import React, { useState, useEffect } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

// ─── Levels (baserat på totalt intjänade stjärnor) ────────────────────────────
const LEVELS = [
  { label: 'Nybörjare',   icon: '🌱', min: 0,   max: 49,  color: '#6B7280', bg: '#F3F4F6' },
  { label: 'Hjälte',      icon: '⚡', min: 50,  max: 149, color: '#F97316', bg: '#FFF0E0' },
  { label: 'Mästare',     icon: '🏆', min: 150, max: 299, color: '#7C5CBF', bg: '#F3EFFF' },
  { label: 'Legend',      icon: '🌟', min: 300, max: 599, color: '#F59E0B', bg: '#FFFBEB' },
  { label: 'Superhjälte', icon: '🚀', min: 600, max: Infinity, color: '#EF4444', bg: '#FEF2F2' },
];

const BADGES = [
  { id: 'first',   icon: '🎯', label: 'Första sysslan!',      check: d => d.totalStars >= 1 },
  { id: 'ten',     icon: '🏅', label: '10 sysslor klara!',    check: d => (d.doneHistory?.length || 0) >= 10 },
  { id: 's50',     icon: '💎', label: '50 stjärnor intjänade!',check: d => d.totalStars >= 50 },
  { id: 's100',    icon: '👑', label: '100 stjärnor!',         check: d => d.totalStars >= 100 },
  { id: 's300',    icon: '🌟', label: '300 stjärnor — Legend!',check: d => d.totalStars >= 300 },
  { id: 'redeem',  icon: '🎁', label: 'Första belöningen!',    check: d => (d.redeemedRewards?.length || 0) >= 1 },
];

const RESET_OPTIONS = [
  { val: 'dag',   label: 'Återställs varje dag' },
  { val: 'vecka', label: 'Återställs varje vecka' },
  { val: 'aldrig',label: 'Återställs inte automatiskt' },
];

const DEFAULT_CHORES = [
  { id: 'ch1', title: 'Diska',              stars: 10, icon: '🍽️', resetEvery: 'dag'   },
  { id: 'ch2', title: 'Städa rummet',       stars: 15, icon: '🧹', resetEvery: 'vecka' },
  { id: 'ch3', title: 'Ta ut soporna',      stars: 10, icon: '🗑️', resetEvery: 'vecka' },
  { id: 'ch4', title: 'Mata djuren',        stars: 8,  icon: '🐾', resetEvery: 'dag'   },
  { id: 'ch5', title: 'Duka bordet',        stars: 5,  icon: '🍴', resetEvery: 'dag'   },
  { id: 'ch6', title: 'Bädda sängen',       stars: 5,  icon: '🛏️', resetEvery: 'dag'   },
  { id: 'ch7', title: 'Hjälpa till med mat',stars: 12, icon: '👨‍🍳',resetEvery: 'dag'   },
  { id: 'ch8', title: 'Läsa 30 min',        stars: 10, icon: '📚', resetEvery: 'dag'   },
];

const DEFAULT_REWARDS = [
  { id: 'r1', title: 'Extra skärmtid 30 min', cost: 20,  icon: '📱', desc: 'Extra tid med tablet/TV' },
  { id: 'r2', title: 'Välj middagen',          cost: 30,  icon: '🍕', desc: 'Du bestämmer vad vi äter' },
  { id: 'r3', title: 'Biobesök',               cost: 80,  icon: '🎬', desc: 'En kväll på bion' },
  { id: 'r4', title: 'Kompis-sovdag',          cost: 60,  icon: '🏠', desc: 'En kompis sover över' },
  { id: 'r5', title: 'Välj familjeaktivitet',  cost: 50,  icon: '🎲', desc: 'Du bestämmer vad vi gör' },
  { id: 'r6', title: 'Glass-utflykt',          cost: 25,  icon: '🍦', desc: 'Vi åker och köper glass' },
];

const DEFAULT_ACTIVITIES = [
  { id: 'a1', label: 'Promenad',   outdoor: true,  color: '#22C55E' },
  { id: 'a2', label: 'Rita',       outdoor: false, color: '#F97316' },
  { id: 'a3', label: 'Cykling',    outdoor: true,  color: '#3B82F6' },
  { id: 'a4', label: 'Baka',       outdoor: false, color: '#EC4899' },
  { id: 'a5', label: 'Simma',      outdoor: true,  color: '#06B6D4' },
  { id: 'a6', label: 'Spela spel', outdoor: false, color: '#8B5CF6' },
  { id: 'a7', label: 'Leka ute',   outdoor: true,  color: '#84CC16' },
  { id: 'a8', label: 'Film',       outdoor: false, color: '#EF4444' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayIso() { return new Date().toISOString().split('T')[0]; }

function isoWeekStart(iso) {
  const d = new Date(iso + 'T12:00:00');
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().split('T')[0];
}

// Is the chore still "checked" given when it was done and its reset interval?
function isChoreChecked(chore, choreState) {
  const state = choreState?.[chore.id];
  if (!state?.doneDate) return false;
  const done    = state.doneDate;
  const today   = todayIso();
  const interval = chore.resetEvery || 'dag';
  if (interval === 'dag')   return done === today;
  if (interval === 'vecka') return isoWeekStart(done) === isoWeekStart(today);
  if (interval === 'aldrig') return true;
  return done === today;
}

function getLevel(totalStars) {
  return LEVELS.find(l => totalStars >= l.min && totalStars <= l.max) || LEVELS[0];
}
function getLevelPct(totalStars) {
  const lv = getLevel(totalStars);
  if (lv.max === Infinity) return 100;
  return Math.round(((totalStars - lv.min) / (lv.max - lv.min)) * 100);
}

// Migrate old kidsData format (coins → stars) transparently
function getKD(kidsData, kidId) {
  const saved = kidsData[kidId];
  if (!saved) return { stars: 0, totalStars: 0, doneHistory: [], choreState: {}, redeemedRewards: [] };
  return {
    stars:           saved.stars          ?? saved.coins        ?? 0,
    totalStars:      saved.totalStars     ?? saved.totalEarned  ?? 0,
    doneHistory:     saved.doneHistory    ?? (saved.doneChores || []).map(d => ({ choreId: d.choreId, date: d.date, stars: d.coins || 0 })),
    choreState:      saved.choreState     ?? {},
    redeemedRewards: saved.redeemedRewards ?? [],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Kids({ members = [] }) {
  const [chores,     setChores]     = useLocalStorage('kl_chores',     DEFAULT_CHORES);
  const [rewards,    setRewards]    = useLocalStorage('kl_rewards',    DEFAULT_REWARDS);
  const [kidsData,   setKidsData]   = useLocalStorage('kl_kids',       {});
  const [activities, setActivities] = useLocalStorage('kl_activities', DEFAULT_ACTIVITIES);

  const [tab,         setTab]        = useState('sysslor');
  const [selectedKid, setSelectedKid]= useState(null);
  const [starAnim,    setStarAnim]   = useState(null);  // { kidId, amount }
  const [confetti,    setConfetti]   = useState(false);
  const [spinning,    setSpinning]   = useState(false);
  const [spinResult,  setSpinResult] = useState(null);
  const [spinAngle,   setSpinAngle]  = useState(0);
  const [outdoorOnly, setOutdoorOnly]= useState(false);

  // Chore form
  const [newChore,      setNewChore]      = useState('');
  const [newChoreStars, setNewChoreStars] = useState(10);
  const [newChoreIcon,  setNewChoreIcon]  = useState('⭐');
  const [newChoreReset, setNewChoreReset] = useState('dag');
  // Reward form
  const [newReward,     setNewReward]     = useState('');
  const [newRewardCost, setNewRewardCost] = useState(30);
  const [newRewardIcon, setNewRewardIcon] = useState('🎁');
  const [newRewardDesc, setNewRewardDesc] = useState('');
  // Activity form
  const [newActivity,   setNewActivity]   = useState('');

  const kids = members.filter(m => m.role?.includes('år') || m.role?.toLowerCase() === 'barn');
  const activeKid = selectedKid || kids[0]?.id;

  function kd(kidId) { return getKD(kidsData, kidId); }

  // ── Toggle chore: stars are PERMANENT, unchecking only resets the checkbox ──
  function toggleChore(kidId, chore) {
    const data = kd(kidId);
    const checked = isChoreChecked(chore, data.choreState);

    if (checked) {
      // Just reset the checkbox — stars stay
      setKidsData(prev => ({
        ...prev,
        [kidId]: {
          ...kd(kidId),
          choreState: { ...data.choreState, [chore.id]: { doneDate: null } },
        },
      }));
    } else {
      // Earn stars
      setStarAnim({ kidId, amount: chore.stars });
      setTimeout(() => setStarAnim(null), 1400);
      setKidsData(prev => {
        const d2 = kd(kidId);
        return {
          ...prev,
          [kidId]: {
            ...d2,
            stars:      (d2.stars || 0) + chore.stars,
            totalStars: (d2.totalStars || 0) + chore.stars,
            doneHistory:[...d2.doneHistory, { choreId: chore.id, date: todayIso(), stars: chore.stars }],
            choreState: { ...d2.choreState, [chore.id]: { doneDate: todayIso() } },
          },
        };
      });
    }
  }

  // Manual reset: clear all checkboxes for a kid (stars stay)
  function resetChores(kidId) {
    setKidsData(prev => ({
      ...prev,
      [kidId]: { ...kd(kidId), choreState: {} },
    }));
  }

  function addChore() {
    if (!newChore.trim()) return;
    setChores(prev => [...prev, { id: 'ch_' + Date.now(), title: newChore.trim(), stars: Number(newChoreStars), icon: newChoreIcon, resetEvery: newChoreReset }]);
    setNewChore(''); setNewChoreStars(10); setNewChoreIcon('⭐'); setNewChoreReset('dag');
  }

  // ── Rewards ──────────────────────────────────────────────────────────────────
  function redeemReward(kidId, reward) {
    const data = kd(kidId);
    if ((data.stars || 0) < reward.cost) return;
    if (!window.confirm(`${kids.find(k => k.id === kidId)?.name} löser in "${reward.title}" för ${reward.cost} ⭐?`)) return;
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2500);
    setKidsData(prev => {
      const d2 = kd(kidId);
      return {
        ...prev,
        [kidId]: {
          ...d2,
          stars: (d2.stars || 0) - reward.cost,
          redeemedRewards: [...d2.redeemedRewards, { rewardId: reward.id, title: reward.title, date: todayIso(), cost: reward.cost }],
        },
      };
    });
  }

  function addReward() {
    if (!newReward.trim()) return;
    setRewards(prev => [...prev, { id: 'r_' + Date.now(), title: newReward.trim(), cost: Number(newRewardCost), icon: newRewardIcon, desc: newRewardDesc.trim() }]);
    setNewReward(''); setNewRewardCost(30); setNewRewardIcon('🎁'); setNewRewardDesc('');
  }

  // ── Wheel ────────────────────────────────────────────────────────────────────
  function spinWheel() {
    if (spinning) return;
    const filtered = outdoorOnly ? activities.filter(a => a.outdoor) : activities;
    if (!filtered.length) return;
    setSpinning(true); setSpinResult(null);
    const idx = Math.floor(Math.random() * filtered.length);
    const seg = 360 / filtered.length;
    setSpinAngle(a => a + 4 * 360 + (360 - (idx * seg + seg / 2)));
    setTimeout(() => { setSpinning(false); setSpinResult(filtered[idx]); }, 3500);
  }

  const filteredActs = outdoorOnly ? activities.filter(a => a.outdoor) : activities;
  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      padding: '9px 20px', border: 'none', borderRadius: T.radiusSm,
      background: tab === id ? T.purple : 'transparent',
      color: tab === id ? '#fff' : T.textMuted,
      fontWeight: tab === id ? 700 : 400, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
    }}>{label}</button>
  );

  const inp = { padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 13, color: T.text, background: T.bg, outline: 'none' };

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>🎮 Kids</h1>
        <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Sysslor · Belöningar · Aktivitetshjul</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 4, width: 'fit-content', marginBottom: 24, boxShadow: T.shadow }}>
        {tabBtn('sysslor', '🏅 Sysslor')}
        {tabBtn('belöningar', '🎁 Belöningar')}
        {tabBtn('aktiviteter', '🎡 Aktivitetshjul')}
      </div>

      {/* ═══════════════ SYSSLOR ═══════════════ */}
      {tab === 'sysslor' && (
        <div>
          {kids.length === 0 ? (
            <p style={{ color: T.textMuted }}>Inga barn tillagda — lägg till familjemedlemmar med roll "X år" i Inställningar.</p>
          ) : (
            <>
              {/* ── Compact kid selector ── */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                {kids.map(kid => {
                  const data    = kd(kid.id);
                  const lv      = getLevel(data.totalStars);
                  const isActive= activeKid === kid.id;
                  const isAnim  = starAnim?.kidId === kid.id;
                  return (
                    <div key={kid.id} style={{ position: 'relative' }}>
                      <button
                        onClick={() => setSelectedKid(kid.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 16px', border: `2px solid ${isActive ? lv.color : T.border}`,
                          borderRadius: 40, background: isActive ? lv.bg : T.card,
                          cursor: 'pointer', transition: 'all 0.15s', boxShadow: isActive ? T.shadowMd : T.shadow,
                        }}
                      >
                        {/* Avatar */}
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: kid.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                          {kid.initials}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{kid.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 13 }}>⭐</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: lv.color }}>{data.stars || 0}</span>
                            <span style={{ fontSize: 11, color: T.textMuted }}>/ {data.totalStars || 0} tot.</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 18, marginLeft: 2 }}>{lv.icon}</span>
                      </button>
                      {/* Star pop animation */}
                      {isAnim && (
                        <div style={{
                          position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                          fontSize: 16, fontWeight: 800, color: '#F59E0B',
                          pointerEvents: 'none', whiteSpace: 'nowrap',
                          textShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          animation: 'fadeUp 1.4s forwards',
                        }}>
                          +{starAnim.amount} ⭐
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Active kid panel ── */}
              {kids.filter(k => k.id === activeKid).map(kid => {
                const data = kd(kid.id);
                const lv   = getLevel(data.totalStars);
                const earnedBadges = BADGES.filter(b => b.check(data));
                const doneToday = chores.filter(c => isChoreChecked(c, data.choreState)).length;

                return (
                  <div key={kid.id} style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

                    {/* Left: chore list */}
                    <div>
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
                        {/* Kid header row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{kid.name}s sysslor</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}>{doneToday} av {chores.length} gjorda</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: lv.bg, borderRadius: T.radiusSm, padding: '6px 14px' }}>
                              <span style={{ fontSize: 18 }}>⭐</span>
                              <span style={{ fontSize: 20, fontWeight: 800, color: lv.color }}>{data.stars || 0}</span>
                              <span style={{ fontSize: 11, color: T.textMuted }}>kvar</span>
                            </div>
                            <button
                              onClick={() => resetChores(kid.id)}
                              title="Återställ alla bockar (stjärnor behålls)"
                              style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '6px 12px', fontSize: 12, color: T.textMuted, cursor: 'pointer' }}
                            >
                              🔄 Återställ
                            </button>
                          </div>
                        </div>

                        {/* Chores */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {chores.map(chore => {
                            const checked = isChoreChecked(chore, data.choreState);
                            return (
                              <div
                                key={chore.id}
                                onClick={() => toggleChore(kid.id, chore)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 14,
                                  padding: '12px 16px', borderRadius: T.radiusSm, cursor: 'pointer',
                                  background: checked ? T.greenLight : T.bg,
                                  border: `1.5px solid ${checked ? T.green : T.border}`,
                                  transition: 'all 0.15s',
                                }}
                              >
                                <div style={{
                                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                                  background: checked ? T.green : 'transparent',
                                  border: `2px solid ${checked ? T.green : '#CBD5E1'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.15s',
                                }}>
                                  {checked && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                                </div>
                                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{chore.icon || '⭐'}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text, textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.6 : 1 }}>
                                    {chore.title}
                                  </div>
                                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                    {RESET_OPTIONS.find(r => r.val === (chore.resetEvery || 'dag'))?.label}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: checked ? '#D1FAE5' : T.purpleLight, borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
                                  <span style={{ fontSize: 14 }}>⭐</span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: checked ? T.greenText : T.purple }}>
                                    {checked ? '✓' : `+${chore.stars}`}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Add chore */}
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 16, marginTop: 16, boxShadow: T.shadow }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, marginBottom: 10 }}>+ Ny syssla</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <input value={newChoreIcon} onChange={e => setNewChoreIcon(e.target.value)} style={{ ...inp, width: 48, textAlign: 'center', fontSize: 18 }} />
                          <input value={newChore} onChange={e => setNewChore(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChore()} placeholder="Sysslans namn..." style={{ ...inp, flex: 1, minWidth: 140 }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.purpleLight, borderRadius: T.radiusSm, padding: '6px 10px' }}>
                            <span>⭐</span>
                            <input type="number" min="1" value={newChoreStars} onChange={e => setNewChoreStars(e.target.value)} style={{ width: 44, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 700, color: T.purple, outline: 'none' }} />
                          </div>
                          <select value={newChoreReset} onChange={e => setNewChoreReset(e.target.value)} style={{ ...inp, fontSize: 12 }}>
                            {RESET_OPTIONS.map(r => <option key={r.val} value={r.val}>{r.label}</option>)}
                          </select>
                          <button onClick={addChore} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Lägg till</button>
                        </div>
                        {/* Existing chores list with delete */}
                        {chores.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                            {chores.map(c => (
                              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 12 }}>
                                <span>{c.icon}</span> {c.title}
                                <span style={{ color: T.purple, fontWeight: 700 }}>⭐{c.stars}</span>
                                <button onClick={() => setChores(p => p.filter(ch => ch.id !== c.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14, padding: 0 }}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Level */}
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 18, boxShadow: T.shadow }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, marginBottom: 10 }}>NIVÅ</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <span style={{ fontSize: 30 }}>{lv.icon}</span>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: lv.color }}>{lv.label}</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}>{data.totalStars || 0} totalt intjänade ⭐</div>
                          </div>
                        </div>
                        <div style={{ background: T.border, borderRadius: 6, height: 10, overflow: 'hidden', marginBottom: 6 }}>
                          <div style={{ background: `linear-gradient(90deg, ${lv.color}, ${lv.color}aa)`, width: `${getLevelPct(data.totalStars || 0)}%`, height: '100%', borderRadius: 6, transition: 'width 0.5s' }} />
                        </div>
                        {lv.max !== Infinity && (
                          <div style={{ fontSize: 11, color: T.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                            <span>{data.totalStars || 0} ⭐</span>
                            <span>→ {LEVELS[LEVELS.indexOf(lv) + 1]?.label} vid {lv.max + 1}</span>
                          </div>
                        )}
                      </div>

                      {/* Badges */}
                      {earnedBadges.length > 0 && (
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 18, boxShadow: T.shadow }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, marginBottom: 10 }}>MÄRKEN</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {earnedBadges.map(b => (
                              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.purpleLight, borderRadius: T.radiusSm, padding: '7px 12px' }}>
                                <span style={{ fontSize: 18 }}>{b.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: T.purple }}>{b.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inlöst historik */}
                      {(data.redeemedRewards || []).length > 0 && (
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 18, boxShadow: T.shadow }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, marginBottom: 10 }}>INLÖST</div>
                          {[...data.redeemedRewards].reverse().slice(0, 5).map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6 }}>
                              <span>🎁</span>
                              <span style={{ flex: 1, color: T.text }}>{r.title}</span>
                              <span style={{ color: T.red, fontWeight: 600 }}>−{r.cost} ⭐</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ═══════════════ BELÖNINGAR ═══════════════ */}
      {tab === 'belöningar' && (
        <div>
          {confetti && (
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 80 }}>🎉</div>
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} style={{ position: 'absolute', top: `${5 + Math.random() * 88}%`, left: `${5 + Math.random() * 88}%`, fontSize: 22, transform: `rotate(${Math.random() * 360}deg)` }}>
                  {['🌟', '🎊', '💫', '✨', '🎈'][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>
          )}

          {/* Kid balances */}
          {kids.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              {kids.map(kid => {
                const data = kd(kid.id);
                const lv   = getLevel(data.totalStars || 0);
                return (
                  <div key={kid.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: T.radius, background: T.card, border: `1.5px solid ${T.border}`, boxShadow: T.shadow }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: kid.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{kid.initials}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{kid.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>⭐</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: lv.color }}>{data.stars || 0}</span>
                        <span style={{ fontSize: 11, color: T.textMuted }}>stjärnor</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reward cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
            {rewards.map(reward => (
              <div key={reward.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 44, textAlign: 'center', marginBottom: 10 }}>{reward.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, textAlign: 'center', marginBottom: 6 }}>{reward.title}</div>
                {reward.desc && <div style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', marginBottom: 12, lineHeight: 1.5 }}>{reward.desc}</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#FFF7ED', borderRadius: T.radiusSm, padding: '8px', marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>⭐</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#F97316' }}>{reward.cost}</span>
                  <span style={{ fontSize: 12, color: T.textMuted }}>stjärnor</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
                  {kids.map(kid => {
                    const data = kd(kid.id);
                    const can  = (data.stars || 0) >= reward.cost;
                    return (
                      <button key={kid.id} onClick={() => can && redeemReward(kid.id, reward)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', border: 'none', borderRadius: T.radiusSm,
                        background: can ? T.purple : T.border, color: can ? '#fff' : T.textMuted,
                        fontSize: 13, fontWeight: 600, cursor: can ? 'pointer' : 'not-allowed',
                        opacity: can ? 1 : 0.55, transition: 'all 0.15s',
                      }}>
                        <span>{kid.name} löser in</span>
                        <span style={{ fontSize: 11 }}>({data.stars || 0} ⭐)</span>
                      </button>
                    );
                  })}
                  {kids.length === 0 && <div style={{ fontSize: 12, color: T.textMuted, textAlign: 'center' }}>Inga barn</div>}
                </div>
                <button onClick={() => setRewards(p => p.filter(r => r.id !== reward.id))} style={{ marginTop: 10, background: 'none', border: 'none', color: T.textMuted, fontSize: 12, cursor: 'pointer' }}>Ta bort</button>
              </div>
            ))}
          </div>

          {/* Add reward */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>+ Ny belöning</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <input value={newRewardIcon} onChange={e => setNewRewardIcon(e.target.value)} style={{ ...inp, width: 48, textAlign: 'center', fontSize: 18 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 2, minWidth: 160 }}>
                <input value={newReward} onChange={e => setNewReward(e.target.value)} placeholder="Belöningens namn..." style={inp} />
                <input value={newRewardDesc} onChange={e => setNewRewardDesc(e.target.value)} placeholder="Beskrivning (valfri)..." style={inp} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF7ED', borderRadius: T.radiusSm, padding: '8px 12px' }}>
                <span>⭐</span>
                <input type="number" min="1" value={newRewardCost} onChange={e => setNewRewardCost(e.target.value)} style={{ width: 56, border: 'none', background: 'transparent', fontSize: 16, fontWeight: 700, color: '#F97316', outline: 'none' }} />
              </div>
              <button onClick={addReward} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Lägg till</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ AKTIVITETSHJUL ═══════════════ */}
      {tab === 'aktiviteter' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {['Alla', 'Utomhus'].map(opt => {
                const isOD = opt === 'Utomhus';
                return <button key={opt} onClick={() => setOutdoorOnly(isOD)} style={{ background: outdoorOnly === isOD ? T.purple : T.bg, color: outdoorOnly === isOD ? '#fff' : T.textMuted, border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontWeight: outdoorOnly === isOD ? 600 : 400 }}>{opt}</button>;
              })}
            </div>

            <div style={{ position: 'relative', width: 400, height: 400, margin: '0 auto 24px' }}>
              <svg width="400" height="400" viewBox="0 0 400 400" style={{ transform: `rotate(${spinAngle}deg)`, transition: spinning ? 'transform 3.5s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}>
                {filteredActs.length > 0 ? filteredActs.map((act, i) => {
                  const n = filteredActs.length, seg = (2 * Math.PI) / n;
                  const s = i * seg - Math.PI / 2, e2 = s + seg;
                  const cx = 200, cy = 200, r = 188;
                  const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
                  const x2 = cx + r * Math.cos(e2), y2 = cy + r * Math.sin(e2);
                  const mid = s + seg / 2;
                  const tx = cx + r * 0.62 * Math.cos(mid), ty = cy + r * 0.62 * Math.sin(mid);
                  return (
                    <g key={act.id}>
                      <path d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${seg > Math.PI ? 1 : 0},1 ${x2},${y2} Z`} fill={act.color} stroke="#fff" strokeWidth="2.5" />
                      <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={n > 10 ? 10 : 12} fontWeight="700" fill="#fff" style={{ pointerEvents: 'none' }}>
                        {act.label.length > 9 ? act.label.slice(0, 8) + '…' : act.label}
                      </text>
                    </g>
                  );
                }) : <circle cx="200" cy="200" r="188" fill={T.border} />}
                <circle cx="200" cy="200" r="22" fill="#fff" stroke={T.border} strokeWidth="3" />
              </svg>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 30, color: T.purple }}>▼</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button onClick={spinWheel} disabled={spinning || !filteredActs.length} style={{ background: spinning ? T.textMuted : `linear-gradient(135deg, ${T.purple}, #A78BFA)`, color: '#fff', border: 'none', borderRadius: T.radius, padding: '14px 44px', fontSize: 18, fontWeight: 700, cursor: spinning ? 'not-allowed' : 'pointer', boxShadow: spinning ? 'none' : T.shadowMd }}>
                {spinning ? '🌀 Snurrar...' : '🎡 Snurra!'}
              </button>
              {spinResult && !spinning && (
                <div style={{ marginTop: 20, padding: '18px 28px', background: spinResult.color + '22', border: `2px solid ${spinResult.color}`, borderRadius: T.radius, fontSize: 22, fontWeight: 700, color: T.text }}>
                  🎉 {spinResult.label}!
                </div>
              )}
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, alignSelf: 'flex-start' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: T.text }}>Aktiviteter</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input value={newActivity} onChange={e => setNewActivity(e.target.value)} onKeyDown={e => { if (e.key !== 'Enter' || !newActivity.trim()) return; const colors = ['#22C55E','#F97316','#3B82F6','#EC4899','#8B5CF6']; setActivities(p => [...p, { id: 'a_' + Date.now(), label: newActivity.trim(), outdoor: outdoorOnly, color: colors[p.length % colors.length] }]); setNewActivity(''); }} placeholder="Ny aktivitet..." style={{ ...inp, flex: 1 }} />
              <button onClick={() => { if (!newActivity.trim()) return; const colors = ['#22C55E','#F97316','#3B82F6','#EC4899','#8B5CF6']; setActivities(p => [...p, { id: 'a_' + Date.now(), label: newActivity.trim(), outdoor: outdoorOnly, color: colors[p.length % colors.length] }]); setNewActivity(''); }} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activities.map(act => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: T.bg, borderRadius: T.radiusSm, borderLeft: `4px solid ${act.color}` }}>
                  <span style={{ flex: 1, fontSize: 13, color: T.text }}>{act.label}</span>
                  <span style={{ fontSize: 12, color: T.textMuted }}>{act.outdoor ? '🌳' : '🏠'}</span>
                  <button onClick={() => setActivities(p => p.filter(a => a.id !== act.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
