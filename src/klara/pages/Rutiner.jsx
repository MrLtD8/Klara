import React, { useState, useEffect, useRef } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';
import { useIsMobile } from '../../useIsMobile';

// ─── Rutiner ──────────────────────────────────────────────────────────────────
// Barnvänlig checklista för morgon- och kvällsrutiner. Stora tryckytor,
// ljud + konfetti som belöning, och allt nollställs automatiskt varje ny dag.

const ANIMALS = ['🦊','🐼','🐨','🦁','🐰','🐸','🐧','🦄','🐢','🐝','🦉','🐙','🐬','🦋','🐶','🐱'];

const DEFAULT_ITEMS = {
  morgon: [
    { id: 'm1', label: 'Vakna & upp ur sängen', icon: '⏰' },
    { id: 'm2', label: 'Gå på toa',             icon: '🚽' },
    { id: 'm3', label: 'Klä på dig',            icon: '👕' },
    { id: 'm4', label: 'Äta frukost',           icon: '🥣' },
    { id: 'm5', label: 'Borsta tänderna',       icon: '🪥' },
    { id: 'm6', label: 'Packa väskan',          icon: '🎒' },
    { id: 'm7', label: 'Ytterkläder & skor',    icon: '🧥' },
  ],
  kvall: [
    { id: 'k1', label: 'Plocka undan leksaker', icon: '🧸' },
    { id: 'k2', label: 'Duscha / bada',         icon: '🚿' },
    { id: 'k3', label: 'Ta på pyjamas',         icon: '🌙' },
    { id: 'k4', label: 'Borsta tänderna',       icon: '🪥' },
    { id: 'k5', label: 'Packa inför imorgon',   icon: '🎒' },
    { id: 'k6', label: 'Läsa saga',             icon: '📖' },
    { id: 'k7', label: 'Godnatt & sova',        icon: '😴' },
  ],
};

// Kompis-figuren blir gladare ju fler rutor som bockas av
const BUDDY = [
  { max: 0,   face: '😴', text: 'Dags att börja!' },
  { max: 24,  face: '🙂', text: 'Bra start!' },
  { max: 49,  face: '😃', text: 'Det går bra!' },
  { max: 74,  face: '😄', text: 'Halvvägs — heja!' },
  { max: 99,  face: '🤩', text: 'Nästan klart!' },
  { max: 100, face: '🥳', text: 'Allt klart — grymt jobbat!' },
];
function buddyFor(pct) { return BUDDY.find(b => pct <= b.max) || BUDDY[0]; }

const PERIODS = {
  morgon: {
    label: 'Morgon', icon: '☀️',
    grad: 'linear-gradient(135deg, #FFE9B0 0%, #FFC978 55%, #FFB05C 100%)',
    ink: '#8A4D10', ring: '#F0A63C',
  },
  kvall: {
    label: 'Kväll', icon: '🌙',
    grad: 'linear-gradient(135deg, #3B3070 0%, #4C3E8F 55%, #2C2555 100%)',
    ink: '#FFFFFF', ring: '#9B8BE0',
  },
};

function todayIso() { return new Date().toISOString().split('T')[0]; }

/** Kort "ding" via Web Audio — inget ljudklipp behöver laddas. */
function playDing() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {   // A5 + E6 = liten glad klang
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.5);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch { /* ljud är en bonus — tyst fallback */ }
}

/** Liten fanfar när hela listan är klar. */
function playFanfare() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = now + i * 0.13;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.55);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch { /* tyst fallback */ }
}

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.8 + Math.random() * 1.2,
    color: ['#F0A63C','#7C5CBF','#3D7A55','#E86A6A','#4C9BE8','#F0D63C'][i % 6],
    size: 7 + Math.random() * 7,
    rot: Math.random() * 360,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 900, overflow: 'hidden' }}>
      <style>{`@keyframes rutinFall { 0% { transform: translateY(-12vh) rotate(0deg); opacity: 1 } 100% { transform: translateY(105vh) rotate(720deg); opacity: 0.9 } }`}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: 0, left: `${p.left}%`,
          width: p.size, height: p.size * 1.6, background: p.color,
          borderRadius: 2, transform: `rotate(${p.rot}deg)`,
          animation: `rutinFall ${p.dur}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

export default function Rutiner() {
  const isMobile = useIsMobile();
  const [kids,  setKids]  = useLocalStorage('kl_rutin_kids',  []);
  const [items, setItems] = useLocalStorage('kl_rutin_items', DEFAULT_ITEMS);
  const [prog,  setProg]  = useLocalStorage('kl_rutin_prog',  { date: todayIso(), done: {} });

  const [period, setPeriod] = useState(() => (new Date().getHours() >= 16 ? 'kvall' : 'morgon'));
  const [activeKid, setActiveKid] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAnimal, setNewAnimal] = useState(ANIMALS[0]);
  const [manage, setManage] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('⭐');

  // Nollställ automatiskt vid ny dag
  useEffect(() => {
    if (prog.date !== todayIso()) setProg({ date: todayIso(), done: {} });
  }, [prog.date]); // eslint-disable-line react-hooks/exhaustive-deps

  const kid = kids.find(k => k.id === activeKid) || kids[0];
  const list = items[period] || [];
  const P = PERIODS[period];

  const doneKey = (kidId, itemId) => `${kidId}:${period}:${itemId}`;
  const isDone = (itemId) => !!prog.done[doneKey(kid?.id, itemId)];
  const doneCount = list.filter(i => isDone(i.id)).length;
  const pct = list.length ? Math.round((doneCount / list.length) * 100) : 0;
  const buddy = buddyFor(pct);

  // Funktionell uppdatering — annars tappas bockar när barnet trycker snabbt
  function toggle(item) {
    if (!kid) return;
    const key = doneKey(kid.id, item.id);
    const wasDone = !!prog.done[key];

    setProg(prev => {
      const base = prev.date === todayIso() ? { ...prev.done } : {};
      if (base[key]) delete base[key]; else base[key] = true;
      return { date: todayIso(), done: base };
    });

    // Ding vid varje bock — fanfaren när listan blir klar sköts av effekten nedan
    if (!wasDone) {
      const after = list.filter(i => i.id === item.id || prog.done[doneKey(kid.id, i.id)]).length;
      if (after < list.length) playDing();
    }
  }

  // Fira när sista rutan bockas av — bara vid övergången till 100 %,
  // så det inte smäller konfetti varje gång sidan öppnas med allt klart.
  const prevPct = useRef(null);
  useEffect(() => {
    const key = `${kid?.id}:${period}`;
    const was = prevPct.current?.key === key ? prevPct.current.pct : null;
    prevPct.current = { key, pct };
    if (was === null || was >= 100 || pct !== 100 || list.length === 0) return;
    playFanfare();
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 3200);
    return () => clearTimeout(t);
  }, [pct, kid?.id, period, list.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function addKid() {
    const name = newName.trim();
    if (!name) return;
    const k = { id: 'rk_' + Date.now(), name, animal: newAnimal };
    setKids(prev => [...prev, k]);
    setActiveKid(k.id);
    setNewName(''); setNewAnimal(ANIMALS[0]); setAdding(false);
  }

  function removeKid(id) {
    if (!window.confirm('Ta bort barnet från rutinerna?')) return;
    setKids(prev => prev.filter(k => k.id !== id));
    if (activeKid === id) setActiveKid(null);
  }

  function addItem() {
    const label = newItem.trim();
    if (!label) return;
    setItems(prev => ({
      ...prev,
      [period]: [...(prev[period] || []), { id: 'i_' + Date.now(), label, icon: newItemIcon }],
    }));
    setNewItem(''); setNewItemIcon('⭐');
  }

  function removeItem(itemId) {
    setItems(prev => ({ ...prev, [period]: (prev[period] || []).filter(i => i.id !== itemId) }));
  }

  const cardBg = period === 'kvall' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)';
  const cardDone = period === 'kvall' ? 'rgba(155,139,224,0.35)' : 'rgba(255,255,255,0.92)';

  return (
    <div style={{ minHeight: '100%', background: P.grad, transition: 'background 0.4s ease' }}>
      {showConfetti && <Confetti />}

      <div style={{ padding: isMobile ? '18px 14px 32px' : '28px 36px 40px', maxWidth: 820, margin: '0 auto' }}>

        {/* ── Period-växlare ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {Object.entries(PERIODS).map(([key, p]) => {
            const active = key === period;
            return (
              <button key={key} onClick={() => setPeriod(key)} style={{
                flex: 1, padding: isMobile ? '12px 8px' : '14px 10px', borderRadius: T.radiusLg,
                border: active ? `3px solid ${P.ink}` : '2px solid rgba(255,255,255,0.45)',
                background: active ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.12)',
                color: P.ink, fontSize: isMobile ? 16 : 18, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: T.fontDisplay,
              }}>
                <span style={{ fontSize: 24 }}>{p.icon}</span> {p.label}
              </button>
            );
          })}
        </div>

        {/* ── Barn-väljare ───────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
          {kids.map(k => {
            const active = kid?.id === k.id;
            return (
              <button key={k.id}
                onClick={() => setActiveKid(k.id)}
                onDoubleClick={() => removeKid(k.id)}
                title={`${k.name} (dubbelklicka för att ta bort)`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '8px 14px', borderRadius: T.radiusLg, cursor: 'pointer',
                  border: active ? `3px solid ${P.ink}` : '2px solid rgba(255,255,255,0.4)',
                  background: active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)',
                  minWidth: 74,
                }}>
                <span style={{ fontSize: 30, lineHeight: 1 }}>{k.animal}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: P.ink }}>{k.name}</span>
              </button>
            );
          })}
          <button onClick={() => setAdding(a => !a)} title="Lägg till barn" style={{
            width: 60, height: 60, borderRadius: '50%', cursor: 'pointer',
            border: `2px dashed ${P.ink}`, background: 'rgba(255,255,255,0.18)',
            color: P.ink, fontSize: 28, fontWeight: 700, lineHeight: 1,
          }}>＋</button>
        </div>

        {/* Lägg till barn */}
        {adding && (
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: T.radiusLg, padding: 18, marginBottom: 18, boxShadow: T.shadowMd }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>Nytt barn</div>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addKid()}
              placeholder="Namn, t.ex. Molly"
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '10px 12px', fontSize: 15, marginBottom: 12, outline: 'none', background: T.bg, color: T.text }} />
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>Välj djur</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {ANIMALS.map(a => (
                <button key={a} onClick={() => setNewAnimal(a)} style={{
                  fontSize: 26, lineHeight: 1, padding: '4px 6px', cursor: 'pointer', borderRadius: 10,
                  background: newAnimal === a ? T.purpleLight : 'transparent',
                  border: `2px solid ${newAnimal === a ? T.purple : 'transparent'}`,
                }}>{a}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addKid} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Lägg till</button>
              <button onClick={() => setAdding(false)} style={{ background: 'transparent', color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '10px 18px', fontSize: 14, cursor: 'pointer' }}>Avbryt</button>
            </div>
          </div>
        )}

        {kids.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: P.ink }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{P.icon}</div>
            <div style={{ fontSize: 19, fontWeight: 800, fontFamily: T.fontDisplay, marginBottom: 6 }}>Inga barn ännu</div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>Tryck på ＋ för att lägga till ditt första barn.</div>
          </div>
        ) : (
          <>
            {/* ── Kompis + progressbar ─────────────────────────── */}
            <div style={{ background: 'rgba(255,255,255,0.22)', borderRadius: T.radiusLg, padding: isMobile ? 14 : 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: isMobile ? 44 : 54, lineHeight: 1, transition: 'transform 0.3s', transform: pct === 100 ? 'scale(1.15)' : 'scale(1)' }}>
                {buddy.face}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: P.ink, fontFamily: T.fontDisplay, marginBottom: 6 }}>
                  {buddy.text}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.45)', borderRadius: 999, height: 14, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: pct === 100 ? '#3D7A55' : P.ring, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: P.ink, marginTop: 5, opacity: 0.9 }}>
                  {doneCount} av {list.length} klara · {kid?.name}
                </div>
              </div>
            </div>

            {/* ── Checklistan ──────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map(item => {
                const done = isDone(item.id);
                return (
                  <button key={item.id} onClick={() => toggle(item)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    padding: isMobile ? '14px 14px' : '16px 20px', borderRadius: T.radiusLg,
                    border: done ? `3px solid ${P.ring}` : '2px solid rgba(255,255,255,0.5)',
                    background: done ? cardDone : cardBg,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
                    transform: done ? 'scale(0.985)' : 'scale(1)',
                  }}>
                    <span style={{ fontSize: isMobile ? 30 : 34, lineHeight: 1, flexShrink: 0, opacity: done ? 0.55 : 1 }}>{item.icon}</span>
                    <span style={{
                      flex: 1, fontSize: isMobile ? 16 : 18, fontWeight: 700,
                      color: period === 'kvall' && !done ? '#fff' : T.text,
                      textDecoration: done ? 'line-through' : 'none',
                      opacity: done ? 0.6 : 1,
                    }}>{item.label}</span>
                    <span style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      border: `3px solid ${done ? '#3D7A55' : P.ring}`,
                      background: done ? '#3D7A55' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 20, fontWeight: 900,
                    }}>{done ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>

            {/* ── Hantera rutiner ──────────────────────────────── */}
            <button onClick={() => setManage(m => !m)} style={{
              marginTop: 16, background: 'rgba(255,255,255,0.2)', border: `1px solid ${P.ink}44`,
              borderRadius: T.radiusSm, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              color: P.ink, cursor: 'pointer',
            }}>
              {manage ? 'Klar' : `⚙️ Ändra ${P.label.toLowerCase()}rutiner`}
            </button>

            {manage && (
              <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: T.radiusLg, padding: 18, marginTop: 12, boxShadow: T.shadowMd }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>
                  {P.icon} {P.label}rutiner — gäller alla barn
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {list.map(i => (
                    <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: T.bg, borderRadius: T.radiusSm, border: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 20 }}>{i.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, color: T.text }}>{i.label}</span>
                      <button onClick={() => removeItem(i.id)} title="Ta bort"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 16 }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input value={newItemIcon} onChange={e => setNewItemIcon(e.target.value)}
                    style={{ width: 46, textAlign: 'center', fontSize: 18, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '8px 4px', background: T.bg, outline: 'none' }} />
                  <input value={newItem} onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem()}
                    placeholder="Ny rutin, t.ex. Ta med gympapåse"
                    style={{ flex: 1, minWidth: 150, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 14, background: T.bg, color: T.text, outline: 'none' }} />
                  <button onClick={addItem} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Lägg till</button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 18, fontSize: 12, color: P.ink, opacity: 0.75, textAlign: 'center' }}>
              Sparas automatiskt · nollställs varje ny dag
            </div>
          </>
        )}
      </div>
    </div>
  );
}
