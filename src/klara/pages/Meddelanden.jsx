import React, { useState, useRef, useEffect } from 'react';
import { T } from '../theme';

function Avatar({ member, size = 36 }) {
  return (
    <div title={member.name} style={{
      width: size, height: size, borderRadius: '50%',
      background: member.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {member.initials}
    </div>
  );
}

export default function Meddelanden({ messages, setMessages, members }) {
  const [newText, setNewText]       = useState('');
  const [selectedFrom, setFrom]     = useState(members[0]?.id || '');
  const listEndRef                  = useRef(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function getMember(id) {
    return members.find(m => m.id === id);
  }

  function markAllRead() {
    setMessages(prev => prev.map(m => ({ ...m, read: true })));
  }

  function markRead(id) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  }

  function removeMessage(id) {
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  function addNote() {
    if (!newText.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: 'msg_' + Date.now(),
      from: selectedFrom,
      text: newText.trim(),
      time: timeStr,
      read: false,
    };
    setMessages(prev => [...prev, newMsg]);
    setNewText('');
  }

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div style={{ padding: '32px 36px', maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>
            💬 Meddelanden
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 10, background: T.purple, color: '#fff',
                borderRadius: 999, fontSize: 14, fontWeight: 700,
                padding: '2px 10px', verticalAlign: 'middle',
              }}>
                {unreadCount} olästa
              </span>
            )}
          </h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Familjeanteckningar och meddelanden</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: T.purpleLight, color: T.purple,
              border: 'none', borderRadius: T.radiusSm,
              padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ✓ Markera alla som lästa
          </button>
        )}
      </div>

      {/* Messages list */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: T.radius, overflow: 'hidden',
        boxShadow: T.shadow, marginBottom: 20,
      }}>
        {messages.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>
            Inga meddelanden ännu. Skriv det första nedan!
          </div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto', padding: '8px 0' }}>
            {messages.map(msg => {
              const sender = getMember(msg.from);
              if (!sender) return null;

              return (
                <div
                  key={msg.id}
                  onClick={() => markRead(msg.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '14px 20px',
                    background: msg.read ? 'transparent' : T.purpleLight + '66',
                    borderLeft: msg.read ? '3px solid transparent' : `3px solid ${T.purple}`,
                    cursor: msg.read ? 'default' : 'pointer',
                    transition: 'background 0.2s',
                    position: 'relative',
                  }}
                >
                  <Avatar member={sender} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{sender.name}</span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>{msg.time}</span>
                      {!msg.read && (
                        <span style={{
                          background: T.purple, color: '#fff',
                          borderRadius: 999, fontSize: 10, padding: '1px 7px', fontWeight: 700,
                        }}>Ny</span>
                      )}
                    </div>
                    <div style={{ fontSize: 15, color: T.text, lineHeight: 1.5 }}>{msg.text}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); removeMessage(msg.id); }}
                    style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: T.textMuted,
                      fontSize: 18, lineHeight: 1, opacity: 0.4,
                      padding: '2px 4px',
                    }}
                    title="Ta bort"
                  >×</button>
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>
        )}
      </div>

      {/* New message form */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: T.radius, padding: 20, boxShadow: T.shadow,
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: T.text }}>📝 Ny anteckning</h3>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* Sender select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
            <label style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>Från</label>
            <select
              value={selectedFrom}
              onChange={e => setFrom(e.target.value)}
              style={{
                border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                padding: '9px 10px', fontSize: 13, color: T.text,
                outline: 'none', background: T.bg, cursor: 'pointer',
              }}
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Text area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>Meddelande</label>
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
              placeholder="Skriv ett meddelande till familjen... (Enter för att skicka)"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                padding: '9px 12px', fontSize: 14, color: T.text,
                outline: 'none', resize: 'vertical', background: T.bg,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Send button */}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 0 }}>
            <button
              onClick={addNote}
              disabled={!newText.trim()}
              style={{
                background: newText.trim() ? T.purple : T.border,
                color: newText.trim() ? '#fff' : T.textMuted,
                border: 'none', borderRadius: T.radiusSm,
                padding: '10px 20px', fontSize: 14, fontWeight: 600,
                cursor: newText.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap',
                marginTop: 22,
              }}
            >
              Skicka ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
