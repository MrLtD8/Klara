import React, { useState } from 'react';
import { T } from '../theme';

const TYPE_META = {
  doc:  { icon: '📄', label: 'Dokument', bg: T.blueLight,    text: T.blueText   },
  pdf:  { icon: '📋', label: 'PDF',      bg: '#FFF7ED',      text: '#C2410C'    },
  link: { icon: '🔗', label: 'Länk',     bg: T.purpleLight,  text: T.purple     },
  bild: { icon: '🖼️', label: 'Bild',     bg: T.greenLight,   text: T.greenText  },
};

function getTypeMeta(type) {
  return TYPE_META[type] || TYPE_META.link;
}

export default function FilerLankar({ files, setFiles }) {
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('doc');
  const [formUrl, setFormUrl]   = useState('');
  const [search, setSearch]     = useState('');
  const [filterType, setFilterType] = useState('');

  function addFile() {
    if (!formName.trim()) return;
    const newFile = {
      id: 'f_' + Date.now(),
      name: formName.trim(),
      type: formType,
      url: formUrl.trim() || '#',
    };
    setFiles(prev => [...prev, newFile]);
    setFormName('');
    setFormUrl('');
    setShowForm(false);
  }

  function removeFile(id) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  const filtered = files.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    const matchType   = !filterType || f.type === filterType;
    return matchSearch && matchType;
  });

  const typeGroups = Object.keys(TYPE_META);

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>📁 Filer & Länkar</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Familjens dokument, PDF:er och länkar</p>
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

      {/* Search & filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Sök filer och länkar..."
          style={{
            flex: 1, border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
            padding: '10px 14px', fontSize: 14, color: T.text,
            outline: 'none', background: T.card, boxShadow: T.shadow,
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setFilterType('')}
            style={{
              background: !filterType ? T.purple : T.card,
              color: !filterType ? '#fff' : T.textMuted,
              border: `1px solid ${!filterType ? T.purple : T.border}`,
              borderRadius: T.radiusSm, padding: '8px 14px',
              fontSize: 13, cursor: 'pointer', fontWeight: !filterType ? 600 : 400,
            }}
          >
            Alla
          </button>
          {typeGroups.map(type => {
            const meta = TYPE_META[type];
            const active = filterType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterType(active ? '' : type)}
                style={{
                  background: active ? meta.text : T.card,
                  color: active ? '#fff' : T.textMuted,
                  border: `1px solid ${active ? meta.text : T.border}`,
                  borderRadius: T.radiusSm, padding: '8px 14px',
                  fontSize: 13, cursor: 'pointer', fontWeight: active ? 600 : 400,
                }}
              >
                {meta.icon} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Files grid */}
      {filtered.length === 0 ? (
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: T.radius, padding: 48, textAlign: 'center',
          color: T.textMuted, fontSize: 14, boxShadow: T.shadow,
        }}>
          {search || filterType ? 'Inga filer matchar sökningen.' : 'Inga filer ännu. Lägg till det första!'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {filtered.map(file => {
            const meta = getTypeMeta(file.type);
            return (
              <div key={file.id} style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: T.radius, padding: 20, boxShadow: T.shadow,
                display: 'flex', flexDirection: 'column', gap: 12,
                transition: 'box-shadow 0.15s',
                position: 'relative',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadowMd}
                onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}
              >
                <button
                  onClick={() => removeFile(file.id)}
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: T.textMuted,
                    fontSize: 18, lineHeight: 1, opacity: 0.4,
                  }}
                  title="Ta bort"
                >×</button>

                {/* Icon */}
                <div style={{
                  width: 48, height: 48,
                  background: meta.bg,
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>
                  {meta.icon}
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.4, marginBottom: 6 }}>
                    {file.name}
                  </div>
                  <span style={{
                    background: meta.bg, color: meta.text,
                    borderRadius: 5, fontSize: 11, padding: '2px 8px', fontWeight: 600,
                  }}>
                    {meta.label}
                  </span>
                </div>

                {/* Open link */}
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    background: meta.bg, color: meta.text,
                    border: `1px solid ${meta.text}22`,
                    borderRadius: T.radiusSm, padding: '8px',
                    fontSize: 13, fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {file.type === 'link' ? '🔗 Öppna länk' : '📂 Öppna fil'}
                </a>
              </div>
            );
          })}
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
            padding: 28, width: 400, boxShadow: T.shadowMd,
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>+ Lägg till fil / länk</h2>

            <label style={labelStyle}>Namn</label>
            <input
              autoFocus
              value={formName}
              onChange={e => setFormName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFile()}
              placeholder="Filens eller länkens namn"
              style={inputStyle}
            />

            <label style={labelStyle}>Typ</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {typeGroups.map(type => {
                const meta = TYPE_META[type];
                const active = formType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setFormType(type)}
                    style={{
                      background: active ? meta.text : T.bg,
                      color: active ? '#fff' : T.textMuted,
                      border: `1.5px solid ${active ? meta.text : T.border}`,
                      borderRadius: T.radiusSm, padding: '6px 14px',
                      fontSize: 13, cursor: 'pointer', fontWeight: active ? 600 : 400,
                    }}
                  >
                    {meta.icon} {meta.label}
                  </button>
                );
              })}
            </div>

            <label style={labelStyle}>URL / Sökväg</label>
            <input
              value={formUrl}
              onChange={e => setFormUrl(e.target.value)}
              placeholder="https://... eller lämna tomt"
              style={inputStyle}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={cancelBtnStyle}>Avbryt</button>
              <button onClick={addFile} style={saveBtnStyle}>Lägg till</button>
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
