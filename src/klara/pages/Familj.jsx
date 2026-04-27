import React, { useState } from 'react';
import { T } from '../theme';

const COLORS = [
  '#7C5CBF', '#F97316', '#22C55E', '#3B82F6',
  '#EF4444', '#EC4899', '#14B8A6', '#F59E0B',
];

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function getThisWeekIsos() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return isoDate(d);
  });
}

export default function Familj({ members, setMembers, tasks, events }) {
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formInitials, setFormInitials] = useState('');

  const weekIsos = getThisWeekIsos();

  function startEdit(member) {
    setEditingId(member.id);
    setFormName(member.name);
    setFormRole(member.role);
    setFormColor(member.color);
    setFormInitials(member.initials);
  }

  function saveEdit() {
    setMembers(prev => prev.map(m =>
      m.id === editingId
        ? { ...m, name: formName, role: formRole, color: formColor, initials: formInitials || formName.slice(0, 1).toUpperCase() }
        : m
    ));
    setEditingId(null);
  }

  function deleteMember(id) {
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  function openAdd() {
    setFormName('');
    setFormRole('');
    setFormColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setFormInitials('');
    setShowAddForm(true);
  }

  function addMember() {
    if (!formName.trim()) return;
    const newM = {
      id: 'm_' + Date.now(),
      name: formName.trim(),
      role: formRole.trim() || 'Familjemedlem',
      color: formColor,
      initials: formInitials.trim() || formName.slice(0, 1).toUpperCase(),
    };
    setMembers(prev => [...prev, newM]);
    setShowAddForm(false);
  }

  function getMemberStats(memberId) {
    const assignedTasks = tasks.filter(t => t.mids.includes(memberId));
    const thisWeekEvents = events.filter(e =>
      weekIsos.includes(e.date) && (e.memberIds || []).includes(memberId)
    );
    return {
      totalTasks: assignedTasks.length,
      activeTasks: assignedTasks.filter(t => t.lane !== 'done').length,
      weekEvents: thisWeekEvents.length,
    };
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>👨‍👩‍👧‍👦 Familj</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Hantera familjemedlemmar</p>
        </div>
        <button
          onClick={openAdd}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {members.map(member => {
          const stats = getMemberStats(member.id);
          const isEditing = editingId === member.id;

          return (
            <div key={member.id} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: T.radius, padding: 24, boxShadow: T.shadow,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Color accent bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                background: member.color,
              }} />

              {isEditing ? (
                <div style={{ paddingTop: 4 }}>
                  <label style={labelStyle}>Initialer</label>
                  <input
                    value={formInitials}
                    onChange={e => setFormInitials(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="t.ex. AL"
                    maxLength={2}
                    style={{ ...inputStyle, textTransform: 'uppercase' }}
                  />
                  <label style={labelStyle}>Namn</label>
                  <input
                    autoFocus
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    style={inputStyle}
                  />
                  <label style={labelStyle}>Roll / Ålder</label>
                  <input
                    value={formRole}
                    onChange={e => setFormRole(e.target.value)}
                    placeholder="t.ex. Förälder, 12 år"
                    style={inputStyle}
                  />
                  <label style={labelStyle}>Färg</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setFormColor(c)}
                        style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: c, border: formColor === c ? `3px solid ${T.text}` : '2px solid transparent',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveEdit} style={saveBtnStyle}>Spara</button>
                    <button onClick={() => setEditingId(null)} style={cancelBtnStyle}>Avbryt</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Avatar */}
                  <div style={{ textAlign: 'center', marginBottom: 16, paddingTop: 8 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: member.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26, fontWeight: 700, margin: '0 auto 12px',
                      boxShadow: `0 6px 20px ${member.color}44`,
                    }}>
                      {member.initials}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{member.name}</div>
                    <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{member.role}</div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 10, marginBottom: 16,
                  }}>
                    <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: T.purple }}>{stats.activeTasks}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>aktiva uppgifter</div>
                    </div>
                    <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: T.blue }}>{stats.weekEvents}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>händelser i veckan</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => startEdit(member)}
                      style={{
                        flex: 1, background: T.purpleLight, color: T.purple,
                        border: 'none', borderRadius: T.radiusSm,
                        padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      ✏️ Redigera
                    </button>
                    <button
                      onClick={() => deleteMember(member.id)}
                      style={{
                        background: T.redLight, color: T.red,
                        border: 'none', borderRadius: T.radiusSm,
                        padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                      }}
                      title="Ta bort"
                    >
                      🗑
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add member modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setShowAddForm(false); }}>
          <div style={{
            background: T.card, borderRadius: T.radius,
            padding: 28, width: 380, boxShadow: T.shadowMd,
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>+ Ny familjemedlem</h2>

            <label style={labelStyle}>Namn</label>
            <input
              autoFocus
              value={formName}
              onChange={e => setFormName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMember()}
              placeholder="Förnamn"
              style={inputStyle}
            />

            <label style={labelStyle}>Roll / Ålder</label>
            <input
              value={formRole}
              onChange={e => setFormRole(e.target.value)}
              placeholder="t.ex. Förälder, 12 år"
              style={inputStyle}
            />

            <label style={labelStyle}>Initialer (visas i avatar)</label>
            <input
              value={formInitials}
              onChange={e => setFormInitials(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="t.ex. AL"
              maxLength={2}
              style={{ ...inputStyle, textTransform: 'uppercase' }}
            />

            <label style={labelStyle}>Färg</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {COLORS.map(c => (
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
              <button onClick={() => setShowAddForm(false)} style={cancelBtnStyle}>Avbryt</button>
              <button onClick={addMember} style={saveBtnStyle}>Lägg till</button>
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
