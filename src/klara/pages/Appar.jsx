import React, { useState, useRef, useEffect } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';
import { COMMUNITY_APPS, APP_CATEGORIES, APP_MANIFEST_SCHEMA, PERMISSIONS, REGISTRY_VERSION, KLARA_VERSION, sendContextToApp } from '../AppRegistry';
import {
  Package, Plus, Search, ExternalLink, Shield, CheckCircle,
  Code2, Globe, Trash2, RefreshCw, AlertCircle, Copy, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Styles ───────────────────────────────────────────────────────────────────
const inp = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 14, color: T.text,
  marginBottom: 12, outline: 'none', background: T.bg,
};

function Badge({ children, color = T.purple, bg }) {
  return (
    <span style={{
      background: bg || color + '18', color,
      borderRadius: 999, fontSize: 11, fontWeight: 700,
      padding: '2px 8px', display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

// ─── App Card (i katalogen) ───────────────────────────────────────────────────
function AppCard({ app, installed, onInstall, onUninstall }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: T.radius, padding: 20, boxShadow: T.shadow,
      display: 'flex', flexDirection: 'column', gap: 12,
      opacity: app.comingSoon && !installed ? 0.85 : 1,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 36, flexShrink: 0, lineHeight: 1 }}>{app.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{app.name}</span>
            {app.verified && <Badge color={T.green}>✓ Verifierad</Badge>}
            {app.comingSoon && <Badge color={T.textMuted} bg={T.border + '80'}>Kommer snart</Badge>}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>
            av {app.author} · v{app.version}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.5 }}>
            {app.description}
          </p>
        </div>
      </div>

      {/* Permissions */}
      {app.permissions?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {app.permissions.map(p => (
            <span key={p} style={{ background: T.purpleLight, color: T.purple, borderRadius: 6, fontSize: 11, padding: '2px 8px', fontWeight: 500 }}>
              🔑 {p}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {installed ? (
          <button
            onClick={() => onUninstall(app.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.redLight, color: T.red, border: `1px solid ${T.red}44`, borderRadius: T.radiusSm, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Trash2 size={13} /> Avinstallera
          </button>
        ) : (
          <button
            onClick={() => !app.comingSoon && onInstall(app)}
            disabled={app.comingSoon}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: app.comingSoon ? T.border : T.purple,
              color: app.comingSoon ? T.textMuted : '#fff',
              border: 'none', borderRadius: T.radiusSm, padding: '7px 16px',
              fontSize: 13, fontWeight: 600,
              cursor: app.comingSoon ? 'default' : 'pointer',
            }}
          >
            <Plus size={13} /> {app.comingSoon ? 'Inte tillgänglig ännu' : 'Installera'}
          </button>
        )}
        {installed && (
          <Badge color={T.green}>✅ Installerad</Badge>
        )}
      </div>
    </div>
  );
}

// ─── Installerad app (i min lista) ────────────────────────────────────────────
function InstalledCard({ app, onUninstall, onOpen, members, tasks, events }) {
  const iframeRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && iframeRef.current && app.url) {
      const timer = setTimeout(() => {
        sendContextToApp(iframeRef.current, { members, tasks, events });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 28 }}>{app.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{app.name}</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>av {app.author}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {app.url && (
            <button
              onClick={() => setOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {open ? <ChevronUp size={13} /> : <Globe size={13} />}
              {open ? 'Stäng' : 'Öppna app'}
            </button>
          )}
          <button
            onClick={() => onUninstall(app.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.redLight, color: T.red, border: 'none', borderRadius: T.radiusSm, padding: '7px 12px', fontSize: 13, cursor: 'pointer' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Iframe panel */}
      {open && app.url && (
        <div style={{ borderTop: `1px solid ${T.border}`, height: 520, background: '#f0f0f0', position: 'relative' }}>
          <iframe
            ref={iframeRef}
            src={app.url}
            title={app.name}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Appar (huvud) ────────────────────────────────────────────────────────────
export default function Appar({ members, tasks, events }) {
  const [installedApps, setInstalledApps] = useLocalStorage('kl_extra_apps', []);
  const [tab, setTab] = useState('installerade');
  const [catFilter, setCatFilter] = useState('alla');
  const [search, setSearch] = useState('');
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [newUrl, setNewUrl]   = useState('');
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🔧');
  const [copied, setCopied]   = useState('');
  const [expandSchema, setExpandSchema] = useState(false);

  function installApp(app) {
    if (installedApps.find(a => a.id === app.id)) return;
    setInstalledApps(prev => [...prev, { ...app, installedAt: new Date().toISOString() }]);
  }

  function addCustomApp() {
    if (!newUrl.trim() || !newName.trim()) return;
    const id = 'custom_' + Date.now();
    installApp({
      id,
      name: newName.trim(),
      icon: newIcon,
      category: 'produktivitet',
      description: 'Anpassad app',
      author: 'Anpassad',
      version: '1.0.0',
      verified: false,
      type: 'iframe',
      url: newUrl.trim(),
      permissions: [],
    });
    setNewUrl(''); setNewName(''); setNewIcon('🔧');
    setShowAddUrl(false);
  }

  function uninstallApp(id) {
    if (!window.confirm('Avinstallera appen?')) return;
    setInstalledApps(prev => prev.filter(a => a.id !== id));
  }

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  }

  const installedIds = installedApps.map(a => a.id);

  const filtered = COMMUNITY_APPS.filter(app => {
    const matchCat = catFilter === 'alla' || app.category === catFilter;
    const matchSearch = !search || app.name.toLowerCase().includes(search.toLowerCase()) || app.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const TAB_STYLE = (active) => ({
    padding: '9px 22px', border: 'none', borderRadius: T.radiusSm,
    background: active ? T.purple : 'transparent',
    color: active ? '#fff' : T.textMuted,
    fontWeight: active ? 700 : 400,
    fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: T.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} color={T.purple} />
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>Appar</h1>
        </div>
        <p style={{ margin: 0, color: T.textMuted, fontSize: 14 }}>
          Utöka Klara med appar från communityn eller bygg egna integrationer via vårt API
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 6, width: 'fit-content', boxShadow: T.shadow }}>
        <button style={TAB_STYLE(tab === 'installerade')} onClick={() => setTab('installerade')}>
          Installerade {installedApps.length > 0 && `(${installedApps.length})`}
        </button>
        <button style={TAB_STYLE(tab === 'utforska')} onClick={() => setTab('utforska')}>
          Utforska appar
        </button>
        <button style={TAB_STYLE(tab === 'bygg')} onClick={() => setTab('bygg')}>
          Bygg en app
        </button>
      </div>

      {/* ── TAB: Installerade ─────────────────────────────────────────────── */}
      {tab === 'installerade' && (
        <div>
          {installedApps.length === 0 ? (
            <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: T.radius, padding: 48, textAlign: 'center' }}>
              <Package size={40} color={T.textMuted} style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 8 }}>Inga appar installerade</div>
              <div style={{ fontSize: 14, color: T.textMuted, marginBottom: 20 }}>
                Utforska katalogen för att hitta appar, eller lägg till en egen via URL.
              </div>
              <button
                onClick={() => setTab('utforska')}
                style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Utforska appar →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {installedApps.map(app => (
                <InstalledCard
                  key={app.id}
                  app={app}
                  onUninstall={uninstallApp}
                  members={members || []}
                  tasks={tasks || []}
                  events={events || []}
                />
              ))}
            </div>
          )}

          {/* Lägg till via URL */}
          <div style={{ marginTop: 24 }}>
            {showAddUrl ? (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text }}>Lägg till app via URL</h3>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>Appens namn</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="t.ex. Min Kalender" style={inp} />
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>Ikon (emoji)</label>
                <input value={newIcon} onChange={e => setNewIcon(e.target.value)} maxLength={2} style={{ ...inp, width: 80 }} />
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>URL (https://...)</label>
                <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://min-app.se/klara" style={inp} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={addCustomApp} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Installera
                  </button>
                  <button onClick={() => setShowAddUrl(false)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 16px', fontSize: 14, cursor: 'pointer' }}>
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddUrl(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1px dashed ${T.border}`, borderRadius: T.radius, padding: '14px 20px', fontSize: 14, color: T.textMuted, cursor: 'pointer', width: '100%', justifyContent: 'center' }}
              >
                <Plus size={16} /> Lägg till app via URL
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Utforska ─────────────────────────────────────────────────── */}
      {tab === 'utforska' && (
        <div>
          {/* Search + category */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Sök appar..."
                style={{ ...inp, marginBottom: 0, paddingLeft: 34 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {APP_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCatFilter(cat.id)}
                style={{
                  background: catFilter === cat.id ? T.purple : T.card,
                  color: catFilter === cat.id ? '#fff' : T.textMuted,
                  border: `1px solid ${catFilter === cat.id ? T.purple : T.border}`,
                  borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: catFilter === cat.id ? 600 : 400,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* App grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filtered.map(app => (
              <AppCard
                key={app.id}
                app={app}
                installed={installedIds.includes(app.id)}
                onInstall={installApp}
                onUninstall={uninstallApp}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: T.textMuted, fontSize: 14 }}>
              Inga appar hittades för "{search}"
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Bygg en app ──────────────────────────────────────────────── */}
      {tab === 'bygg' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Intro */}
          <div style={{ background: `linear-gradient(135deg, ${T.purple}18, ${T.purpleLight})`, border: `1px solid ${T.purple}33`, borderRadius: T.radius, padding: 28 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>
              🚀 Bygg appar för Klara
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: T.text, lineHeight: 1.7 }}>
              Klara använder ett öppet iframe-baserat API som låter dig bygga webbappar som kan läsa och skriva familjedata. Din app hostas på din egen server — Klara laddar den i en säker sandbox.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ background: T.card, borderRadius: T.radiusSm, padding: '10px 16px', fontSize: 13, fontWeight: 600, color: T.text }}>
                🔌 API version: <code style={{ color: T.purple }}>{REGISTRY_VERSION}</code>
              </div>
              <div style={{ background: T.card, borderRadius: T.radiusSm, padding: '10px 16px', fontSize: 13, fontWeight: 600, color: T.text }}>
                📦 Klara version: <code style={{ color: T.purple }}>{KLARA_VERSION}</code>
              </div>
            </div>
          </div>

          {/* Quick start */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code2 size={18} color={T.purple} /> Snabbstart
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
              Lyssna på <code>KLARA_CONTEXT</code>-meddelandet i din app för att ta emot familjedata:
            </p>
            <div style={{ position: 'relative' }}>
              <pre style={{
                background: '#1E1E2E', color: '#CDD6F4', borderRadius: T.radiusSm,
                padding: '16px 20px', fontSize: 12, lineHeight: 1.7,
                overflowX: 'auto', margin: 0,
              }}>
{`// I din app (index.html / script.js)
window.addEventListener('message', (event) => {
  if (event.data?.type === 'KLARA_CONTEXT') {
    const { members, tasks, events } = event.data.payload;
    console.log('Familjemedlemmar:', members);
    console.log('Uppgifter:', tasks);
    console.log('Händelser:', events);
    // Bygg din app-UI här!
  }
});

// Skicka data tillbaka till Klara (t.ex. ny uppgift)
window.parent.postMessage({
  type: 'KLARA_WRITE_TASK',
  payload: {
    title: 'Uppgift från min app',
    lane: 'ready',
    prio: 'med',
    tags: [],
    mids: [],
  }
}, '*');`}
              </pre>
              <button
                onClick={() => copyToClipboard('window.addEventListener...', 'quickstart')}
                style={{ position: 'absolute', top: 10, right: 10, background: T.purple + '33', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '4px 8px', color: '#CDD6F4', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
              >
                <Copy size={11} /> {copied === 'quickstart' ? 'Kopierat!' : 'Kopiera'}
              </button>
            </div>
          </div>

          {/* App manifest */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow }}>
            <button
              onClick={() => setExpandSchema(e => !e)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color={T.purple} /> App-manifest (klara.json)
              </h3>
              {expandSchema ? <ChevronUp size={16} color={T.textMuted} /> : <ChevronDown size={16} color={T.textMuted} />}
            </button>
            {expandSchema && (
              <div style={{ marginTop: 16 }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: T.textMuted }}>
                  Placera filen <code>klara.json</code> i din apps rot. Klara läser den för att verifiera din app.
                </p>
                <div style={{ position: 'relative' }}>
                  <pre style={{
                    background: '#1E1E2E', color: '#CDD6F4', borderRadius: T.radiusSm,
                    padding: '16px 20px', fontSize: 12, lineHeight: 1.7,
                    overflowX: 'auto', margin: 0,
                  }}>
{`{
  "id":          "min-app",
  "name":        "Min Klara-app",
  "version":     "1.0.0",
  "description": "Kort beskrivning av appen",
  "author":      "Ditt Namn",
  "icon":        "🚀",
  "category":    "produktivitet",
  "type":        "iframe",
  "url":         "https://min-app.se/klara",
  "permissions": [
    "read:members",
    "read:tasks",
    "write:tasks"
  ]
}`}
                  </pre>
                  <button
                    onClick={() => copyToClipboard('{"id":"min-app"...}', 'manifest')}
                    style={{ position: 'absolute', top: 10, right: 10, background: T.purple + '33', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '4px 8px', color: '#CDD6F4', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                  >
                    <Copy size={11} /> {copied === 'manifest' ? 'Kopierat!' : 'Kopiera'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Permissions */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text }}>🔑 Tillgängliga behörigheter</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(PERMISSIONS).map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: T.bg, borderRadius: T.radiusSm }}>
                  <code style={{ background: T.purpleLight, color: T.purple, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{key}</code>
                  <span style={{ fontSize: 13, color: T.text }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit app */}
          <div style={{ background: T.greenLight, border: `1px solid ${T.green}44`, borderRadius: T.radius, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>📬 Skicka in din app</div>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: T.text, lineHeight: 1.6 }}>
              Vill du att din app ska listas i Klara-katalogen? Skicka ett email med din apps manifest och en kort demo-video.
            </p>
            <a
              href="mailto:apps@klara.app?subject=App-submission"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: T.green, color: '#fff', borderRadius: T.radiusSm, padding: '9px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              <ExternalLink size={13} /> Kontakta oss
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
