import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

export default function Assistent({ members = [] }) {
  const [calEvents] = useLocalStorage('kl_cal_events', []);
  const [tasks] = useLocalStorage('kl_tasks', []);
  const [medicins] = useLocalStorage('kl_medicin', []);
  const [carItems] = useLocalStorage('kl_car', []);
  const [houseItems] = useLocalStorage('kl_house', []);
  const [aiKey, setAiKey] = useLocalStorage('kl_ai_key', '');
  const [report, setReport] = useState(null);
  const [emailText, setEmailText] = useState('');
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

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
    if (!aiKey.trim()) {
      setSummary('API-nyckel saknas. Ange din Claude API-nyckel nedan för att använda AI-sammanfattning.');
      return;
    }
    setSummarizing(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': aiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          messages: [{ role: 'user', content: `Sammanfatta denna text kortfattat på svenska (max 3 meningar):\n\n${emailText}` }],
        }),
      });
      const data = await res.json();
      if (data.content && data.content[0]) {
        setSummary(data.content[0].text);
      } else {
        setSummary('Kunde inte sammanfatta. Kontrollera API-nyckeln.');
      }
    } catch (err) {
      setSummary('Fel vid anrop till Claude API: ' + err.message);
    }
    setSummarizing(false);
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>🤖 FamiljeAssistenten</h1>
        <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Din personliga dagrapport och AI-hjälp</p>
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

          {/* API Key */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, color: T.text }}>🔑 Claude API-nyckel</h3>
            <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>
              Krävs för AI-sammanfattning. Lagras bara lokalt i din webbläsare.
            </p>
            <input
              type="password"
              value={aiKey}
              onChange={e => setAiKey(e.target.value)}
              placeholder="sk-ant-..."
              style={{
                width: '100%', boxSizing: 'border-box',
                border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                padding: '9px 12px', fontSize: 14, color: T.text,
                background: T.bg, outline: 'none',
              }}
            />
            {aiKey && <div style={{ fontSize: 12, color: T.green, marginTop: 8 }}>✓ API-nyckel sparad</div>}
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
