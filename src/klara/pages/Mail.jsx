import React, { useState, useEffect } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 22, boxShadow: T.shadow, marginBottom: 18 };

// Chip-lista med inputfält — används för både VIP och blockerade avsändare
function SenderList({ title, hint, items, onAdd, onRemove, color, bg, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v || items.includes(v)) { setInput(''); return; }
    onAdd(v);
    setInput('');
  };
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>{hint}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {items.length === 0 && <span style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>Inga ännu</span>}
        {items.map(s => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: bg, color, fontSize: 12, fontWeight: 600 }}>
            {s}
            <button onClick={() => onRemove(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color, fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
          style={{ flex: 1, boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '8px 12px', fontSize: 13, color: T.text, outline: 'none', background: T.bg }}
        />
        <button onClick={add} style={{ padding: '8px 16px', borderRadius: T.radiusSm, border: 'none', background: T.purple, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Lägg till</button>
      </div>
    </div>
  );
}

export default function Mail() {
  const [prefs, setPrefs] = useLocalStorage('kl_mail_prefs', { vip: [], block: [] });
  const [, setTasks] = useLocalStorage('kl_tasks', []);
  const [, setCalEvents] = useLocalStorage('kl_cal_events', []);
  const [digest, setDigest] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState([]); // "task_<id>" / "event_<id>" som redan lagts till

  function addTaskFromMail(m) {
    setTasks(prev => [...prev, {
      id: 't_' + Date.now(), title: m.suggestTask, desc: `Från mail: ${m.subject} (${m.from})`,
      lane: 'ready', mids: [], tags: ['Hem'], prio: 'med', estimate: '', deadline: '',
      subtasks: [], epic: '', recur: 'none',
    }]);
    setAdded(a => [...a, 'task_' + m.id]);
  }

  function addEventFromMail(m) {
    setCalEvents(prev => [...prev, {
      id: 'ev_' + Date.now(), title: m.suggestEvent.title, date: m.suggestEvent.date,
      who: '', type: 'note', recur: 'none',
    }]);
    setAdded(a => [...a, 'event_' + m.id]);
  }

  const loadDigest = () => {
    fetch('/api/mail/digest').then(r => r.json()).then(setDigest).catch(() => {});
  };

  useEffect(() => {
    loadDigest();
    const iv = setInterval(loadDigest, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  async function checkNow() {
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/mail/check', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setDigest(data);
    } catch (e) {
      setError(e.message);
    }
    setChecking(false);
  }

  const vip = prefs.vip || [];
  const block = prefs.block || [];

  return (
    <div style={{ padding: '32px 36px', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>📧 Viktiga mail</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>
            AI-sorterade mail från familjens konton
            {digest?.time && ` · uppdaterad ${new Date(digest.time).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <button onClick={checkNow} disabled={checking}
          style={{ padding: '9px 20px', borderRadius: T.radiusSm, border: 'none', background: T.purple, color: '#fff', fontSize: 14, fontWeight: 700, cursor: checking ? 'wait' : 'pointer', opacity: checking ? 0.7 : 1 }}>
          {checking ? 'Skannar…' : 'Uppdatera'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: T.radiusSm, background: '#FEE2E2', color: '#B91C1C', fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      {/* ── Maillista ─────────────────────────────────────────── */}
      <div style={card}>
        {(!digest?.items || digest.items.length === 0) ? (
          <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>
            Inga viktiga mail just nu. Klicka Uppdatera för att skanna.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {digest.items.map(m => (
              <div key={m.id} style={{ padding: '12px 14px', borderRadius: T.radiusSm, background: T.bg, border: `1px solid ${m.vip ? T.purple + '66' : T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  {m.vip && <span style={{ fontSize: 10, fontWeight: 800, color: T.purple, background: T.purpleLight, borderRadius: 999, padding: '2px 8px', flexShrink: 0 }}>VIP</span>}
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text, flex: 1 }}>{m.subject}</span>
                  <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>
                    {m.date ? new Date(m.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: m.summary ? 5 : 0 }}>
                  {m.from}
                  <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, background: T.purpleLight, color: T.purple, fontSize: 10, fontWeight: 700 }}>{m.account}</span>
                </div>
                {m.summary && <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{m.summary}</div>}
                {m.action && (
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: '#B45309', background: '#FEF3C7', borderRadius: T.radiusSm, padding: '4px 10px', display: 'inline-block' }}>
                    → {m.action}
                  </div>
                )}
                {(m.suggestTask || m.suggestEvent) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {m.suggestTask && (
                      added.includes('task_' + m.id)
                        ? <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>✓ Uppgift tillagd</span>
                        : <button onClick={() => addTaskFromMail(m)} style={{ padding: '5px 12px', borderRadius: T.radiusSm, border: 'none', background: T.purpleLight, color: T.purple, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            ✅ Uppgift: {m.suggestTask.length > 40 ? m.suggestTask.slice(0, 40) + '…' : m.suggestTask}
                          </button>
                    )}
                    {m.suggestEvent && (
                      added.includes('event_' + m.id)
                        ? <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>✓ I kalendern</span>
                        : <button onClick={() => addEventFromMail(m)} style={{ padding: '5px 12px', borderRadius: T.radiusSm, border: 'none', background: '#DBEAFE', color: '#1E40AF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            📅 {m.suggestEvent.title.length > 30 ? m.suggestEvent.title.slice(0, 30) + '…' : m.suggestEvent.title} ({m.suggestEvent.date})
                          </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {digest?.scanned > 0 && (
          <p style={{ margin: '12px 0 0', fontSize: 11, color: T.textMuted }}>
            {digest.scanned} mail skannade{digest.blocked > 0 ? ` · ${digest.blocked} blockerade` : ''} · skannar automatiskt var 30:e minut
          </p>
        )}
      </div>

      {/* ── Prioritering ──────────────────────────────────────── */}
      <div style={card}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text }}>⭐ Prioritering</h2>
        <SenderList
          title="VIP — tas alltid med"
          hint="Avsändare, domäner eller nyckelord som alltid ska visas — t.ex. skolplattform, samfälligheten, BVC."
          items={vip}
          onAdd={v => setPrefs(p => ({ ...p, vip: [...(p.vip || []), v] }))}
          onRemove={v => setPrefs(p => ({ ...p, vip: (p.vip || []).filter(x => x !== v) }))}
          color={T.purple} bg={T.purpleLight}
          placeholder="t.ex. unikum.net eller samfällighet"
        />
        <SenderList
          title="Blockerade — visas aldrig"
          hint="Avsändare eller nyckelord som alltid ska ignoreras — t.ex. nyhetsbrev du inte orkar avprenumerera på."
          items={block}
          onAdd={v => setPrefs(p => ({ ...p, block: [...(p.block || []), v] }))}
          onRemove={v => setPrefs(p => ({ ...p, block: (p.block || []).filter(x => x !== v) }))}
          color="#B91C1C" bg="#FEE2E2"
          placeholder="t.ex. noreply@butik.se"
        />
        <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>
          Ändringar gäller från nästa skanning. Matchning sker mot avsändare, adress och ämnesrad.
        </p>
      </div>
    </div>
  );
}
