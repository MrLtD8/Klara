import React, { useState, useEffect } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const TRIGGERS = [
  { id: 'time',       label: 'Klockan blir...',        icon: '⏰', needsTime: true },
  { id: 'door',       label: 'Ytterdörren öppnas',     icon: '🚪', haEntity: 'binary_sensor.front_door' },
  { id: 'leaving',    label: 'Någon lämnar hemmet',     icon: '🏃', haEntity: 'device_tracker' },
  { id: 'morning',    label: 'Varje morgon (07:00)',    icon: '🌅', fixedTime: '07:00' },
  { id: 'evening',    label: 'Varje kväll (20:00)',     icon: '🌙', fixedTime: '20:00' },
  { id: 'cal_soon',   label: 'Kalenderhändelse snart',  icon: '📅' },
];

const CONDITIONS = [
  { id: 'none',            label: 'Alltid',                     icon: '✅' },
  { id: 'med_not_given',   label: 'Medicin ej given idag',      icon: '💊' },
  { id: 'task_not_done',   label: 'Uppgift ej klar',            icon: '📋' },
  { id: 'no_cal_today',    label: 'Ingen händelse idag',        icon: '📅' },
  { id: 'weekday',         label: 'Bara vardagar',              icon: '📆' },
  { id: 'weekend',         label: 'Bara helg',                  icon: '🏖️' },
];

const ACTIONS = [
  { id: 'notify_app',  label: 'Visa notis i appen',         icon: '🔔' },
  { id: 'notify_push', label: 'Push-notis (via HA)',         icon: '📱', needsHA: true },
  { id: 'highlight',   label: 'Markera på Hem-sidan',        icon: '⭐' },
  { id: 'sound',       label: 'Spela ljud',                  icon: '🔊', needsHA: true },
];

const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, marginBottom: 16 };
const chip = (active) => ({
  padding: '8px 14px', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 13, fontWeight: 600,
  border: `1.5px solid ${active ? T.purple : T.border}`,
  background: active ? T.purpleLight : 'transparent',
  color: active ? T.purple : T.textMuted,
  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
});

function RuleCard({ rule, onToggle, onDelete }) {
  const trigger = TRIGGERS.find(t => t.id === rule.trigger) || TRIGGERS[0];
  const condition = CONDITIONS.find(c => c.id === rule.condition) || CONDITIONS[0];
  const action = ACTIONS.find(a => a.id === rule.action) || ACTIONS[0];

  return (
    <div style={{ ...card, opacity: rule.enabled ? 1 : 0.5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>{rule.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ padding: '3px 10px', borderRadius: 999, background: T.purpleLight, color: T.purple, fontWeight: 600 }}>
              {trigger.icon} {trigger.label}{rule.triggerTime ? ` ${rule.triggerTime}` : ''}
            </span>
            {rule.condition !== 'none' && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
                {condition.icon} {condition.label}
              </span>
            )}
            <span style={{ padding: '3px 10px', borderRadius: 999, background: '#DBEAFE', color: '#1E40AF', fontWeight: 600 }}>
              {action.icon} {action.label}
            </span>
          </div>
          {rule.message && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6, fontStyle: 'italic' }}>"{rule.message}"</div>}
        </div>
        <button onClick={() => onToggle(rule.id)}
          style={{ width: 44, height: 24, borderRadius: 12, background: rule.enabled ? T.purple : T.border, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 3, left: rule.enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
        <button onClick={() => onDelete(rule.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: T.textMuted, padding: '4px 8px' }}>✕</button>
      </div>
    </div>
  );
}

export default function Automationer({ members = [] }) {
  const [rules, setRules] = useLocalStorage('kl_automations', []);
  const [config, setConfig] = useLocalStorage('kl_automation_config', { doorEntity: '' });
  const [creating, setCreating] = useState(false);

  // HA-status + notislogg hämtas direkt från servern (skrivs av regelmotorn)
  const [haStatus, setHaStatus] = useState(null);   // null=laddar, {available,...}
  const [doorSensors, setDoorSensors] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = () => {
    fetch('/api/data').then(r => r.json())
      .then(d => setNotifications(d.kl_notifications || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/ha/status').then(r => r.json()).then(setHaStatus).catch(() => setHaStatus({ available: false }));
    fetch('/api/ha/states?q=binary_sensor').then(r => r.json())
      .then(d => setDoorSensors(d.states || [])).catch(() => {});
    loadNotifications();
    const iv = setInterval(loadNotifications, 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const [name, setName]           = useState('');
  const [trigger, setTrigger]     = useState('time');
  const [triggerTime, setTriggerTime] = useState('07:00');
  const [condition, setCondition] = useState('none');
  const [action, setAction]       = useState('notify_app');
  const [message, setMessage]     = useState('');

  const toggleRule = id => setRules(p => p.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteRule = id => setRules(p => p.filter(r => r.id !== id));

  const saveRule = () => {
    if (!name.trim()) return;
    const trig = TRIGGERS.find(t => t.id === trigger);
    setRules(p => [...p, {
      id: 'auto_' + Date.now(),
      name: name.trim(),
      trigger,
      triggerTime: trig?.needsTime ? triggerTime : (trig?.fixedTime || ''),
      condition,
      action,
      message: message.trim(),
      enabled: true,
    }]);
    setCreating(false);
    setName(''); setTrigger('time'); setTriggerTime('07:00'); setCondition('none'); setAction('notify_app'); setMessage('');
  };

  const selectedTrigger = TRIGGERS.find(t => t.id === trigger);

  const EXAMPLES = [
    { name: 'Medicinpåminnelse vid dörren', trigger: 'door', condition: 'med_not_given', action: 'notify_push', message: 'Glöm inte medicinen innan ni går!' },
    { name: 'Morgonrutin-check', trigger: 'morning', condition: 'task_not_done', action: 'notify_app', message: 'Det finns uppgifter kvar att göra idag.' },
    { name: 'Kvällspåminnelse medicin', trigger: 'evening', condition: 'med_not_given', action: 'notify_app', message: 'Kvällsmedicinen är inte given ännu.' },
  ];

  return (
    <div style={{ padding: '32px 36px', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>⚡ Automationer</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Regler som triggar notiser och påminnelser</p>
        </div>
        <button onClick={() => setCreating(c => !c)}
          style={{ padding: '9px 20px', borderRadius: T.radiusSm, border: 'none', background: T.purple, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {creating ? 'Avbryt' : '+ Ny regel'}
        </button>
      </div>

      {creating && (
        <div style={{ ...card, border: `2px solid ${T.purple}`, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text }}>Skapa automation</h3>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 }}>Namn</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="t.ex. Medicinpåminnelse"
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 14, color: T.text, marginBottom: 18, outline: 'none', background: T.bg }} />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 8 }}>🔴 När...</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {TRIGGERS.map(t => (
              <button key={t.id} onClick={() => setTrigger(t.id)} style={chip(trigger === t.id)}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
          {selectedTrigger?.needsTime && (
            <input type="time" value={triggerTime} onChange={e => setTriggerTime(e.target.value)}
              style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '6px 12px', fontSize: 14, color: T.text, marginBottom: 8, outline: 'none', background: T.bg }} />
          )}
          <div style={{ marginBottom: 18 }} />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 8 }}>🟡 Om...</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {CONDITIONS.map(c => (
              <button key={c.id} onClick={() => setCondition(c.id)} style={chip(condition === c.id)}>
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 8 }}>🟢 Gör...</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {ACTIONS.map(a => (
              <button key={a.id} onClick={() => setAction(a.id)} style={chip(action === a.id)}>
                <span>{a.icon}</span> {a.label}
                {a.needsHA && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 999, background: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>HA</span>}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 }}>Meddelande</label>
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Text som visas i notisen..."
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 14, color: T.text, marginBottom: 20, outline: 'none', background: T.bg }} />

          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveRule}
                style={{ padding: '10px 28px', borderRadius: T.radiusSm, border: 'none', background: T.purple, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Spara regel
              </button>
              <button onClick={() => setCreating(false)}
                style={{ padding: '10px 20px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 14, cursor: 'pointer' }}>
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {rules.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 10 }}>
            {rules.filter(r => r.enabled).length} av {rules.length} aktiva
          </div>
          {rules.map(r => <RuleCard key={r.id} rule={r} onToggle={toggleRule} onDelete={deleteRule} />)}
        </div>
      )}

      {rules.length === 0 && !creating && (
        <div style={card}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, color: T.text }}>Inga automationer ännu</h3>
            <p style={{ margin: '0 0 20px', color: T.textMuted, fontSize: 13 }}>
              Skapa regler som triggar påminnelser baserat på tid, händelser och villkor.
            </p>
            <p style={{ margin: 0, color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>
              Klicka "+ Ny regel" ovan, eller prova ett snabbexempel nedan.
            </p>
          </div>
        </div>
      )}

      {!creating && (
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: T.text }}>💡 Snabbexempel</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: T.textMuted }}>Klicka för att lägga till direkt:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {EXAMPLES.map((ex, i) => {
              const exists = rules.some(r => r.name === ex.name);
              return (
                <button key={i} disabled={exists}
                  onClick={() => setRules(p => [...p, { ...ex, id: 'auto_' + Date.now() + i, triggerTime: TRIGGERS.find(t => t.id === ex.trigger)?.fixedTime || '', enabled: true }])}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: exists ? T.bg : 'transparent', cursor: exists ? 'default' : 'pointer', textAlign: 'left', opacity: exists ? 0.5 : 1 }}>
                  <span style={{ fontSize: 20 }}>{TRIGGERS.find(t => t.id === ex.trigger)?.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ex.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{ex.message}</div>
                  </div>
                  {exists && <span style={{ fontSize: 11, color: T.purple, fontWeight: 600 }}>Tillagd ✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Home Assistant-koppling ─────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <h3 style={{ margin: 0, flex: 1, fontSize: 15, fontWeight: 700, color: T.text }}>Home Assistant</h3>
          {haStatus === null ? (
            <span style={{ fontSize: 12, color: T.textMuted }}>Kontrollerar…</span>
          ) : haStatus.available ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
              Ansluten{haStatus.version ? ` · HA ${haStatus.version}` : ''}
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706' }}>Ej ansluten — regler med HA-triggers pausade</span>
          )}
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 }}>Dörrsensor (för "Ytterdörren öppnas")</label>
        {doorSensors.length > 0 ? (
          <select value={config.doorEntity || ''} onChange={e => setConfig(c => ({ ...c, doorEntity: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 14, color: T.text, outline: 'none', background: T.bg }}>
            <option value="">— Välj sensor —</option>
            {doorSensors.map(s => <option key={s.entity_id} value={s.entity_id}>{s.name} ({s.entity_id})</option>)}
          </select>
        ) : (
          <input value={config.doorEntity || ''} onChange={e => setConfig(c => ({ ...c, doorEntity: e.target.value }))}
            placeholder="binary_sensor.ytterdorr"
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 12px', fontSize: 14, color: T.text, outline: 'none', background: T.bg }} />
        )}
        <p style={{ margin: '8px 0 0', fontSize: 11, color: T.textMuted }}>
          Regelmotorn körs i HA-addonet var 30:e sekund. Push-notiser skickas via HA:s notify-tjänst (ställs in i addonets konfiguration).
        </p>
      </div>

      {/* ── Händelselogg ─────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <h3 style={{ margin: 0, flex: 1, fontSize: 15, fontWeight: 700, color: T.text }}>Händelselogg</h3>
          <button onClick={loadNotifications}
            style={{ padding: '5px 12px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 12, cursor: 'pointer' }}>
            Uppdatera
          </button>
        </div>
        {notifications.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>Inga triggade regler ännu.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.slice(0, 15).map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 12px', borderRadius: T.radiusSm, background: T.bg, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {new Date(n.time).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{n.ruleName}</span>
                  {n.message && n.message !== n.ruleName && <span style={{ fontSize: 12, color: T.textMuted }}> — {n.message}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
