import React, { useState } from 'react';
import { T } from '../theme';

const DAY_SHORT = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

const CATEGORIES = [
  { id: 'familj',      label: 'Familj',      color: T.purple,  bg: T.purpleLight },
  { id: 'skola',       label: 'Skola',       color: T.blue,    bg: T.blueLight   },
  { id: 'aktiviteter', label: 'Aktiviteter', color: T.orange,  bg: T.orangeLight },
  { id: 'shopping',    label: 'Shopping',    color: T.green,   bg: T.greenLight  },
  { id: 'noteringar',  label: 'Noteringar',  color: '#6B7280', bg: '#F3F4F6'     },
];

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
  return `${first.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}`;
}

export default function Planering({ events, members, setEvents }) {
  const [weekOffset, setWeekOffset]     = useState(0);
  const [showForm, setShowForm]         = useState(null); // { date, catId }
  const [formTitle, setFormTitle]       = useState('');
  const [formTime, setFormTime]         = useState('');

  const weekDays = getWeekDays(weekOffset);
  const todayIso = isoDate(new Date());

  function getCellEvents(dayIso, catId) {
    return events.filter(e => e.date === dayIso && e.category === catId);
  }

  function openCell(dayIso, catId) {
    setShowForm({ date: dayIso, catId });
    setFormTitle('');
    setFormTime('');
  }

  function addItem() {
    if (!showForm || !formTitle.trim()) return;
    const cat = CATEGORIES.find(c => c.id === showForm.catId);
    const newEv = {
      id: 'pl_' + Date.now(),
      title: formTitle.trim(),
      date: showForm.date,
      color: cat ? cat.color : T.purple,
      category: showForm.catId,
      time: formTime,
      memberIds: [],
    };
    setEvents(prev => [...prev, newEv]);
    setShowForm(null);
  }

  function removeEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>📋 Planering</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Veckans planering per kategori</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: T.radius, padding: '10px 16px', boxShadow: T.shadow,
          }}>
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.purple }}
            >‹</button>
            <span style={{ fontWeight: 600, color: T.text, minWidth: 180, textAlign: 'center', fontSize: 14 }}>
              {weekLabel(weekDays)}
            </span>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.purple }}
            >›</button>
          </div>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              style={{ background: T.purpleLight, color: T.purple, border: 'none', borderRadius: T.radiusSm, fontSize: 13, cursor: 'pointer', padding: '8px 14px', fontWeight: 600 }}
            >
              Idag
            </button>
          )}
        </div>
      </div>

      {/* Planning grid */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px repeat(7, 1fr)',
          background: T.sidebar,
        }}>
          <div style={{ padding: '12px 14px', fontSize: 12, color: T.sidebarText, fontWeight: 600 }}>Kategori</div>
          {weekDays.map((day, i) => {
            const iso = isoDate(day);
            const isToday = iso === todayIso;
            return (
              <div key={i} style={{
                padding: '12px 8px', textAlign: 'center',
                borderLeft: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{ fontSize: 11, color: T.sidebarText, fontWeight: 600 }}>{DAY_SHORT[i]}</div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: isToday ? T.purple : 'transparent',
                  color: isToday ? '#fff' : '#CCCCDD',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, margin: '4px auto 0',
                }}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Category rows */}
        {CATEGORIES.map((cat, catIdx) => (
          <div
            key={cat.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px repeat(7, 1fr)',
              borderTop: '1px solid ' + T.border,
            }}
          >
            {/* Category label */}
            <div style={{
              padding: '10px 14px',
              display: 'flex', alignItems: 'flex-start',
              background: cat.bg + '88',
              borderRight: '1px solid ' + T.border,
            }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: cat.color,
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {cat.label}
              </span>
            </div>

            {/* Day cells */}
            {weekDays.map((day, dayIdx) => {
              const iso = isoDate(day);
              const isToday = iso === todayIso;
              const cellEvents = getCellEvents(iso, cat.id);
              const isOpen = showForm && showForm.date === iso && showForm.catId === cat.id;

              return (
                <div
                  key={dayIdx}
                  style={{
                    padding: '8px',
                    borderLeft: '1px solid ' + T.border,
                    minHeight: 60,
                    background: isToday ? T.purpleLight + '44' : 'transparent',
                    position: 'relative',
                  }}
                >
                  {cellEvents.map(ev => (
                    <div
                      key={ev.id}
                      style={{
                        background: ev.color + '22',
                        border: `1px solid ${ev.color}44`,
                        borderLeft: `3px solid ${ev.color}`,
                        borderRadius: 5, padding: '3px 6px',
                        marginBottom: 4, fontSize: 11, color: ev.color,
                        fontWeight: 600, lineHeight: 1.3,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 4,
                      }}
                    >
                      <span style={{ flex: 1 }}>
                        {ev.time ? `${ev.time} ` : ''}{ev.title}
                      </span>
                      <button
                        onClick={() => removeEvent(ev.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: ev.color, fontSize: 12, lineHeight: 1, opacity: 0.6, padding: 0, flexShrink: 0 }}
                      >×</button>
                    </div>
                  ))}

                  {isOpen ? (
                    <div>
                      <input
                        autoFocus
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setShowForm(null); }}
                        placeholder="Beskrivning..."
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          border: `1px solid ${cat.color}`,
                          borderRadius: 5, padding: '3px 6px',
                          fontSize: 11, outline: 'none', marginBottom: 3,
                          background: cat.bg, color: cat.color,
                        }}
                      />
                      <input
                        value={formTime}
                        onChange={e => setFormTime(e.target.value)}
                        placeholder="Tid (t.ex. 14:00)"
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          border: `1px solid ${T.border}`,
                          borderRadius: 5, padding: '3px 6px',
                          fontSize: 11, outline: 'none', marginBottom: 4,
                          background: '#fff',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={addItem}
                          style={{ background: cat.color, color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer', flex: 1 }}
                        >OK</button>
                        <button
                          onClick={() => setShowForm(null)}
                          style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 6px', fontSize: 11, cursor: 'pointer' }}
                        >✕</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCell(iso, cat.id)}
                      style={{
                        width: '100%', background: 'none',
                        border: `1px dashed ${T.border}`, borderRadius: 4,
                        color: T.textMuted, fontSize: 10, padding: '2px 4px',
                        cursor: 'pointer', marginTop: cellEvents.length ? 4 : 0,
                        opacity: 0.6,
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
