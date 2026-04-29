import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const MOOD_EMOJIS = ['😢', '😞', '😐', '😊', '😄'];
const MOOD_LABELS = ['Dåligt', 'Inte bra', 'OK', 'Bra', 'Toppen'];

export default function Wellness({ members = [] }) {
  const [entries, setEntries] = useLocalStorage('kl_wellness', []);
  const [selectedMember, setSelectedMember] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [fMember, setFMember] = useState('');
  const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0]);
  const [fMood, setFMood] = useState(3);
  const [fNote, setFNote] = useState('');
  const [fSymptoms, setFSymptoms] = useState('');

  function addEntry() {
    if (!fMember || !fNote.trim()) return;
    setEntries(prev => [{
      id: 'w_' + Date.now(),
      member: fMember,
      date: fDate,
      mood: fMood,
      note: fNote.trim(),
      symptoms: fSymptoms.trim(),
    }, ...prev]);
    setShowForm(false);
    setFNote(''); setFSymptoms('');
  }

  function removeEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function getMemberObj(id) {
    return members.find(m => m.id === id) || { name: id, color: T.textMuted, initials: '?' };
  }

  const filteredEntries = selectedMember ? entries.filter(e => e.member === selectedMember) : entries;
  const sortedEntries = [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date));

  // Last 7 days mood per member
  function getLast7Moods(memberId) {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    return days.map(d => {
      const e = entries.find(en => en.member === memberId && en.date === d);
      return { date: d, mood: e ? e.mood : null };
    });
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
    padding: '9px 12px', fontSize: 14, color: T.text,
    marginBottom: 14, outline: 'none', background: T.bg,
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 };

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>❤️ Wellness</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Hälsologg per familjemedlem</p>
        </div>
        <button onClick={() => { setFMember(members[0]?.id || ''); setShowForm(true); }} style={{
          background: T.purple, color: '#fff', border: 'none',
          borderRadius: T.radiusSm, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          + Ny loggpost
        </button>
      </div>

      {/* Mood trends per member */}
      {members.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
          {members.map(m => {
            const moods = getLast7Moods(m.id);
            return (
              <div key={m.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 16, boxShadow: T.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                    {m.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Senaste 7 dagarna</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {moods.map((d, i) => (
                    <div key={i} title={d.date} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: d.mood ? 20 : 14, lineHeight: 1.2 }}>
                        {d.mood ? MOOD_EMOJIS[d.mood - 1] : '·'}
                      </div>
                      <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>
                        {new Date(d.date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short' }).slice(0, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setSelectedMember('')} style={{
          background: !selectedMember ? T.purple : T.bg, color: !selectedMember ? '#fff' : T.textMuted,
          border: `1px solid ${T.border}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
        }}>Alla</button>
        {members.map(m => (
          <button key={m.id} onClick={() => setSelectedMember(selectedMember === m.id ? '' : m.id)} style={{
            background: selectedMember === m.id ? m.color + '22' : T.bg,
            color: selectedMember === m.id ? m.color : T.textMuted,
            border: `1.5px solid ${selectedMember === m.id ? m.color : T.border}`,
            borderRadius: 20, padding: '5px 14px', fontSize: 12, cursor: 'pointer',
          }}>{m.name}</button>
        ))}
      </div>

      {/* Log entries */}
      {sortedEntries.length === 0 && (
        <div style={{ textAlign: 'center', color: T.textMuted, marginTop: 40, fontSize: 16 }}>
          Inga loggposter ännu. Klicka "+ Ny loggpost" för att börja.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sortedEntries.map(entry => {
          const m = getMemberObj(entry.member);
          return (
            <div key={entry.id} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: T.radius, padding: 18, boxShadow: T.shadow,
              display: 'flex', gap: 16, alignItems: 'flex-start',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                {m.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{m.name}</span>
                    <span style={{ color: T.textMuted, fontSize: 12, marginLeft: 8 }}>{entry.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }} title={MOOD_LABELS[entry.mood - 1]}>{MOOD_EMOJIS[entry.mood - 1]}</span>
                    <button onClick={() => removeEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14 }}>×</button>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: T.text, marginBottom: entry.symptoms ? 6 : 0 }}>{entry.note}</div>
                {entry.symptoms && (
                  <div style={{ fontSize: 12, color: '#B8722A', background: '#FDF0E0', borderRadius: 5, padding: '3px 8px', display: 'inline-block' }}>
                    Symtom: {entry.symptoms}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Entry Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 440, boxShadow: T.shadowMd }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>+ Ny loggpost</h2>

            <label style={labelStyle}>Familjemedlem</label>
            <select value={fMember} onChange={e => setFMember(e.target.value)} style={inputStyle}>
              <option value="">— Välj —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <label style={labelStyle}>Datum</label>
            <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Mående idag</label>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14, justifyContent: 'center' }}>
              {MOOD_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setFMood(i + 1)}
                  title={MOOD_LABELS[i]}
                  style={{
                    fontSize: 28, background: fMood === i + 1 ? T.purpleLight : 'transparent',
                    border: `2px solid ${fMood === i + 1 ? T.purple : T.border}`,
                    borderRadius: 10, padding: '4px 8px', cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: T.textMuted, marginBottom: 14 }}>{MOOD_LABELS[fMood - 1]}</div>

            <label style={labelStyle}>Notering</label>
            <textarea
              autoFocus value={fNote} onChange={e => setFNote(e.target.value)}
              placeholder="Hur mår du idag? Vad har hänt?"
              rows={3} style={{ ...inputStyle, resize: 'vertical' }}
            />

            <label style={labelStyle}>Symtom (valfri)</label>
            <input value={fSymptoms} onChange={e => setFSymptoms(e.target.value)}
              placeholder="t.ex. hosta, feber, ont i magen..." style={inputStyle} />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={addEntry} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Spara</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
