import React, { useState, useRef } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

// ─── Digital garderob ─────────────────────────────────────────────────────────
// Foto tas med <input capture> (öppnar kameran direkt på iPad — inget HTTPS-krav).
// Bilden skalas ner till ~600px JPEG i webbläsaren och laddas upp till addonet
// (/api/wardrobe/image). Metadata ligger i kl_wardrobe. Om servern inte nås
// sparas den nedskalade bilden inline i posten istället (fallback).

const CATEGORIES = [
  { id: 'overdel',   label: 'Överdel',    icon: '👕' },
  { id: 'underdel',  label: 'Underdel',   icon: '👖' },
  { id: 'klanning',  label: 'Klänning',   icon: '👗' },
  { id: 'ytterplagg',label: 'Ytterplagg', icon: '🧥' },
  { id: 'skor',      label: 'Skor',       icon: '👟' },
  { id: 'accessoar', label: 'Accessoar',  icon: '🧢' },
];

const SEASONS = [
  { id: 'alla',   label: 'Året runt', icon: '🌍' },
  { id: 'var',    label: 'Vår',       icon: '🌸' },
  { id: 'sommar', label: 'Sommar',    icon: '☀️' },
  { id: 'host',   label: 'Höst',      icon: '🍂' },
  { id: 'vinter', label: 'Vinter',    icon: '❄️' },
];

const inputStyle = {
  width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`,
  borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 14, color: T.text,
  marginBottom: 12, outline: 'none', background: T.bg,
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 };

/** Skala ner ett foto till maxdimension och returnera JPEG data-URL. */
function downscaleImage(file, maxDim = 600) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Kunde inte läsa bilden.')); };
    img.src = url;
  });
}

export default function Garderob({ members = [] }) {
  const [items, setItems] = useLocalStorage('kl_wardrobe', []);
  const [filterCat, setFilterCat] = useState('');
  const [filterWho, setFilterWho] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [fName, setFName] = useState('');
  const [fCat, setFCat] = useState('overdel');
  const [fSeason, setFSeason] = useState('alla');
  const [fWho, setFWho] = useState('');
  const [fImage, setFImage] = useState(''); // nedskalad data-URL
  const [loadingImg, setLoadingImg] = useState(false);
  const fileRef = useRef(null);

  async function onPickImage(e) {
    let file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setLoadingImg(true);
    try {
      // HEIC (iPhone/iPad-foton) kan inte avkodas av Chrome/Windows —
      // konvertera till JPEG först. Biblioteket laddas bara vid behov.
      if (/\.heic$|\.heif$/i.test(file.name) || ['image/heic', 'image/heif'].includes(file.type)) {
        const { default: heic2any } = await import('heic2any');
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
        file = Array.isArray(converted) ? converted[0] : converted;
      }
      setFImage(await downscaleImage(file));
    } catch (err) {
      setError('Kunde inte läsa bilden' + (err.message ? ` (${err.message})` : '') + '. Prova JPEG/PNG.');
    }
    setLoadingImg(false);
  }

  async function saveItem() {
    if (!fName.trim() || !fImage) { setError('Namn och foto krävs.'); return; }
    setSaving(true);
    setError('');
    let imageId = '';
    let imageData = '';
    try {
      const res = await fetch('/api/wardrobe/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: fImage }),
      });
      if (res.ok) imageId = (await res.json()).id;
      else imageData = fImage; // servern nekade — spara inline
    } catch {
      imageData = fImage; // ingen server (lokal körning) — spara inline
    }
    setItems(prev => [{
      id: 'g_' + Date.now(),
      name: fName.trim(), cat: fCat, season: fSeason, who: fWho,
      imageId, imageData,
      added: new Date().toISOString().slice(0, 10),
    }, ...prev]);
    setSaving(false);
    setAdding(false);
    setFName(''); setFCat('overdel'); setFSeason('alla'); setFWho(''); setFImage('');
  }

  function deleteItem(item) {
    if (!window.confirm(`Ta bort "${item.name}" ur garderoben?`)) return;
    if (item.imageId) fetch(`/api/wardrobe/image/${item.imageId}`, { method: 'DELETE' }).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== item.id));
  }

  const getMember = id => members.find(m => m.id === id);
  const imgSrc = item => item.imageId ? `/api/wardrobe/image/${item.imageId}` : item.imageData;

  const filtered = items
    .filter(i => !filterCat || i.cat === filterCat)
    .filter(i => !filterWho || i.who === filterWho);

  const chip = (active, color = T.purple, bg = T.purpleLight) => ({
    padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    border: `1.5px solid ${active ? color : T.border}`,
    background: active ? bg : 'transparent',
    color: active ? color : T.textMuted,
  });

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>👗 Garderob</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>{items.length} plagg i den digitala garderoben</p>
        </div>
        <button onClick={() => { setAdding(a => !a); setError(''); }}
          style={{ padding: '10px 20px', borderRadius: T.radiusSm, border: 'none', background: T.purple, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {adding ? 'Avbryt' : '+ Lägg till plagg'}
        </button>
      </div>

      {/* ── Lägg till ──────────────────────────────────────────── */}
      {adding && (
        <div style={{ background: T.card, border: `2px solid ${T.purple}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow, marginBottom: 24, maxWidth: 520 }}>
          <label style={labelStyle}>Foto</label>
          <input ref={fileRef} type="file" accept="image/*,.heic,.heif" capture="environment" onChange={onPickImage} style={{ display: 'none' }} />
          {fImage ? (
            <div style={{ position: 'relative', width: 160, marginBottom: 14 }}>
              <img src={fImage} alt="Valt plagg" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: T.radiusSm, border: `1px solid ${T.border}` }} />
              <button onClick={() => fileRef.current?.click()}
                style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
                Byt foto
              </button>
            </div>
          ) : (
            <button onClick={() => !loadingImg && fileRef.current?.click()}
              style={{ width: 160, height: 160, borderRadius: T.radiusSm, border: `2px dashed ${T.border}`, background: T.bg, color: T.textMuted, fontSize: 13, cursor: loadingImg ? 'wait' : 'pointer', marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 32 }}>{loadingImg ? '⏳' : '📷'}</span>
              {loadingImg ? 'Läser in bilden…' : 'Ta foto / välj bild'}
            </button>
          )}

          <label style={labelStyle}>Namn</label>
          <input value={fName} onChange={e => setFName(e.target.value)} placeholder="t.ex. Blå stickad tröja" style={inputStyle} />

          <label style={labelStyle}>Kategori</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setFCat(c.id)} style={chip(fCat === c.id)}>{c.icon} {c.label}</button>
            ))}
          </div>

          <label style={labelStyle}>Säsong</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {SEASONS.map(s => (
              <button key={s.id} onClick={() => setFSeason(s.id)} style={chip(fSeason === s.id)}>{s.icon} {s.label}</button>
            ))}
          </div>

          <label style={labelStyle}>Vems?</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {members.map(m => (
              <button key={m.id} onClick={() => setFWho(fWho === m.id ? '' : m.id)} style={chip(fWho === m.id, m.color, m.color + '22')}>{m.name}</button>
            ))}
          </div>

          {error && <p style={{ margin: '0 0 12px', fontSize: 13, color: T.red, fontWeight: 600 }}>{error}</p>}
          <button onClick={saveItem} disabled={saving}
            style={{ padding: '10px 28px', borderRadius: T.radiusSm, border: 'none', background: T.purple, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Sparar…' : 'Spara plagg'}
          </button>
        </div>
      )}

      {/* ── Filter ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <button onClick={() => setFilterCat('')} style={chip(!filterCat)}>Alla</button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setFilterCat(filterCat === c.id ? '' : c.id)} style={chip(filterCat === c.id)}>{c.icon} {c.label}</button>
        ))}
      </div>
      {members.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {members.map(m => (
            <button key={m.id} onClick={() => setFilterWho(filterWho === m.id ? '' : m.id)} style={chip(filterWho === m.id, m.color, m.color + '22')}>{m.name}</button>
          ))}
        </div>
      )}

      {/* ── Plagg-grid ─────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: T.textMuted, marginTop: 40, fontSize: 15 }}>
          {items.length === 0 ? 'Garderoben är tom — lägg till ditt första plagg! 📷' : 'Inga plagg matchar filtret.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {filtered.map(item => {
            const cat = CATEGORIES.find(c => c.id === item.cat);
            const season = SEASONS.find(s => s.id === item.season);
            const member = getMember(item.who);
            return (
              <div key={item.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow }}>
                <div style={{ position: 'relative' }}>
                  <img src={imgSrc(item)} alt={item.name} loading="lazy"
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', background: T.bg }} />
                  <button onClick={() => deleteItem(item)} title="Ta bort"
                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', fontSize: 13 }}>✕</button>
                  {member && (
                    <span style={{ position: 'absolute', bottom: 6, left: 6, background: member.color, color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                      {member.name}
                    </span>
                  )}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                    {cat?.icon} {cat?.label}{season && season.id !== 'alla' ? ` · ${season.icon} ${season.label}` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
