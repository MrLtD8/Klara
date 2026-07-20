import React, { useState, useEffect } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';
import { mailSuggestions, suggestionKey, buildTask, buildEvent } from '../mailSuggestions';

export default function Assistent({ members = [] }) {
  const [calEvents, setCalEvents] = useLocalStorage('kl_cal_events', []);
  const [tasks, setTasks] = useLocalStorage('kl_tasks', []);
  const [medicins] = useLocalStorage('kl_medicin', []);
  const [carItems] = useLocalStorage('kl_car', []);
  const [houseItems] = useLocalStorage('kl_house', []);
  const [report, setReport] = useState(null);
  const [emailText, setEmailText] = useState('');
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [serverReport, setServerReport] = useState(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [addedSuggestions, setAddedSuggestions] = useState([]);

  // ── Förslag från mail (skola/aktiviteter → uppgifter & kalender) ──
  const [mailDigest, setMailDigest] = useState(null);
  const [mailChecking, setMailChecking] = useState(false);
  const [mailError, setMailError] = useState('');
  const [addedMail, setAddedMail] = useState([]);

  useEffect(() => {
    fetch('/api/mail/digest').then(r => r.json()).then(setMailDigest).catch(() => {});
  }, []);

  async function refreshMail() {
    setMailChecking(true);
    setMailError('');
    try {
      const res = await fetch('/api/mail/check', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMailDigest(data);
    } catch (e) {
      setMailError(e.message);
    }
    setMailChecking(false);
  }

  function acceptMailSuggestion(mail, sugg, key) {
    if (sugg.type === 'event') setCalEvents(prev => [...prev, buildEvent(sugg)]);
    else setTasks(prev => [...prev, buildTask(sugg, mail)]);
    setAddedMail(a => [...a, key]);
  }

  // Alla förslag från alla viktiga mail, plattade med sitt källmail
  const mailProposals = (mailDigest?.items || []).flatMap(mail =>
    mailSuggestions(mail).map((s, si) => ({ mail, sugg: s, key: suggestionKey(mail.id, s, si) }))
  );

  // AI-dagsrapport från HA-addonet — nyckeln ligger på servern, inte i webbläsaren
  async function fetchServerReport() {
    setServerLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/assistent/rapport', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setServerReport(data);
      setAddedSuggestions([]);
    } catch (err) {
      setServerError(err.message);
    }
    setServerLoading(false);
  }

  function addSuggestionAsTask(title) {
    setTasks(prev => [...prev, {
      id: 't_' + Date.now(), title, lane: 'ready', mids: [], tags: ['AI-förslag'],
      prio: 'med', estimate: '', deadline: '', subtasks: [], epic: '',
    }]);
    setAddedSuggestions(prev => [...prev, title]);
  }

  const today = new Date().toISOString().split('T')[0];

  function generateReport() {
    const now = new Date();
    const h = now.getHours();
    const greeting = h < 10 ? 'God morgon' : h < 18 ? 'God dag' : 'God kväll';

    // Today's events
    const todayEvents = calEvents.filter(ev => {
      if (!ev.recur || ev.recur === 'none') return ev.date === today;
      const evDate = new Date(ev.date + 'T12:00:00');
      const todayDate = new Date(today + 'T12:00:00');
      if (ev.recur === 'weekly') return evDate.getDay() === todayDate.getDay();
      if (ev.recur === 'yearly') return evDate.getMonth() === todayDate.getMonth() && evDate.getDate() === todayDate.getDate();
      return ev.date === today;
    });

    // Tasks in progress / overdue
    const activeTasks = tasks.filter(t => t.lane === 'progress');
    const overdueTasks = tasks.filter(t => t.deadline && t.deadline < today && t.lane !== 'done');

    // Medicine reminders
    const medWarnings = medicins.filter(m => {
      if (m.active === false) return false;
      if (!m.dose || m.dose <= 0) return false;
      const days = Math.floor(m.stock / m.dose);
      return days <= (m.threshold || 7);
    });

    // Car/house reminders
    const urgentCar = carItems.filter(c => {
      if (c.done) return false;
      const d = Math.round((new Date(c.due) - new Date()) / 86400000);
      return d <= 14;
    });
    const urgentHouse = houseItems.filter(h => {
      if (!h.lastDone) return false;
      const intervals = { monthly: 1, yearly: 12, every2y: 24, every5y: 60 };
      const months = intervals[h.interval] || 12;
      const next = new Date(h.lastDone + 'T00:00:00');
      next.setMonth(next.getMonth() + months);
      const d = Math.round((next - new Date()) / 86400000);
      return d <= 30;
    });

    const r = {
      greeting,
      date: now.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      todayEvents,
      activeTasks,
      overdueTasks,
      medWarnings,
      urgentCar,
      urgentHouse,
    };
    setReport(r);
  }

  async function summarizeEmail() {
    if (!emailText.trim()) return;
    setSummarizing(true);
    try {
      const res = await fetch('/api/assistent/sammanfatta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: emailText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSummary(data.summary || '');
    } catch (err) {
      setSummary('Fel: ' + err.message);
    }
    setSummarizing(false);
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>🤖 FamiljeAssistenten</h1>
        <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Din personliga dagrapport och AI-hjälp</p>
      </div>

      {/* ── AI-dagsrapport från servern ─────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>🔮</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>AI-dagsrapport</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: T.textMuted }}>Servern analyserar dagens kalender, uppgifter och mediciner med Claude</p>
          </div>
          <button onClick={fetchServerReport} disabled={serverLoading}
            style={{ padding: '9px 20px', borderRadius: T.radiusSm, border: 'none', background: T.purple, color: '#fff', fontSize: 14, fontWeight: 700, cursor: serverLoading ? 'wait' : 'pointer', opacity: serverLoading ? 0.7 : 1 }}>
            {serverLoading ? 'Analyserar…' : 'Generera'}
          </button>
        </div>

        {serverError && (
          <div style={{ padding: '10px 14px', borderRadius: T.radiusSm, background: '#FEE2E2', color: '#B91C1C', fontSize: 13 }}>
            {serverError}
          </div>
        )}

        {serverReport && (
          <div>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: T.text, lineHeight: 1.6 }}>{serverReport.summary}</p>
            {serverReport.suggestions?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Föreslagna uppgifter</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {serverReport.suggestions.map((s, i) => {
                    const added = addedSuggestions.includes(s);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: T.radiusSm, background: T.bg, border: `1px solid ${T.border}` }}>
                        <span style={{ flex: 1, fontSize: 13, color: T.text }}>{s}</span>
                        <button onClick={() => !added && addSuggestionAsTask(s)} disabled={added}
                          style={{ padding: '5px 14px', borderRadius: T.radiusSm, border: 'none', background: added ? T.bg : T.purpleLight, color: added ? T.textMuted : T.purple, fontSize: 12, fontWeight: 700, cursor: added ? 'default' : 'pointer' }}>
                          {added ? 'Tillagd ✓' : '+ Lägg på tavlan'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Förslag från mail (aktiviteter → uppgifter & kalender) ── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>📬</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Förslag från mail</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: T.textMuted }}>
              AI:n läser viktiga mail (t.ex. Unikum) och föreslår uppgifter och kalenderinlägg — inkl. förberedelser som matsäck till utflykter
            </p>
          </div>
          <button onClick={refreshMail} disabled={mailChecking}
            style={{ padding: '9px 18px', borderRadius: T.radiusSm, border: 'none', background: T.purple, color: '#fff', fontSize: 14, fontWeight: 700, cursor: mailChecking ? 'wait' : 'pointer', opacity: mailChecking ? 0.7 : 1 }}>
            {mailChecking ? 'Läser mail…' : 'Skanna mail'}
          </button>
        </div>

        {mailError && (
          <div style={{ padding: '10px 14px', borderRadius: T.radiusSm, background: '#FEE2E2', color: '#B91C1C', fontSize: 13 }}>{mailError}</div>
        )}

        {!mailError && mailProposals.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>
            {mailDigest ? 'Inga förslag just nu. Klicka "Skanna mail" för att leta efter aktiviteter och att-göra.' : 'Mailkonton ställs in i addonets konfiguration. Klicka "Skanna mail" för att börja.'}
          </p>
        )}

        {mailProposals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mailProposals.map(({ mail, sugg, key }) => {
              const done = addedMail.includes(key);
              const isEvent = sugg.type === 'event';
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: T.radiusSm, background: T.bg, border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{isEvent ? '📅' : '✅'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                      {sugg.title}{isEvent && sugg.date ? <span style={{ color: T.textMuted, fontWeight: 400 }}> · {sugg.date}</span> : ''}
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isEvent ? 'Kalender' : 'Uppgift'} · från "{mail.subject}"
                    </div>
                  </div>
                  <button onClick={() => !done && acceptMailSuggestion(mail, sugg, key)} disabled={done}
                    style={{ flexShrink: 0, padding: '6px 14px', borderRadius: T.radiusSm, border: 'none',
                      background: done ? T.bg : (isEvent ? '#DBEAFE' : T.purpleLight),
                      color: done ? '#16A34A' : (isEvent ? '#1E40AF' : T.purple),
                      fontSize: 12, fontWeight: 700, cursor: done ? 'default' : 'pointer' }}>
                    {done ? 'Tillagd ✓' : (isEvent ? '+ Kalender' : '+ Tavlan')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Dagsrapport */}
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow, marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text }}>📋 Dagsrapport</h2>
            <button onClick={generateReport} style={{
              background: T.purple, color: '#fff', border: 'none',
              borderRadius: T.radiusSm, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              width: '100%',
            }}>
              Generera rapport
            </button>
          </div>

          {report && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.purple, marginBottom: 4 }}>{report.greeting}!</div>
              <div style={{ fontSize: 14, color: T.textMuted, marginBottom: 20 }}>{report.date}</div>

              {/* Today's events */}
              <Section title="📅 Dagens händelser" color={T.blue}>
                {report.todayEvents.length === 0 ? (
                  <div style={{ color: T.textMuted, fontSize: 13 }}>Inga händelser idag</div>
                ) : report.todayEvents.map(ev => (
                  <Item key={ev.id} text={ev.title} sub={ev.who} />
                ))}
              </Section>

              {/* Active tasks */}
              {report.activeTasks.length > 0 && (
                <Section title="✅ Pågående uppgifter" color={T.orange}>
                  {report.activeTasks.map(t => <Item key={t.id} text={t.title} />)}
                </Section>
              )}

              {/* Overdue tasks */}
              {report.overdueTasks.length > 0 && (
                <Section title="⚠️ Försenade uppgifter" color={T.red}>
                  {report.overdueTasks.map(t => <Item key={t.id} text={t.title} sub={`Deadline: ${t.deadline}`} />)}
                </Section>
              )}

              {/* Medicine warnings */}
              {report.medWarnings.length > 0 && (
                <Section title="💊 Medicin — snart slut" color="#E8A0B0">
                  {report.medWarnings.map(m => {
                    const days = m.dose > 0 ? Math.floor(m.stock / m.dose) : 0;
                    return <Item key={m.id} text={m.name} sub={`${days} dagar kvar`} />;
                  })}
                </Section>
              )}

              {/* Car reminders */}
              {report.urgentCar.length > 0 && (
                <Section title="🚗 Bilpåminnelser" color="#7CA8E8">
                  {report.urgentCar.map(c => <Item key={c.id} text={c.title} sub={`${c.car} — ${c.due}`} />)}
                </Section>
              )}

              {/* House reminders */}
              {report.urgentHouse.length > 0 && (
                <Section title="🏠 Husunderhåll" color="#C8A87C">
                  {report.urgentHouse.map(h => <Item key={h.id} text={h.title} sub={h.category} />)}
                </Section>
              )}
            </div>
          )}
        </div>

        {/* AI Sammanfattning */}
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow, marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text }}>🤖 AI-sammanfattning</h2>
            <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 14 }}>
              Klistra in en e-post, artikel eller lång text — AI:n sammanfattar den på svenska.
            </p>
            <textarea
              value={emailText}
              onChange={e => setEmailText(e.target.value)}
              placeholder="Klistra in text här..."
              rows={8}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                padding: '10px 12px', fontSize: 13, color: T.text,
                background: T.bg, outline: 'none', resize: 'vertical',
                marginBottom: 14,
              }}
            />
            <button
              onClick={summarizeEmail}
              disabled={summarizing}
              style={{
                background: summarizing ? T.textMuted : T.purple, color: '#fff', border: 'none',
                borderRadius: T.radiusSm, padding: '10px 20px', fontSize: 14, fontWeight: 600,
                cursor: summarizing ? 'not-allowed' : 'pointer', width: '100%',
              }}
            >
              {summarizing ? '⏳ Sammanfattar...' : '✨ Sammanfatta'}
            </button>

            {summary && (
              <div style={{ marginTop: 16, background: T.purpleLight, border: `1px solid ${T.purple}44`, borderRadius: T.radiusSm, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: T.purple, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Sammanfattning</div>
                <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>{summary}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Item({ text, sub }) {
  return (
    <div style={{ fontSize: 13, color: T.text, marginBottom: 5, paddingLeft: 12, borderLeft: `2px solid ${T.border}` }}>
      {text}
      {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}
