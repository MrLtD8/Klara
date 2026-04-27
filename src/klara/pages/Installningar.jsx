import React, { useState } from 'react';
import { T } from '../theme';

const COLORS = [
  '#7C5CBF', '#F97316', '#22C55E', '#3B82F6',
  '#EF4444', '#EC4899', '#14B8A6', '#F59E0B',
];

function Section({ title, children }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: T.radius, padding: 24, boxShadow: T.shadow,
      marginBottom: 20,
    }}>
      <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: T.text }}>{title}</h2>
      {children}
    </div>
  );
}

export default function Installningar({ members, setMembers, focus, setFocus }) {
  const [familyName, setFamilyName]       = useState('Familjen');
  const [editingFam, setEditingFam]       = useState(false);
  const [tempFamName, setTempFamName]     = useState('Familjen');
  const [focusEdit, setFocusEdit]         = useState(false);
  const [tempFocus, setTempFocus]         = useState(focus);
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName]           = useState('');
  const [editRole, setEditRole]           = useState('');
  const [editColor, setEditColor]         = useState('');
  const [editInit, setEditInit]           = useState('');

  function saveFamilyName() {
    setFamilyName(tempFamName);
    setEditingFam(false);
  }

  function saveFocus() {
    setFocus(tempFocus);
    setFocusEdit(false);
  }

  function startEditMember(m) {
    setEditingMember(m.id);
    setEditName(m.name);
    setEditRole(m.role);
    setEditColor(m.color);
    setEditInit(m.initials);
  }

  function saveEditMember() {
    setMembers(prev => prev.map(m =>
      m.id === editingMember
        ? { ...m, name: editName, role: editRole, color: editColor, initials: editInit || editName.slice(0, 1).toUpperCase() }
        : m
    ));
    setEditingMember(null);
  }

  function deleteMember(id) {
    if (window.confirm('Vill du ta bort denna familjemedlem?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>⚙️ Inställningar</h1>
        <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Anpassa Klara för din familj</p>
      </div>

      {/* Familjenamn */}
      <Section title="🏠 Familjenamn">
        {editingFam ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              autoFocus
              value={tempFamName}
              onChange={e => setTempFamName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveFamilyName(); if (e.key === 'Escape') setEditingFam(false); }}
              style={inputStyle}
            />
            <button onClick={saveFamilyName} style={saveBtnStyleSm}>Spara</button>
            <button onClick={() => setEditingFam(false)} style={cancelBtnStyleSm}>Avbryt</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{familyName}</span>
            <button
              onClick={() => { setTempFamName(familyName); setEditingFam(true); }}
              style={editBtnStyle}
            >
              ✏️ Redigera
            </button>
          </div>
        )}
      </Section>

      {/* Dagens fokus */}
      <Section title="⭐ Dagens fokus">
        <p style={{ margin: '0 0 12px', fontSize: 13, color: T.textMuted }}>
          Texten visas längst ned i sidomenyn som en daglig påminnelse.
        </p>
        {focusEdit ? (
          <div>
            <textarea
              autoFocus
              value={tempFocus}
              onChange={e => setTempFocus(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontStyle: 'italic', marginBottom: 10 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveFocus} style={saveBtnStyleSm}>Spara</button>
              <button onClick={() => setFocusEdit(false)} style={cancelBtnStyleSm}>Avbryt</button>
            </div>
          </div>
        ) : (
          <div style={{
            background: T.sidebarHover,
            borderRadius: T.radiusSm, padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <span style={{ fontSize: 14, color: '#CCCCDD', fontStyle: 'italic', flex: 1, lineHeight: 1.5 }}>
              "{focus}"
            </span>
            <button onClick={() => { setTempFocus(focus); setFocusEdit(true); }} style={editBtnStyle}>
              ✏️ Redigera
            </button>
          </div>
        )}
      </Section>

      {/* Familjemedlemmar */}
      <Section title="👨‍👩‍👧‍👦 Familjemedlemmar">
        {members.map(m => (
          <div key={m.id} style={{
            border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
            padding: '12px 16px', marginBottom: 10,
          }}>
            {editingMember === m.id ? (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Initialer</label>
                    <input
                      value={editInit}
                      onChange={e => setEditInit(e.target.value.toUpperCase().slice(0, 2))}
                      style={{ ...inputStyle, width: 60, marginBottom: 0 }}
                      maxLength={2}
                    />
                  </div>
                  <div style={{ flex: 3 }}>
                    <label style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Namn</label>
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{ ...inputStyle, marginBottom: 0 }}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Roll</label>
                    <input
                      value={editRole}
                      onChange={e => setEditRole(e.target.value)}
                      style={{ ...inputStyle, marginBottom: 0 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: c, border: editColor === c ? `3px solid ${T.text}` : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveEditMember} style={saveBtnStyleSm}>Spara</button>
                  <button onClick={() => setEditingMember(null)} style={cancelBtnStyleSm}>Avbryt</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: m.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, flexShrink: 0,
                }}>
                  {m.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{m.role}</div>
                </div>
                <button onClick={() => startEditMember(m)} style={editBtnStyle}>✏️ Redigera</button>
                <button
                  onClick={() => deleteMember(m.id)}
                  style={{
                    background: T.redLight, color: T.red,
                    border: 'none', borderRadius: T.radiusSm,
                    padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  🗑 Ta bort
                </button>
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* Tema */}
      <Section title="🎨 Tema">
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center',
          background: T.bg, borderRadius: T.radiusSm, padding: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: T.radiusSm,
            background: `linear-gradient(135deg, ${T.sidebar} 50%, ${T.purple} 50%)`,
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Klara Dark/Light</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Aktivt tema — fler teman kommer snart</div>
          </div>
          <span style={{ marginLeft: 'auto', background: T.greenLight, color: T.greenText, borderRadius: 999, fontSize: 12, padding: '4px 12px', fontWeight: 700 }}>
            Aktiv
          </span>
        </div>
      </Section>

      {/* Om Klara */}
      <Section title="ℹ️ Om Klara">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Design', value: 'Klara.' },
            { label: 'Moduler', value: '9 aktiva' },
            { label: 'Plattform', value: 'Animus Heart / Lokal' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: T.bg, borderRadius: T.radiusSm, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{value}</div>
            </div>
          ))}
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
          Klara är en familjeplaneringsapp byggd för att köras lokalt på Animus Heart.
          Alla data sparas på din enhet — ingen molntjänst krävs.
        </p>
      </Section>
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 14, color: T.text,
  outline: 'none', background: T.bg,
};
const saveBtnStyleSm = {
  background: T.purple, color: '#fff', border: 'none',
  borderRadius: T.radiusSm, padding: '7px 16px',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const cancelBtnStyleSm = {
  background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`,
  borderRadius: T.radiusSm, padding: '7px 14px',
  fontSize: 13, cursor: 'pointer',
};
const editBtnStyle = {
  background: T.purpleLight, color: T.purple,
  border: 'none', borderRadius: T.radiusSm,
  padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
