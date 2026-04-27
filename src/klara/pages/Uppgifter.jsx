import React, { useState } from 'react';
import { T } from '../theme';

const LANES = [
  { id: 'ready',    label: 'Att göra', color: T.purple,  bg: T.purpleLight },
  { id: 'progress', label: 'Pågår',    color: T.orange,  bg: T.orangeLight },
  { id: 'done',     label: 'Klart',    color: T.green,   bg: T.greenLight  },
];

const PRIO_OPTIONS = [
  { value: 'high', label: 'Hög',   color: '#B91C1C', bg: '#FEE2E2' },
  { value: 'med',  label: 'Medel', color: T.orangeText, bg: T.orangeLight },
  { value: 'low',  label: 'Låg',   color: T.greenText,  bg: T.greenLight  },
];

const TAG_OPTIONS = ['Familj', 'Aktivitet', 'Hem', 'Skola', 'Ekonomi', 'Hälsa', 'Övrigt'];

function getPrioStyle(prio) {
  return PRIO_OPTIONS.find(p => p.value === prio) || PRIO_OPTIONS[1];
}

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

export default function Uppgifter({ tasks, setTasks, members }) {
  const [draggingId, setDraggingId]   = useState(null);
  const [dragOverLane, setDragOverLane] = useState(null);
  const [showForm, setShowForm]       = useState(null); // lane id or null
  const [formTitle, setFormTitle]     = useState('');
  const [formTag, setFormTag]         = useState('Familj');
  const [formPrio, setFormPrio]       = useState('med');
  const [formMids, setFormMids]       = useState([]);
  const [formLane, setFormLane]       = useState('ready');

  function getMember(id) {
    return members.find(m => m.id === id);
  }

  function onDragStart(e, taskId) {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e, laneId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverLane(laneId);
  }

  function onDrop(e, laneId) {
    e.preventDefault();
    if (!draggingId) return;
    setTasks(prev => prev.map(t => t.id === draggingId ? { ...t, lane: laneId } : t));
    setDraggingId(null);
    setDragOverLane(null);
  }

  function onDragEnd() {
    setDraggingId(null);
    setDragOverLane(null);
  }

  function openForm(laneId) {
    setFormLane(laneId);
    setFormTitle('');
    setFormTag('Familj');
    setFormPrio('med');
    setFormMids([]);
    setShowForm(laneId);
  }

  function addTask() {
    if (!formTitle.trim()) return;
    const newTask = {
      id: 't_' + Date.now(),
      title: formTitle.trim(),
      lane: formLane,
      mids: formMids,
      tags: [formTag],
      prio: formPrio,
    };
    setTasks(prev => [...prev, newTask]);
    setShowForm(null);
  }

  function removeTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function toggleMember(mid) {
    setFormMids(prev => prev.includes(mid) ? prev.filter(m => m !== mid) : [...prev, mid]);
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>✅ Uppgifter</h1>
        <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Dra och släpp för att flytta uppgifter</p>
      </div>

      {/* Kanban board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {LANES.map(lane => {
          const laneTasks = tasks.filter(t => t.lane === lane.id);
          const isDragTarget = dragOverLane === lane.id;

          return (
            <div
              key={lane.id}
              onDragOver={e => onDragOver(e, lane.id)}
              onDrop={e => onDrop(e, lane.id)}
              style={{
                background: isDragTarget ? lane.bg : T.card,
                border: `1.5px solid ${isDragTarget ? lane.color : T.border}`,
                borderRadius: T.radius,
                padding: 16,
                minHeight: 400,
                transition: 'border-color 0.15s, background 0.15s',
                boxShadow: T.shadow,
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: lane.color }}>{lane.label}</span>
                <span style={{
                  background: lane.bg, color: lane.color,
                  borderRadius: 999, fontSize: 12, fontWeight: 700,
                  padding: '2px 9px',
                }}>
                  {laneTasks.length}
                </span>
              </div>

              {/* Task cards */}
              {laneTasks.map(task => {
                const prio = getPrioStyle(task.prio);
                const isDragging = draggingId === task.id;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => onDragStart(e, task.id)}
                    onDragEnd={onDragEnd}
                    style={{
                      background: isDragging ? lane.bg : T.bg,
                      border: `1px solid ${T.border}`,
                      borderRadius: T.radiusSm,
                      padding: '12px 14px',
                      marginBottom: 10,
                      cursor: 'grab',
                      opacity: isDragging ? 0.5 : 1,
                      boxShadow: isDragging ? T.shadowMd : 'none',
                      transition: 'opacity 0.15s',
                      borderLeft: `3px solid ${lane.color}`,
                      position: 'relative',
                    }}
                  >
                    <button
                      onClick={() => removeTask(task.id)}
                      style={{
                        position: 'absolute', top: 6, right: 8,
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: T.textMuted,
                        fontSize: 14, lineHeight: 1, opacity: 0.5,
                      }}
                      title="Ta bort"
                    >×</button>

                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8, paddingRight: 16, lineHeight: 1.4 }}>
                      {task.title}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                      {task.tags.map(tag => (
                        <span key={tag} style={{
                          background: prio.bg, color: prio.color,
                          borderRadius: 5, fontSize: 11, padding: '2px 7px', fontWeight: 600,
                        }}>
                          {tag}
                        </span>
                      ))}
                      <span style={{
                        background: prio.bg, color: prio.color,
                        borderRadius: 5, fontSize: 11, padding: '2px 7px', fontWeight: 600,
                      }}>
                        {prio.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: -4 }}>
                      {task.mids.map((mid, idx) => {
                        const m = getMember(mid);
                        return m ? (
                          <div key={mid} style={{ marginLeft: idx > 0 ? -8 : 0 }}>
                            <Avatar member={m} size={24} />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Add task inline form */}
              {showForm === lane.id ? (
                <div style={{
                  background: T.card, border: `1px solid ${lane.color}`,
                  borderRadius: T.radiusSm, padding: 12, marginTop: 8,
                }}>
                  <input
                    autoFocus
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setShowForm(null); }}
                    placeholder="Titel på uppgiften..."
                    style={{ ...miniInputStyle, marginBottom: 8 }}
                  />
                  <select value={formTag} onChange={e => setFormTag(e.target.value)} style={{ ...miniInputStyle, marginBottom: 8 }}>
                    {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={formPrio} onChange={e => setFormPrio(e.target.value)} style={{ ...miniInputStyle, marginBottom: 8 }}>
                    {PRIO_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label} prioritet</option>)}
                  </select>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Tilldela</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {members.map(m => (
                        <button
                          key={m.id}
                          onClick={() => toggleMember(m.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: formMids.includes(m.id) ? m.color + '22' : T.bg,
                            border: `1.5px solid ${formMids.includes(m.id) ? m.color : T.border}`,
                            borderRadius: 20, padding: '3px 8px',
                            cursor: 'pointer', fontSize: 12, color: T.text,
                          }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: m.color, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 700,
                          }}>{m.initials}</div>
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addTask} style={{ ...miniSaveBtnStyle, background: lane.color }}>Lägg till</button>
                    <button onClick={() => setShowForm(null)} style={miniCancelBtnStyle}>Avbryt</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openForm(lane.id)}
                  style={{
                    width: '100%', background: 'none',
                    border: `1px dashed ${T.border}`, borderRadius: T.radiusSm,
                    color: T.textMuted, fontSize: 13, padding: '8px',
                    cursor: 'pointer', marginTop: 8,
                  }}
                >
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

const miniInputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: 6,
  padding: '7px 10px', fontSize: 13, color: T.text,
  outline: 'none', background: T.bg, display: 'block',
};
const miniSaveBtnStyle = {
  color: '#fff', border: 'none', borderRadius: 6,
  padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  flex: 1,
};
const miniCancelBtnStyle = {
  background: T.bg, color: T.textMuted,
  border: `1px solid ${T.border}`, borderRadius: 6,
  padding: '6px 14px', fontSize: 13, cursor: 'pointer',
};
