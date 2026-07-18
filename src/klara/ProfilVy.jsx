import React from 'react';
import { T } from './theme';
import { useLocalStorage } from '../useLocalStorage';
import useIcsCalendars from '../useIcsCalendars';
import { DEFAULT_GCAL, activeCalendars } from '../gcal';

// ─── Personlig dashboard ──────────────────────────────────────────────────────
// Nås via /<namn> (t.ex. /bjorn) — visar bara den personens dag.
// Länken sätts upp automatiskt: App.jsx matchar URL-en mot kl_members.

function isoDate(d) { return d.toISOString().split('T')[0]; }

function eventMatchesDay(ev, iso) {
  if (!ev.recur || ev.recur === 'none') return ev.date === iso;
  const s = new Date(ev.date + 'T12:00:00');
  const d = new Date(iso + 'T12:00:00');
  if (d < s) return false;
  if (ev.recur === 'weekly') return s.getDay() === d.getDay();
  if (ev.recur === 'yearly') return s.getMonth() === d.getMonth() && s.getDate() === d.getDate();
  return ev.date === iso;
}

const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, marginBottom: 16 };

export default function ProfilVy({ member }) {
  const [calEvents]  = useLocalStorage('kl_cal_events', []);
  const [tasks, setTasks] = useLocalStorage('kl_tasks', []);
  const [medicins]   = useLocalStorage('kl_medicin', []);
  const [gcalSettings] = useLocalStorage('kl_gcal', DEFAULT_GCAL);
  const { events: gcalEvents } = useIcsCalendars(activeCalendars(gcalSettings));

  const now = new Date();
  const todayIso = isoDate(now);
  const h = now.getHours();
  const greeting = h < 10 ? 'God morgon' : h < 18 ? 'God dag' : 'God kväll';

  const nameLower = member.name.toLowerCase();

  // Dagens händelser: egna events (who innehåller namnet) + Google-kalendrar
  const myEventsToday = [
    ...calEvents.filter(ev => eventMatchesDay(ev, todayIso) && (ev.who || '').toLowerCase().includes(nameLower)),
    ...gcalEvents.filter(ev => ev.date === todayIso && ((ev.calendarName || '').toLowerCase().includes(nameLower) || (ev.title || '').toLowerCase().includes(nameLower))),
  ];

  const myTasks = tasks.filter(t => (t.mids || []).includes(member.id) && t.lane !== 'done');
  const myMeds  = medicins.filter(m => m.active !== false && m.who === member.id);

  function completeTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, lane: 'done', doneAt: new Date().toISOString() } : t));
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontBody, padding: '28px 24px', maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: member.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, boxShadow: `0 4px 14px ${member.color}55` }}>
          {member.initials}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 700, color: T.text }}>
            {greeting}, <span style={{ color: member.color }}>{member.name}</span>!
          </h1>
          <p style={{ margin: '2px 0 0', color: T.textMuted, fontSize: 13 }}>
            {now.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <a href="/" style={{ fontSize: 13, fontWeight: 600, color: T.purple, textDecoration: 'none', padding: '8px 14px', borderRadius: T.radiusSm, background: T.purpleLight }}>
          Hela appen →
        </a>
      </div>

      {/* Dagens händelser */}
      <div style={card}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: T.text }}>📅 Din dag</h2>
        {myEventsToday.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>Inget inbokat idag 🎉</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myEventsToday.map((ev, i) => (
              <div key={ev.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: T.radiusSm, background: T.bg, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 16 }}>{ev.gcal || ev.calendarName ? '📆' : '📌'}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text, flex: 1 }}>{ev.title}</span>
                {ev.time && <span style={{ fontSize: 12, color: T.textMuted }}>{ev.time}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mina uppgifter */}
      <div style={card}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: T.text }}>✅ Dina uppgifter</h2>
        {myTasks.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>Allt klart — snyggt jobbat!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myTasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: T.radiusSm, background: T.bg, border: `1px solid ${T.border}` }}>
                <button onClick={() => completeTask(t.id)} title="Markera som klar"
                  style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${member.color}`, background: 'transparent', cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.title}</div>
                  {t.lane === 'progress' && <div style={{ fontSize: 11, color: T.orange, fontWeight: 600 }}>Pågår</div>}
                </div>
                {t.prio === 'high' && <span style={{ fontSize: 11, fontWeight: 700, color: T.red }}>Hög prio</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mediciner (om personen har några) */}
      {myMeds.length > 0 && (
        <div style={card}>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: T.text }}>💊 Dina mediciner</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myMeds.map(m => {
              const givenToday = m.lastGiven && m.lastGiven.slice(0, 10) === todayIso;
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: T.radiusSm, background: givenToday ? '#F0FDF4' : T.bg, border: `1px solid ${givenToday ? '#BBF7D0' : T.border}` }}>
                  <span style={{ fontSize: 16 }}>{givenToday ? '✅' : '💊'}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text, flex: 1 }}>{m.name}</span>
                  <span style={{ fontSize: 12, color: givenToday ? '#16A34A' : T.textMuted, fontWeight: 600 }}>
                    {givenToday ? 'Given idag' : 'Ej given idag'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
