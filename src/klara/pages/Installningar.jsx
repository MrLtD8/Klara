import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';
import {
  Home, Calendar, CheckSquare, GraduationCap, FolderOpen,
  Wrench, Wallet, Star, List, Heart, Bot, BarChart2,
  Users, MessageCircle, Pill, ExternalLink, Toggle,
} from 'lucide-react';

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 14, color: T.text,
  marginBottom: 14, outline: 'none', background: T.bg,
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 };
const saveBtnSm  = { background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const cancelBtnSm = { background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '7px 14px', fontSize: 13, cursor: 'pointer' };
const editBtnSt  = { background: T.purpleLight, color: T.purple, border: 'none', borderRadius: T.radiusSm, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };

const COLORS = ['#7C5CBF','#F97316','#22C55E','#3B82F6','#EF4444','#EC4899','#14B8A6','#F59E0B'];

function Section({ title, children, action }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Module definitions (for toggle list) ────────────────────────────────────
const MODULE_LIST = [
  { id: 'kalender',    label: 'Kalender · Planering · Skola', Icon: Calendar,    alwaysOn: false, desc: 'Veckokalender, planering och skoluppgifter' },
  { id: 'uppgifter',   label: 'Uppgifter',             Icon: CheckSquare,  alwaysOn: false, desc: 'Kanban-tavla med uppgifter' },
  { id: 'filer',       label: 'Filer & Länkar',        Icon: FolderOpen,   alwaysOn: false, desc: 'Dokument och viktiga länkar' },
  { id: 'bilhus',      label: 'Bil & Hus',             Icon: Wrench,       alwaysOn: false, desc: 'Service, underhåll och påminnelser' },
  { id: 'ekonomi',     label: 'Ekonomi',               Icon: Wallet,       alwaysOn: false, desc: 'Budget och utgiftsöversikt' },
  { id: 'kids',        label: 'Kids & Sysslor',        Icon: Star,         alwaysOn: false, desc: 'Sysslor med poäng och aktivitetshjul' },
  { id: 'listor',      label: 'Listor',                Icon: List,         alwaysOn: false, desc: 'Bucketlist och sommarlovslista' },
  { id: 'wellness',    label: 'Wellness',              Icon: Heart,        alwaysOn: false, desc: 'Hälsolog och humörspårning' },
  { id: 'assistent',   label: 'Assistent',             Icon: Bot,          alwaysOn: false, desc: 'AI-daglig rapport och sammanfattning' },
  { id: 'kravdatabas', label: 'Kravdatabas',           Icon: BarChart2,    alwaysOn: false, desc: 'Alla krav och status' },
  // Dolda som standard
  { id: 'familj',      label: 'Familj (i meny)',       Icon: Users,        alwaysOn: false, desc: 'Familjeöversikt som separat menyval' },
  { id: 'medicin',     label: 'Medicin (i meny)',      Icon: Pill,         alwaysOn: false, desc: 'Medicinhantering som separat menyval' },
  { id: 'meddelanden', label: 'Meddelanden',           Icon: MessageCircle,alwaysOn: false, desc: 'Intern familjechatt (dold som standard)' },
];

// ─── Inställningar ────────────────────────────────────────────────────────────
export default function Installningar({ members, setMembers, focus, setFocus, visiblePages = {}, setVisiblePages, onNavigate, showFocus, setShowFocus }) {
  const [gcalSettings, setGcalSettings] = useLocalStorage('kl_gcal', { enabled: false, clientId: '', apiKey: '', calendarIds: '' });
  const [gcalEdit, setGcalEdit] = useState(false);
  const [tempGcal, setTempGcal] = useState(gcalSettings);

  const [familyName, setFamilyName]   = useState('Familjen');
  const [editingFam, setEditingFam]   = useState(false);
  const [tempFamName, setTempFamName] = useState('Familjen');
  const [focusEdit, setFocusEdit]     = useState(false);
  const [tempFocus, setTempFocus]     = useState(focus);
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName]   = useState('');
  const [editRole, setEditRole]   = useState('');
  const [editColor, setEditColor] = useState('');
  const [editInit, setEditInit]   = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newRole, setNewRole]   = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newInit, setNewInit]   = useState('');

  function saveFocus() { setFocus(tempFocus); setFocusEdit(false); }
  function startEditMember(m) { setEditingMember(m.id); setEditName(m.name); setEditRole(m.role); setEditColor(m.color); setEditInit(m.initials); }
  function saveEditMember() {
    setMembers(prev => prev.map(m => m.id === editingMember ? { ...m, name: editName, role: editRole, color: editColor, initials: editInit || editName.slice(0,1).toUpperCase() } : m));
    setEditingMember(null);
  }
  function deleteMember(id) { if (window.confirm('Ta bort familjemedlem?')) setMembers(prev => prev.filter(m => m.id !== id)); }
  function addMember() {
    if (!newName.trim()) return;
    const id = 'm' + Date.now();
    setMembers(prev => [...prev, { id, name: newName.trim(), role: newRole.trim() || 'Familjemedlem', color: newColor, initials: newInit || newName.slice(0,1).toUpperCase() }]);
    setAddingMember(false); setNewName(''); setNewRole(''); setNewInit(''); setNewColor(COLORS[0]);
  }

  function toggleModule(id) {
    setVisiblePages(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function saveGcal() {
    setGcalSettings(tempGcal);
    setGcalEdit(false);
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>⚙️ Inställningar</h1>
        <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Anpassa Klara för din familj</p>
      </div>

      {/* ── Menymoduler ───────────────────────────────────────── */}
      <Section title="🗂 Menymoduler">
        <p style={{ margin: '0 0 16px', fontSize: 13, color: T.textMuted }}>
          Välj vilka moduler som ska visas i den vänstra menyn. Hem och Inställningar är alltid aktiva.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MODULE_LIST.map(mod => {
            const { Icon } = mod;
            const isOn = !!visiblePages[mod.id];
            return (
              <div key={mod.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 14px', borderRadius: T.radiusSm,
                background: isOn ? T.purpleLight : T.bg,
                border: `1px solid ${isOn ? T.purple + '44' : T.border}`,
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: isOn ? T.purple : T.border,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}>
                  <Icon size={16} color={isOn ? '#fff' : T.textMuted} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{mod.label}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{mod.desc}</div>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: isOn ? T.purple : T.border,
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3,
                    left: isOn ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Google Kalender ───────────────────────────────────── */}
      <Section title="📅 Google Kalender-integration">
        <p style={{ margin: '0 0 14px', fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
          Koppla din Google Kalender för att se och synka händelser. Du behöver ett Google Cloud-projekt med Calendar API aktiverat.
          <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: T.purple, marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            Google Cloud Console <ExternalLink size={12} />
          </a>
        </p>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: T.radiusSm,
            background: gcalSettings.enabled ? T.greenLight : T.bg,
            border: `1px solid ${gcalSettings.enabled ? T.green : T.border}`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: gcalSettings.enabled ? T.green : T.border }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: gcalSettings.enabled ? T.greenText : T.textMuted }}>
              {gcalSettings.enabled ? 'Aktiverad' : 'Inte konfigurerad'}
            </span>
          </div>
          <button onClick={() => { setTempGcal(gcalSettings); setGcalEdit(e => !e); }} style={editBtnSt}>
            ✏️ {gcalEdit ? 'Avbryt' : 'Konfigurera'}
          </button>
        </div>

        {gcalEdit && (
          <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: 18, border: `1px solid ${T.border}` }}>
            <label style={labelStyle}>Client ID (från Google Cloud Console)</label>
            <input
              value={tempGcal.clientId}
              onChange={e => setTempGcal(p => ({ ...p, clientId: e.target.value }))}
              placeholder="xxxxx.apps.googleusercontent.com"
              style={inputStyle}
            />
            <label style={labelStyle}>API-nyckel</label>
            <input
              value={tempGcal.apiKey}
              onChange={e => setTempGcal(p => ({ ...p, apiKey: e.target.value }))}
              placeholder="AIzaSy..."
              style={inputStyle}
            />
            <label style={labelStyle}>Kalender-ID:n (kommaseparerade)</label>
            <input
              value={tempGcal.calendarIds}
              onChange={e => setTempGcal(p => ({ ...p, calendarIds: e.target.value }))}
              placeholder="primary, family@group.v.calendar.google.com"
              style={inputStyle}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <button
                onClick={() => setTempGcal(p => ({ ...p, enabled: !p.enabled }))}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: tempGcal.enabled ? T.purple : T.border,
                  border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                }}
              >
                <div style={{ position: 'absolute', top: 3, left: tempGcal.enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
              <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>
                {tempGcal.enabled ? 'Aktiverad' : 'Inaktiverad'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveGcal} style={saveBtnSm}>Spara inställningar</button>
              <button onClick={() => setGcalEdit(false)} style={cancelBtnSm}>Avbryt</button>
            </div>
          </div>
        )}

        {gcalSettings.enabled && gcalSettings.clientId && (
          <div style={{ marginTop: 12, padding: '12px 16px', background: T.blueLight, borderRadius: T.radiusSm, border: `1px solid ${T.blue}33` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.blue, marginBottom: 4 }}>ℹ️ Nästa steg</div>
            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>
              Lägg till <code style={{ background: T.bg, padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>http://localhost:3000</code> som auktoriserat ursprung i din Google Cloud OAuth-konfiguration. Synkroniseringen startar automatiskt i Kalender-vyn när du navigerar dit.
            </div>
          </div>
        )}
      </Section>

      {/* ── Familjemedlemmar ──────────────────────────────────── */}
      <Section
        title="👨‍👩‍👧‍👦 Familjemedlemmar"
        action={
          <button
            onClick={() => setAddingMember(a => !a)}
            style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Lägg till
          </button>
        }
      >
        {addingMember && (
          <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: 16, marginBottom: 14, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Initialer</label>
                <input value={newInit} onChange={e => setNewInit(e.target.value.toUpperCase().slice(0,2))} maxLength={2} style={{ ...inputStyle, width: 60 }} />
              </div>
              <div style={{ flex: 3 }}>
                <label style={labelStyle}>Namn</label>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Roll / Ålder</label>
                <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="t.ex. Förälder, 12 år" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: newColor === c ? `3px solid ${T.text}` : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addMember} style={saveBtnSm}>Lägg till</button>
              <button onClick={() => setAddingMember(false)} style={cancelBtnSm}>Avbryt</button>
            </div>
          </div>
        )}

        {members.map(m => (
          <div key={m.id} style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '12px 16px', marginBottom: 10 }}>
            {editingMember === m.id ? (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Initialer</label>
                    <input value={editInit} onChange={e => setEditInit(e.target.value.toUpperCase().slice(0,2))} style={{ ...inputStyle, width: 60, marginBottom: 0 }} maxLength={2} />
                  </div>
                  <div style={{ flex: 3 }}>
                    <label style={labelStyle}>Namn</label>
                    <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={labelStyle}>Roll</label>
                    <input value={editRole} onChange={e => setEditRole(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setEditColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: editColor === c ? `3px solid ${T.text}` : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveEditMember} style={saveBtnSm}>Spara</button>
                  <button onClick={() => setEditingMember(null)} style={cancelBtnSm}>Avbryt</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                  {m.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{m.role}</div>
                </div>
                <button onClick={() => startEditMember(m)} style={editBtnSt}>✏️ Redigera</button>
                <button onClick={() => deleteMember(m.id)} style={{ background: T.redLight, color: T.red, border: 'none', borderRadius: T.radiusSm, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>🗑 Ta bort</button>
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* ── Medicin-snabbåtkomst ──────────────────────────────── */}
      <Section title="💊 Medicin">
        <p style={{ margin: '0 0 14px', fontSize: 13, color: T.textMuted }}>
          Medicin-modulen är tillgänglig via Inställningar. Du kan även aktivera den i menyn via Menymoduler ovan.
        </p>
        <button
          onClick={() => onNavigate('medicin')}
          style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Öppna Medicin-modulen →
        </button>
      </Section>

      {/* ── Dagens fokus ─────────────────────────────────────── */}
      <Section title="⭐ Dagens fokus">
        {/* Show/hide toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, padding: '10px 14px', borderRadius: T.radiusSm, background: showFocus ? T.purpleLight : T.bg, border: `1px solid ${showFocus ? T.purple + '44' : T.border}`, transition: 'all 0.15s' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Visa i sidomenyn</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Texten visas längst ned i sidomenyn under navigationen</div>
          </div>
          <button
            onClick={() => setShowFocus && setShowFocus(v => !v)}
            style={{ width: 44, height: 24, borderRadius: 12, background: showFocus ? T.purple : T.border, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
          >
            <div style={{ position: 'absolute', top: 3, left: showFocus ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
        {focusEdit ? (
          <div>
            <textarea autoFocus value={tempFocus} onChange={e => setTempFocus(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', fontStyle: 'italic', marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveFocus} style={saveBtnSm}>Spara</button>
              <button onClick={() => setFocusEdit(false)} style={cancelBtnSm}>Avbryt</button>
            </div>
          </div>
        ) : (
          <div style={{ background: T.sidebarHover, borderRadius: T.radiusSm, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <span style={{ fontSize: 14, color: '#CCCCDD', fontStyle: 'italic', flex: 1, lineHeight: 1.5 }}>"{focus}"</span>
            <button onClick={() => { setTempFocus(focus); setFocusEdit(true); }} style={editBtnSt}>✏️ Redigera</button>
          </div>
        )}
      </Section>

      {/* ── Om Klara ─────────────────────────────────────────── */}
      <Section title="ℹ️ Om Klara">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Version',   value: '2.0.0' },
            { label: 'Design',    value: 'Klara.' },
            { label: 'Moduler',   value: `${MODULE_LIST.filter(m => visiblePages[m.id]).length + 2} aktiva` },
            { label: 'Plattform', value: 'Web / Lokal' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: T.bg, borderRadius: T.radiusSm, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{value}</div>
            </div>
          ))}
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
          Klara är en familjeplaneringsapp. Alla data sparas lokalt i webbläsaren — ingen molntjänst krävs.
        </p>
      </Section>
    </div>
  );
}
