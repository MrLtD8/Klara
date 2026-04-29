import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const EVENT_TYPES = {
  heart:   { icon: '❤️',  label: 'Kärlek',       bg: '#FDE8EE', border: '#E8A0B0' },
  birthday:{ icon: '🎈',  label: 'Födelsedag',   bg: '#FFF0D8', border: '#F0C060' },
  doctor:  { icon: '⚕️',  label: 'Läkare',       bg: '#FDE8E8', border: '#E06060' },
  school:  { icon: '🎒',  label: 'Skola',         bg: '#E8F0FD', border: '#7090D0' },
  sport:   { icon: '⚽',  label: 'Sport',         bg: '#E8F5EE', border: '#70A880' },
  travel:  { icon: '✈️',  label: 'Resa',          bg: '#EDF2EF', border: '#7A9080' },
  holiday: { icon: '🎉',  label: 'Helgdag',       bg: '#FFF5E0', border: '#D4A030' },
  note:    { icon: '📌',  label: 'Anteckning',    bg: '#F5F0E8', border: '#B09870' },
  dance:   { icon: '💃',  label: 'Dans',          bg: '#FDE8F5', border: '#D060A0' },
  swim:    { icon: '🏊',  label: 'Simning',       bg: '#E0F0FF', border: '#5090D0' },
  party:   { icon: '🎂',  label: 'Kalas',         bg: '#FFF0E0', border: '#E0A030' },
  paddle:  { icon: '🏓',  label: 'Paddling',      bg: '#E8F8EE', border: '#50A060' },
  tennis:  { icon: '🎾',  label: 'Tennis',        bg: '#F0FFE8', border: '#70A030' },
  football:{ icon: '⚽',  label: 'Fotboll',       bg: '#E8F5E8', border: '#409040' },
  gym:     { icon: '💪',  label: 'Träning',       bg: '#FFF0E8', border: '#D07030' },
  music:   { icon: '🎵',  label: 'Musik',         bg: '#F0E8FF', border: '#9060C0' },
  dentist: { icon: '🦷',  label: 'Tandläkare',    bg: '#F0F8FF', border: '#6080C0' },
  meeting: { icon: '👥',  label: 'Möte',          bg: '#F5F5F0', border: '#909080' },
};

const DAY_SHORT = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const MONTHS_SV = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function eventMatchesDay(ev, dayIso) {
  if (!ev.recur || ev.recur === 'none') return ev.date === dayIso;
  const evDate = new Date(ev.date + 'T12:00:00');
  const day = new Date(dayIso + 'T12:00:00');
  if (ev.recur === 'weekly') {
    return evDate.getDay() === day.getDay();
  }
  if (ev.recur === 'yearly') {
    return evDate.getMonth() === day.getMonth() && evDate.getDate() === day.getDate();
  }
  return ev.date === dayIso;
}

const RECUR_OPTIONS = [
  { val: 'none',   label: 'Ingen upprepning' },
  { val: 'weekly', label: 'Varje vecka (samma dag)' },
  { val: 'yearly', label: 'Varje år (samma datum)' },
];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 14, color: T.text,
  marginBottom: 14, outline: 'none', background: T.bg,
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 };

export default function Kalender({ members }) {
  const [calEvents, setCalEvents] = useLocalStorage('kl_cal_events', []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);

  // Form state
  const [fType, setFType] = useState('school');
  const [fTitle, setFTitle] = useState('');
  const [fWho, setFWho] = useState('');
  const [fDate, setFDate] = useState(isoDate(new Date()));
  const [fRecur, setFRecur] = useState('none');

  const weekDays = getWeekDays(weekOffset);
  const todayIso = isoDate(new Date());
  const weekNum = getWeekNumber(weekDays[0]);
  const monthName = MONTHS_SV[weekDays[3].getMonth()];

  function openModal(date) {
    setFDate(date || isoDate(new Date()));
    setFType('school');
    setFTitle('');
    setFWho('');
    setFRecur('none');
    setShowModal(true);
  }

  function addEvent() {
    if (!fTitle.trim()) return;
    const newEv = {
      id: 'cal_' + Date.now(),
      type: fType,
      title: fTitle.trim(),
      who: fWho.trim(),
      date: fDate,
      recur: fRecur,
    };
    setCalEvents(prev => [...prev, newEv]);
    setShowModal(false);
  }

  function removeEvent(id) {
    setCalEvents(prev => prev.filter(e => e.id !== id));
  }

  function onDragStart(e, evId) {
    setDraggingId(evId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', evId);
  }

  function onDragOver(e, dayIso) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(dayIso);
  }

  function onDrop(e, dayIso) {
    e.preventDefault();
    const evId = e.dataTransfer.getData('text/plain') || draggingId;
    if (!evId) return;
    setCalEvents(prev => prev.map(ev =>
      ev.id === evId ? { ...ev, date: dayIso, recur: 'none' } : ev
    ));
    setDraggingId(null);
    setDragOverDay(null);
  }

  function onDragEnd() {
    setDraggingId(null);
    setDragOverDay(null);
  }

  function hasConflict(dayIso) {
    const dayEvs = calEvents.filter(ev => eventMatchesDay(ev, dayIso));
    if (dayEvs.length < 2) return false;
    const adults = members.filter(m => !m.role.includes('år'));
    if (adults.length < 2) return false;
    const whoText = dayEvs.map(ev => ev.who || '').join(' ').toLowerCase();
    const adultsPresent = adults.filter(m => whoText.includes(m.name.toLowerCase()));
    return adultsPresent.length >= 2;
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>📅 Kalender</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>
            Vecka {weekNum} — {monthName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => alert('Google Kalender kräver setup — kontakta administratören.')}
            style={{
              background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`,
              borderRadius: T.radiusSm, padding: '9px 16px', fontSize: 13, cursor: 'pointer',
            }}
          >
            Google Kalender
          </button>
          <button
            onClick={() => openModal(null)}
            style={{
              background: T.purple, color: '#fff', border: 'none',
              borderRadius: T.radiusSm, padding: '9px 18px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Händelse
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: T.radius, padding: '10px 18px', boxShadow: T.shadow,
        width: 'fit-content',
      }}>
        <button onClick={() => setWeekOffset(w => w - 1)}
          style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.purple, padding: '2px 8px' }}>
          ‹
        </button>
        <span style={{ fontWeight: 600, color: T.text, minWidth: 220, textAlign: 'center', fontSize: 15 }}>
          {weekDays[0].toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} –{' '}
          {weekDays[6].toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <button onClick={() => setWeekOffset(w => w + 1)}
          style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.purple, padding: '2px 8px' }}>
          ›
        </button>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)}
            style={{ background: T.purpleLight, color: T.purple, border: 'none', borderRadius: T.radiusSm, fontSize: 12, cursor: 'pointer', padding: '4px 10px', fontWeight: 600 }}>
            Idag
          </button>
        )}
      </div>

      {/* Week grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {weekDays.map((day, i) => {
          const iso = isoDate(day);
          const isToday = iso === todayIso;
          const isDragTarget = dragOverDay === iso;
          const dayEvs = calEvents.filter(ev => eventMatchesDay(ev, iso));
          const conflict = hasConflict(iso);

          return (
            <div
              key={i}
              onDragOver={e => onDragOver(e, iso)}
              onDrop={e => onDrop(e, iso)}
              onDragLeave={() => setDragOverDay(null)}
              style={{
                background: isDragTarget ? T.purpleLight : T.card,
                border: `1.5px solid ${isToday ? T.purple : (isDragTarget ? T.purple : T.border)}`,
                borderRadius: T.radius,
                padding: 10,
                minHeight: 200,
                boxShadow: isToday ? `0 0 0 2px ${T.purple}22` : T.shadow,
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? T.purple : T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {DAY_SHORT[i]}
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: isToday ? T.purple : 'transparent',
                  color: isToday ? '#fff' : T.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, margin: '3px auto 0',
                }}>
                  {day.getDate()}
                </div>
              </div>

              {conflict && (
                <div style={{
                  background: '#FFFBE6', border: '1px solid #F0C000',
                  borderRadius: 5, padding: '3px 6px', fontSize: 10,
                  color: '#7A5A00', marginBottom: 6, lineHeight: 1.3,
                }}>
                  ⚠️ Konflikt — barnvakt kan behövas
                </div>
              )}

              {dayEvs.map(ev => {
                const et = EVENT_TYPES[ev.type] || EVENT_TYPES.note;
                const isDragging = draggingId === ev.id;
                return (
                  <div
                    key={ev.id + iso}
                    draggable
                    onDragStart={e => onDragStart(e, ev.id)}
                    onDragEnd={onDragEnd}
                    style={{
                      background: et.bg,
                      border: `1px solid ${et.border}`,
                      borderRadius: 6,
                      padding: '4px 7px',
                      marginBottom: 5,
                      cursor: 'grab',
                      opacity: isDragging ? 0.4 : 1,
                      position: 'relative',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#333', lineHeight: 1.3, paddingRight: 14 }}>
                      <span style={{ marginRight: 4 }}>{et.icon}</span>{ev.title}
                    </div>
                    {ev.who && (
                      <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{ev.who}</div>
                    )}
                    {ev.recur && ev.recur !== 'none' && (
                      <div style={{ fontSize: 9, color: '#999', marginTop: 1 }}>
                        {ev.recur === 'weekly' ? '🔁 Varje vecka' : '🔁 Varje år'}
                      </div>
                    )}
                    <button
                      onClick={() => removeEvent(ev.id)}
                      style={{
                        position: 'absolute', top: 2, right: 4,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#999', fontSize: 11, lineHeight: 1, padding: 2,
                      }}
                      title="Ta bort"
                    >×</button>
                  </div>
                );
              })}

              <button
                onClick={() => openModal(iso)}
                style={{
                  width: '100%', background: 'none',
                  border: `1px dashed ${T.border}`, borderRadius: 6,
                  color: T.textMuted, fontSize: 10, padding: '3px',
                  cursor: 'pointer', marginTop: 4,
                }}
              >
                + händelse
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 440, boxShadow: T.shadowMd, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>+ Ny händelse</h2>

            <label style={labelStyle}>Typ</label>
            <select value={fType} onChange={e => setFType(e.target.value)} style={inputStyle}>
              {Object.entries(EVENT_TYPES).map(([key, et]) => (
                <option key={key} value={key}>{et.icon} {et.label}</option>
              ))}
            </select>

            <label style={labelStyle}>Titel</label>
            <input
              autoFocus
              value={fTitle}
              onChange={e => setFTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEvent()}
              placeholder="Vad ska hända?"
              style={inputStyle}
            />

            <label style={labelStyle}>Vem</label>
            <input
              value={fWho}
              onChange={e => setFWho(e.target.value)}
              placeholder="t.ex. Ella, Noah..."
              style={inputStyle}
            />

            <label style={labelStyle}>Datum</label>
            <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Upprepning</label>
            <select value={fRecur} onChange={e => setFRecur(e.target.value)} style={inputStyle}>
              {RECUR_OPTIONS.map(r => (
                <option key={r.val} value={r.val}>{r.label}</option>
              ))}
            </select>

            {fType && (
              <div style={{
                background: EVENT_TYPES[fType].bg,
                border: `1px solid ${EVENT_TYPES[fType].border}`,
                borderRadius: 8, padding: '8px 12px', marginBottom: 16,
                fontSize: 13, fontWeight: 600, color: '#333',
              }}>
                {EVENT_TYPES[fType].icon} {fTitle || EVENT_TYPES[fType].label}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{
                background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, cursor: 'pointer',
              }}>Avbryt</button>
              <button onClick={addEvent} style={{
                background: T.purple, color: '#fff', border: 'none',
                borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Spara</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
