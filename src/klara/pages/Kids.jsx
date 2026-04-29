import React, { useState, useRef } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const LEVELS = [
  { label: 'Nybörjare', min: 0,   max: 50,  color: '#6B7280' },
  { label: 'Hjälte',    min: 51,  max: 150, color: '#F97316' },
  { label: 'Mästare',   min: 151, max: 300, color: '#7C5CBF' },
  { label: 'Legend',    min: 301, max: Infinity, color: '#F59E0B' },
];

const BADGES_DEF = [
  { id: 'first',    label: 'Första sysslan!',    icon: '🌟', condition: (c) => c >= 1 },
  { id: 'ten',      label: '10 sysslor gjorda!', icon: '🏆', condition: (c) => c >= 10 },
  { id: 'points50', label: '50 poäng!',          icon: '💎', condition: (p) => p >= 50 },
  { id: 'points100',label: '100 poäng!',         icon: '🚀', condition: (p) => p >= 100 },
];

const defaultChores = [
  { id: 'ch1', title: 'Diska',               points: 10 },
  { id: 'ch2', title: 'Städa rummet',        points: 15 },
  { id: 'ch3', title: 'Ta ut soporna',       points: 10 },
  { id: 'ch4', title: 'Mata djuren',         points: 5  },
  { id: 'ch5', title: 'Duka bordet',         points: 5  },
  { id: 'ch6', title: 'Bädda sängen',        points: 5  },
];

const defaultKids = {};

const defaultActivities = [
  { id: 'a1', label: 'Promenad', outdoor: true,  color: '#22C55E' },
  { id: 'a2', label: 'Rita',     outdoor: false, color: '#F97316' },
  { id: 'a3', label: 'Cykling',  outdoor: true,  color: '#3B82F6' },
  { id: 'a4', label: 'Baka',     outdoor: false, color: '#EC4899' },
  { id: 'a5', label: 'Simma',    outdoor: true,  color: '#06B6D4' },
  { id: 'a6', label: 'Spela spel',outdoor: false,color: '#8B5CF6' },
  { id: 'a7', label: 'Leka ute', outdoor: true,  color: '#84CC16' },
  { id: 'a8', label: 'Film',     outdoor: false, color: '#EF4444' },
];

function getLevel(points) {
  return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[0];
}

function getLevelProgress(points) {
  const lv = getLevel(points);
  if (lv.max === Infinity) return 100;
  const range = lv.max - lv.min;
  return Math.round(((points - lv.min) / range) * 100);
}

export default function Kids({ members = [] }) {
  const [activeTab, setActiveTab] = useState('sysslor');
  const [chores, setChores] = useLocalStorage('kl_chores', defaultChores);
  const [kidsData, setKidsData] = useLocalStorage('kl_kids', defaultKids);
  const [activities, setActivities] = useLocalStorage('kl_activities', defaultActivities);
  const [outdoorOnly, setOutdoorOnly] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [spinAngle, setSpinAngle] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newChore, setNewChore] = useState('');
  const [newChorePoints, setNewChorePoints] = useState(10);
  const [newActivity, setNewActivity] = useState('');
  const [editActivity, setEditActivity] = useState(null);
  const spinRef = useRef(null);

  const kids = members.filter(m => m.role && m.role.includes('år'));

  function getKidData(kidId) {
    return kidsData[kidId] || { points: 0, doneCount: 0, doneTodayIds: [] };
  }

  function toggleChore(kidId, choreId, points) {
    setKidsData(prev => {
      const kd = prev[kidId] || { points: 0, doneCount: 0, doneTodayIds: [] };
      const already = (kd.doneTodayIds || []).includes(choreId);
      if (already) {
        return {
          ...prev,
          [kidId]: {
            ...kd,
            points: Math.max(0, kd.points - points),
            doneCount: Math.max(0, kd.doneCount - 1),
            doneTodayIds: kd.doneTodayIds.filter(id => id !== choreId),
          },
        };
      } else {
        return {
          ...prev,
          [kidId]: {
            ...kd,
            points: kd.points + points,
            doneCount: kd.doneCount + 1,
            doneTodayIds: [...(kd.doneTodayIds || []), choreId],
          },
        };
      }
    });
  }

  function addChore() {
    if (!newChore.trim()) return;
    setChores(prev => [...prev, { id: 'ch_' + Date.now(), title: newChore.trim(), points: Number(newChorePoints) }]);
    setNewChore('');
    setNewChorePoints(10);
  }

  function removeChore(id) {
    setChores(prev => prev.filter(c => c.id !== id));
  }

  function spinWheel() {
    if (spinning) return;
    const filtered = outdoorOnly ? activities.filter(a => a.outdoor) : activities;
    if (filtered.length === 0) return;
    setSpinning(true);
    setSpinResult(null);
    const extraSpins = 4;
    const targetIdx = Math.floor(Math.random() * filtered.length);
    const segAngle = 360 / filtered.length;
    const targetAngle = extraSpins * 360 + (360 - (targetIdx * segAngle + segAngle / 2));
    const newAngle = spinAngle + targetAngle;
    setSpinAngle(newAngle);
    setTimeout(() => {
      setSpinning(false);
      setSpinResult(filtered[targetIdx]);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }, 3500);
  }

  function addActivity() {
    if (!newActivity.trim()) return;
    const colors = ['#22C55E','#F97316','#3B82F6','#EC4899','#8B5CF6','#EF4444','#F59E0B','#06B6D4'];
    setActivities(prev => [...prev, { id: 'a_' + Date.now(), label: newActivity.trim(), outdoor: outdoorOnly, color: colors[prev.length % colors.length] }]);
    setNewActivity('');
  }

  function removeActivity(id) {
    setActivities(prev => prev.filter(a => a.id !== id));
  }

  const tabStyle = (id) => ({
    padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    background: activeTab === id ? T.purple : 'transparent',
    color: activeTab === id ? '#fff' : T.textMuted,
    border: 'none', borderRadius: T.radiusSm, transition: 'background 0.15s',
  });

  const filteredActivities = outdoorOnly ? activities.filter(a => a.outdoor) : activities;

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>🎡 Kids & Sysslor</h1>
        <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Poängsystem och aktivitetshjul</p>
      </div>

      <div style={{ display: 'flex', gap: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 4, width: 'fit-content', marginBottom: 28 }}>
        <button onClick={() => setActiveTab('sysslor')} style={tabStyle('sysslor')}>🏆 Sysslor</button>
        <button onClick={() => setActiveTab('aktiviteter')} style={tabStyle('aktiviteter')}>🎡 Aktivitetshjul</button>
      </div>

      {/* SYSSLOR TAB */}
      {activeTab === 'sysslor' && (
        <div>
          {kids.length === 0 && (
            <div style={{ textAlign: 'center', color: T.textMuted, fontSize: 16, marginTop: 40 }}>
              Inga barn tillagda. Lägg till familjemedlemmar med roll "X år" i Familj.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24, marginBottom: 28 }}>
            {kids.map(kid => {
              const kd = getKidData(kid.id);
              const lv = getLevel(kd.points);
              const lvPct = getLevelProgress(kd.points);
              return (
                <div key={kid.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: kid.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                      {kid.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{kid.name}</div>
                      <div style={{ fontSize: 12, color: lv.color, fontWeight: 600 }}>{lv.label} · {kd.points} poäng</div>
                    </div>
                    <div style={{ fontSize: 28 }}>
                      {kd.points >= 301 ? '🌟' : kd.points >= 151 ? '🏆' : kd.points >= 51 ? '💪' : '🌱'}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMuted, marginBottom: 4 }}>
                      <span>{lv.label}</span>
                      <span>{lvPct}%</span>
                    </div>
                    <div style={{ background: T.border, borderRadius: 6, height: 8, overflow: 'hidden' }}>
                      <div style={{ background: lv.color, width: `${lvPct}%`, height: '100%', borderRadius: 6, transition: 'width 0.4s' }} />
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {BADGES_DEF.map(b => {
                      const earned = b.id.startsWith('points') ? b.condition(kd.points) : b.condition(kd.doneCount);
                      return earned ? (
                        <div key={b.id} title={b.label} style={{ background: T.purpleLight, borderRadius: 20, padding: '4px 10px', fontSize: 12, color: T.purple, fontWeight: 600 }}>
                          {b.icon} {b.label}
                        </div>
                      ) : null;
                    })}
                  </div>

                  {/* Chores */}
                  <div>
                    {chores.map(chore => {
                      const done = (kd.doneTodayIds || []).includes(chore.id);
                      return (
                        <div key={chore.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', marginBottom: 6, borderRadius: T.radiusSm,
                          background: done ? T.greenLight : T.bg,
                          border: `1px solid ${done ? T.green : T.border}`,
                          cursor: 'pointer',
                        }}
                          onClick={() => toggleChore(kid.id, chore.id, chore.points)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: 4,
                              background: done ? T.green : 'transparent',
                              border: `2px solid ${done ? T.green : T.textMuted}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {done && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: T.text, textDecoration: done ? 'line-through' : 'none' }}>{chore.title}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: done ? T.green : T.textMuted }}>+{chore.points} p</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add chore */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, color: T.text }}>Hantera sysslor</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input value={newChore} onChange={e => setNewChore(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChore()}
                placeholder="Ny syssla..." style={{ flex: 2, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, color: T.text, background: T.bg, outline: 'none' }} />
              <input type="number" min="1" value={newChorePoints} onChange={e => setNewChorePoints(e.target.value)}
                style={{ width: 80, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, color: T.text, background: T.bg, outline: 'none' }} />
              <button onClick={addChore} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Lägg till</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {chores.map(c => (
                <div key={c.id} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: '5px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.title} <span style={{ color: T.purple, fontWeight: 600 }}>{c.points}p</span>
                  <button onClick={() => removeChore(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14, padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AKTIVITETSHJUL TAB */}
      {activeTab === 'aktiviteter' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
              <button
                onClick={() => setOutdoorOnly(false)}
                style={{ background: !outdoorOnly ? T.purple : T.bg, color: !outdoorOnly ? '#fff' : T.textMuted, border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: !outdoorOnly ? 600 : 400 }}>
                Alla
              </button>
              <button
                onClick={() => setOutdoorOnly(true)}
                style={{ background: outdoorOnly ? T.purple : T.bg, color: outdoorOnly ? '#fff' : T.textMuted, border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: outdoorOnly ? 600 : 400 }}>
                Utomhus
              </button>
            </div>

            {/* SVG Wheel */}
            <div style={{ position: 'relative', width: 400, height: 400, margin: '0 auto 20px' }}>
              {showConfetti && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, zIndex: 10, pointerEvents: 'none' }}>
                  {'🎉'.repeat(8).split('').map((e, i) => (
                    <span key={i} style={{ position: 'absolute', top: `${10 + Math.random() * 80}%`, left: `${10 + Math.random() * 80}%`, fontSize: 24, animation: 'none' }}>{e}</span>
                  ))}
                  <div style={{ fontSize: 48 }}>🎉</div>
                </div>
              )}
              <svg
                width="400" height="400" viewBox="0 0 400 400"
                style={{ transform: `rotate(${spinAngle}deg)`, transition: spinning ? 'transform 3.5s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}
              >
                {filteredActivities.length > 0 && filteredActivities.map((act, i) => {
                  const n = filteredActivities.length;
                  const segAngle = (2 * Math.PI) / n;
                  const startAngle = i * segAngle - Math.PI / 2;
                  const endAngle = startAngle + segAngle;
                  const cx = 200, cy = 200, r = 190;
                  const x1 = cx + r * Math.cos(startAngle);
                  const y1 = cy + r * Math.sin(startAngle);
                  const x2 = cx + r * Math.cos(endAngle);
                  const y2 = cy + r * Math.sin(endAngle);
                  const midAngle = startAngle + segAngle / 2;
                  const tx = cx + (r * 0.62) * Math.cos(midAngle);
                  const ty = cy + (r * 0.62) * Math.sin(midAngle);
                  const largeArc = segAngle > Math.PI ? 1 : 0;
                  return (
                    <g key={act.id}>
                      <path d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill={act.color} stroke="#fff" strokeWidth="2" />
                      <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={n > 10 ? 10 : 13} fontWeight="700" fill="#fff" style={{ pointerEvents: 'none' }}>
                        {act.label.length > 8 ? act.label.slice(0, 7) + '…' : act.label}
                      </text>
                    </g>
                  );
                })}
                {filteredActivities.length === 0 && (
                  <circle cx="200" cy="200" r="190" fill={T.border} />
                )}
                <circle cx="200" cy="200" r="24" fill="#fff" stroke={T.border} strokeWidth="2" />
              </svg>
              {/* Arrow */}
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 28, color: T.purple, zIndex: 5 }}>▼</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={spinWheel}
                disabled={spinning || filteredActivities.length === 0}
                style={{
                  background: spinning ? T.textMuted : T.purple, color: '#fff', border: 'none',
                  borderRadius: T.radius, padding: '14px 40px', fontSize: 18, fontWeight: 700,
                  cursor: spinning ? 'not-allowed' : 'pointer', marginBottom: 16,
                  boxShadow: T.shadowMd, transition: 'background 0.15s',
                }}
              >
                {spinning ? '🌀 Snurrar...' : '🎡 Snurra!'}
              </button>

              {spinResult && !spinning && (
                <div style={{ background: spinResult.color + '22', border: `2px solid ${spinResult.color}`, borderRadius: T.radius, padding: '16px 24px', fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 16 }}>
                  🎉 {spinResult.label}!
                </div>
              )}
            </div>
          </div>

          {/* Activity management */}
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, color: T.text }}>Aktiviteter</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input value={newActivity} onChange={e => setNewActivity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addActivity()}
                  placeholder="Ny aktivitet..." style={{ flex: 1, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 13, color: T.text, background: T.bg, outline: 'none' }} />
                <button onClick={addActivity} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activities.map(act => (
                  <div key={act.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', background: T.bg, borderRadius: T.radiusSm,
                    borderLeft: `4px solid ${act.color}`,
                  }}>
                    <span style={{ flex: 1, fontSize: 13, color: T.text }}>{act.label}</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{act.outdoor ? '🌳' : '🏠'}</span>
                    <button onClick={() => removeActivity(act.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
