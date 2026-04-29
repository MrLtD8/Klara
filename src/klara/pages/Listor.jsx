import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const BUCKET_CATS = ['Resa', 'Upplevelse', 'Mat', 'Äventyr', 'Kultur'];

const SOMMAR_CATS = ['Utomhus', 'Inomhus', 'Vatten', 'Kultur', 'Sport'];

const SOMMAR_CAT_COLORS = {
  Utomhus: { bg: '#E8F5EE', text: '#3A7A52' },
  Inomhus: { bg: '#F0EBFD', text: '#6B4EA8' },
  Vatten:  { bg: '#E0F0FF', text: '#2A6FA8' },
  Kultur:  { bg: '#FDF0FB', text: '#9B4EA8' },
  Sport:   { bg: '#FFF0E0', text: '#B8722A' },
};

const BUCKET_CAT_COLORS = {
  Resa:      { bg: '#EDF2EF', text: '#3A6A50' },
  Upplevelse:{ bg: '#FFF5E0', text: '#B8722A' },
  Mat:       { bg: '#FDF0E0', text: '#A84040' },
  Äventyr:   { bg: '#FDE8EE', text: '#C83060' },
  Kultur:    { bg: '#F0EBFD', text: '#6B4EA8' },
};

const defaultSommar = [
  { id: 's1',  title: 'Bada i havet',          category: 'Vatten',  done: false },
  { id: 's2',  title: 'Grilla',                 category: 'Utomhus', done: false },
  { id: 's3',  title: 'Plocka bär',             category: 'Utomhus', done: false },
  { id: 's4',  title: 'Besök nöjespark',        category: 'Upplevelse', done: false },
  { id: 's5',  title: 'Cykla',                  category: 'Sport',   done: false },
  { id: 's6',  title: 'Fiska',                  category: 'Utomhus', done: false },
  { id: 's7',  title: 'Campa',                  category: 'Utomhus', done: false },
  { id: 's8',  title: 'Titta på stjärnor',      category: 'Utomhus', done: false },
  { id: 's9',  title: 'Leka på lekplats',       category: 'Utomhus', done: false },
  { id: 's10', title: 'Baka sommarkaka',        category: 'Inomhus', done: false },
  { id: 's11', title: 'Besök museum',           category: 'Kultur',  done: false },
  { id: 's12', title: 'Simma i sjö',            category: 'Vatten',  done: false },
  { id: 's13', title: 'Åka kajak/kanot',        category: 'Vatten',  done: false },
  { id: 's14', title: 'Picknicka',              category: 'Utomhus', done: false },
  { id: 's15', title: 'Spela kubb',             category: 'Sport',   done: false },
];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 14, color: T.text,
  marginBottom: 14, outline: 'none', background: T.bg,
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 };

export default function Listor({ members = [] }) {
  const [activeTab, setActiveTab] = useState('bucket');
  const [bucketList, setBucketList] = useLocalStorage('kl_bucket', []);
  const [sommarList, setSommarList] = useLocalStorage('kl_sommar', defaultSommar);
  const [bucketFilter, setBucketFilter] = useState('');
  const [sommarFilter, setSommarFilter] = useState('');
  const [showBucketModal, setShowBucketModal] = useState(false);

  const [fTitle, setFTitle] = useState('');
  const [fCat, setFCat] = useState('Upplevelse');
  const [fWho, setFWho] = useState([]);
  const [newSommar, setNewSommar] = useState('');
  const [newSommarCat, setNewSommarCat] = useState('Utomhus');

  const year = new Date().getFullYear();

  function toggleBucketDone(id) {
    setBucketList(prev => prev.map(item => {
      if (item.id !== id) return item;
      const done = !item.done;
      return { ...item, done, doneDate: done ? new Date().toISOString().split('T')[0] : null };
    }));
  }

  function removeBucket(id) {
    setBucketList(prev => prev.filter(b => b.id !== id));
  }

  function addBucket() {
    if (!fTitle.trim()) return;
    setBucketList(prev => [...prev, { id: 'bk_' + Date.now(), title: fTitle.trim(), category: fCat, who: fWho, done: false, doneDate: null }]);
    setShowBucketModal(false);
    setFTitle('');
  }

  function toggleSommarDone(id) {
    setSommarList(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  }

  function removeSommar(id) {
    setSommarList(prev => prev.filter(s => s.id !== id));
  }

  function addSommar() {
    if (!newSommar.trim()) return;
    setSommarList(prev => [...prev, { id: 's_' + Date.now(), title: newSommar.trim(), category: newSommarCat, done: false }]);
    setNewSommar('');
  }

  const filteredBucket = bucketFilter ? bucketList.filter(b => b.category === bucketFilter) : bucketList;
  const filteredSommar = sommarFilter ? sommarList.filter(s => s.category === sommarFilter) : sommarList;
  const bucketDone = bucketList.filter(b => b.done).length;
  const sommarDone = sommarList.filter(s => s.done).length;

  const tabStyle = (id) => ({
    padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    background: activeTab === id ? T.purple : 'transparent',
    color: activeTab === id ? '#fff' : T.textMuted,
    border: 'none', borderRadius: T.radiusSm, transition: 'background 0.15s',
  });

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>🪣 Listor</h1>
        <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Bucketlist och sommarlovslista</p>
      </div>

      <div style={{ display: 'flex', gap: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 4, width: 'fit-content', marginBottom: 28 }}>
        <button onClick={() => setActiveTab('bucket')} style={tabStyle('bucket')}>🪣 Bucketlist</button>
        <button onClick={() => setActiveTab('sommar')} style={tabStyle('sommar')}>☀️ Sommarlov</button>
      </div>

      {/* BUCKETLIST TAB */}
      {activeTab === 'bucket' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setBucketFilter('')} style={{
                background: !bucketFilter ? T.purple : T.bg, color: !bucketFilter ? '#fff' : T.textMuted,
                border: `1px solid ${T.border}`, borderRadius: 20, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
              }}>Alla</button>
              {BUCKET_CATS.map(c => (
                <button key={c} onClick={() => setBucketFilter(bucketFilter === c ? '' : c)} style={{
                  background: bucketFilter === c ? T.purple : T.bg, color: bucketFilter === c ? '#fff' : T.textMuted,
                  border: `1px solid ${T.border}`, borderRadius: 20, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                }}>{c}</button>
              ))}
            </div>
            <button onClick={() => setShowBucketModal(true)} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              + Lägg till
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: T.text, fontWeight: 600 }}>Framsteg</span>
                <span style={{ color: T.textMuted }}>{bucketDone}/{bucketList.length} avklarade</span>
              </div>
              <div style={{ background: T.border, borderRadius: 6, height: 10, overflow: 'hidden' }}>
                <div style={{ background: T.purple, width: bucketList.length ? `${(bucketDone / bucketList.length) * 100}%` : '0%', height: '100%', borderRadius: 6, transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>

          {filteredBucket.length === 0 && <div style={{ textAlign: 'center', color: T.textMuted, marginTop: 40, fontSize: 16 }}>Inga saker på bucketlistan ännu.</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filteredBucket.map(item => {
              const catc = BUCKET_CAT_COLORS[item.category] || { bg: T.bg, text: T.textMuted };
              return (
                <div key={item.id} style={{
                  background: item.done ? T.greenLight : T.card,
                  border: `1px solid ${item.done ? T.green : T.border}`,
                  borderRadius: T.radius, padding: 16, boxShadow: T.shadow,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <button
                      onClick={() => toggleBucketDone(item.id)}
                      style={{
                        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                        background: item.done ? T.green : 'transparent',
                        border: `2px solid ${item.done ? T.green : T.textMuted}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 2,
                      }}
                    >
                      {item.done && <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>✓</span>}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.text, textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.4 }}>
                        {item.done && '✅ '}{item.title}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ background: catc.bg, color: catc.text, borderRadius: 5, fontSize: 11, padding: '2px 7px', fontWeight: 600 }}>{item.category}</span>
                        {item.doneDate && <span style={{ fontSize: 11, color: T.textMuted }}>✓ {item.doneDate}</span>}
                      </div>
                    </div>
                    <button onClick={() => removeBucket(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 16 }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SOMMARLOV TAB */}
      {activeTab === 'sommar' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setSommarFilter('')} style={{
                background: !sommarFilter ? T.purple : T.bg, color: !sommarFilter ? '#fff' : T.textMuted,
                border: `1px solid ${T.border}`, borderRadius: 20, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
              }}>Alla</button>
              {SOMMAR_CATS.map(c => (
                <button key={c} onClick={() => setSommarFilter(sommarFilter === c ? '' : c)} style={{
                  background: sommarFilter === c ? T.purple : T.bg, color: sommarFilter === c ? '#fff' : T.textMuted,
                  border: `1px solid ${T.border}`, borderRadius: 20, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                }}>{c}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newSommar} onChange={e => setNewSommar(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSommar()}
                placeholder="Ny aktivitet..." style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 13, color: T.text, background: T.bg, outline: 'none', width: 200 }} />
              <select value={newSommarCat} onChange={e => setNewSommarCat(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 13, color: T.text, background: T.bg, outline: 'none' }}>
                {SOMMAR_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={addSommar} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+</button>
            </div>
          </div>

          {/* Progress */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '14px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: T.text, fontWeight: 600 }}>Ni har klarat {sommarDone} av {sommarList.length} aktiviteter!</span>
              <span style={{ color: T.textMuted }}>{sommarList.length > 0 ? Math.round((sommarDone / sommarList.length) * 100) : 0}%</span>
            </div>
            <div style={{ background: T.border, borderRadius: 6, height: 10, overflow: 'hidden' }}>
              <div style={{ background: '#F97316', width: sommarList.length ? `${(sommarDone / sommarList.length) * 100}%` : '0%', height: '100%', borderRadius: 6, transition: 'width 0.4s' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginBottom: 20 }}>
            {filteredSommar.map(item => {
              const catc = SOMMAR_CAT_COLORS[item.category] || { bg: T.bg, text: T.textMuted };
              return (
                <div key={item.id} style={{
                  background: item.done ? T.greenLight : T.card,
                  border: `1px solid ${item.done ? T.green : T.border}`,
                  borderRadius: T.radiusSm, padding: 14,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <button
                    onClick={() => toggleSommarDone(item.id)}
                    style={{
                      width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                      background: item.done ? T.green : 'transparent',
                      border: `2px solid ${item.done ? T.green : T.textMuted}`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {item.done && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                  </button>
                  <span style={{ flex: 1, fontSize: 13, color: T.text, textDecoration: item.done ? 'line-through' : 'none', fontWeight: 500 }}>{item.title}</span>
                  <span style={{ background: catc.bg, color: catc.text, borderRadius: 5, fontSize: 10, padding: '2px 6px', fontWeight: 600, flexShrink: 0 }}>{item.category}</span>
                  <button onClick={() => removeSommar(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14, flexShrink: 0 }}>×</button>
                </div>
              );
            })}
          </div>

          <div style={{ background: T.purpleLight, border: `1px solid ${T.purple}44`, borderRadius: T.radius, padding: '14px 20px', textAlign: 'center', fontSize: 14, color: T.text, fontStyle: 'italic' }}>
            Sommaren {year} — ni klarade {sommarDone} av {sommarList.length} aktiviteter! {sommarDone === sommarList.length && sommarList.length > 0 ? '🎉 Fantastiskt!' : ''}
          </div>
        </div>
      )}

      {/* Add bucket modal */}
      {showBucketModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowBucketModal(false); }}>
          <div style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 400, boxShadow: T.shadowMd }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>+ Ny bucket-upplevelse</h2>

            <label style={labelStyle}>Titel</label>
            <input autoFocus value={fTitle} onChange={e => setFTitle(e.target.value)}
              placeholder="Vad vill ni uppleva?" style={inputStyle} />

            <label style={labelStyle}>Kategori</label>
            <select value={fCat} onChange={e => setFCat(e.target.value)} style={inputStyle}>
              {BUCKET_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={labelStyle}>Vem (välj)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {members.map(m => (
                <button key={m.id} onClick={() => setFWho(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id])} style={{
                  background: fWho.includes(m.id) ? m.color + '22' : T.bg,
                  color: fWho.includes(m.id) ? m.color : T.textMuted,
                  border: `1.5px solid ${fWho.includes(m.id) ? m.color : T.border}`,
                  borderRadius: 20, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                }}>{m.name}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBucketModal(false)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={addBucket} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Spara</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
