import React, { useState } from 'react';
import { T } from './theme';

const MEMBER_COLORS = [
  T.purple, '#F97316', '#22C55E', '#3B82F6',
  '#EC4899', '#EAB308', '#14B8A6', '#8B5CF6',
];

const TOUR_STEPS = [
  {
    icon: '🏠',
    title: 'Hem — din dagliga översikt',
    body: 'Hem-sidan visar veckans kalender, familjestatistik och dina uppgifter. I Anpassa-läget kan du flytta om widgetarna precis som du vill ha dem.',
  },
  {
    icon: '📅',
    title: 'Kalender',
    body: 'Vecko- och månadsvy. Klicka på en dag för att lägga till en händelse, dra för att flytta. Klicka på en befintlig händelse för att redigera den.',
  },
  {
    icon: '✅',
    title: 'Uppgifter',
    body: 'Kanban-tavla för hela familjen — Redo, Pågår och Klart. Tilldela uppgifter, sätt prioritet, estimat och subtasks.',
  },
  {
    icon: '📆',
    title: 'Google Kalender-synk',
    body: 'Koppla dina Google-kalendrar via Inställningar → Google Kalender. Du behöver ingen OAuth eller Google-konto — bara en hemlig iCal-länk.',
  },
  {
    icon: '◀',
    title: 'Minimera sidomenyn',
    body: 'Klicka på pilen (‹) uppe i sidomenyn för att fälla ihop den till ikonläge. Perfekt på iPad eller när du vill ha mer yta. Valet sparas.',
  },
];

const ALL_MODULES = [
  { id: 'kalender',  label: 'Kalender',      icon: '📅', desc: 'Vecko- och månadsvy, Google Kalender-synk' },
  { id: 'uppgifter', label: 'Uppgifter',      icon: '✅', desc: 'Kanban-tavla med prioritet och subtasks' },
  { id: 'familj',    label: 'Familj',         icon: '👨‍👩‍👧‍👦', desc: 'Familjeöversikt och statistik' },
  { id: 'medicin',   label: 'Medicin',        icon: '💊', desc: 'Medicinpåminnelser och lagerstatus' },
  { id: 'bilhus',    label: 'Bil & Hus',      icon: '🔧', desc: 'Underhållsplan med påminnelser' },
  { id: 'ekonomi',   label: 'Ekonomi',        icon: '💰', desc: 'Budget och kommande betalningar' },
  { id: 'listor',    label: 'Listor',         icon: '📝', desc: 'Bucketlist och sommarlovslista' },
  { id: 'kids',      label: 'Kids & Sysslor', icon: '⭐', desc: 'Poängsystem och aktivitetshjul' },
  { id: 'wellness',  label: 'Wellness',       icon: '❤️', desc: 'Hälsolog för hela familjen' },
  { id: 'assistent', label: 'Assistent',      icon: '🤖', desc: 'AI-dagsrapport via Claude API' },
  { id: 'filer',     label: 'Filer & länkar', icon: '📁', desc: 'Samlingsplats för viktiga dokument' },
];

const overlay = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(28,27,46,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)',
};
const box = {
  width: 480, background: T.card, borderRadius: T.radiusLg,
  overflow: 'hidden', boxShadow: '0 24px 64px rgba(80,40,70,0.28)',
  maxHeight: '92vh', display: 'flex', flexDirection: 'column',
};
const headerGrad = `linear-gradient(135deg, ${T.purpleDark}, ${T.purple})`;

function ProgressDots({ total, current }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 12 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 6, height: 6, borderRadius: 3,
          background: i === current ? '#fff' : 'rgba(255,255,255,0.35)',
          transition: 'all 0.3s',
        }} />
      ))}
    </div>
  );
}

function PrimaryBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 2, padding: '11px', borderRadius: T.radiusSm,
      border: 'none', background: T.purple, color: '#fff',
      fontWeight: 700, fontSize: 14, cursor: 'pointer',
      fontFamily: T.fontBody, transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = T.purpleDark}
      onMouseLeave={e => e.currentTarget.style.background = T.purple}
    >{children}</button>
  );
}

function SecondaryBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '11px', borderRadius: T.radiusSm,
      border: `1px solid ${T.border}`, background: 'transparent',
      color: T.textMuted, fontWeight: 600, fontSize: 13,
      cursor: 'pointer', fontFamily: T.fontBody,
    }}>{children}</button>
  );
}

function SkipBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', padding: '10px',
      border: 'none', background: 'transparent',
      color: T.textHint, fontSize: 11, cursor: 'pointer',
      fontFamily: T.fontBody,
    }}>Hoppa över — gå direkt till appen</button>
  );
}

export default function KlaraOnboarding({ onDone }) {
  const [step, setStep]         = useState(0);
  const [fname, setFname]       = useState('');
  const [members, setMembers]   = useState([
    { id: 1, name: '', color: MEMBER_COLORS[0], initials: '' },
    { id: 2, name: '', color: MEMBER_COLORS[1], initials: '' },
  ]);
  const [enabledMods, setEnabledMods] = useState(
    ['kalender', 'uppgifter', 'medicin', 'bilhus', 'ekonomi']
  );
  const [tourStep, setTourStep] = useState(0);

  const addMember = () => setMembers(p => [
    ...p,
    { id: Date.now(), name: '', color: MEMBER_COLORS[p.length % MEMBER_COLORS.length], initials: '' },
  ]);
  const updMember = (id, name) => setMembers(p => p.map(m =>
    m.id === id ? { ...m, name, initials: name.charAt(0).toUpperCase() || '?' } : m
  ));
  const delMember = id => setMembers(p => p.filter(m => m.id !== id));
  const toggleMod = id => setEnabledMods(p =>
    p.includes(id) ? p.filter(x => x !== id) : [...p, id]
  );

  const finish = () => {
    const visiblePages = {};
    enabledMods.forEach(id => { visiblePages[id] = true; });
    onDone({
      familyName: fname.trim() || 'Familjen',
      members: members
        .filter(m => m.name.trim())
        .map((m, i) => ({
          id: 'm' + (i + 1),
          name: m.name.trim(),
          color: m.color,
          initials: m.name.charAt(0).toUpperCase(),
          role: i < 2 ? 'Förälder' : 'Barn',
        })),
      visiblePages,
    });
  };

  // ── Steg 3: Välj moduler ─────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div style={overlay}>
        <div style={box}>
          <div style={{ background: headerGrad, padding: '22px 26px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>📱</div>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 700, color: '#fff', margin: 0 }}>
              Välj era moduler
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '6px 0 0' }}>
              Kan alltid ändras i Inställningar → Hantera appar
            </p>
            <ProgressDots total={5} current={3} />
          </div>
          <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>
            {ALL_MODULES.map(mod => {
              const on = enabledMods.includes(mod.id);
              return (
                <button key={mod.id} onClick={() => toggleMod(mod.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px', marginBottom: 6,
                  borderRadius: T.radiusSm,
                  background: on ? T.purpleLight : '#fafafa',
                  border: `1.5px solid ${on ? T.purple : T.border}`,
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: T.fontBody, transition: 'all 0.2s',
                  boxSizing: 'border-box',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{mod.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{mod.label}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{mod.desc}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${on ? T.purple : '#ccc'}`,
                    background: on ? T.purple : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {on && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <SecondaryBtn onClick={() => setStep(2)}>← Tillbaka</SecondaryBtn>
              <PrimaryBtn onClick={() => setStep(4)}>Tour →</PrimaryBtn>
            </div>
          </div>
          <SkipBtn onClick={finish} />
        </div>
      </div>
    );
  }

  // ── Steg 4: Tour ─────────────────────────────────────────────────────────
  if (step === 4) {
    const ts = TOUR_STEPS[tourStep];
    return (
      <div style={overlay}>
        <div style={{ ...box, maxHeight: 'unset' }}>
          <div style={{ background: headerGrad, padding: '30px 26px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{ts.icon}</div>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>
              {ts.title}
            </h2>
            <ProgressDots total={TOUR_STEPS.length} current={tourStep} />
          </div>
          <div style={{ padding: '24px 28px' }}>
            <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.75, textAlign: 'center', margin: '0 0 24px' }}>
              {ts.body}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {tourStep > 0 && <SecondaryBtn onClick={() => setTourStep(t => t - 1)}>← Tillbaka</SecondaryBtn>}
              {tourStep < TOUR_STEPS.length - 1
                ? <PrimaryBtn onClick={() => setTourStep(t => t + 1)}>Nästa →</PrimaryBtn>
                : <button onClick={finish} style={{
                    flex: 2, padding: '11px', borderRadius: T.radiusSm,
                    border: 'none', background: T.green, color: '#fff',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: T.fontBody,
                  }}>🎉 Kör igång!</button>
              }
            </div>
            <SkipBtn onClick={finish} />
          </div>
        </div>
      </div>
    );
  }

  // ── Steg 0–2 ─────────────────────────────────────────────────────────────
  return (
    <div style={overlay}>
      <div style={box}>
        {/* Header */}
        <div style={{ background: headerGrad, padding: '28px 26px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            {step === 0 ? '👋' : step === 1 ? '🏡' : '👨‍👩‍👧‍👦'}
          </div>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: 21, fontWeight: 700, color: '#fff', margin: 0 }}>
            {step === 0 && 'Välkommen till Klara!'}
            {step === 1 && 'Vad heter er familj?'}
            {step === 2 && 'Vilka är med?'}
          </h2>
          {step === 0 && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '8px 0 0' }}>
              Er familjeapp — lokalt, privat, alltid hemma
            </p>
          )}
          <ProgressDots total={5} current={step} />
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
          {/* Steg 0: Välkommen */}
          {step === 0 && (
            <>
              <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.75, textAlign: 'center', marginBottom: 28 }}>
                Kalender, uppgifter, familjemedlemmar och Google Kalender — allt på ett ställe.
                All data stannar hemma på ert nätverk, ingenting skickas till molnet.
              </p>
              <button onClick={() => setStep(1)} style={{
                width: '100%', padding: '13px', borderRadius: T.radiusSm,
                border: 'none', background: T.purple, color: '#fff',
                fontWeight: 700, fontSize: 15, cursor: 'pointer',
                fontFamily: T.fontBody,
              }}>Kom igång →</button>
            </>
          )}

          {/* Steg 1: Familjenamn */}
          {step === 1 && (
            <>
              <p style={{ fontSize: 12, color: T.textHint, textAlign: 'center', marginBottom: 12 }}>
                Visas i sidomenyn — t.ex. "Familjen Berg" eller "Svenssons"
              </p>
              <input
                autoFocus
                value={fname}
                onChange={e => setFname(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setStep(2)}
                placeholder="Er familjs namn…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 16px', borderRadius: T.radiusSm,
                  border: `2px solid ${T.border}`, fontSize: 16,
                  fontFamily: T.fontDisplay, color: T.text,
                  textAlign: 'center', outline: 'none', marginBottom: 20,
                  background: T.bgWarm,
                }}
                onFocus={e => e.currentTarget.style.borderColor = T.purple}
                onBlur={e => e.currentTarget.style.borderColor = T.border}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <SecondaryBtn onClick={() => setStep(0)}>← Tillbaka</SecondaryBtn>
                <PrimaryBtn onClick={() => setStep(2)}>Nästa →</PrimaryBtn>
              </div>
            </>
          )}

          {/* Steg 2: Familjemedlemmar */}
          {step === 2 && (
            <>
              <p style={{ fontSize: 12, color: T.textHint, textAlign: 'center', marginBottom: 14 }}>
                Kan ändras i Inställningar → Familjemedlemmar
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 240, overflowY: 'auto' }}>
                {members.map((m, i) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: m.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>{m.initials || '?'}</div>
                    <input
                      value={m.name}
                      onChange={e => updMember(m.id, e.target.value)}
                      placeholder={`Person ${i + 1}…`}
                      style={{
                        flex: 1, padding: '8px 11px', borderRadius: T.radiusSm,
                        border: `1px solid ${T.border}`, fontSize: 13,
                        fontFamily: T.fontBody, color: T.text, outline: 'none',
                        background: T.bgWarm,
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = T.purple}
                      onBlur={e => e.currentTarget.style.borderColor = T.border}
                    />
                    {members.length > 1 && (
                      <button onClick={() => delMember(m.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: T.textHint, fontSize: 18, padding: '0 2px',
                      }}>×</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addMember} style={{
                width: '100%', padding: '8px', marginBottom: 18,
                borderRadius: T.radiusSm, border: `1px dashed ${T.border}`,
                background: 'transparent', color: T.textMuted, fontSize: 13,
                cursor: 'pointer', fontFamily: T.fontBody,
              }}>+ Lägg till person</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <SecondaryBtn onClick={() => setStep(1)}>← Tillbaka</SecondaryBtn>
                <PrimaryBtn onClick={() => setStep(3)}>Nästa →</PrimaryBtn>
              </div>
            </>
          )}
        </div>

        <SkipBtn onClick={finish} />
      </div>
    </div>
  );
}
