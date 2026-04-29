import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const LANES = [
  { id: 'ready',    label: 'Att göra', color: T.purple, bg: T.purpleLight },
  { id: 'progress', label: 'Pågår',    color: T.orange, bg: T.orangeLight },
  { id: 'done',     label: 'Klart',    color: T.green,  bg: T.greenLight  },
];

const PRIO_META = {
  urgent: { label: 'Akut', color: '#C62828', bg: '#FDEAEA', icon: '🔴' },
  high:   { label: 'Hög',  color: '#B8722A', bg: '#FDF0E0', icon: '🟠' },
  med:    { label: 'Med',  color: '#2A5FA8', bg: '#E8F0FD', icon: '🔵' },
  low:    { label: 'Låg',  color: '#3A7A52', bg: '#E8F5EE', icon: '🟢' },
};

const TAG_COLORS = {
  Hem:    { bg: '#F0F0F0', text: '#555' },
  Sport:  { bg: '#E8F5EE', text: '#3A7A52' },
  Skola:  { bg: '#F0EBFD', text: '#6B4EA8' },
  Mat:    { bg: '#FDF0E0', text: '#B8722A' },
  Hälsa:  { bg: '#FDF0FB', text: '#9B4EA8' },
  Fritid: { bg: '#FDEAEA', text: '#A84040' },
  Jobb:   { bg: '#E8F0FD', text: '#2A5FA8' },
  Övrigt: { bg: '#F5F5F5', text: '#777' },
};
const ALL_TAGS = Object.keys(TAG_COLORS);
const ESTIMATE_OPTIONS = ['', '30 min', '2h', 'Halvdag', 'Heldag'];

const defaultMembersLocal = [
  { id: 'm1', name: 'Alex', role: 'Förälder', color: '#7C5CBF', initials: 'A' },
  { id: 'm2', name: 'Sara', role: 'Förälder', color: '#F97316', initials: 'S' },
  { id: 'm3', name: 'Ella', role: '12 år',    color: '#22C55E', initials: 'E' },
  { id: 'm4', name: 'Noah', role: '9 år',     color: '#3B82F6', initials: 'N' },
];

const defaultTasksLocal = [
  { id: 't1', title: 'Boka läkarbesök till Ella',  lane: 'ready',    mids: ['m2'], tags: ['Hälsa'],  prio: 'high', estimate: '2h',      deadline: '', subtasks: [], epic: '' },
  { id: 't2', title: 'Planera sommarlov',           lane: 'ready',    mids: ['m1'], tags: ['Fritid'], prio: 'med',  estimate: 'Halvdag', deadline: '', subtasks: [], epic: '' },
  { id: 't3', title: 'Handla inför helgen',         lane: 'ready',    mids: ['m1'], tags: ['Hem'],    prio: 'low',  estimate: '2h',      deadline: '', subtasks: [], epic: '' },
  { id: 't4', title: 'Lämna in SO-läxa',            lane: 'ready',    mids: ['m3'], tags: ['Skola'],  prio: 'high', estimate: '30 min',  deadline: '', subtasks: [], epic: '' },
  { id: 't5', title: 'Planera fotbollscup',         lane: 'progress', mids: ['m4'], tags: ['Sport'],  prio: 'med',  estimate: 'Halvdag', deadline: '', subtasks: [], epic: '' },
  { id: 't6', title: 'Betala räkningar',            lane: 'done',     mids: ['m1'], tags: ['Hem'],    prio: 'high', estimate: '30 min',  deadline: '', subtasks: [], epic: '' },
  { id: 't7', title: 'Boka tandläkare',             lane: 'done',     mids: ['m2'], tags: ['Hälsa'],  prio: 'med',  estimate: '30 min',  deadline: '', subtasks: [], epic: '' },
];

function Avatar({ member, size = 26 }) {
  return (
    <div title={member.name} style={{
      width: size, height: size, borderRadius: '50%',
      background: member.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      border: '2px solid #fff',
    }}>
      {member.initials}
    </div>
  );
}

function SubtaskProgress({ subtasks }) {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter(s => s.done).length;
  const pct = Math.round((done / subtasks.length) * 100);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, marginBottom: 3 }}>
        <span>Deluppgifter</span><span>{done}/{subtasks.length}</span>
      </div>
      <div style={{ background: T.border, borderRadius: 4, height: 4, overflow: 'hidden' }}>
        <div style={{ background: T.green, width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

const miniInputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: 6,
  padding: '7px 10px', fontSize: 13, color: T.text,
  outline: 'none', background: T.bg, display: 'block', marginBottom: 8,
};

export default function Uppgifter({ members: membersProp, tasks: tasksProp, setTasks: setTasksProp }) {
  const [tasksLocal, setTasksLocal] = useLocalStorage('kl_tasks', defaultTasksLocal);
  const [membersLocal] = useLocalStorage('kl_members', defaultMembersLocal);

  const tasks = tasksProp !== undefined ? tasksProp : tasksLocal;
  const setTasks = setTasksProp !== undefined ? setTasksProp : setTasksLocal;
  const members = membersProp !== undefined ? membersProp : membersLocal;

  const [draggingId, setDraggingId] = useState(null);
  const [dragOverLane, setDragOverLane] = useState(null);
  const [showForm, setShowForm] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filterMember, setFilterMember] = useState('');

  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fTags, setFTags] = useState(['Övrigt']);
  const [fMids, setFMids] = useState([]);
  const [fPrio, setFPrio] = useState('med');
  const [fEstimate, setFEstimate] = useState('');
  const [fDeadline, setFDeadline] = useState('');
  const [fSubtasks, setFSubtasks] = useState([]);
  const [fSubInput, setFSubInput] = useState('');
  const [fEpic, setFEpic] = useState('');
  const [fLane, setFLane] = useState('ready');

  function getMember(id) { return members.find(m => m.id === id); }

  function onDragStart(e, taskId) {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }

  function onDragOver(e, laneId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverLane(laneId);
  }

  function onDrop(e, laneId) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (!id) return;
    const laneCount = tasks.filter(t => t.lane === laneId && t.id !== id).length;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, lane: laneId, order: laneCount } : t));
    setDraggingId(null);
    setDragOverLane(null);
  }

  function onDragEnd() {
    setDraggingId(null);
    setDragOverLane(null);
  }

  function openForm(laneId) {
    setFLane(laneId);
    setFTitle(''); setFDesc(''); setFTags(['Övrigt']); setFMids([]);
    setFPrio('med'); setFEstimate(''); setFDeadline('');
    setFSubtasks([]); setFSubInput(''); setFEpic('');
    setShowForm(laneId);
  }

  function toggleTag(tag) {
    setFTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function toggleMember(mid) {
    setFMids(prev => prev.includes(mid) ? prev.filter(m => m !== mid) : [...prev, mid]);
  }

  function addSubtask() {
    if (!fSubInput.trim()) return;
    setFSubtasks(prev => [...prev, { id: 'sub_' + Date.now(), title: fSubInput.trim(), done: false }]);
    setFSubInput('');
  }

  function removeSubtask(id) {
    setFSubtasks(prev => prev.filter(s => s.id !== id));
  }

  function addTask() {
    if (!fTitle.trim()) return;
    const laneCount = tasks.filter(t => t.lane === fLane).length;
    const newTask = {
      id: 't_' + Date.now(),
      title: fTitle.trim(),
      desc: fDesc.trim(),
      lane: fLane,
      mids: fMids,
      tags: fTags.length ? fTags : ['Övrigt'],
      prio: fPrio,
      estimate: fEstimate,
      deadline: fDeadline,
      subtasks: fSubtasks,
      epic: fEpic.trim(),
      order: laneCount,
    };
    setTasks(prev => [...prev, newTask]);
    setShowForm(null);
  }

  function removeTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function toggleSubtask(taskId, subId) {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: (t.subtasks || []).map(s => s.id === subId ? { ...s, done: !s.done } : s) };
    }));
  }

  const today = new Date().toISOString().split('T')[0];
  const filteredTasks = filterMember ? tasks.filter(t => (t.mids || []).includes(filterMember)) : tasks;

  function getEpicGroups(laneTasks) {
    const epics = {};
    laneTasks.forEach(t => {
      const epic = t.epic || '';
      if (!epics[epic]) epics[epic] = [];
      epics[epic].push(t);
    });
    return epics;
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>✅ Uppgifter</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Dra och släpp för att flytta uppgifter</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: T.textMuted }}>Filtrera:</span>
          <button onClick={() => setFilterMember('')} style={{
            background: !filterMember ? T.purple : T.bg, color: !filterMember ? '#fff' : T.textMuted,
            border: `1px solid ${T.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
          }}>Alla</button>
          {members.map(m => (
            <button key={m.id} onClick={() => setFilterMember(filterMember === m.id ? '' : m.id)} style={{
              background: filterMember === m.id ? m.color + '22' : T.bg,
              color: filterMember === m.id ? m.color : T.textMuted,
              border: `1.5px solid ${filterMember === m.id ? m.color : T.border}`,
              borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{m.initials}</div>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {LANES.map(lane => {
          const laneTasks = filteredTasks.filter(t => t.lane === lane.id);
          const isDragTarget = dragOverLane === lane.id;
          const epicGroups = getEpicGroups(laneTasks);

          return (
            <div
              key={lane.id}
              onDragOver={e => onDragOver(e, lane.id)}
              onDrop={e => onDrop(e, lane.id)}
              onDragLeave={() => setDragOverLane(null)}
              style={{
                background: isDragTarget ? lane.bg : T.card,
                border: `1.5px solid ${isDragTarget ? lane.color : T.border}`,
                borderRadius: T.radius, padding: 16, minHeight: 400,
                transition: 'border-color 0.15s, background 0.15s', boxShadow: T.shadow,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: lane.color }}>{lane.label}</span>
                <span style={{ background: lane.bg, color: lane.color, borderRadius: 999, fontSize: 12, fontWeight: 700, padding: '2px 9px' }}>
                  {laneTasks.length}
                </span>
              </div>

              {Object.entries(epicGroups).map(([epic, epicTasks]) => (
                <div key={epic}>
                  {epic && (
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase',
                      letterSpacing: 0.8, marginBottom: 6, paddingBottom: 4,
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      {epic}
                    </div>
                  )}
                  {epicTasks.map(task => {
                    const prio = PRIO_META[task.prio] || PRIO_META.med;
                    const isDragging = draggingId === task.id;
                    const isExpanded = expandedId === task.id;
                    const isOverdue = task.deadline && task.deadline < today;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={e => onDragStart(e, task.id)}
                        onDragEnd={onDragEnd}
                        style={{
                          background: isDragging ? lane.bg : T.bg,
                          border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                          padding: '12px 14px', marginBottom: 10,
                          cursor: 'grab', opacity: isDragging ? 0.5 : 1,
                          boxShadow: isDragging ? T.shadowMd : 'none',
                          borderLeft: `3px solid ${lane.color}`, position: 'relative',
                        }}
                      >
                        <button onClick={() => removeTask(task.id)} style={{
                          position: 'absolute', top: 6, right: 8, background: 'none', border: 'none',
                          cursor: 'pointer', color: T.textMuted, fontSize: 14, lineHeight: 1, opacity: 0.5,
                        }} title="Ta bort">×</button>

                        <div onClick={() => setExpandedId(isExpanded ? null : task.id)}
                          style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8, paddingRight: 20, lineHeight: 1.4, cursor: 'pointer' }}>
                          {task.title}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                          {(task.tags || []).map(tag => {
                            const tc = TAG_COLORS[tag] || TAG_COLORS.Övrigt;
                            return <span key={tag} style={{ background: tc.bg, color: tc.text, borderRadius: 5, fontSize: 10, padding: '1px 6px', fontWeight: 600 }}>{tag}</span>;
                          })}
                          <span style={{ background: prio.bg, color: prio.color, borderRadius: 5, fontSize: 10, padding: '1px 6px', fontWeight: 600 }}>
                            {prio.icon} {prio.label}
                          </span>
                          {task.estimate && (
                            <span style={{ background: T.blueLight, color: T.blueText, borderRadius: 5, fontSize: 10, padding: '1px 6px', fontWeight: 600 }}>
                              ⏱ {task.estimate}
                            </span>
                          )}
                        </div>

                        {task.deadline && (
                          <div style={{ fontSize: 11, color: isOverdue ? T.red : T.textMuted, marginBottom: 4, fontWeight: isOverdue ? 700 : 400 }}>
                            {isOverdue ? '⚠️' : '📅'} {task.deadline}
                          </div>
                        )}

                        <SubtaskProgress subtasks={task.subtasks} />

                        <div style={{ display: 'flex', gap: 0, marginTop: 8 }}>
                          {(task.mids || []).map((mid, idx) => {
                            const m = getMember(mid);
                            return m ? <div key={mid} style={{ marginLeft: idx > 0 ? -6 : 0 }}><Avatar member={m} size={22} /></div> : null;
                          })}
                        </div>

                        {isExpanded && task.subtasks && task.subtasks.length > 0 && (
                          <div style={{ marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                            {task.subtasks.map(sub => (
                              <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, cursor: 'pointer' }}>
                                <input type="checkbox" checked={sub.done} onChange={() => toggleSubtask(task.id, sub.id)} style={{ cursor: 'pointer' }} />
                                <span style={{ fontSize: 12, color: sub.done ? T.textMuted : T.text, textDecoration: sub.done ? 'line-through' : 'none' }}>{sub.title}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {showForm === lane.id ? (
                <div style={{ background: T.card, border: `1px solid ${lane.color}`, borderRadius: T.radiusSm, padding: 12, marginTop: 8 }}>
                  <input autoFocus value={fTitle} onChange={e => setFTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') setShowForm(null); }}
                    placeholder="Titel..." style={miniInputStyle} />

                  <textarea value={fDesc} onChange={e => setFDesc(e.target.value)}
                    placeholder="Beskrivning (valfri)" rows={2}
                    style={{ ...miniInputStyle, resize: 'vertical' }} />

                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 5 }}>Taggar</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {ALL_TAGS.map(tag => {
                      const tc = TAG_COLORS[tag];
                      const sel = fTags.includes(tag);
                      return <button key={tag} onClick={() => toggleTag(tag)} style={{
                        background: sel ? tc.bg : 'transparent', color: sel ? tc.text : T.textMuted,
                        border: `1px solid ${sel ? tc.text : T.border}`,
                        borderRadius: 5, fontSize: 11, padding: '2px 7px', cursor: 'pointer',
                      }}>{tag}</button>;
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select value={fPrio} onChange={e => setFPrio(e.target.value)} style={{ ...miniInputStyle, marginBottom: 0, flex: 1 }}>
                      {Object.entries(PRIO_META).map(([k, p]) => <option key={k} value={k}>{p.icon} {p.label}</option>)}
                    </select>
                    <select value={fEstimate} onChange={e => setFEstimate(e.target.value)} style={{ ...miniInputStyle, marginBottom: 0, flex: 1 }}>
                      {ESTIMATE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Tidsestimat —'}</option>)}
                    </select>
                  </div>

                  <input type="date" value={fDeadline} onChange={e => setFDeadline(e.target.value)} style={miniInputStyle} placeholder="Deadline (valfri)" />

                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 5 }}>Tilldela</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                    {members.map(m => (
                      <button key={m.id} onClick={() => toggleMember(m.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: fMids.includes(m.id) ? m.color + '22' : T.bg,
                        border: `1.5px solid ${fMids.includes(m.id) ? m.color : T.border}`,
                        borderRadius: 20, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: T.text,
                      }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{m.initials}</div>
                        {m.name}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 5 }}>Deluppgifter</div>
                  {fSubtasks.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, flex: 1, color: T.text }}>{s.title}</span>
                      <button onClick={() => removeSubtask(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14 }}>×</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                    <input value={fSubInput} onChange={e => setFSubInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSubtask()}
                      placeholder="Lägg till deluppgift..." style={{ ...miniInputStyle, marginBottom: 0, flex: 1 }} />
                    <button onClick={addSubtask} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: 6, padding: '0 10px', cursor: 'pointer', fontSize: 16 }}>+</button>
                  </div>

                  <input value={fEpic} onChange={e => setFEpic(e.target.value)}
                    placeholder="Epic / projekt (valfri)" style={miniInputStyle} />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addTask} style={{ background: lane.color, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                      Lägg till
                    </button>
                    <button onClick={() => setShowForm(null)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => openForm(lane.id)} style={{
                  width: '100%', background: 'none', border: `1px dashed ${T.border}`,
                  borderRadius: T.radiusSm, color: T.textMuted, fontSize: 13, padding: '8px',
                  cursor: 'pointer', marginTop: 8,
                }}>
                  + Lägg till uppgift
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
