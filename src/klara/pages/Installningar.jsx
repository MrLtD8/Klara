import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';
import { DEFAULT_GCAL, normalizeGcal, GCAL_COLORS, newCalendarId } from '../../gcal';

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

// ─── Inställningar ────────────────────────────────────────────────────────────
export default function Installningar({ members, setMembers, focus, setFocus, onNavigate, showFocus, setShowFocus, familyName = '', setFamilyName }) {
  const [design, setDesign] = useLocalStorage('app_design', 'klara');
  const [gcalSettings, setGcalSettings] = useLocalStorage('kl_gcal', DEFAULT_GCAL);
  const gcalNorm = normalizeGcal(gcalSettings);
  const updCal = (id, patch) => setGcalSettings(s => { const n = normalizeGcal(s); return { ...n, calendars: n.calendars.map(c => c.id === id ? { ...c, ...patch } : c) }; });
  const addCal = () => setGcalSettings(s => { const n = normalizeGcal(s); const color = GCAL_COLORS[n.calendars.length % GCAL_COLORS.length]; return { ...n, enabled: true, calendars: [...n.calendars, { id: newCalendarId(), name: '', icsUrl: '', color, enabled: true }] }; });
  const delCal = id => setGcalSettings(s => { const n = normalizeGcal(s); return { ...n, calendars: n.calendars.filter(c => c.id !== id) }; });
  const cycleColor = id => setGcalSettings(s => { const n = normalizeGcal(s); return { ...n, calendars: n.calendars.map(c => { if (c.id !== id) return c; const i = GCAL_COLORS.indexOf(c.color); return { ...c, color: GCAL_COLORS[(i + 1) % GCAL_COLORS.length] }; }) }; });

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

  function chooseDesign(d) {
    if (d === design) return;
    setDesign(d);
    // Designerna är separata React-träd — ladda om så rätt rot renderas.
    setTimeout(() => window.location.reload(), 60);
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>⚙️ Inställningar</h1>
        <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>Anpassa Klara för din familj</p>
      </div>

      {/* ── Design ────────────────────────────────────────────── */}
      <Section title="🎨 Design">
        <p style={{ margin: '0 0 16px', fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
          Välj utseende på appen. Båda designerna delar samma data — familj, uppgifter och kalender följer med oavsett vilken du väljer.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { id: 'klara',    name: 'Klara', desc: 'Lila, sidomeny, en sida per modul', swatch: ['#7C5CBF', '#A78BDA', '#EDE9F7'] },
            { id: 'familjen', name: 'Familjen', desc: 'Grå/varm, klocka, flikar och dashboard', swatch: ['#8A7C68', '#C9A227', '#F2EDE4'] },
          ].map(opt => {
            const active = design === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => chooseDesign(opt.id)}
                style={{
                  textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${active ? T.purple : T.border}`,
                  background: active ? T.purpleLight : T.bg,
                  borderRadius: T.radiusSm, padding: 16, transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                  {opt.swatch.map(c => <div key={c} style={{ width: 22, height: 22, borderRadius: 6, background: c }} />)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{opt.name}</span>
                  {active && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: T.purple, borderRadius: 999, padding: '1px 8px' }}>Aktiv</span>}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.4 }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Google Kalender (flera iCal-kalendrar) ────────────── */}
      <Section
        title="📅 Google Kalender-integration"
        action={
          <button
            onClick={() => setGcalSettings(s => ({ ...normalizeGcal(s), enabled: !normalizeGcal(s).enabled }))}
            style={{ width: 44, height: 24, borderRadius: 12, background: gcalNorm.enabled ? T.purple : T.border, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
            title={gcalNorm.enabled ? 'Aktiverad' : 'Avstängd'}
          >
            <div style={{ position: 'absolute', top: 3, left: gcalNorm.enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        }
      >
        <p style={{ margin: '0 0 16px', fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
          Lägg till en eller flera hemliga iCal-länkar (i Google Kalender: Inställningar → välj en kalender → "Hemlig adress i iCal-format"). Varje Google-kalender har en egen länk. Klicka på färgrutan för att byta färg.
        </p>

        {gcalNorm.calendars.map((c, i) => (
          <div key={c.id} style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: 14, marginBottom: 12, background: T.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <button onClick={() => cycleColor(c.id)} title="Byt färg" style={{ width: 26, height: 26, borderRadius: 7, background: c.color, border: 'none', cursor: 'pointer', flexShrink: 0 }} />
              <input
                value={c.name}
                onChange={e => updCal(c.id, { name: e.target.value })}
                placeholder={`Kalender ${i + 1} (t.ex. Familj, Jobb)`}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button
                onClick={() => updCal(c.id, { enabled: !c.enabled })}
                style={{ width: 44, height: 24, borderRadius: 12, background: c.enabled ? T.purple : T.border, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
                title={c.enabled ? 'Visas' : 'Dold'}
              >
                <div style={{ position: 'absolute', top: 3, left: c.enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
              <button onClick={() => delCal(c.id)} style={{ background: T.redLight, color: T.red, border: 'none', borderRadius: T.radiusSm, padding: '6px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>🗑</button>
            </div>
            <input
              value={c.icsUrl}
              onChange={e => updCal(c.id, { icsUrl: e.target.value })}
              placeholder="https://calendar.google.com/calendar/ical/.../private-.../basic.ics"
              style={{ ...inputStyle, marginBottom: 0, fontSize: 12 }}
            />
          </div>
        ))}

        {gcalNorm.calendars.length === 0 && (
          <p style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic', margin: '0 0 12px' }}>Inga kalendrar tillagda ännu.</p>
        )}

        <button onClick={addCal} style={{ ...saveBtnSm, width: '100%', padding: '10px' }}>+ Lägg till kalender</button>
      </Section>

      {/* ── Familjenamn + medlemmar ─────────────────────────────── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>Familjenamn</label>
          <input
            value={familyName}
            onChange={e => setFamilyName(e.target.value)}
            placeholder="t.ex. Svenssons"
            style={{ ...inputStyle, marginBottom: 0, flex: 1, maxWidth: 240 }}
          />
          <span style={{ fontSize: 12, color: T.textMuted }}>Visas i hälsningen på Hem</span>
        </div>

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
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  {['Förälder', 'Barn'].map(r => (
                    <button key={r} onClick={() => setNewRole(r === 'Barn' ? ' år' : r)} style={{ padding: '4px 12px', borderRadius: T.radiusSm, border: `1.5px solid ${(r === 'Förälder' && newRole === 'Förälder') || (r === 'Barn' && newRole.includes('år')) ? T.purple : T.border}`, background: (r === 'Förälder' && newRole === 'Förälder') || (r === 'Barn' && newRole.includes('år')) ? T.purpleLight : 'transparent', color: (r === 'Förälder' && newRole === 'Förälder') || (r === 'Barn' && newRole.includes('år')) ? T.purple : T.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{r}</button>
                  ))}
                </div>
                {newRole.includes('år') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input value={newRole.replace(' år', '')} onChange={e => setNewRole(e.target.value.replace(/[^0-9]/g, '') + ' år')} placeholder="Ålder" style={{ ...inputStyle, width: 60, marginBottom: 0, textAlign: 'center' }} />
                    <span style={{ fontSize: 13, color: T.textMuted }}>år</span>
                  </div>
                ) : (
                  <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="t.ex. Förälder" style={inputStyle} />
                )}
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
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      {['Förälder', 'Barn'].map(r => (
                        <button key={r} onClick={() => setEditRole(r === 'Barn' ? ' år' : r)} style={{ padding: '4px 12px', borderRadius: T.radiusSm, border: `1.5px solid ${(r === 'Förälder' && editRole === 'Förälder') || (r === 'Barn' && editRole.includes('år')) ? T.purple : T.border}`, background: (r === 'Förälder' && editRole === 'Förälder') || (r === 'Barn' && editRole.includes('år')) ? T.purpleLight : 'transparent', color: (r === 'Förälder' && editRole === 'Förälder') || (r === 'Barn' && editRole.includes('år')) ? T.purple : T.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{r}</button>
                      ))}
                    </div>
                    {editRole.includes('år') ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input value={editRole.replace(' år', '')} onChange={e => setEditRole(e.target.value.replace(/[^0-9]/g, '') + ' år')} placeholder="Ålder" style={{ ...inputStyle, width: 60, marginBottom: 0, textAlign: 'center' }} />
                        <span style={{ fontSize: 13, color: T.textMuted }}>år</span>
                      </div>
                    ) : (
                      <input value={editRole} onChange={e => setEditRole(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                    )}
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
            { label: 'Moduler',   value: 'Hantera appar →' },
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
