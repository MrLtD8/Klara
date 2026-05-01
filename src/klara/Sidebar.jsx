import React from 'react';
import { T } from './theme';
import {
  Home, Calendar, CheckSquare, FolderOpen,
  Wrench, Wallet, Star, List, Heart, Bot, BarChart2,
  Users, MessageCircle, Pill, Settings, User, Package, Plus,
} from 'lucide-react';
import { useLocalStorage } from '../useLocalStorage';

const ALL_NAV_ITEMS = [
  { id: 'hem',         label: 'Hem',            Icon: Home,          alwaysOn: true },
  { id: 'kalender',    label: 'Kalender',        Icon: Calendar },
  { id: 'uppgifter',   label: 'Uppgifter',       Icon: CheckSquare },
  { id: 'filer',       label: 'Filer & länkar',  Icon: FolderOpen },
  { id: 'bilhus',      label: 'Bil & Hus',       Icon: Wrench },
  { id: 'ekonomi',     label: 'Ekonomi',         Icon: Wallet },
  { id: 'kids',        label: 'Kids & Sysslor',  Icon: Star },
  { id: 'listor',      label: 'Listor',          Icon: List },
  { id: 'wellness',    label: 'Wellness',        Icon: Heart },
  { id: 'assistent',   label: 'Assistent',       Icon: Bot },
  { id: 'kravdatabas', label: 'Kravdatabas',     Icon: BarChart2 },
  // Dolda som standard
  { id: 'familj',      label: 'Familj',          Icon: Users },
  { id: 'meddelanden', label: 'Meddelanden',     Icon: MessageCircle },
  { id: 'medicin',     label: 'Medicin',         Icon: Pill },
];

export default function Sidebar({
  activePage, onNavigate, members, unreadCount,
  focus, showFocus, guestMode, onToggleGuest, visiblePages = {},
  currentUser, onSignOut, isLocalMode,
}) {
  const [installedApps] = useLocalStorage('kl_extra_apps', []);

  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item =>
    item.alwaysOn || visiblePages[item.id]
  );

  return (
    <div style={{
      width: 220,
      minWidth: 220,
      height: '100vh',
      background: T.sidebar,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>Klara</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: T.purple }}>.</span>
        </div>
      </div>

      {/* Nav items — scrollable middle */}
      <nav style={{ flex: 1, padding: '10px 10px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive  = activePage === item.id;
          const showBadge = item.id === 'meddelanden' && unreadCount > 0;
          const { Icon }  = item;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 11px', marginBottom: 2,
                background: isActive ? T.sidebarActive : 'transparent',
                border: 'none', borderRadius: T.radiusSm, cursor: 'pointer',
                color: isActive ? T.sidebarActiveText : T.sidebarText,
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                textAlign: 'left', transition: 'background 0.15s', position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.sidebarHover; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={15} strokeWidth={isActive ? 2.2 : 1.7} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.72 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {showBadge && (
                <span style={{ background: T.purple, color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 16, textAlign: 'center' }}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── APPAR ─── */}
      <div style={{ padding: '4px 10px 0', flexShrink: 0 }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginBottom: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.2, textTransform: 'uppercase', padding: '4px 4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Appar</span>
          </div>
          {/* Installed extra apps */}
          {installedApps.map(app => {
            const isActive = activePage === `app:${app.id}`;
            return (
              <button
                key={app.id}
                onClick={() => onNavigate(`app:${app.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '7px 11px', marginBottom: 2,
                  background: isActive ? T.sidebarActive : 'transparent',
                  border: 'none', borderRadius: T.radiusSm, cursor: 'pointer',
                  color: isActive ? T.sidebarActiveText : T.sidebarText,
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  textAlign: 'left', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.sidebarHover; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 14, flexShrink: 0, opacity: isActive ? 1 : 0.8 }}>{app.icon}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</span>
              </button>
            );
          })}
          {/* Hantera appar */}
          <button
            onClick={() => onNavigate('appar')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '7px 11px', marginBottom: 2,
              background: activePage === 'appar' ? T.sidebarActive : 'transparent',
              border: 'none', borderRadius: T.radiusSm, cursor: 'pointer',
              color: activePage === 'appar' ? T.sidebarActiveText : T.sidebarText,
              fontSize: 13, fontWeight: activePage === 'appar' ? 600 : 400,
              textAlign: 'left', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (activePage !== 'appar') e.currentTarget.style.background = T.sidebarHover; }}
            onMouseLeave={e => { if (activePage !== 'appar') e.currentTarget.style.background = 'transparent'; }}
          >
            <Package size={14} strokeWidth={activePage === 'appar' ? 2.2 : 1.7} style={{ flexShrink: 0, opacity: activePage === 'appar' ? 1 : 0.65 }} />
            <span style={{ flex: 1 }}>Hantera appar</span>
            <Plus size={12} style={{ opacity: 0.5 }} />
          </button>
        </div>
      </div>

      {/* Dagens fokus — valfri */}
      {showFocus && focus && (
        <div style={{ padding: '10px 10px 0', flexShrink: 0 }}>
          <div style={{ background: T.sidebarHover, borderRadius: T.radiusSm, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.sidebarText, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              ⭐ Dagens fokus
            </div>
            <div style={{ fontSize: 12, color: '#CCCCDD', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{focus}"
            </div>
          </div>
        </div>
      )}

      {/* Bottom — Användare + knappar */}
      <div style={{ padding: '8px 10px 10px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>

        {/* Inloggad användare */}
        {currentUser && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', marginBottom: 6,
            borderRadius: T.radiusSm, background: 'rgba(255,255,255,0.04)',
          }}>
            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: T.purple, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {currentUser.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.sidebarActiveText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </div>
              {isLocalMode && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Lokalt läge</div>
              )}
            </div>
            {/* Logga ut */}
            <button
              onClick={onSignOut}
              title="Logga ut"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', padding: 4, display: 'flex',
                borderRadius: 6, transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              {/* Enkel utloggningsikon utan extra import */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        )}

        {/* Guest + Inställningar */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onToggleGuest}
            title={guestMode ? 'Stäng av gästläge' : 'Aktivera gästläge'}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 0',
              background: guestMode ? T.sidebarActive : 'transparent',
              border: `1px solid ${guestMode ? T.purple : 'rgba(255,255,255,0.12)'}`,
              borderRadius: T.radiusSm, cursor: 'pointer',
              color: guestMode ? T.sidebarActiveText : T.sidebarText,
              fontSize: 11, fontWeight: guestMode ? 700 : 400, transition: 'all 0.15s',
            }}
          >
            <User size={13} strokeWidth={guestMode ? 2.2 : 1.7} />
            <span>Gäst</span>
          </button>

          <button
            onClick={() => onNavigate('installningar')}
            title="Inställningar"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 0',
              background: activePage === 'installningar' ? T.sidebarActive : 'transparent',
              border: `1px solid ${activePage === 'installningar' ? T.purple : 'rgba(255,255,255,0.12)'}`,
              borderRadius: T.radiusSm, cursor: 'pointer',
              color: activePage === 'installningar' ? T.sidebarActiveText : T.sidebarText,
              fontSize: 11, fontWeight: activePage === 'installningar' ? 700 : 400, transition: 'all 0.15s',
            }}
          >
            <Settings size={13} strokeWidth={activePage === 'installningar' ? 2.2 : 1.7} />
            <span>Inställningar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
