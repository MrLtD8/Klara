import React, { useState } from 'react';
import { T } from '../theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekDays(offset = 0) {
  const today = new Date();
  today.setDate(today.getDate() + offset * 7);
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

const PRIO_COLORS = {
  high: { bg: T.redLight,    text: '#B91C1C' },
  med:  { bg: T.orangeLight, text: T.orangeText },
  low:  { bg: T.greenLight,  text: T.greenText },
};

function Avatar({ member, size = 28 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: member.color,
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {member.initials}
    </div>
  );
}

// ─── Hem ──────────────────────────────────────────────────────────────────────
export default function Hem({ members, tasks, events, onNavigate }) {
  const today = new Date();
  const todayIso = isoDate(today);
  const weekDays = getWeekDays(0);
  const weekIsos = weekDays.map(isoDate);

  const eventsThisWeek = events.filter(e => weekIsos.includes(e.date));
  const tasksTodo      = tasks.filter(t => t.lane === 'ready');
  const activeMembers  = members.length;

  const greeting = (() => {
    const h = today.getHours();
    if (h < 10) return 'God morgon';
    if (h < 18) return 'God dag';
    return 'God kväll';
  })();

  // Kanban preview — first 3 per lane
  const lanes = [
    { id: 'ready',    label: 'Att göra', color: T.purple,  bg: T.purpleLight },
    { id: 'progress', label: 'Pågår',    color: T.orange,  bg: T.orangeLight },
    { id: 'done',     label: 'Klart',    color: T.green,   bg: T.greenLight  },
  ];

  function getMember(id) {
    return members.find(m => m.id === id);
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>
            {greeting}, familjen! 👋
          </h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>
            {today.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => {}}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 22, padding: 8,
            }}
            title="Notifikationer"
          >🔔</button>
          <button
            onClick={() => onNavigate('familj')}
            style={{
              background: T.purple, color: '#fff', border: 'none',
              borderRadius: T.radiusSm, padding: '10px 18px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: T.shadowMd,
            }}
          >
            + Dela med familjen
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '📅', label: 'Händelser denna vecka', value: eventsThisWeek.length, color: T.purple, bg: T.purpleLight, onClick: () => onNavigate('kalender') },
          { icon: '✅', label: 'Uppgifter att göra',    value: tasksTodo.length,       color: T.orange, bg: T.orangeLight, onClick: () => onNavigate('uppgifter') },
          { icon: '👨‍👩‍👧‍👦', label: 'Familjemedlemmar aktiva', value: `${activeMembers}/${members.length}`, color: T.green, bg: T.greenLight, onClick: () => onNavigate('familj') },
          { icon: '💬', label: 'Meddelanden idag',      value: 2,                      color: T.blue,   bg: T.blueLight,  onClick: () => onNavigate('meddelanden') },
        ].map((stat, i) => (
          <button
            key={i}
            onClick={stat.onClick}
            style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: T.radius, padding: '20px 20px',
              boxShadow: T.shadow, cursor: 'pointer',
              textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10,
              transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadowMd}
            onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{stat.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* 2-col: Calendar mini + Tasks preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Calendar mini */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>📅 Veckans kalender</h2>
            <button
              onClick={() => onNavigate('kalender')}
              style={{ background: 'none', border: 'none', color: T.purple, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
            >
              Visa hela →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {weekDays.map((day, i) => {
              const iso = isoDate(day);
              const isToday = iso === todayIso;
              const dayEvents = events.filter(e => e.date === iso);
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>
                    {DAY_LABELS[i]}
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: isToday ? T.purple : 'transparent',
                    color: isToday ? '#fff' : T.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: isToday ? 700 : 500,
                    margin: '0 auto 6px',
                  }}>
                    {day.getDate()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} style={{
                        background: ev.color, borderRadius: 4,
                        height: 4, width: '100%',
                      }} title={ev.title} />
                    ))}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: 10, color: T.textMuted }}>+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Event list for today */}
          {eventsThisWeek.length > 0 && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8, fontWeight: 600 }}>Kommande händelser</div>
              {eventsThisWeek.slice(0, 3).map(ev => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: T.text, flex: 1 }}>{ev.title}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>
                    {new Date(ev.date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks preview */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>✅ Uppgifter</h2>
            <button
              onClick={() => onNavigate('uppgifter')}
              style={{ background: 'none', border: 'none', color: T.purple, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
            >
              Visa alla →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {lanes.map(lane => {
              const laneTasks = tasks.filter(t => t.lane === lane.id).slice(0, 3);
              return (
                <div key={lane.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: lane.color }}>{lane.label}</span>
                    <span style={{
                      background: lane.bg, color: lane.color,
                      borderRadius: 999, fontSize: 11, fontWeight: 700,
                      padding: '1px 7px',
                    }}>
                      {tasks.filter(t => t.lane === lane.id).length}
                    </span>
                  </div>
                  {laneTasks.map(task => {
                    const prio = PRIO_COLORS[task.prio] || PRIO_COLORS.med;
                    return (
                      <div key={task.id} style={{
                        background: T.bg, border: `1px solid ${T.border}`,
                        borderRadius: T.radiusSm, padding: '8px 10px',
                        marginBottom: 6, fontSize: 12, color: T.text,
                        borderLeft: `3px solid ${lane.color}`,
                      }}>
                        <div style={{ marginBottom: 4, fontWeight: 500, lineHeight: 1.3 }}>{task.title}</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          {task.tags.map(tag => (
                            <span key={tag} style={{
                              background: prio.bg, color: prio.text,
                              borderRadius: 4, fontSize: 10, padding: '1px 5px', fontWeight: 600,
                            }}>{tag}</span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                          {task.mids.map(mid => {
                            const m = getMember(mid);
                            return m ? <Avatar key={mid} member={m} size={20} /> : null;
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => onNavigate('uppgifter')}
                    style={{
                      width: '100%', background: 'none',
                      border: `1px dashed ${T.border}`, borderRadius: T.radiusSm,
                      color: T.textMuted, fontSize: 12, padding: '6px',
                      cursor: 'pointer', marginTop: 2,
                    }}
                  >
                    + Lägg till
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-col: Family + Veckans påminnelse */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Family section */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>👨‍👩‍👧‍👦 Familjen</h2>
            <button
              onClick={() => onNavigate('familj')}
              style={{ background: 'none', border: 'none', color: T.purple, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
            >
              Hantera →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {members.map(m => (
              <div key={m.id} style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: m.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, margin: '0 auto 8px',
                  boxShadow: `0 4px 12px ${m.color}44`,
                }}>
                  {m.initials}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.name}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{m.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Veckans påminnelse */}
        <div style={{
          background: `linear-gradient(135deg, ${T.purple}18 0%, ${T.purpleLight} 100%)`,
          border: `1px solid ${T.purple}33`,
          borderRadius: T.radius, padding: 24, boxShadow: T.shadow,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: 16, top: 12,
            fontSize: 60, opacity: 0.15, lineHeight: 1,
          }}>🌸</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Veckans påminnelse
          </div>
          <p style={{
            margin: 0, fontSize: 18, fontWeight: 600, color: T.text,
            lineHeight: 1.5, fontStyle: 'italic',
          }}>
            "Små stunder tillsammans skapar de största minnena."
          </p>
          <div style={{ marginTop: 12, fontSize: 13, color: T.purple, fontWeight: 500 }}>
            🌸 Ha en fin vecka!
          </div>
        </div>
      </div>
    </div>
  );
}
