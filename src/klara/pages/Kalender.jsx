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

// ─── Planering-vyn (kategorirutnät) ──────────────────────────────────────────
const PLAN_CATS = [
  { id: 'familj',      label: 'Familj',      color: T.purple,  bg: T.purpleLight },
  { id: 'skola',       label: 'Skola',       color: T.blue,    bg: T.blueLight   },
  { id: 'aktiviteter', label: 'Aktiviteter', color: T.orange,  bg: T.orangeLight },
  { id: 'shopping',    label: 'Shopping',    color: T.green,   bg: T.greenLight  },
  { id: 'noteringar',  label: 'Noteringar',  color: '#6B7280', bg: '#F3F4F6'     },
];

function PlaneringsVy({ events, setEvents }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm]     = useState(null);
  const [formTitle, setFormTitle]   = useState('');
  const [formTime, setFormTime]     = useState('');
  const todayIso = isoDate(new Date());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const today = new Date();
    const dow = today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((dow + 6) % 7) + weekOffset * 7);
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    return d;
  });

  const first = weekDays[0], last = weekDays[6];
  const weekLabel = `${first.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}`;

  function addItem() {
    if (!showForm || !formTitle.trim()) return;
    const cat = PLAN_CATS.find(c => c.id === showForm.catId);
    setEvents(prev => [...prev, {
      id: 'pl_' + Date.now(),
      title: formTitle.trim(),
      date: showForm.date,
      color: cat ? cat.color : T.purple,
      category: showForm.catId,
      time: formTime,
      memberIds: [],
    }]);
    setShowForm(null);
  }

  return (
    <div>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, width: 'fit-content', background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '10px 16px', boxShadow: T.shadow }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.purple }}>‹</button>
        <span style={{ fontWeight: 600, color: T.text, minWidth: 200, textAlign: 'center', fontSize: 14 }}>{weekLabel}</span>
        <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.purple }}>›</button>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} style={{ background: T.purpleLight, color: T.purple, border: 'none', borderRadius: T.radiusSm, fontSize: 12, cursor: 'pointer', padding: '5px 12px', fontWeight: 600 }}>Idag</button>
        )}
      </div>

      {/* Grid */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(7, 1fr)', background: T.sidebar }}>
          <div style={{ padding: '12px 14px', fontSize: 12, color: T.sidebarText, fontWeight: 600 }}>Kategori</div>
          {weekDays.map((day, i) => {
            const iso = isoDate(day);
            const isToday = iso === todayIso;
            return (
              <div key={i} style={{ padding: '12px 8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 11, color: T.sidebarText, fontWeight: 600 }}>
                  {['Mån','Tis','Ons','Tor','Fre','Lör','Sön'][i]}
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: isToday ? T.purple : 'transparent',
                  color: isToday ? '#fff' : '#CCCCDD',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, margin: '4px auto 0',
                }}>{day.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {PLAN_CATS.map(cat => (
          <div key={cat.id} style={{ display: 'grid', gridTemplateColumns: '110px repeat(7, 1fr)', borderTop: `1px solid ${T.border}` }}>
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', background: cat.bg + '88', borderRight: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: cat.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{cat.label}</span>
            </div>
            {weekDays.map((day, di) => {
              const iso = isoDate(day);
              const isToday = iso === todayIso;
              const cellEvs = events.filter(e => e.date === iso && e.category === cat.id);
              const isOpen = showForm && showForm.date === iso && showForm.catId === cat.id;
              return (
                <div key={di} style={{ padding: 8, borderLeft: `1px solid ${T.border}`, minHeight: 60, background: isToday ? T.purpleLight + '44' : 'transparent' }}>
                  {cellEvs.map(ev => (
                    <div key={ev.id} style={{ background: ev.color + '22', border: `1px solid ${ev.color}44`, borderLeft: `3px solid ${ev.color}`, borderRadius: 5, padding: '3px 6px', marginBottom: 4, fontSize: 11, color: ev.color, fontWeight: 600, lineHeight: 1.3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <span style={{ flex: 1 }}>{ev.time ? `${ev.time} ` : ''}{ev.title}</span>
                      <button onClick={() => setEvents(p => p.filter(e => e.id !== ev.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ev.color, fontSize: 12, opacity: 0.6, padding: 0 }}>×</button>
                    </div>
                  ))}
                  {isOpen ? (
                    <div>
                      <input autoFocus value={formTitle} onChange={e => setFormTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setShowForm(null); }} placeholder="Beskrivning..." style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${cat.color}`, borderRadius: 5, padding: '3px 6px', fontSize: 11, outline: 'none', marginBottom: 3, background: cat.bg, color: cat.color }} />
                      <input value={formTime} onChange={e => setFormTime(e.target.value)} placeholder="Tid (14:00)" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 5, padding: '3px 6px', fontSize: 11, outline: 'none', marginBottom: 4 }} />
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={addItem} style={{ background: cat.color, color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer', flex: 1 }}>OK</button>
                        <button onClick={() => setShowForm(null)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 6px', fontSize: 11, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setShowForm({ date: iso, catId: cat.id }); setFormTitle(''); setFormTime(''); }} style={{ width: '100%', background: 'none', border: `1px dashed ${T.border}`, borderRadius: 4, color: T.textMuted, fontSize: 10, padding: '2px 4px', cursor: 'pointer', marginTop: cellEvs.length ? 4 : 0, opacity: 0.6 }}>+</button>
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

// ─── Skola-vyn ───────────────────────────────────────────────────────────────
const SUBJECT_COLORS = {
  'Matematik': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Svenska':   { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  'SO':        { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' },
  'NO':        { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  'Idrott':    { bg: '#EDE8FF', text: '#5B3FA0', border: '#C4B5FD' },
  'Engelska':  { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
  'Bild':      { bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC' },
  'Musik':     { bg: '#FDF4FF', text: '#86198F', border: '#E879F9' },
  'Övrigt':    { bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' },
};
const SUBJECTS = Object.keys(SUBJECT_COLORS);
const TYPE_LABELS = {
  prov:      { label: 'Prov',      bg: '#FEE2E2', text: '#B91C1C' },
  laxe:      { label: 'Läxa',      bg: '#FFF7ED', text: '#C2410C' },
  aktivitet: { label: 'Aktivitet', bg: '#EDE8FF', text: '#5B3FA0' },
};

function SkolaVy({ school, setSchool, members }) {
  const [showForm,    setShowForm]    = useState(false);
  const [formTitle,   setFormTitle]   = useState('');
  const [formSubject, setFormSubject] = useState('Matematik');
  const [formDate,    setFormDate]    = useState(new Date().toISOString().split('T')[0]);
  const [formMember,  setFormMember]  = useState('');
  const [formType,    setFormType]    = useState('laxe');
  const [filterKid,   setFilterKid]   = useState('');

  const children = members.filter(m => !m.role?.includes('Förälder'));

  function addItem() {
    if (!formTitle.trim()) return;
    setSchool(prev => [...prev, { id: 'sk_' + Date.now(), title: formTitle.trim(), subject: formSubject, date: formDate, memberId: formMember, type: formType, done: false }]);
    setFormTitle(''); setShowForm(false);
  }

  function fmt(iso) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  const filtered = filterKid ? school.filter(i => i.memberId === filterKid) : school;
  const upcoming  = filtered.filter(i => !i.done).sort((a, b) => a.date.localeCompare(b.date));
  const done      = filtered.filter(i => i.done);

  const sInp = { width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 14, color: T.text, marginBottom: 14, outline: 'none', background: T.bg };
  const sLbl = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 };

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterKid('')} style={{ background: !filterKid ? T.purple : T.card, color: !filterKid ? '#fff' : T.textMuted, border: `1px solid ${!filterKid ? T.purple : T.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: !filterKid ? 600 : 400 }}>Alla</button>
          {children.map(c => (
            <button key={c.id} onClick={() => setFilterKid(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: filterKid === c.id ? c.color : T.card, color: filterKid === c.id ? '#fff' : T.textMuted, border: `1px solid ${filterKid === c.id ? c.color : T.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: filterKid === c.id ? 600 : 400 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: c.color, display: filterKid === c.id ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700 }}>{c.initials}</div>
              {c.name}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: T.shadowMd }}>
          + Lägg till
        </button>
      </div>

      {/* Kid overview cards */}
      {children.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {children.map(child => {
            const pending = school.filter(i => i.memberId === child.id && !i.done);
            const urgent  = pending.filter(i => {
              const d = new Date(i.date + 'T12:00:00');
              return (d - new Date()) / 86400000 <= 3;
            });
            return (
              <div key={child.id} onClick={() => setFilterKid(f => f === child.id ? '' : child.id)} style={{ background: T.card, border: `1.5px solid ${filterKid === child.id ? child.color : T.border}`, borderRadius: T.radius, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: T.shadow, cursor: 'pointer', flex: 1, minWidth: 160 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: child.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>{child.initials}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{child.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{pending.length} kvar</div>
                  {urgent.length > 0 && <div style={{ fontSize: 11, color: T.red, fontWeight: 600 }}>⚠ {urgent.length} snart</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List: upcoming */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          Kommande
          <span style={{ background: T.purpleLight, color: T.purple, borderRadius: 999, fontSize: 12, padding: '2px 10px', fontWeight: 700 }}>{upcoming.length}</span>
        </h3>
        {upcoming.length === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 28, textAlign: 'center', color: T.textMuted, fontSize: 14 }}>Inga kommande uppgifter 🎉</div>
        ) : upcoming.map(item => {
          const ss = SUBJECT_COLORS[item.subject] || SUBJECT_COLORS['Övrigt'];
          const ts = TYPE_LABELS[item.type] || TYPE_LABELS.laxe;
          const m  = members.find(x => x.id === item.memberId);
          const daysLeft = Math.ceil((new Date(item.date + 'T12:00:00') - new Date()) / 86400000);
          return (
            <div key={item.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
              <input type="checkbox" checked={item.done} onChange={() => setSchool(p => p.map(i => i.id === item.id ? { ...i, done: !i.done } : i))} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: T.purple, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}`, borderRadius: 5, fontSize: 11, padding: '2px 8px', fontWeight: 700 }}>{item.subject}</span>
                  <span style={{ background: ts.bg, color: ts.text, borderRadius: 5, fontSize: 11, padding: '2px 8px', fontWeight: 600 }}>{ts.label}</span>
                  {m && <div title={m.name} style={{ width: 20, height: 20, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{m.initials}</div>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{item.title}</div>
                <div style={{ fontSize: 12, color: daysLeft <= 1 ? T.red : daysLeft <= 3 ? '#F97316' : T.textMuted, marginTop: 3, fontWeight: daysLeft <= 3 ? 600 : 400 }}>
                  {fmt(item.date)} {daysLeft <= 3 && daysLeft >= 0 ? `· ${daysLeft === 0 ? 'Idag!' : daysLeft === 1 ? 'Imorgon!' : `${daysLeft} dagar kvar`}` : ''}
                </div>
              </div>
              <button onClick={() => setSchool(p => p.filter(i => i.id !== item.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 18, opacity: 0.5 }}>×</button>
            </div>
          );
        })}
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
            Klara
            <span style={{ background: T.greenLight, color: T.greenText, borderRadius: 999, fontSize: 12, padding: '2px 10px', fontWeight: 700 }}>{done.length}</span>
          </h3>
          {done.map(item => {
            const ss = SUBJECT_COLORS[item.subject] || SUBJECT_COLORS['Övrigt'];
            const ts = TYPE_LABELS[item.type] || TYPE_LABELS.laxe;
            const m  = members.find(x => x.id === item.memberId);
            return (
              <div key={item.id} style={{ background: '#F9FAFB', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, opacity: 0.7 }}>
                <input type="checkbox" checked={item.done} onChange={() => setSchool(p => p.map(i => i.id === item.id ? { ...i, done: !i.done } : i))} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: T.purple, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}`, borderRadius: 5, fontSize: 11, padding: '2px 8px', fontWeight: 700 }}>{item.subject}</span>
                    <span style={{ background: ts.bg, color: ts.text, borderRadius: 5, fontSize: 11, padding: '2px 8px', fontWeight: 600 }}>{ts.label}</span>
                    {m && <div title={m.name} style={{ width: 20, height: 20, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{m.initials}</div>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, textDecoration: 'line-through' }}>{item.title}</div>
                </div>
                <button onClick={() => setSchool(p => p.filter(i => i.id !== item.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 18, opacity: 0.5 }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 420, boxShadow: T.shadowMd }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>+ Ny skoluppgift</h2>
            <label style={sLbl}>Titel</label>
            <input autoFocus value={formTitle} onChange={e => setFormTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} placeholder="T.ex. Prov i matematik kapitel 5" style={sInp} />
            <label style={sLbl}>Ämne</label>
            <select value={formSubject} onChange={e => setFormSubject(e.target.value)} style={sInp}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={sLbl}>Typ</label>
            <select value={formType} onChange={e => setFormType(e.target.value)} style={sInp}>
              <option value="prov">Prov</option><option value="laxe">Läxa</option><option value="aktivitet">Aktivitet</option>
            </select>
            <label style={sLbl}>Datum</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={sInp} />
            <label style={sLbl}>Elev</label>
            <select value={formMember} onChange={e => setFormMember(e.target.value)} style={sInp}>
              <option value="">Välj elev...</option>
              {children.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setShowForm(false)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={addItem} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Spara</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kalender (huvud) ─────────────────────────────────────────────────────────
export default function Kalender({ members, school, setSchool, initialView = 'kalender' }) {
  const [calEvents, setCalEvents] = useLocalStorage('kl_cal_events', []);
  const [planEvents, setPlanEvents] = useLocalStorage('kl_events', []);
  const [skolaItems, setSkolaItems] = useLocalStorage('kl_school', school || []);
  const [activeView, setActiveView] = useState(initialView); // 'kalender' | 'planering' | 'skola'

  // Sync with parent if provided
  const schoolData   = school    ?? skolaItems;
  const setSchoolData= setSchool ?? setSkolaItems;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>📅 Kalender</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>
            Vecka {weekNum} — {monthName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {activeView === 'kalender' && (
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
          )}
        </div>
      </div>

      {/* Tab-väljare */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 6, width: 'fit-content', boxShadow: T.shadow }}>
        {[
          { id: 'kalender',  label: '📅 Kalender' },
          { id: 'planering', label: '📋 Planering' },
          { id: 'skola',     label: '🎓 Skola' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              padding: '8px 20px', border: 'none', borderRadius: T.radiusSm,
              background: activeView === tab.id ? T.purple : 'transparent',
              color: activeView === tab.id ? '#fff' : T.textMuted,
              fontWeight: activeView === tab.id ? 700 : 400,
              fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Planering-vyn */}
      {activeView === 'planering' && (
        <PlaneringsVy events={planEvents} setEvents={setPlanEvents} />
      )}

      {/* Skola-vyn */}
      {activeView === 'skola' && (
        <SkolaVy school={schoolData} setSchool={setSchoolData} members={members || []} />
      )}

      {/* Kalender-vyn (resten renderas bara när activeView === 'kalender') */}
      {activeView === 'kalender' && (<>


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
      </>)}
    </div>
  );
}
