import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const CAR_TYPES = ['Däckbyte vår', 'Däckbyte höst', 'Besiktning', 'Service', 'Städning'];
const HOUSE_CATS = ['Utvändigt', 'Inomhus', 'Teknik', 'Trädgård'];
const INTERVALS = [
  { val: 'monthly', label: 'Varje månad',  months: 1 },
  { val: 'yearly',  label: 'Varje år',     months: 12 },
  { val: 'every2y', label: 'Vart 2:a år',  months: 24 },
  { val: 'every5y', label: 'Vart 5:e år',  months: 60 },
];

const defaultCar = [
  { id: 'c1', car: 'Volvo XC60', title: 'Däckbyte vår',  type: 'Däckbyte vår', due: '2025-04-15', done: false },
  { id: 'c2', car: 'Volvo XC60', title: 'Besiktning',     type: 'Besiktning',   due: '2025-09-01', done: false },
];

const defaultHouse = [
  { id: 'h1', title: 'Rensa hängrännor',         category: 'Utvändigt', interval: 'yearly',  lastDone: '2024-10-01', warranty: '' },
  { id: 'h2', title: 'Byta filter i ventilation', category: 'Teknik',   interval: 'every2y', lastDone: '2023-06-01', warranty: '' },
];

function daysUntil(isoDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(isoDate + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

function addMonths(isoDate, months) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function nextYear(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

function carColor(days) {
  if (days > 60) return T.green;
  if (days > 14) return '#F97316';
  return T.red;
}

function carBg(days) {
  if (days > 60) return T.greenLight;
  if (days > 14) return T.orangeLight;
  return T.redLight;
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 14, color: T.text,
  marginBottom: 14, outline: 'none', background: T.bg,
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 };

export default function BilHus() {
  const [activeTab, setActiveTab] = useState('bil');
  const [carItems, setCarItems] = useLocalStorage('kl_car', defaultCar);
  const [houseItems, setHouseItems] = useLocalStorage('kl_house', defaultHouse);
  const [showCarModal, setShowCarModal] = useState(false);
  const [showHouseModal, setShowHouseModal] = useState(false);
  const [houseFilter, setHouseFilter] = useState('alla');
  const [editCarId, setEditCarId] = useState(null);
  const [editHouseId, setEditHouseId] = useState(null);

  // Car form
  const [fCar, setFCar] = useState('');
  const [fCarTitle, setFCarTitle] = useState('');
  const [fCarType, setFCarType] = useState('Besiktning');
  const [fCarDue, setFCarDue] = useState('');

  // House form
  const [fHTitle, setFHTitle] = useState('');
  const [fHCat, setFHCat] = useState('Utvändigt');
  const [fHInterval, setFHInterval] = useState('yearly');
  const [fHLastDone, setFHLastDone] = useState('');
  const [fHWarranty, setFHWarranty] = useState('');

  function openAddCar() {
    setEditCarId(null);
    setFCar(''); setFCarTitle(''); setFCarType('Besiktning'); setFCarDue('');
    setShowCarModal(true);
  }

  function openEditCar(item) {
    setEditCarId(item.id);
    setFCar(item.car); setFCarTitle(item.title); setFCarType(item.type); setFCarDue(item.due);
    setShowCarModal(true);
  }

  function saveCar() {
    if (!fCarTitle.trim() || !fCarDue) return;
    if (editCarId) {
      setCarItems(prev => prev.map(c => c.id === editCarId ? { ...c, car: fCar, title: fCarTitle, type: fCarType, due: fCarDue } : c));
    } else {
      setCarItems(prev => [...prev, { id: 'c_' + Date.now(), car: fCar, title: fCarTitle, type: fCarType, due: fCarDue, done: false }]);
    }
    setShowCarModal(false);
  }

  function markCarDone(id) {
    setCarItems(prev => prev.map(c => {
      if (c.id !== id) return c;
      return { ...c, done: true, due: nextYear(c.due) };
    }));
  }

  function addQuickCar(carName) {
    const today = new Date();
    const y = today.getFullYear();
    const templates = [
      { title: 'Däckbyte vår',  type: 'Däckbyte vår', due: `${y}-04-15` },
      { title: 'Däckbyte höst', type: 'Däckbyte höst', due: `${y}-10-15` },
      { title: 'Besiktning',    type: 'Besiktning',    due: `${y}-09-01` },
      { title: 'Service',       type: 'Service',       due: `${y}-06-01` },
      { title: 'Städning',      type: 'Städning',      due: `${y}-05-01` },
    ];
    const newItems = templates.map(t => ({ ...t, id: 'c_' + Date.now() + Math.random(), car: carName, done: false }));
    setCarItems(prev => [...prev, ...newItems]);
  }

  function removeCar(id) {
    setCarItems(prev => prev.filter(c => c.id !== id));
  }

  function openAddHouse() {
    setEditHouseId(null);
    setFHTitle(''); setFHCat('Utvändigt'); setFHInterval('yearly');
    setFHLastDone(new Date().toISOString().split('T')[0]); setFHWarranty('');
    setShowHouseModal(true);
  }

  function openEditHouse(item) {
    setEditHouseId(item.id);
    setFHTitle(item.title); setFHCat(item.category); setFHInterval(item.interval);
    setFHLastDone(item.lastDone); setFHWarranty(item.warranty || '');
    setShowHouseModal(true);
  }

  function saveHouse() {
    if (!fHTitle.trim()) return;
    if (editHouseId) {
      setHouseItems(prev => prev.map(h => h.id === editHouseId ? { ...h, title: fHTitle, category: fHCat, interval: fHInterval, lastDone: fHLastDone, warranty: fHWarranty } : h));
    } else {
      setHouseItems(prev => [...prev, { id: 'h_' + Date.now(), title: fHTitle, category: fHCat, interval: fHInterval, lastDone: fHLastDone, warranty: fHWarranty }]);
    }
    setShowHouseModal(false);
  }

  function markHouseDone(id) {
    const today = new Date().toISOString().split('T')[0];
    setHouseItems(prev => prev.map(h => h.id === id ? { ...h, lastDone: today } : h));
  }

  function removeHouse(id) {
    setHouseItems(prev => prev.filter(h => h.id !== id));
  }

  function getNextDue(item) {
    const intv = INTERVALS.find(i => i.val === item.interval);
    if (!intv || !item.lastDone) return null;
    return addMonths(item.lastDone, intv.months);
  }

  function getFilteredHouse() {
    const today = new Date().toISOString().split('T')[0];
    const in3m = addMonths(today, 3);
    if (houseFilter === 'alla') return houseItems;
    if (houseFilter === 'forfallet') return houseItems.filter(h => {
      const nd = getNextDue(h);
      return nd && nd <= today;
    });
    if (houseFilter === 'kommande') return houseItems.filter(h => {
      const nd = getNextDue(h);
      return nd && nd > today && nd <= in3m;
    });
    return houseItems;
  }

  const tabStyle = (id) => ({
    padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    background: activeTab === id ? T.purple : 'transparent',
    color: activeTab === id ? '#fff' : T.textMuted,
    border: 'none', borderRadius: T.radiusSm,
    transition: 'background 0.15s',
  });

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>🚗 Bil & 🏠 Hus</h1>
        <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Påminnelser och underhållsplan</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 4, width: 'fit-content', marginBottom: 28 }}>
        <button onClick={() => setActiveTab('bil')} style={tabStyle('bil')}>🚗 Bil</button>
        <button onClick={() => setActiveTab('hus')} style={tabStyle('hus')}>🏠 Hus</button>
      </div>

      {/* BIL TAB */}
      {activeTab === 'bil' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <button onClick={openAddCar} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              + Lägg till påminnelse
            </button>
            <button onClick={() => {
              const carName = prompt('Bilens namn (t.ex. Volvo XC60):');
              if (carName) addQuickCar(carName);
            }} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '10px 18px', fontSize: 14, cursor: 'pointer' }}>
              ⚡ Snabblägg till (alla påminnelser för en bil)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {carItems.map(item => {
              const days = daysUntil(item.due);
              const cc = item.done ? T.green : carColor(days);
              const cb = item.done ? T.greenLight : carBg(days);

              return (
                <div key={item.id} style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: T.radius, padding: 18, boxShadow: T.shadow,
                  borderLeft: `4px solid ${cc}`,
                  opacity: item.done ? 0.75 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: T.textMuted }}>{item.car}</div>
                    </div>
                    <div style={{ background: cb, color: cc, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                      {item.done ? '✓ Klar' : days < 0 ? `${Math.abs(days)} d sedan` : days === 0 ? 'Idag!' : `om ${days} d`}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>
                    Datum: {item.due}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => markCarDone(item.id)} style={{
                      flex: 1, background: T.green, color: '#fff', border: 'none',
                      borderRadius: T.radiusSm, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      Klar ✓ (sätt nästa år)
                    </button>
                    <button onClick={() => openEditCar(item)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => removeCar(item.id)} style={{ background: T.redLight, color: T.red, border: 'none', borderRadius: T.radiusSm, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HUS TAB */}
      {activeTab === 'hus' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
            <button onClick={openAddHouse} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              + Lägg till underhåll
            </button>
            <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
              {[['alla','Alla'],['forfallet','Förfallet'],['kommande','Kommande 3 mån']].map(([k,l]) => (
                <button key={k} onClick={() => setHouseFilter(k)} style={{
                  background: houseFilter === k ? T.purple : T.bg,
                  color: houseFilter === k ? '#fff' : T.textMuted,
                  border: `1px solid ${T.border}`, borderRadius: 20,
                  padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: houseFilter === k ? 600 : 400,
                }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {getFilteredHouse().map(item => {
              const nextDue = getNextDue(item);
              const days = nextDue ? daysUntil(nextDue) : null;
              const cc = days === null ? T.textMuted : carColor(days);
              const cb = days === null ? T.bg : carBg(days);
              const intv = INTERVALS.find(i => i.val === item.interval);
              const today = new Date().toISOString().split('T')[0];
              const warrantyExpired = item.warranty && item.warranty < today;

              return (
                <div key={item.id} style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: T.radius, padding: 18, boxShadow: T.shadow,
                  borderLeft: `4px solid ${cc}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: T.textMuted }}>{item.category} · {intv ? intv.label : item.interval}</div>
                    </div>
                    <div style={{ background: cb, color: cc, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                      {days === null ? '—' : days < 0 ? `${Math.abs(days)} d sedan` : days === 0 ? 'Idag!' : `om ${days} d`}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>
                    Senast utfört: {item.lastDone || '—'} · Nästa: {nextDue || '—'}
                  </div>
                  {item.warranty && (
                    <div style={{ fontSize: 12, color: warrantyExpired ? T.red : T.green, marginBottom: 8 }}>
                      {warrantyExpired ? '⚠️ Garanti utgången' : '✓ Garanti'}: {item.warranty}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => markHouseDone(item.id)} style={{
                      flex: 1, background: T.green, color: '#fff', border: 'none',
                      borderRadius: T.radiusSm, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      Utfört idag
                    </button>
                    <button onClick={() => openEditHouse(item)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => removeHouse(item.id)} style={{ background: T.redLight, color: T.red, border: 'none', borderRadius: T.radiusSm, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Car Modal */}
      {showCarModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCarModal(false); }}>
          <div style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 400, boxShadow: T.shadowMd }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>{editCarId ? 'Redigera' : '+ Ny'} bilpåminnelse</h2>
            <label style={labelStyle}>Bil</label>
            <input value={fCar} onChange={e => setFCar(e.target.value)} placeholder="t.ex. Volvo XC60" style={inputStyle} />
            <label style={labelStyle}>Titel</label>
            <input autoFocus value={fCarTitle} onChange={e => setFCarTitle(e.target.value)} placeholder="t.ex. Däckbyte vår" style={inputStyle} />
            <label style={labelStyle}>Typ</label>
            <select value={fCarType} onChange={e => setFCarType(e.target.value)} style={inputStyle}>
              {CAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label style={labelStyle}>Datum</label>
            <input type="date" value={fCarDue} onChange={e => setFCarDue(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCarModal(false)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={saveCar} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Spara</button>
            </div>
          </div>
        </div>
      )}

      {/* House Modal */}
      {showHouseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowHouseModal(false); }}>
          <div style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 420, boxShadow: T.shadowMd }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>{editHouseId ? 'Redigera' : '+ Nytt'} underhåll</h2>
            <label style={labelStyle}>Titel</label>
            <input autoFocus value={fHTitle} onChange={e => setFHTitle(e.target.value)} placeholder="t.ex. Rensa hängrännor" style={inputStyle} />
            <label style={labelStyle}>Kategori</label>
            <select value={fHCat} onChange={e => setFHCat(e.target.value)} style={inputStyle}>
              {HOUSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label style={labelStyle}>Intervall</label>
            <select value={fHInterval} onChange={e => setFHInterval(e.target.value)} style={inputStyle}>
              {INTERVALS.map(i => <option key={i.val} value={i.val}>{i.label}</option>)}
            </select>
            <label style={labelStyle}>Senast utfört</label>
            <input type="date" value={fHLastDone} onChange={e => setFHLastDone(e.target.value)} style={inputStyle} />
            <label style={labelStyle}>Garantidatum (valfri)</label>
            <input type="date" value={fHWarranty} onChange={e => setFHWarranty(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowHouseModal(false)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={saveHouse} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Spara</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
