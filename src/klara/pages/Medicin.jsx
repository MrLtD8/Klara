import React, { useState, useEffect } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const FORM_OPTIONS = ['Tablett', 'Mixtur', 'Suppositorium', 'Kapslar', 'Plåster', 'Ögondroppar'];
const INTERVAL_OPTIONS = [
  { val: null,  label: 'Ingen timer' },
  { val: 4,     label: 'Var 4:e timme' },
  { val: 5,     label: 'Var 5:e timme' },
  { val: 6,     label: 'Var 6:e timme' },
  { val: 8,     label: 'Var 8:e timme' },
  { val: 12,    label: 'Var 12:e timme' },
  { val: 24,    label: 'En gång per dag' },
];

const TIMES_OF_DAY = [
  { id: 'morning', label: 'Morgon', icon: '🌅', color: '#F59E0B', bg: '#FFFBEB', time: '08:00' },
  { id: 'midday',  label: 'Middag', icon: '☀️',  color: '#F97316', bg: '#FFF7ED', time: '12:00' },
  { id: 'evening', label: 'Kväll',  icon: '🌙',  color: '#6366F1', bg: '#EEF2FF', time: '20:00' },
];

const defaultMedicins = [
  { id: 'med1', name: 'Alvedon', form: 'Tablett', stock: 20, dose: 2, threshold: 7, who: 'm3', log: [],
    times: { morning: true, midday: false, evening: true }, intervalHours: 5, lastGiven: null },
];

function daysLeft(stock, dose) {
  if (!dose || dose <= 0) return Infinity;
  return Math.floor(stock / dose);
}
function statusColor(days) {
  if (days > 14) return T.green;
  if (days > 7)  return '#F97316';
  return T.red;
}
function statusBg(days) {
  if (days > 14) return T.greenLight;
  if (days > 7)  return T.orangeLight;
  return T.redLight;
}
function addDays(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toLocaleDateString('sv-SE');
}
function minutesToHHMM(mins) {
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h > 0) return `${h}h ${m > 0 ? m + 'min' : ''}`.trim();
  return `${m} min`;
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 14, color: T.text,
  marginBottom: 14, outline: 'none', background: T.bg,
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 };

// ─── Countdown component ──────────────────────────────────────────────────────
function Countdown({ lastGiven, intervalHours }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  if (!lastGiven || !intervalHours) return null;
  const nextAt  = new Date(lastGiven).getTime() + intervalHours * 3600000;
  const diffMs  = nextAt - now;
  const diffMin = Math.ceil(diffMs / 60000);
  if (diffMin <= 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.greenLight, color: T.greenText, borderRadius: T.radiusSm, padding: '6px 12px', fontSize: 13, fontWeight: 700 }}>
        ✅ Kan ges nu!
      </div>
    );
  }
  const urgent = diffMin <= 30;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: urgent ? T.orangeLight : T.bg, color: urgent ? '#C2410C' : T.textMuted, borderRadius: T.radiusSm, padding: '6px 12px', fontSize: 13, fontWeight: urgent ? 700 : 400 }}>
      ⏱ Nästa dos om {minutesToHHMM(diffMin)}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Medicin({ members = [], guestMode = false }) {
  const [medicins, setMedicins] = useLocalStorage('kl_medicin', defaultMedicins);
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [viewTab,   setViewTab]   = useState('alla'); // 'alla' | 'morning' | 'midday' | 'evening'

  // Form state
  const [fName,     setFName]     = useState('');
  const [fForm,     setFForm]     = useState('Tablett');
  const [fStock,    setFStock]    = useState(0);
  const [fDose,     setFDose]     = useState(1);
  const [fThresh,   setFThresh]   = useState(7);
  const [fWho,      setFWho]      = useState('');
  const [fTimes,    setFTimes]    = useState({ morning: true, midday: false, evening: true });
  const [fInterval, setFInterval] = useState(null);

  if (guestMode) return (
    <div style={{ padding: '32px 36px' }}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>💊 Medicin</h1>
      <div style={{ marginTop: 40, textAlign: 'center', color: T.textMuted, fontSize: 18 }}>🔒 Dold i gästläge</div>
    </div>
  );

  function openAdd() {
    setEditId(null);
    setFName(''); setFForm('Tablett'); setFStock(0); setFDose(1); setFThresh(7); setFWho('');
    setFTimes({ morning: true, midday: false, evening: false }); setFInterval(null);
    setShowModal(true);
  }
  function openEdit(med) {
    setEditId(med.id);
    setFName(med.name); setFForm(med.form); setFStock(med.stock); setFDose(med.dose);
    setFThresh(med.threshold); setFWho(med.who || '');
    setFTimes(med.times || { morning: true, midday: false, evening: false });
    setFInterval(med.intervalHours ?? null);
    setShowModal(true);
  }
  function saveMed() {
    if (!fName.trim()) return;
    const patch = {
      name: fName.trim(), form: fForm, stock: Number(fStock),
      dose: Number(fDose), threshold: Number(fThresh), who: fWho,
      times: fTimes, intervalHours: fInterval,
    };
    if (editId) {
      setMedicins(prev => prev.map(m => m.id === editId ? { ...m, ...patch } : m));
    } else {
      setMedicins(prev => [...prev, { id: 'med_' + Date.now(), ...patch, log: [], lastGiven: null }]);
    }
    setShowModal(false);
  }
  function logDose(id) {
    const now = new Date();
    setMedicins(prev => prev.map(m => {
      if (m.id !== id) return m;
      return { ...m, stock: Math.max(0, m.stock - m.dose), lastGiven: now.toISOString(), log: [{ time: now.toLocaleString('sv-SE') }, ...(m.log || [])].slice(0, 30) };
    }));
  }
  function getMember(id) { return members.find(m => m.id === id); }

  // Filter by time-of-day tab
  const displayed = viewTab === 'alla' ? medicins
    : medicins.filter(m => m.times?.[viewTab]);

  const tabBtn = (id, label, icon) => (
    <button key={id} onClick={() => setViewTab(id)} style={{
      padding: '8px 18px', border: 'none', borderRadius: T.radiusSm,
      background: viewTab === id ? T.purple : 'transparent',
      color: viewTab === id ? '#fff' : T.textMuted,
      fontWeight: viewTab === id ? 700 : 400, fontSize: 13, cursor: 'pointer',
    }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>💊 Medicin</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Läkemedel, dosering och timer</p>
        </div>
        <button onClick={openAdd} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Lägg till medicin
        </button>
      </div>

      {/* Time-of-day tabs */}
      <div style={{ display: 'flex', gap: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 4, width: 'fit-content', marginBottom: 24, boxShadow: T.shadow }}>
        {tabBtn('alla', 'Alla', '💊')}
        {TIMES_OF_DAY.map(t => tabBtn(t.id, t.label, t.icon))}
      </div>

      {/* Summary strip for current tab */}
      {viewTab !== 'alla' && (() => {
        const tod = TIMES_OF_DAY.find(t => t.id === viewTab);
        const meds = medicins.filter(m => m.times?.[viewTab]);
        return meds.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 18px', background: tod.bg, borderRadius: T.radius, border: `1px solid ${tod.color}33` }}>
            <span style={{ fontSize: 24 }}>{tod.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: tod.color }}>{tod.label} — {meds.length} medicin{meds.length > 1 ? 'er' : ''} att ge kl. {tod.time}</span>
          </div>
        ) : null;
      })()}

      {displayed.length === 0 && (
        <div style={{ textAlign: 'center', color: T.textMuted, marginTop: 60, fontSize: 16 }}>
          {viewTab === 'alla' ? 'Inga mediciner tillagda.' : `Inga mediciner för ${TIMES_OF_DAY.find(t=>t.id===viewTab)?.label.toLowerCase()}.`}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
        {displayed.map(med => {
          const days  = daysLeft(med.stock, med.dose);
          const sc    = statusColor(days);
          const sb    = statusBg(days);
          const member = getMember(med.who);
          const activeTimes = TIMES_OF_DAY.filter(t => med.times?.[t.id]);

          // Can give now?
          let canGive = true;
          if (med.intervalHours && med.lastGiven) {
            const nextAt = new Date(med.lastGiven).getTime() + med.intervalHours * 3600000;
            canGive = Date.now() >= nextAt;
          }

          return (
            <div key={med.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, borderTop: `3px solid ${sc}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{med.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{med.form}{member ? ` — ${member.name}` : ''}</div>
                </div>
                <div style={{ background: sb, color: sc, borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>
                  {days === Infinity ? '∞' : days} dagar
                </div>
              </div>

              {/* Time-of-day pills */}
              {activeTimes.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  {activeTimes.map(t => (
                    <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: t.bg, color: t.color, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                      {t.icon} {t.label}
                    </span>
                  ))}
                  {med.intervalHours && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.purpleLight, color: T.purple, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                      ⏱ {INTERVAL_OPTIONS.find(o => o.val === med.intervalHours)?.label || `var ${med.intervalHours}h`}
                    </span>
                  )}
                </div>
              )}

              {/* Timer countdown */}
              {med.intervalHours && (
                <div style={{ marginBottom: 12 }}>
                  <Countdown lastGiven={med.lastGiven} intervalHours={med.intervalHours} />
                </div>
              )}

              {days <= med.threshold && (
                <div style={{ background: T.redLight, color: T.red, borderRadius: 6, padding: '6px 10px', fontSize: 12, marginBottom: 12, fontWeight: 600 }}>
                  ⚠️ Dags att beställa! Räcker till {addDays(days)}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Antal kvar', val: med.stock },
                  { label: 'Dos/tillfälle', val: med.dose },
                  { label: 'Räcker till', val: days === Infinity ? '∞' : addDays(days), sm: true },
                  { label: 'Senast given', val: med.lastGiven ? new Date(med.lastGiven).toLocaleString('sv-SE', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '—', sm: true },
                ].map(({ label, val, sm }) => (
                  <div key={label} style={{ background: T.bg, borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: sm ? 13 : 20, fontWeight: 700, color: T.text }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => canGive && logDose(med.id)} style={{
                  flex: 1, background: canGive ? T.green : T.border, color: canGive ? '#fff' : T.textMuted,
                  border: 'none', borderRadius: T.radiusSm, padding: '9px', fontSize: 13, fontWeight: 600,
                  cursor: canGive ? 'pointer' : 'not-allowed',
                }}>
                  {canGive ? '💊 Ge nu' : '⏳ Vänta'}
                </button>
                <a href={`https://www.fass.se/LIF/startpage?query=${encodeURIComponent(med.name)}`} target="_blank" rel="noopener noreferrer" style={{ background: T.blueLight, color: T.blueText, borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  FASS
                </a>
                <button onClick={() => openEdit(med)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 13, cursor: 'pointer' }}>✏️</button>
                <button onClick={() => setMedicins(p => p.filter(m => m.id !== med.id))} style={{ background: T.redLight, color: T.red, border: 'none', borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 13, cursor: 'pointer' }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 480, boxShadow: T.shadowMd, maxHeight: '90vh', overflowY: 'auto' }}>
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

            {/* Times of day */}
            <label style={labelStyle}>Ges vid</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {TIMES_OF_DAY.map(t => (
                <button key={t.id} type="button" onClick={() => setFTimes(prev => ({ ...prev, [t.id]: !prev[t.id] }))} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 8px', borderRadius: T.radiusSm, cursor: 'pointer',
                  background: fTimes[t.id] ? t.bg : T.bg,
                  border: `2px solid ${fTimes[t.id] ? t.color : T.border}`,
                }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: fTimes[t.id] ? t.color : T.textMuted }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{t.time}</span>
                </button>
              ))}
            </div>

            {/* Interval timer */}
            <label style={labelStyle}>Dosintervall (timer)</label>
            <select value={fInterval ?? ''} onChange={e => setFInterval(e.target.value === '' ? null : Number(e.target.value))} style={inputStyle}>
              {INTERVAL_OPTIONS.map(o => <option key={o.val ?? ''} value={o.val ?? ''}>{o.label}</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[
                { label: 'Antal kvar', val: fStock, set: setFStock },
                { label: 'Dos/tillfälle', val: fDose, set: setFDose },
                { label: 'Varningsgräns (dagar)', val: fThresh, set: setFThresh },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <input type="number" min="0" value={val} onChange={e => set(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                </div>
              ))}
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
