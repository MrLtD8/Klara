import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';
import useIcsCalendars from '../../useIcsCalendars';
import { DEFAULT_GCAL, activeCalendars } from '../../gcal';

const EVENT_TYPES = {
  gcal:    { icon: '📆',  label: 'Google Kalender', bg: '#E8F0FE', border: '#7095D8' },
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
  if (day < evDate) return false; // visa aldrig en repetition före startdatumet
  if (ev.recur === 'weekly') {
    return evDate.getDay() === day.getDay();
  }
  if (ev.recur === 'yearly') {
    return evDate.getMonth() === day.getMonth() && evDate.getDate() === day.getDate();
  }
  return ev.date === dayIso;
}

// Google Kalender-händelser (från iCal-feeden) är skrivskyddade — de kan inte
// redigeras/flyttas/tas bort. Robust check: proxyn sätter type:'gcal' och
// useIcsCalendars sätter calendarId (id:t prefixas med kalender-id).
function isGcalEvent(ev) {
  return !!(ev && (ev.type === 'gcal' || ev.calendarId || (typeof ev.id === 'string' && ev.id.includes('gcal_'))));
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


// ─── Månadsvy ─────────────────────────────────────────────────────────────────
function MonthView({ calEvents, todayIso, onDayClick, removeEvent, onEditEvent }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const year  = base.getFullYear();
  const month = base.getMonth();

  // Monday-aligned 6×7 grid
  const firstDay = new Date(year, month, 1);
  const dow      = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - dow);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  const label = `${MONTHS_SV[month]} ${year}`;

  return (
    <div>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '10px 18px', boxShadow: T.shadow, width: 'fit-content' }}>
        <button onClick={() => setMonthOffset(m => m - 1)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.purple, padding: '2px 8px' }}>‹</button>
        <span style={{ fontWeight: 700, color: T.text, minWidth: 180, textAlign: 'center', fontSize: 16, textTransform: 'capitalize' }}>{label}</span>
        <button onClick={() => setMonthOffset(m => m + 1)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.purple, padding: '2px 8px' }}>›</button>
        {monthOffset !== 0 && (
          <button onClick={() => setMonthOffset(0)} style={{ background: T.purpleLight, color: T.purple, border: 'none', borderRadius: T.radiusSm, fontSize: 12, cursor: 'pointer', padding: '4px 10px', fontWeight: 600 }}>Idag</button>
        )}
      </div>

      {/* Day-of-week header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4, marginBottom: 4 }}>
        {DAY_SHORT.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
        {days.map((day, i) => {
          const iso = isoDate(day);
          const isCurrentMonth = day.getMonth() === month;
          const isToday = iso === todayIso;
          const dayEvs = calEvents.filter(ev => eventMatchesDay(ev, iso));

          return (
            <div
              key={i}
              onClick={() => onDayClick(iso)}
              style={{
                background: isToday ? T.purpleLight : T.card,
                border: `1.5px solid ${isToday ? T.purple : T.border}`,
                borderRadius: T.radiusSm,
                padding: '6px 8px',
                minHeight: 88,
                cursor: 'pointer',
                opacity: isCurrentMonth ? 1 : 0.3,
                transition: 'border-color 0.15s',
                boxShadow: isToday ? `0 0 0 2px ${T.purple}22` : 'none',
              }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.borderColor = T.purple + '66'; }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.borderColor = T.border; }}
            >
              <div style={{
                fontSize: 13, fontWeight: isToday ? 800 : 500,
                color: isToday ? T.purple : (isCurrentMonth ? T.text : T.textMuted),
                marginBottom: 4,
                width: 24, height: 24, borderRadius: '50%',
                background: isToday ? T.purple : 'transparent',
                color: isToday ? '#fff' : (isCurrentMonth ? T.text : T.textMuted),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {day.getDate()}
              </div>
              {dayEvs.slice(0, 3).map(ev => {
                const et = EVENT_TYPES[ev.type] || EVENT_TYPES.note;
                const isGcal = isGcalEvent(ev);
                return (
                  <div
                    key={ev.id + iso}
                    onClick={isGcal ? undefined : e => { e.stopPropagation(); onEditEvent && onEditEvent(ev); }}
                    title={isGcal ? 'Google-händelse (skrivskyddad)' : 'Klicka för att redigera'}
                    style={{
                      background: et.bg, border: `1px solid ${et.border}`,
                      borderRadius: 3, padding: '1px 5px',
                      fontSize: 10, fontWeight: 600, color: '#333',
                      marginBottom: 2, lineHeight: 1.4,
                      cursor: isGcal ? 'default' : 'pointer',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {et.icon} {ev.title}
                  </div>
                );
              })}
              {dayEvs.length > 3 && (
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600 }}>+{dayEvs.length - 3} till</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Kalender (huvud) ─────────────────────────────────────────────────────────
export default function Kalender({ members }) {
  const [calEvents, setCalEvents] = useLocalStorage('kl_cal_events', []);
  const [gcalSettings] = useLocalStorage('kl_gcal', DEFAULT_GCAL);
  const { events: gcalEvents } = useIcsCalendars(activeCalendars(gcalSettings));
  const mergedEvents = [...calEvents, ...gcalEvents];
  const [weekOffset, setWeekOffset] = useState(0);
  const [calView, setCalView] = useState('week'); // 'week' | 'month'
  const [showModal, setShowModal] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);

  // Form state
  const [fType, setFType] = useState('school');
  const [fTitle, setFTitle] = useState('');
  const [fWho, setFWho] = useState('');
  const [fDate, setFDate] = useState(isoDate(new Date()));
  const [fRecur, setFRecur] = useState('none');
  const [editingId, setEditingId] = useState(null); // null = ny händelse, annars id som redigeras

  const weekDays = getWeekDays(weekOffset);
  const todayIso = isoDate(new Date());
  const weekNum = getWeekNumber(weekDays[0]);
  const monthName = MONTHS_SV[weekDays[3].getMonth()];

  function openModal(date) {
    setEditingId(null);
    setFDate(date || isoDate(new Date()));
    setFType('school');
    setFTitle('');
    setFWho('');
    setFRecur('none');
    setShowModal(true);
  }

  // Öppna en befintlig (icke-Google) händelse för redigering
  function openEdit(ev) {
    if (!ev || isGcalEvent(ev)) return; // Google-händelser är skrivskyddade
    setEditingId(ev.id);
    setFType(ev.type || 'note');
    setFTitle(ev.title || '');
    setFWho(ev.who || '');
    setFDate(ev.date);
    setFRecur(ev.recur || 'none');
    setShowModal(true);
  }

  function saveEvent() {
    if (!fTitle.trim()) return;
    if (editingId) {
      setCalEvents(prev => prev.map(e => e.id === editingId
        ? { ...e, type: fType, title: fTitle.trim(), who: fWho.trim(), date: fDate, recur: fRecur }
        : e));
    } else {
      setCalEvents(prev => [...prev, {
        id: 'cal_' + Date.now(),
        type: fType,
        title: fTitle.trim(),
        who: fWho.trim(),
        date: fDate,
        recur: fRecur,
      }]);
    }
    setShowModal(false);
    setEditingId(null);
  }

  // Fyll formuläret från en tidigare händelse (snabb-bubblorna högst upp)
  function applyChip(ev) {
    setFType(ev.type || 'note');
    setFTitle(ev.title || '');
    setFWho(ev.who || '');
    // behåll valt datum och upprepning
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
    const dayEvs = mergedEvents.filter(ev => eventMatchesDay(ev, dayIso));
    if (dayEvs.length < 2) return false;
    const adults = members.filter(m => !m.role.includes('år'));
    if (adults.length < 2) return false;
    const whoText = dayEvs.map(ev => ev.who || '').join(' ').toLowerCase();
    const adultsPresent = adults.filter(m => whoText.includes(m.name.toLowerCase()));
    return adultsPresent.length >= 2;
  }

  // De senaste (egna) händelserna, distinkta på titel — för snabb-bubblorna
  const recentChips = (() => {
    const seen = new Set();
    const out = [];
    for (let i = calEvents.length - 1; i >= 0 && out.length < 6; i--) {
      const ev = calEvents[i];
      const key = (ev.title || '').toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(ev);
    }
    return out;
  })();

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>📅 Kalender</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>
            Vecka {weekNum} — {monthName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Week / Month toggle */}
          <div style={{ display: 'flex', background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, overflow: 'hidden' }}>
            {['week','month'].map(v => (
              <button key={v} onClick={() => setCalView(v)} style={{
                padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: calView === v ? 700 : 400,
                background: calView === v ? T.purple : 'transparent',
                color: calView === v ? '#fff' : T.textMuted,
                transition: 'all 0.15s',
              }}>
                {v === 'week' ? 'Vecka' : 'Månad'}
              </button>
            ))}
          </div>
          <button
            onClick={() => openModal(null)}
            style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            + Händelse
          </button>
        </div>
      </div>

      {/* Månadsvy */}
      {calView === 'month' && (
        <MonthView
          calEvents={mergedEvents}
          todayIso={todayIso}
          onDayClick={openModal}
          removeEvent={removeEvent}
          onEditEvent={openEdit}
        />
      )}

      {/* Veckovy */}
      {calView === 'week' && (<>

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 10 }}>
        {weekDays.map((day, i) => {
          const iso = isoDate(day);
          const isToday = iso === todayIso;
          const isDragTarget = dragOverDay === iso;
          const dayEvs = mergedEvents.filter(ev => eventMatchesDay(ev, iso));
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
                const isGcal = isGcalEvent(ev);
                return (
                  <div
                    key={ev.id + iso}
                    draggable={!isGcal}
                    onDragStart={isGcal ? undefined : e => onDragStart(e, ev.id)}
                    onDragEnd={isGcal ? undefined : onDragEnd}
                    onClick={isGcal ? undefined : () => openEdit(ev)}
                    title={isGcal ? 'Google-händelse (skrivskyddad)' : 'Klicka för att redigera'}
                    style={{
                      background: et.bg,
                      border: `1px solid ${et.border}`,
                      borderRadius: 6,
                      padding: '4px 7px',
                      marginBottom: 5,
                      cursor: isGcal ? 'default' : 'pointer',
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
                    {!isGcal && (
                      <button
                        onClick={e => { e.stopPropagation(); removeEvent(ev.id); }}
                        style={{
                          position: 'absolute', top: 2, right: 4,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#999', fontSize: 11, lineHeight: 1, padding: 2,
                        }}
                        title="Ta bort"
                      >×</button>
                    )}
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

      </>)}

      {/* Add Event Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 440, boxShadow: T.shadowMd, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 18, color: T.text }}>{editingId ? 'Redigera händelse' : '+ Ny händelse'}</h2>

            {/* Snabb-bubblor: de senaste händelserna — klicka för att fylla i */}
            {!editingId && recentChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                {recentChips.map(ev => {
                  const et = EVENT_TYPES[ev.type] || EVENT_TYPES.note;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => applyChip(ev)}
                      title="Fyll i från denna"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: et.bg, border: `1px solid ${et.border}`, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#333', cursor: 'pointer', maxWidth: 200 }}
                    >
                      <span>{et.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                      <span style={{ marginLeft: 2, fontWeight: 700, color: T.purple, fontSize: 14, lineHeight: 1 }}>+</span>
                    </button>
                  );
                })}
              </div>
            )}

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
              onKeyDown={e => e.key === 'Enter' && saveEvent()}
              placeholder="Vad ska hända?"
              style={inputStyle}
            />

            <label style={labelStyle}>Vem</label>
            <select value={fWho} onChange={e => setFWho(e.target.value)} style={inputStyle}>
              <option value="">Ingen / alla</option>
              {(members || []).map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
              {/* Bevara ett gammalt fritext-värde som inte matchar någon medlem */}
              {fWho && !(members || []).some(m => m.name === fWho) && (
                <option value={fWho}>{fWho}</option>
              )}
            </select>

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

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
              {editingId && (
                <button
                  onClick={() => { removeEvent(editingId); setShowModal(false); setEditingId(null); }}
                  style={{ background: T.redLight, color: T.red, border: 'none', borderRadius: T.radiusSm, padding: '9px 16px', fontSize: 14, cursor: 'pointer', marginRight: 'auto' }}
                >🗑 Ta bort</button>
              )}
              <button onClick={() => { setShowModal(false); setEditingId(null); }} style={{
                background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, cursor: 'pointer',
              }}>Avbryt</button>
              <button onClick={saveEvent} style={{
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
