import React, { useState } from 'react';
import { T } from '../theme';

const SUBJECT_COLORS = {
  'Matematik':   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Svenska':     { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  'SO':          { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' },
  'NO':          { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  'Idrott':      { bg: '#EDE8FF', text: '#5B3FA0', border: '#C4B5FD' },
  'Engelska':    { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
  'Bild':        { bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC' },
  'Musik':       { bg: '#FDF4FF', text: '#86198F', border: '#E879F9' },
  'Övrigt':      { bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' },
};

const SUBJECTS = Object.keys(SUBJECT_COLORS);

const TYPE_LABELS = {
  prov:      { label: 'Prov',      bg: '#FEE2E2', text: '#B91C1C' },
  laxe:      { label: 'Läxa',      bg: '#FFF7ED', text: '#C2410C' },
  aktivitet: { label: 'Aktivitet', bg: '#EDE8FF', text: '#5B3FA0' },
};

function Avatar({ member, size = 24 }) {
  return (
    <div title={member.name} style={{
      width: size, height: size, borderRadius: '50%',
      background: member.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {member.initials}
    </div>
  );
}

export default function Skola({ school, setSchool, members }) {
  const [showForm, setShowForm]         = useState(false);
  const [formTitle, setFormTitle]       = useState('');
  const [formSubject, setFormSubject]   = useState('Matematik');
  const [formDate, setFormDate]         = useState(new Date().toISOString().split('T')[0]);
  const [formMember, setFormMember]     = useState('');
  const [formType, setFormType]         = useState('laxe');

  // Only child members
  const children = members.filter(m => m.role !== 'Förälder');

  function addItem() {
    if (!formTitle.trim()) return;
    const item = {
      id: 'sk_' + Date.now(),
      title: formTitle.trim(),
      subject: formSubject,
      date: formDate,
      memberId: formMember,
      type: formType,
      done: false,
    };
    setSchool(prev => [...prev, item]);
    setFormTitle('');
    setShowForm(false);
  }

  function toggleDone(id) {
    setSchool(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function removeItem(id) {
    setSchool(prev => prev.filter(i => i.id !== id));
  }

  const upcoming = school.filter(i => !i.done).sort((a, b) => a.date.localeCompare(b.date));
  const done     = school.filter(i => i.done);

  function getMember(id) {
    return members.find(m => m.id === id);
  }

  function formatDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function SchoolItem({ item }) {
    const subjectStyle = SUBJECT_COLORS[item.subject] || SUBJECT_COLORS['Övrigt'];
    const typeStyle    = TYPE_LABELS[item.type] || TYPE_LABELS.laxe;
    const member       = getMember(item.memberId);

    return (
      <div style={{
        background: item.done ? '#F9FAFB' : T.card,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusSm,
        padding: '14px 16px',
        marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 14,
        opacity: item.done ? 0.65 : 1,
        transition: 'opacity 0.2s',
      }}>
        <input
          type="checkbox"
          checked={item.done}
          onChange={() => toggleDone(item.id)}
          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: T.purple, flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{
              background: subjectStyle.bg, color: subjectStyle.text,
              border: `1px solid ${subjectStyle.border}`,
              borderRadius: 5, fontSize: 11, padding: '2px 8px', fontWeight: 700,
            }}>
              {item.subject}
            </span>
            <span style={{
              background: typeStyle.bg, color: typeStyle.text,
              borderRadius: 5, fontSize: 11, padding: '2px 8px', fontWeight: 600,
            }}>
              {typeStyle.label}
            </span>
            {member && <Avatar member={member} size={20} />}
          </div>
          <div style={{
            fontSize: 14, fontWeight: 600, color: T.text,
            textDecoration: item.done ? 'line-through' : 'none',
          }}>
            {item.title}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{formatDate(item.date)}</div>
        </div>
        <button
          onClick={() => removeItem(item.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 18, lineHeight: 1, opacity: 0.5 }}
          title="Ta bort"
        >×</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>🎓 Skola</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Prov, läxor och skolaktiviteter</p>
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
          + Lägg till
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        {children.map(child => {
          const childItems = school.filter(i => i.memberId === child.id && !i.done);
          return (
            <div key={child.id} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: T.radius, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: T.shadow, flex: 1,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: child.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700,
              }}>{child.initials}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{child.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>
                  {childItems.length} uppgifter kvar
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming section */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          Kommande prov & inlämningar
          <span style={{ background: T.purpleLight, color: T.purple, borderRadius: 999, fontSize: 12, padding: '2px 10px', fontWeight: 700 }}>
            {upcoming.length}
          </span>
        </h2>
        {upcoming.length === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '32px', textAlign: 'center', color: T.textMuted, fontSize: 14 }}>
            Inga kommande uppgifter. Tryck på "+ Lägg till" för att lägga till.
          </div>
        ) : (
          upcoming.map(item => <SchoolItem key={item.id} item={item} />)
        )}
      </div>

      {/* Done section */}
      {done.length > 0 && (
        <div>
          <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
            Klara uppgifter
            <span style={{ background: T.greenLight, color: T.greenText, borderRadius: 999, fontSize: 12, padding: '2px 10px', fontWeight: 700 }}>
              {done.length}
            </span>
          </h2>
          {done.map(item => <SchoolItem key={item.id} item={item} />)}
        </div>
      )}

      {/* Add modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{
            background: T.card, borderRadius: T.radius,
            padding: 28, width: 420, boxShadow: T.shadowMd,
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>+ Ny skoluppgift</h2>

            <label style={labelStyle}>Titel / Beskrivning</label>
            <input
              autoFocus
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="T.ex. Prov i matematik kapitel 5"
              style={inputStyle}
            />

            <label style={labelStyle}>Ämne</label>
            <select value={formSubject} onChange={e => setFormSubject(e.target.value)} style={inputStyle}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label style={labelStyle}>Typ</label>
            <select value={formType} onChange={e => setFormType(e.target.value)} style={inputStyle}>
              <option value="prov">Prov</option>
              <option value="laxe">Läxa</option>
              <option value="aktivitet">Aktivitet</option>
            </select>

            <label style={labelStyle}>Datum</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Elev</label>
            <select value={formMember} onChange={e => setFormMember(e.target.value)} style={inputStyle}>
              <option value="">Välj elev...</option>
              {children.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setShowForm(false)} style={cancelBtnStyle}>Avbryt</button>
              <button onClick={addItem} style={saveBtnStyle}>Spara</button>
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
