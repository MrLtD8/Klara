import React, { useState, useEffect } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';
import useIcsCalendars from '../../useIcsCalendars';
import { DEFAULT_GCAL, activeCalendars } from '../../gcal';
import {
  Calendar, CheckSquare, Users, Bell, Pill, Wallet, Settings2,
  Wrench, Eye, EyeOff, Plus, Minus, GripVertical,
  ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Mail,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekDays() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isoDate(d) { return d.toISOString().split('T')[0]; }

// Matchar en händelse mot en dag — hanterar veckovis/årlig upprepning, men
// aldrig före startdatumet (samma logik som i Kalender.jsx).
function matchesDay(ev, dayIso) {
  if (!ev.recur || ev.recur === 'none') return ev.date === dayIso;
  const evDate = new Date(ev.date + 'T12:00:00');
  const day = new Date(dayIso + 'T12:00:00');
  if (day < evDate) return false;
  if (ev.recur === 'weekly') return evDate.getDay() === day.getDay();
  if (ev.recur === 'yearly') return evDate.getMonth() === day.getMonth() && evDate.getDate() === day.getDate();
  return ev.date === dayIso;
}

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

const PRIO_COLORS = {
  high: { bg: T.redLight,    text: '#B91C1C' },
  med:  { bg: T.orangeLight, text: T.orangeText },
  low:  { bg: T.greenLight,  text: T.greenText },
};

function Avatar({ member, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: member.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {member.initials}
    </div>
  );
}

function daysUntilDate(iso) {
  if (!iso) return 999;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(iso + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const dayName = now.toLocaleDateString('sv-SE', { weekday: 'long' });
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <div style={{ textAlign: 'right', lineHeight: 1 }}>
      <div style={{ fontFamily: T.fontMono, fontSize: 42, fontWeight: 400, letterSpacing: '-2px', color: T.text, lineHeight: 1 }}>
        {hh}:{mm}
        <span style={{ fontSize: 20, color: T.textHint, letterSpacing: 0 }}>:{ss}</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textHint, textTransform: 'uppercase', letterSpacing: '1.4px', marginTop: 3 }}>
        {cap(dayName)}
      </div>
    </div>
  );
}

// ─── Flow strip (time-of-day) ─────────────────────────────────────────────────
const FLOW_PERIODS = [
  { id: 'morning',   label: 'Morgon',      sub: '06–10', icon: '🌅' },
  { id: 'day',       label: 'Dag',         sub: '10–16', icon: '☀️' },
  { id: 'afternoon', label: 'Eftermidd.',  sub: '16–19', icon: '⛅' },
  { id: 'evening',   label: 'Kväll',       sub: '19–23', icon: '🌙' },
];
function getActivePeriod() {
  const h = new Date().getHours();
  if (h >= 6  && h < 10) return 'morning';
  if (h >= 10 && h < 16) return 'day';
  if (h >= 16 && h < 19) return 'afternoon';
  return 'evening';
}

function FlowStrip() {
  const active = getActivePeriod();
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
      {FLOW_PERIODS.map(p => {
        const isActive = p.id === active;
        return (
          <div key={p.id} style={{
            flex: 1, padding: '7px 4px', borderRadius: 10,
            border: `1.5px solid ${isActive ? T.purple + 'AA' : T.border}`,
            background: isActive ? T.purpleLight : 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}>
            <span style={{ fontSize: 15 }}>{p.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? T.purple : T.textHint }}>{p.label}</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 8, color: isActive ? T.purple : T.textHint }}>{p.sub}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Widget metadata (icons matching sidebar) ─────────────────────────────────
const WIDGET_META = {
  kalender:  { Icon: Calendar,     color: T.purple  },
  uppgifter: { Icon: CheckSquare,  color: '#22C55E' },
  familj:    { Icon: Users,        color: '#3B82F6' },
  pamill:    { Icon: Bell,         color: T.orange  },
  bilhus:    { Icon: Wrench,       color: '#6B7280' },
  medicin:   { Icon: Pill,         color: '#EC4899' },
  ekonomi:   { Icon: Wallet,       color: '#10B981' },
  mail:      { Icon: Mail,         color: '#F59E0B' },
};

// ─── Default widget config (cols = 1-4 in a 4-col grid) ──────────────────────
const DEFAULT_WIDGETS = [
  { id: 'kalender',  label: 'Veckans kalender',       visible: true, cols: 2 },
  { id: 'uppgifter', label: 'Uppgifter',               visible: true, cols: 2 },
  { id: 'familj',    label: 'Familjen',                visible: true, cols: 2 },
  { id: 'pamill',    label: 'Veckans påminnelse',      visible: true, cols: 2 },
  { id: 'bilhus',    label: 'Bil & Hus',               visible: true, cols: 1 },
  { id: 'medicin',   label: 'Medicin',                 visible: true, cols: 1 },
  { id: 'ekonomi',   label: 'Kommande betalningar',    visible: true, cols: 2 },
  { id: 'mail',      label: 'Viktiga mail',            visible: true, cols: 2 },
];

// ─── Kanban Widget (drag-and-drop + single-lane mode) ─────────────────────────
function KanbanWidget({ tasks, setTasks, lanes, getMember, cols }) {
  const [draggingId, setDraggingId] = useState(null);
  const [overLane, setOverLane]     = useState(null);
  const [activeLaneIdx, setActiveLaneIdx] = useState(0);

  function onDragStart(e, taskId) {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }
  function onDragOver(e, laneId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverLane(laneId);
  }
  function onDrop(e, laneId) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (!id) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, lane: laneId } : t));
    setDraggingId(null); setOverLane(null);
  }
  function onDragEnd() { setDraggingId(null); setOverLane(null); }
  function advanceLane(task) {
    const order = ['ready', 'progress', 'done'];
    const next = order[(order.indexOf(task.lane) + 1) % order.length];
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, lane: next } : t));
  }

  function TaskCard({ task, lane }) {
    const prio = PRIO_COLORS[task.prio] || PRIO_COLORS.med;
    const isDragging = draggingId === task.id;
    return (
      <div
        draggable
        onDragStart={e => onDragStart(e, task.id)}
        onDragEnd={onDragEnd}
        style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: T.radiusSm, padding: '8px 10px', marginBottom: 6,
          fontSize: 12, color: T.text, borderLeft: `3px solid ${lane.color}`,
          cursor: 'grab', opacity: isDragging ? 0.35 : 1,
          boxShadow: isDragging ? 'none' : T.shadow,
          transition: 'opacity 0.15s, box-shadow 0.15s', userSelect: 'none',
        }}
      >
        <div style={{ marginBottom: 4, fontWeight: 500, lineHeight: 1.3 }}>{task.title}</div>
        {task.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 5 }}>
            {task.tags.map(tag => (
              <span key={tag} style={{ background: prio.bg, color: prio.text, borderRadius: 4, fontSize: 10, padding: '1px 5px', fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {task.mids?.map(mid => {
              const m = getMember(mid);
              return m ? <Avatar key={mid} member={m} size={18} /> : null;
            })}
          </div>
          <button
            onClick={() => advanceLane(task)}
            title={`Flytta till nästa status`}
            style={{ background: lane.bg, border: 'none', borderRadius: 4, color: lane.color, fontSize: 10, fontWeight: 700, padding: '2px 6px', cursor: 'pointer', lineHeight: 1.4 }}
          >→</button>
        </div>
      </div>
    );
  }

  // ── Single-lane mode (cols === 1) ──────────────────────────────────────────
  if (cols === 1) {
    const lane = lanes[activeLaneIdx];
    const laneTasks = tasks.filter(t => t.lane === lane.id);
    return (
      <div>
        {/* Lane selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <button
            onClick={() => setActiveLaneIdx(i => (i - 1 + 3) % 3)}
            style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center', color: T.textMuted }}
          ><ChevronLeft size={13} /></button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ color: lane.color, fontWeight: 700, fontSize: 13 }}>{lane.label}</span>
            <span style={{ background: lane.bg, color: lane.color, borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 6px', marginLeft: 6 }}>
              {laneTasks.length}
            </span>
          </div>
          <button
            onClick={() => setActiveLaneIdx(i => (i + 1) % 3)}
            style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center', color: T.textMuted }}
          ><ChevronRight size={13} /></button>
        </div>
        {/* Lane dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 10 }}>
          {lanes.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setActiveLaneIdx(i)}
              style={{ width: 6, height: 6, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: i === activeLaneIdx ? lane.color : T.border, transition: 'background 0.2s' }}
            />
          ))}
        </div>
        {/* Drop zone + tasks */}
        <div
          onDragOver={e => onDragOver(e, lane.id)}
          onDragLeave={() => setOverLane(null)}
          onDrop={e => onDrop(e, lane.id)}
          style={{ minHeight: 60, borderRadius: T.radiusSm, background: overLane === lane.id ? lane.bg : 'transparent', border: `2px dashed ${overLane === lane.id ? lane.color : 'transparent'}`, padding: overLane === lane.id ? 4 : 0, transition: 'all 0.15s' }}
        >
          {laneTasks.slice(0, 5).map(task => <TaskCard key={task.id} task={task} lane={lane} />)}
          {laneTasks.length > 5 && <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: '4px 0' }}>+{laneTasks.length - 5} till</div>}
          {laneTasks.length === 0 && <div style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '12px 0' }}>Inga uppgifter här</div>}
        </div>
      </div>
    );
  }

  // ── Multi-lane kanban (cols >= 2) ──────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {lanes.map(lane => {
        const laneTasks = tasks.filter(t => t.lane === lane.id);
        const isOver = overLane === lane.id;
        return (
          <div
            key={lane.id}
            onDragOver={e => onDragOver(e, lane.id)}
            onDragLeave={() => setOverLane(null)}
            onDrop={e => onDrop(e, lane.id)}
            style={{ minHeight: 80, borderRadius: T.radiusSm, background: isOver ? lane.bg : 'transparent', border: `2px dashed ${isOver ? lane.color : 'transparent'}`, padding: isOver ? 4 : 0, transition: 'all 0.15s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: isOver ? '0 4px' : 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: lane.color }}>{lane.label}</span>
              <span style={{ background: lane.bg, color: lane.color, borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 6px' }}>{laneTasks.length}</span>
            </div>
            {laneTasks.slice(0, 4).map(task => <TaskCard key={task.id} task={task} lane={lane} />)}
            {laneTasks.length > 4 && <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: '4px 0' }}>+{laneTasks.length - 4} till</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Medicine checklist helpers ──────────────────────────────────────────────
const MED_TIMES = [
  { id: 'morning', label: 'Morgon', icon: '🌅', color: '#F59E0B', bg: '#FFFBEB', time: '08:00' },
  { id: 'midday',  label: 'Middag', icon: '☀️',  color: '#F97316', bg: '#FFF7ED', time: '12:00' },
  { id: 'evening', label: 'Kväll',  icon: '🌙',  color: '#6366F1', bg: '#EEF2FF', time: '20:00' },
];

function getCurrentPeriod() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'midday';
  return 'evening';
}

function MedicinChecklist({ medicins, setMedicins, medicinToday, setMedicinToday, members }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const takenToday = medicinToday.date === todayStr ? medicinToday.taken : {};
  const currentPeriod = getCurrentPeriod();

  function isTaken(medId, period) {
    return (takenToday[medId] || []).includes(period);
  }

  function toggleTaken(med, period) {
    const currentTaken = medicinToday.date === todayStr ? medicinToday.taken : {};
    const medPeriods = currentTaken[med.id] || [];
    let newPeriods;
    if (medPeriods.includes(period)) {
      // Avmarkera — minska inte lagret, bara ta bort bocken
      newPeriods = medPeriods.filter(p => p !== period);
    } else {
      // Bocka — logga dos och minska lager
      newPeriods = [...medPeriods, period];
      const now = new Date();
      setMedicins(prev => prev.map(m => m.id !== med.id ? m : {
        ...m,
        stock: Math.max(0, m.stock - m.dose),
        lastGiven: now.toISOString(),
        log: [{ time: now.toLocaleString('sv-SE'), period }, ...(m.log || [])].slice(0, 30),
      }));
    }
    setMedicinToday({ date: todayStr, taken: { ...currentTaken, [med.id]: newPeriods } });
  }

  const periodsWithMeds = MED_TIMES.filter(tod => medicins.some(m => m.times?.[tod.id]));

  if (medicins.length === 0) {
    return <div style={{ fontSize: 13, color: T.textMuted }}>Inga mediciner inlagda.</div>;
  }
  if (periodsWithMeds.length === 0) {
    return <div style={{ fontSize: 13, color: T.textMuted }}>Inga tider konfigurerade.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {periodsWithMeds.map(tod => {
        const todMeds = medicins.filter(m => m.times?.[tod.id]);
        const takenCount = todMeds.filter(m => isTaken(m.id, tod.id)).length;
        const allTaken = takenCount === todMeds.length;
        const isCurrent = tod.id === currentPeriod;

        return (
          <div key={tod.id} style={{
            background: isCurrent ? tod.bg : T.bg,
            borderRadius: T.radiusSm,
            border: `1px solid ${isCurrent ? tod.color + '55' : T.border}`,
            padding: '10px 12px',
          }}>
            {/* Period-rubrik */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{tod.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: tod.color }}>{tod.label}</span>
                <span style={{ fontSize: 11, color: T.textMuted }}>{tod.time}</span>
                {isCurrent && (
                  <span style={{ fontSize: 10, background: tod.color, color: '#fff', borderRadius: 999, padding: '1px 6px', fontWeight: 700 }}>Nu</span>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: allTaken ? T.green : T.textMuted }}>
                {allTaken ? '✅ Klart!' : `${takenCount}/${todMeds.length}`}
              </span>
            </div>

            {/* Medicin-rader med kryssrutor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {todMeds.map(med => {
                const taken = isTaken(med.id, tod.id);
                const member = members?.find(m => m.id === med.who);
                return (
                  <button
                    key={med.id}
                    onClick={() => toggleTaken(med, tod.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: taken ? T.greenLight : T.card,
                      border: `1px solid ${taken ? T.green + '55' : T.border}`,
                      borderRadius: T.radiusSm, padding: '7px 10px',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Kryssruta */}
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      background: taken ? T.green : 'transparent',
                      border: `2px solid ${taken ? T.green : T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {taken && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </div>
                    {/* Namn + dos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        color: taken ? T.green : T.text,
                        textDecoration: taken ? 'line-through' : 'none',
                      }}>
                        {med.name}
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>
                        {med.dose} {med.form?.toLowerCase()}{member ? ` · ${member.name}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconColor, iconBg, value, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.cardGlass,
        backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        border: `1px solid ${hov ? iconColor + '66' : T.border}`,
        borderRadius: T.radiusLg, padding: '16px 18px',
        boxShadow: hov ? T.shadowMd : T.shadow,
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 13, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, color: T.text, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: T.textHint, marginTop: 4, whiteSpace: 'nowrap', fontWeight: 500 }}>{label}</div>
      </div>
    </button>
  );
}

// ─── Col adjust controls (reusable) ──────────────────────────────────────────
function ColControls({ editMode, cols, onIncrCols, onDecrCols, onHide }) {
  if (!editMode) return null;
  const btnBase = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer', padding: '3px 7px', display: 'flex', alignItems: 'center', color: T.textMuted };
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      <button onClick={onDecrCols} disabled={cols <= 1} title="Smalare" style={{ ...btnBase, opacity: cols <= 1 ? 0.35 : 1, cursor: cols <= 1 ? 'default' : 'pointer' }}><Minus size={12} /></button>
      <span style={{ fontSize: 11, color: T.textMuted, width: 14, textAlign: 'center', fontWeight: 700 }}>{cols}</span>
      <button onClick={onIncrCols} disabled={cols >= 4} title="Bredare" style={{ ...btnBase, opacity: cols >= 4 ? 0.35 : 1, cursor: cols >= 4 ? 'default' : 'pointer' }}><Plus size={12} /></button>
      <button onClick={onHide} title="Dölj widget" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T.red, display: 'flex' }}><EyeOff size={14} /></button>
    </div>
  );
}

// ─── Widget wrapper ────────────────────────────────────────────────────────────
function Widget({ id, title, onGo, goLabel = 'Visa alla →', children, editMode, onIncrCols, onDecrCols, onHide, cols, onHandleDragStart }) {
  const { Icon, color = T.purple } = WIDGET_META[id] || {};
  return (
    <div style={{
      background: T.cardGlass,
      backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
      border: `1px solid ${T.border}`,
      borderRadius: T.radiusLg,
      padding: 18, boxShadow: T.shadow,
      height: '100%', boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icon && (
            <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={14} color={color} strokeWidth={2} />
            </div>
          )}
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{title}</h2>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {editMode && (
            <span draggable onDragStart={onHandleDragStart} title="Dra för att flytta widgeten" style={{ cursor: 'grab', color: T.textMuted, display: 'flex', alignItems: 'center', padding: '0 2px' }}>
              <GripVertical size={16} />
            </span>
          )}
          <ColControls editMode={editMode} cols={cols} onIncrCols={onIncrCols} onDecrCols={onDecrCols} onHide={onHide} />
          {onGo && (
            <button onClick={onGo} style={{ background: 'none', border: 'none', color: T.purple, fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              {goLabel} <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Hem ──────────────────────────────────────────────────────────────────────
export default function Hem({ members, tasks, setTasks, events, onNavigate, guestMode = false, familyName = '' }) {
  const [carItems]   = useLocalStorage('kl_car',    []);
  const [houseItems] = useLocalStorage('kl_house',  []);
  const [medicins, setMedicins]   = useLocalStorage('kl_medicin',[]);
  const [medicinToday, setMedicinToday] = useLocalStorage('kl_medicin_today', { date: '', taken: {} });
  const [budget]     = useLocalStorage('kl_budget', []);
  const [calEvents]  = useLocalStorage('kl_cal_events', []);   // riktiga kalendern (delas med grå designen)
  const [gcalSettings] = useLocalStorage('kl_gcal', DEFAULT_GCAL);
  const { events: gcalEvents } = useIcsCalendars(activeCalendars(gcalSettings));
  const allEvents = [...calEvents, ...gcalEvents];
  const [widgets, setWidgets] = useLocalStorage('kl_hem_widgets', DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);

  // Nya default-widgets ska dyka upp även för användare med sparad layout
  useEffect(() => {
    const missing = DEFAULT_WIDGETS.filter(d => !widgets.some(w => w.id === d.id));
    if (missing.length) setWidgets(prev => [...prev, ...missing.filter(d => !prev.some(w => w.id === d.id))]);
  }, [widgets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mail-digest från servern (AI-sorterade viktiga mail)
  const [mailDigest, setMailDigest] = useState(null);
  const [mailChecking, setMailChecking] = useState(false);
  const [mailError, setMailError] = useState('');

  const loadMailDigest = () => {
    fetch('/api/mail/digest').then(r => r.json()).then(setMailDigest).catch(() => {});
  };

  useEffect(() => {
    loadMailDigest();
    const iv = setInterval(loadMailDigest, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  async function checkMailNow() {
    setMailChecking(true);
    setMailError('');
    try {
      const res = await fetch('/api/mail/check', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMailDigest(data);
    } catch (e) {
      setMailError(e.message);
    }
    setMailChecking(false);
  }

  const today    = new Date();
  const todayIso = isoDate(today);
  const weekDays = getWeekDays();
  const weekIsos = weekDays.map(isoDate);

  // Alla händelse-tillfällen denna vecka (expanderar upprepningar per dag), sorterade
  const weekOccurrences = [];
  weekDays.forEach(day => {
    const iso = isoDate(day);
    allEvents.forEach(ev => { if (matchesDay(ev, iso)) weekOccurrences.push({ ev, iso }); });
  });
  weekOccurrences.sort((a, b) => a.iso.localeCompare(b.iso));
  const eventsThisWeek = weekOccurrences;
  const tasksTodo      = tasks.filter(t => t.lane === 'ready');
  const activeMembers  = members.length;

  const greeting = (() => {
    const h = today.getHours();
    if (h < 10) return 'God morgon';
    if (h < 18) return 'God dag';
    return 'God kväll';
  })();

  const lanes = [
    { id: 'ready',    label: 'Att göra', color: T.purple,  bg: T.purpleLight },
    { id: 'progress', label: 'Pågår',    color: T.orange,  bg: T.orangeLight },
    { id: 'done',     label: 'Klart',    color: T.green,   bg: T.greenLight  },
  ];

  function getMember(id) { return members.find(m => m.id === id); }

  function updateWidget(id, patch) {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
  }

  // ── Dra-och-släpp för att flytta runt widgets (via draghandtaget) ──
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  function onWidgetDragStart(e, id) {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }
  function onWidgetDragOver(e, id) {
    if (!editMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== overId) setOverId(id);
  }
  function onWidgetDrop(e, targetId) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    setOverId(null); setDragId(null);
    if (!id || id === targetId) return;
    setWidgets(prev => {
      // migrera ev. gammalt 'size' → 'cols' så inget tappas vid omordning
      const arr = prev.map(w => (w.cols !== undefined ? w : { ...w, cols: ({ full: 4, half: 2, third: 1 }[w.size] || 2) }));
      const from = arr.findIndex(w => w.id === id);
      const to   = arr.findIndex(w => w.id === targetId);
      if (from === -1 || to === -1) return prev;
      const copy = [...arr];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }
  function onWidgetDragEnd() { setDragId(null); setOverId(null); }

  // Migrate old 'size' field to 'cols'
  const migratedWidgets = widgets.map(w => {
    if (w.cols !== undefined) return w;
    const colsMap = { full: 4, half: 2, third: 1 };
    return { ...w, cols: colsMap[w.size] || 2 };
  });

  const visibleWidgets = migratedWidgets.filter(w => w.visible);
  const hiddenWidgets  = migratedWidgets.filter(w => !w.visible);

  function wProps(w) {
    return {
      id: w.id,
      editMode,
      cols: w.cols,
      onIncrCols: () => updateWidget(w.id, { cols: Math.min(4, w.cols + 1) }),
      onDecrCols: () => updateWidget(w.id, { cols: Math.max(1, w.cols - 1) }),
      onHide:     () => updateWidget(w.id, { visible: false }),
      onHandleDragStart: e => onWidgetDragStart(e, w.id),
    };
  }

  function renderWidgets() {
    return visibleWidgets.map(w => {
      const colSpan = Math.min(w.cols, 4);

      switch (w.id) {

        // ── Kalender ──────────────────────────────────────────────────────────
        case 'kalender': return (
          <div
            key={w.id}
            onDragOver={editMode ? e => onWidgetDragOver(e, w.id) : undefined}
            onDrop={editMode ? e => onWidgetDrop(e, w.id) : undefined}
            style={{
              gridColumn: `span ${colSpan}`,
              opacity: dragId === w.id ? 0.4 : 1,
              outline: (overId === w.id && dragId && dragId !== w.id) ? `2px dashed ${T.purple}` : 'none',
              outlineOffset: 3, borderRadius: T.radiusLg, transition: 'opacity 0.15s',
            }}
          >
            <Widget title="Veckans kalender" onGo={() => onNavigate('kalender')} {...wProps(w)}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {weekDays.map((day, i) => {
                  const iso = isoDate(day);
                  const isToday = iso === todayIso;
                  const dayEvents = allEvents.filter(e => matchesDay(e, iso));
                  return (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>{DAY_LABELS[i]}</div>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: isToday ? T.purple : 'transparent', color: isToday ? '#fff' : T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: isToday ? 700 : 500, margin: '0 auto 6px' }}>
                        {day.getDate()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dayEvents.slice(0, 2).map(ev => (
                          <div key={ev.id} style={{ background: ev.color || T.purple, borderRadius: 4, height: 4 }} title={ev.title} />
                        ))}
                        {dayEvents.length > 2 && <div style={{ fontSize: 10, color: T.textMuted }}>+{dayEvents.length - 2}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {eventsThisWeek.filter(o => o.iso >= todayIso).length > 0 && (
                <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8, fontWeight: 600 }}>Kommande händelser</div>
                  {eventsThisWeek.filter(o => o.iso >= todayIso).slice(0, 3).map(({ ev, iso }) => (
                    <div key={ev.id + iso} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color || T.purple, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: T.text, flex: 1 }}>{ev.title}</span>
                      <span style={{ fontSize: 11, color: T.textMuted }}>
                        {new Date(iso + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={() => onNavigate('kalender')}
                    style={{ marginTop: 6, width: '100%', padding: '8px', background: T.purpleLight, border: 'none', borderRadius: T.radiusSm, color: T.purple, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >+ Lägg till händelse</button>
                </div>
              )}
            </Widget>
          </div>
        );

        // ── Uppgifter ─────────────────────────────────────────────────────────
        case 'uppgifter': return (
          <div
            key={w.id}
            onDragOver={editMode ? e => onWidgetDragOver(e, w.id) : undefined}
            onDrop={editMode ? e => onWidgetDrop(e, w.id) : undefined}
            style={{
              gridColumn: `span ${colSpan}`,
              opacity: dragId === w.id ? 0.4 : 1,
              outline: (overId === w.id && dragId && dragId !== w.id) ? `2px dashed ${T.purple}` : 'none',
              outlineOffset: 3, borderRadius: T.radiusLg, transition: 'opacity 0.15s',
            }}
          >
            <Widget title="Uppgifter" onGo={() => onNavigate('uppgifter')} {...wProps(w)}>
              <KanbanWidget tasks={tasks} setTasks={setTasks} lanes={lanes} getMember={getMember} cols={w.cols} />
              <button
                onClick={() => onNavigate('uppgifter')}
                style={{ marginTop: 10, width: '100%', padding: '8px', background: T.purpleLight, border: 'none', borderRadius: T.radiusSm, color: T.purple, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >+ Ny uppgift</button>
            </Widget>
          </div>
        );

        // ── Familj ────────────────────────────────────────────────────────────
        case 'familj': return (
          <div
            key={w.id}
            onDragOver={editMode ? e => onWidgetDragOver(e, w.id) : undefined}
            onDrop={editMode ? e => onWidgetDrop(e, w.id) : undefined}
            style={{
              gridColumn: `span ${colSpan}`,
              opacity: dragId === w.id ? 0.4 : 1,
              outline: (overId === w.id && dragId && dragId !== w.id) ? `2px dashed ${T.purple}` : 'none',
              outlineOffset: 3, borderRadius: T.radiusLg, transition: 'opacity 0.15s',
            }}
          >
            <Widget title="Familjen" onGo={() => onNavigate('familj')} goLabel="Hantera →" {...wProps(w)}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {members.map(m => {
                  const memberTasks  = tasks.filter(t => t.mids.includes(m.id) && t.lane !== 'done');
                  const memberEvents = allEvents.filter(e => e.who && e.who.toLowerCase().includes(m.name.toLowerCase()) && weekIsos.some(iso => matchesDay(e, iso)));
                  return (
                    <div key={m.id} style={{ textAlign: 'center', minWidth: 70 }}>
                      <div
                        onClick={() => onNavigate('familj')}
                        style={{ width: 52, height: 52, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, margin: '0 auto 6px', boxShadow: `0 4px 12px ${m.color}44`, cursor: 'pointer' }}
                      >{m.initials}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{m.role}</div>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
                        {memberTasks.length > 0 && (
                          <span style={{ fontSize: 10, background: T.purpleLight, color: T.purple, borderRadius: 999, padding: '2px 6px', fontWeight: 600 }}>{memberTasks.length} uppg.</span>
                        )}
                        {memberEvents.length > 0 && (
                          <span style={{ fontSize: 10, background: T.blueLight, color: T.blue, borderRadius: 999, padding: '2px 6px', fontWeight: 600 }}>{memberEvents.length} ev.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Widget>
          </div>
        );

        // ── Påminnelse-quote ──────────────────────────────────────────────────
        case 'pamill': return (
          <div
            key={w.id}
            onDragOver={editMode ? e => onWidgetDragOver(e, w.id) : undefined}
            onDrop={editMode ? e => onWidgetDrop(e, w.id) : undefined}
            style={{
              gridColumn: `span ${colSpan}`,
              opacity: dragId === w.id ? 0.4 : 1,
              outline: (overId === w.id && dragId && dragId !== w.id) ? `2px dashed ${T.purple}` : 'none',
              outlineOffset: 3, borderRadius: T.radiusLg, transition: 'opacity 0.15s',
            }}
          >
            <div style={{
              background: `linear-gradient(135deg, ${T.purple}14 0%, ${T.purpleLight} 100%)`,
              backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
              border: `1px solid ${T.purple}33`,
              borderRadius: T.radiusLg, padding: 22, boxShadow: T.shadow,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              position: 'relative', overflow: 'hidden', minHeight: 140, height: '100%', boxSizing: 'border-box',
            }}>
              {/* Edit controls */}
              {editMode && (
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span draggable onDragStart={e => onWidgetDragStart(e, w.id)} title="Dra för att flytta widgeten" style={{ cursor: 'grab', color: T.textMuted, display: 'flex', alignItems: 'center' }}>
                    <GripVertical size={16} />
                  </span>
                  <ColControls
                    editMode={editMode}
                    cols={w.cols}
                    onIncrCols={() => updateWidget(w.id, { cols: Math.min(4, w.cols + 1) })}
                    onDecrCols={() => updateWidget(w.id, { cols: Math.max(1, w.cols - 1) })}
                    onHide={() => updateWidget(w.id, { visible: false })}
                  />
                </div>
              )}
              <div style={{ position: 'absolute', right: 20, top: 14, fontSize: 56, opacity: 0.12, lineHeight: 1 }}>🌸</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Veckans påminnelse
              </div>
              <p style={{ margin: 0, fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 600, fontStyle: 'italic', color: T.text, lineHeight: 1.5 }}>
                "Små stunder tillsammans skapar de största minnena."
              </p>
              <div style={{ marginTop: 12, fontSize: 13, color: T.purple, fontWeight: 500 }}>🌸 Ha en fin vecka!</div>
            </div>
          </div>
        );

        // ── Viktiga mail (AI-sorterade från servern) ──────────────────────────
        case 'mail': return (
          <div
            key={w.id}
            onDragOver={editMode ? e => onWidgetDragOver(e, w.id) : undefined}
            onDrop={editMode ? e => onWidgetDrop(e, w.id) : undefined}
            style={{
              gridColumn: `span ${colSpan}`,
              opacity: dragId === w.id ? 0.4 : 1,
              outline: (overId === w.id && dragId && dragId !== w.id) ? `2px dashed ${T.purple}` : 'none',
              outlineOffset: 3, borderRadius: T.radiusLg, transition: 'opacity 0.15s',
            }}
          >
            <Widget title="Viktiga mail" {...wProps(w)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>
                  {mailDigest?.time
                    ? `Uppdaterad ${new Date(mailDigest.time).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${mailDigest.scanned || 0} skannade`
                    : 'Ingen skanning gjord ännu'}
                </span>
                <button onClick={checkMailNow} disabled={mailChecking}
                  style={{ padding: '4px 12px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: 'transparent', color: T.purple, fontSize: 11, fontWeight: 600, cursor: mailChecking ? 'wait' : 'pointer' }}>
                  {mailChecking ? 'Hämtar…' : 'Uppdatera'}
                </button>
              </div>
              {mailError && (
                <div style={{ padding: '8px 12px', borderRadius: T.radiusSm, background: '#FEE2E2', color: '#B91C1C', fontSize: 12, marginBottom: 8 }}>{mailError}</div>
              )}
              {(!mailDigest?.items || mailDigest.items.length === 0) && !mailError ? (
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>
                  Inga viktiga mail just nu. Mailkonton ställs in i addonets konfiguration (mail_accounts).
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(mailDigest?.items || []).map(m => (
                    <div key={m.id} style={{ padding: '10px 12px', borderRadius: T.radiusSm, background: T.bg, border: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</span>
                        <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>
                          {m.date ? new Date(m.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: m.summary ? 4 : 0 }}>
                        {m.from}
                        <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 999, background: T.purpleLight, color: T.purple, fontSize: 9, fontWeight: 700 }}>{m.account}</span>
                      </div>
                      {m.summary && <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{m.summary}</div>}
                      {m.action && (
                        <div style={{ marginTop: 5, fontSize: 11, fontWeight: 600, color: '#B45309', background: '#FEF3C7', borderRadius: T.radiusSm, padding: '3px 8px', display: 'inline-block' }}>
                          → {m.action}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Widget>
          </div>
        );

        // ── Bil & Hus ─────────────────────────────────────────────────────────
        case 'bilhus': return (
          <div
            key={w.id}
            onDragOver={editMode ? e => onWidgetDragOver(e, w.id) : undefined}
            onDrop={editMode ? e => onWidgetDrop(e, w.id) : undefined}
            style={{
              gridColumn: `span ${colSpan}`,
              opacity: dragId === w.id ? 0.4 : 1,
              outline: (overId === w.id && dragId && dragId !== w.id) ? `2px dashed ${T.purple}` : 'none',
              outlineOffset: 3, borderRadius: T.radiusLg, transition: 'opacity 0.15s',
            }}
          >
            <Widget title="Bil & Hus" onGo={() => onNavigate('bilhus')} goLabel="Visa →" {...wProps(w)}>
              {[
                ...carItems.filter(c => !c.done && daysUntilDate(c.due) <= 30).map(c => ({ ...c, _type: 'car' })),
                ...houseItems.filter(h => {
                  if (!h.lastDone) return false;
                  const m2 = { monthly:1, yearly:12, every2y:24, every5y:60 }[h.interval] || 12;
                  const next = new Date(h.lastDone + 'T00:00:00');
                  next.setMonth(next.getMonth() + m2);
                  return Math.round((next - new Date()) / 86400000) <= 30;
                }).map(h => ({ ...h, _type: 'house' }))
              ].slice(0, 3).map((item, i) => {
                const days = item.due ? daysUntilDate(item.due) : 0;
                const color = days <= 14 ? T.red : T.orange;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: T.bg, borderRadius: T.radiusSm, borderLeft: `3px solid ${color}` }}>
                    <span style={{ fontSize: 12, flex: 1, color: T.text }}>{item.title}</span>
                    <span style={{ fontSize: 11, color, fontWeight: 600 }}>{item.car || item.category || ''}</span>
                  </div>
                );
              })}
              {carItems.filter(c => !c.done && daysUntilDate(c.due) <= 30).length === 0 && houseItems.length === 0 && (
                <div style={{ fontSize: 13, color: T.textMuted }}>Inga akuta påminnelser 🎉</div>
              )}
            </Widget>
          </div>
        );

        // ── Medicin ───────────────────────────────────────────────────────────
        case 'medicin': return (
          <div
            key={w.id}
            onDragOver={editMode ? e => onWidgetDragOver(e, w.id) : undefined}
            onDrop={editMode ? e => onWidgetDrop(e, w.id) : undefined}
            style={{
              gridColumn: `span ${colSpan}`,
              opacity: dragId === w.id ? 0.4 : 1,
              outline: (overId === w.id && dragId && dragId !== w.id) ? `2px dashed ${T.purple}` : 'none',
              outlineOffset: 3, borderRadius: T.radiusLg, transition: 'opacity 0.15s',
            }}
          >
            <Widget title="Medicin idag" onGo={() => onNavigate('medicin')} goLabel="Hantera →" {...wProps(w)}>
              {guestMode ? (
                <div style={{ fontSize: 13, color: T.textMuted }}>🔒 Dold i gästläge</div>
              ) : (
                <MedicinChecklist
                  medicins={medicins}
                  setMedicins={setMedicins}
                  medicinToday={medicinToday}
                  setMedicinToday={setMedicinToday}
                  members={members}
                />
              )}
            </Widget>
          </div>
        );

        // ── Ekonomi ───────────────────────────────────────────────────────────
        case 'ekonomi': return (
          <div
            key={w.id}
            onDragOver={editMode ? e => onWidgetDragOver(e, w.id) : undefined}
            onDrop={editMode ? e => onWidgetDrop(e, w.id) : undefined}
            style={{
              gridColumn: `span ${colSpan}`,
              opacity: dragId === w.id ? 0.4 : 1,
              outline: (overId === w.id && dragId && dragId !== w.id) ? `2px dashed ${T.purple}` : 'none',
              outlineOffset: 3, borderRadius: T.radiusLg, transition: 'opacity 0.15s',
            }}
          >
            <Widget title="Kommande betalningar" onGo={() => onNavigate('ekonomi')} goLabel="Visa →" {...wProps(w)}>
              {guestMode ? (
                <div style={{ fontSize: 13, color: T.textMuted }}>🔒 Dold i gästläge</div>
              ) : budget.filter(e => e.date > todayIso).length === 0 ? (
                <div style={{ fontSize: 13, color: T.textMuted }}>Inga kommande betalningar</div>
              ) : (
                budget.filter(e => e.date > todayIso).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 3).map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: T.bg, borderRadius: T.radiusSm }}>
                    <span style={{ fontSize: 12, flex: 1, color: T.text }}>{item.title}</span>
                    <span style={{ fontSize: 11, color: item.type === 'income' ? T.green : T.red, fontWeight: 600 }}>
                      {item.type === 'income' ? '+' : '-'}{item.amount?.toLocaleString('sv-SE')} kr
                    </span>
                  </div>
                ))
              )}
            </Widget>
          </div>
        );

        default: return null;
      }
    });
  }

  return (
    <div style={{
      padding: '28px 36px', maxWidth: 1400,
      background: `linear-gradient(160deg, ${T.purple}10 0%, ${T.bg} 30%, ${T.bgWarm})`,
      minHeight: '100vh',
    }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>

        {/* Greeting */}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            {greeting}, <span style={{ color: T.purple }}>{familyName || 'familjen'}!</span> 👋
          </h1>
          <p style={{ margin: '3px 0 0', color: T.textMuted, fontSize: 13, fontWeight: 500 }}>
            {today.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Member avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', background: T.cardGlass, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${T.border}`, borderRadius: 999, boxShadow: T.shadowSm }}>
          {members.map((m, i) => (
            <div key={m.id} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: m.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, border: '2px solid #fff',
              boxShadow: i === 0 ? `0 0 0 2px ${T.purple}` : 'none',
              cursor: 'pointer',
            }}
              onClick={() => onNavigate('familj')}
              title={m.name}
            >
              {m.initials}
            </div>
          ))}
        </div>

        {/* Live clock */}
        <LiveClock />

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setEditMode(e => !e)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: editMode ? T.purple : T.cardGlass,
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              color: editMode ? '#fff' : T.textMuted,
              border: `1px solid ${editMode ? T.purple : T.border}`,
              borderRadius: T.radiusSm, padding: '9px 14px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Settings2 size={15} />
            {editMode ? 'Klar' : 'Anpassa'}
          </button>
        </div>
      </div>

      {/* ── Aktivt flöde ─────────────────────────────────────────────── */}
      <FlowStrip />

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22, marginTop: 14 }}>
        <StatCard
          icon={Calendar} iconColor={T.purple} iconBg={T.purpleLight}
          value={eventsThisWeek.length} label="Händelser denna vecka"
          onClick={() => onNavigate('kalender')}
        />
        <StatCard
          icon={CheckSquare} iconColor={T.green} iconBg={T.greenLight}
          value={tasksTodo.length} label="Uppgifter att göra"
          onClick={() => onNavigate('uppgifter')}
        />
        <StatCard
          icon={ShoppingCart} iconColor="#F97316" iconBg={T.orangeLight}
          value={budget.filter(b => b.type === 'expense' && b.date >= todayIso).length || 0}
          label="Kommande utgifter"
          onClick={() => onNavigate('ekonomi')}
        />
        <StatCard
          icon={Users} iconColor={T.blue} iconBg={T.blueLight}
          value={`${activeMembers}/${members.length}`} label="Familjemedlemmar aktiva"
          onClick={() => onNavigate('familj')}
        />
      </div>

      {/* ── Widget grid (4-column) ───────────────────────────────────────── */}
      {editMode && (
        <div style={{ marginBottom: 12, padding: '10px 16px', background: T.purpleLight, borderRadius: T.radiusSm, border: `1px solid ${T.purple}33`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings2 size={14} color={T.purple} />
          <span style={{ fontSize: 13, color: T.purple, fontWeight: 600 }}>Anpassningsläge — dra i handtaget ⠿ för att flytta widgets, och +/− för att ändra bredd (1–4 kolumner)</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 20 }}>
        {renderWidgets()}
      </div>

      {/* ── Edit mode: hidden widgets + reset ───────────────────────────── */}
      {editMode && (
        <div style={{ marginTop: 12, padding: 20, background: T.cardGlass, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px dashed ${T.borderMid}`, borderRadius: T.radiusLg }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, marginBottom: 14 }}>Dolda widgets</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {hiddenWidgets.map(w => (
              <button
                key={w.id}
                onClick={() => updateWidget(w.id, { visible: true })}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '7px 14px', fontSize: 13, color: T.textMuted, cursor: 'pointer' }}
              >
                <Eye size={13} /> {w.label}
              </button>
            ))}
            {hiddenWidgets.length === 0 && <span style={{ fontSize: 13, color: T.textMuted }}>Alla widgets visas</span>}
          </div>
          <button
            onClick={() => setWidgets(DEFAULT_WIDGETS)}
            style={{ marginTop: 14, background: 'none', border: 'none', color: T.red, fontSize: 12, cursor: 'pointer', padding: 0 }}
          >
            Återställ standardlayout
          </button>
        </div>
      )}

    </div>
  );
}
