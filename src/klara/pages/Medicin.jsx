import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const FORM_OPTIONS = ['Tablett', 'Mixtur', 'Suppositorium', 'Kapslar'];

const defaultMedicins = [
  { id: 'med1', name: 'Alvedon', form: 'Tablett', stock: 20, dose: 2, threshold: 7, who: 'm3', log: [] },
];

function daysLeft(stock, dose) {
  if (!dose || dose <= 0) return Infinity;
  return Math.floor(stock / dose);
}

function statusColor(days) {
  if (days > 14) return T.green;
  if (days > 7) return '#F97316';
  return T.red;
}

function statusBg(days) {
  if (days > 14) return T.greenLight;
  if (days > 7) return T.orangeLight;
  return T.redLight;
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('sv-SE');
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 14, color: T.text,
  marginBottom: 14, outline: 'none', background: T.bg,
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 };

export default function Medicin({ members = [], guestMode = false }) {
  const [medicins, setMedicins] = useLocalStorage('kl_medicin', defaultMedicins);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [fName, setFName] = useState('');
  const [fForm, setFForm] = useState('Tablett');
  const [fStock, setFStock] = useState(0);
  const [fDose, setFDose] = useState(1);
  const [fThreshold, setFThreshold] = useState(7);
  const [fWho, setFWho] = useState('');

  if (guestMode) {
    return (
      <div style={{ padding: '32px 36px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>💊 Medicin</h1>
        <div style={{ marginTop: 40, textAlign: 'center', color: T.textMuted, fontSize: 18 }}>
          🔒 Dold i gästläge
        </div>
      </div>
    );
  }

  function openAdd() {
    setEditId(null);
    setFName(''); setFForm('Tablett'); setFStock(0); setFDose(1); setFThreshold(7); setFWho('');
    setShowModal(true);
  }

  function openEdit(med) {
    setEditId(med.id);
    setFName(med.name); setFForm(med.form); setFStock(med.stock); setFDose(med.dose);
    setFThreshold(med.threshold); setFWho(med.who || '');
    setShowModal(true);
  }

  function saveMed() {
    if (!fName.trim()) return;
    if (editId) {
      setMedicins(prev => prev.map(m => m.id === editId ? { ...m, name: fName.trim(), form: fForm, stock: Number(fStock), dose: Number(fDose), threshold: Number(fThreshold), who: fWho } : m));
    } else {
      setMedicins(prev => [...prev, { id: 'med_' + Date.now(), name: fName.trim(), form: fForm, stock: Number(fStock), dose: Number(fDose), threshold: Number(fThreshold), who: fWho, log: [] }]);
    }
    setShowModal(false);
  }

  function removeMed(id) {
    setMedicins(prev => prev.filter(m => m.id !== id));
  }

  function logDose(id) {
    const now = new Date().toLocaleString('sv-SE');
    setMedicins(prev => prev.map(m => {
      if (m.id !== id) return m;
      const newStock = Math.max(0, m.stock - m.dose);
      return { ...m, stock: newStock, log: [{ time: now }, ...(m.log || [])].slice(0, 20) };
    }));
  }

  function getMemberName(who) {
    const m = members.find(m => m.id === who);
    return m ? m.name : who;
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>💊 Medicin</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Läkemedel och dosering per familjemedlem</p>
        </div>
        <button onClick={openAdd} style={{
          background: T.purple, color: '#fff', border: 'none',
          borderRadius: T.radiusSm, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          + Lägg till medicin
        </button>
      </div>

      {medicins.length === 0 && (
        <div style={{ textAlign: 'center', color: T.textMuted, marginTop: 60, fontSize: 16 }}>
          Inga mediciner tillagda. Klicka "+ Lägg till medicin" för att börja.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {medicins.map(med => {
          const days = daysLeft(med.stock, med.dose);
          const sc = statusColor(days);
          const sb = statusBg(days);
          const lastLog = med.log && med.log.length > 0 ? med.log[0] : null;
          const memberName = getMemberName(med.who);
          const isChild = members.find(m => m.id === med.who && m.role && m.role.includes('år'));

          return (
            <div key={med.id} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: T.radius, padding: 20, boxShadow: T.shadow,
              borderTop: `3px solid ${sc}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{med.name}</div>
                  <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{med.form} — {memberName}</div>
                </div>
                <div style={{ background: sb, color: sc, borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>
                  {days === Infinity ? '∞' : days} dagar
                </div>
              </div>

              {isChild && (
                <div style={{ background: T.blueLight, color: T.blueText, borderRadius: 6, padding: '6px 10px', fontSize: 12, marginBottom: 12 }}>
                  💡 Dosrekommendation: kontrollera FASS för barnets ålder/vikt
                </div>
              )}

              {days <= med.threshold && (
                <div style={{ background: T.redLight, color: T.red, borderRadius: 6, padding: '6px 10px', fontSize: 12, marginBottom: 12, fontWeight: 600 }}>
                  ⚠️ Dags att beställa! Räcker till {days < 0 ? 'idag' : addDays(days)}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ background: T.bg, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>Antal kvar</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{med.stock}</div>
                </div>
                <div style={{ background: T.bg, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>Daglig dos</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{med.dose}</div>
                </div>
                <div style={{ background: T.bg, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>Räcker till</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: sc }}>{days === Infinity ? 'Obegränsat' : addDays(days)}</div>
                </div>
                <div style={{ background: T.bg, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>Senast given</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{lastLog ? lastLog.time : '—'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => logDose(med.id)} style={{
                  flex: 1, background: T.green, color: '#fff', border: 'none',
                  borderRadius: T.radiusSm, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  💊 Ge nu
                </button>
                <a
                  href={`https://www.fass.se/LIF/startpage?query=${encodeURIComponent(med.name)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    background: T.blueLight, color: T.blueText, border: 'none',
                    borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center',
                  }}
                >
                  FASS
                </a>
                <button onClick={() => openEdit(med)} style={{
                  background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`,
                  borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 13, cursor: 'pointer',
                }}>
                  ✏️
                </button>
                <button onClick={() => removeMed(med.id)} style={{
                  background: T.redLight, color: T.red, border: 'none',
                  borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 13, cursor: 'pointer',
                }}>
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 420, boxShadow: T.shadowMd }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>{editId ? '✏️ Redigera medicin' : '+ Ny medicin'}</h2>

            <label style={labelStyle}>Namn</label>
            <input autoFocus value={fName} onChange={e => setFName(e.target.value)} placeholder="t.ex. Alvedon" style={inputStyle} />

            <label style={labelStyle}>Form</label>
            <select value={fForm} onChange={e => setFForm(e.target.value)} style={inputStyle}>
              {FORM_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <label style={labelStyle}>Till vem</label>
            <select value={fWho} onChange={e => setFWho(e.target.value)} style={inputStyle}>
              <option value="">— Välj familjemedlem —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Antal kvar</label>
                <input type="number" min="0" value={fStock} onChange={e => setFStock(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
              </div>
              <div>
                <label style={labelStyle}>Daglig dos</label>
                <input type="number" min="1" value={fDose} onChange={e => setFDose(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
              </div>
              <div>
                <label style={labelStyle}>Varningsgräns</label>
                <input type="number" min="1" value={fThreshold} onChange={e => setFThreshold(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={saveMed} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Spara</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
