import React, { useState } from 'react';
import { T } from '../theme';

const DAY_NAMES = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
const DAY_SHORT = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function getWeekDays(weekOffset = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function weekLabel(days) {
  const first = days[0];
  const last  = days[6];
  const opts = { month: 'short', day: 'numeric' };
  return `${first.toLocaleDateString('sv-SE', opts)} – ${last.toLocaleDateString('sv-SE', opts)}`;
}

const EVENT_COLORS = [T.purple, T.orange, T.green, T.blue, '#EF4444', '#EC4899'];

export default function Kalender({ events, members, setEvents }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm]     = useState(false);
  const [formDate, setFormDate]     = useState(isoDate(new Date()));
  const [formTitle, setFormTitle]   = useState('');
  const [formColor, setFormColor]   = useState(T.purple);
  const [formMember, setFormMember] = useState('');

  const weekDays = getWeekDays(weekOffset);
  const todayIso = isoDate(new Date());

  function getMember(id) {
    return members.find(m => m.id === id);
  }

  function addEvent() {
    if (!formTitle.trim()) return;
    const newEv = {
      id: 'ev_' + Date.now(),
      title: formTitle.trim(),
      date: formDate,
      color: formColor,
      memberIds: formMember ? [formMember] : [],
    };
    setEvents(prev => [...prev, newEv]);
    setFormTitle('');
    setShowForm(false);
  }

  function removeEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>📅 Kalender</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Veckovy för familjen</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: T.purple, color: '#fff', border: 'none',
            borderRadius: T.radiusSm, padding: '10px 18px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: T.shadowMd,
          }}
        >
          + Ny händelse
        </button>
      </div>

      {/* Week navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: T.radius, padding: '12px 20px', boxShadow: T.shadow,
        width: 'fit-content',
      }}>
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.purple, padding: '2px 8px' }}
        >‹</button>
        <span style={{ fontWeight: 600, color: T.text, minWidth: 200, textAlign: 'center', fontSize: 15 }}>
          {weekLabel(weekDays)}
        </span>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.purple, padding: '2px 8px' }}
        >›</button>
        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            style={{ background: T.purpleLight, color: T.purple, border: 'none', borderRadius: T.radiusSm, fontSize: 12, cursor: 'pointer', padding: '4px 10px', fontWeight: 600 }}
          >
            Idag
          </button>
        )}
      </div>

      {/* Week grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 12,
      }}>
        {weekDays.map((day, i) => {
          const iso = isoDate(day);
          const isToday = iso === todayIso;
          const dayEvents = events.filter(e => e.date === iso);

          return (
            <div key={i} style={{
              background: T.card,
              border: `1.5px solid ${isToday ? T.purple : T.border}`,
              borderRadius: T.radius,
              padding: 12,
              minHeight: 180,
              boxShadow: isToday ? `0 0 0 2px ${T.purple}22` : T.shadow,
            }}>
              {/* Day header */}
              <div style={{ marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? T.purple : T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {DAY_SHORT[i]}
                </div>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: isToday ? T.purple : 'transparent',
                  color: isToday ? '#fff' : T.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, margin: '4px auto 0',
                }}>
                  {day.getDate()}
                </div>
              </div>

              {/* Events */}
              {dayEvents.map(ev => {
                const memberNames = (ev.memberIds || []).map(mid => {
                  const m = getMember(mid);
                  return m ? m.initials : '';
                }).filter(Boolean);

                return (
                  <div
                    key={ev.id}
                    style={{
                      background: ev.color + '22',
                      border: `1px solid ${ev.color}44`,
                      borderLeft: `3px solid ${ev.color}`,
                      borderRadius: 6,
                      padding: '5px 8px',
                      marginBottom: 6,
                      cursor: 'default',
                      position: 'relative',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: ev.color, lineHeight: 1.3 }}>{ev.title}</div>
                    {memberNames.length > 0 && (
                      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>
                        {memberNames.join(', ')}
                      </div>
                    )}
                    <button
                      onClick={() => removeEvent(ev.id)}
                      style={{
                        position: 'absolute', top: 2, right: 4,
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: T.textMuted, fontSize: 12, lineHeight: 1,
                        opacity: 0.5, padding: 2,
                      }}
                      title="Ta bort"
                    >×</button>
                  </div>
                );
              })}

              {/* Add quick event */}
              <button
                onClick={() => { setFormDate(iso); setShowForm(true); }}
                style={{
                  width: '100%', background: 'none',
                  border: `1px dashed ${T.border}`, borderRadius: 6,
                  color: T.textMuted, fontSize: 11, padding: '4px',
                  cursor: 'pointer', marginTop: 4,
                }}
              >
                + Lägg till
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Event Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{
            background: T.card, borderRadius: T.radius,
            padding: 28, width: 400, boxShadow: T.shadowMd,
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>+ Ny händelse</h2>

            <label style={labelStyle}>Titel</label>
            <input
              autoFocus
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEvent()}
              placeholder="Vad ska hända?"
              style={inputStyle}
            />

            <label style={labelStyle}>Datum</label>
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Familjemedlem</label>
            <select value={formMember} onChange={e => setFormMember(e.target.value)} style={inputStyle}>
              <option value="">Alla / ingen</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <label style={labelStyle}>Färg</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {EVENT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setFormColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: c, border: formColor === c ? `3px solid ${T.text}` : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={cancelBtnStyle}>Avbryt</button>
              <button onClick={addEvent} style={saveBtnStyle}>Spara</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 6 };
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 14, color: T.text,
  marginBottom: 16, outline: 'none', background: T.bg,
};
const saveBtnStyle = {
  background: T.purple, color: '#fff', border: 'none',
  borderRadius: T.radiusSm, padding: '9px 20px',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
const cancelBtnStyle = {
  background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`,
  borderRadius: T.radiusSm, padding: '9px 20px',
  fontSize: 14, cursor: 'pointer',
};
