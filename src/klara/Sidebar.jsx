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

      {/* Bottom bar — Gästläge + Inställningar */}
      <div style={{
        padding: '10px', borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', gap: 6, flexShrink: 0,
      }}>
        {/* Guest toggle */}
        <button
          onClick={onToggleGuest}
          title={guestMode ? 'Stäng av gästläge' : 'Aktivera gästläge'}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0',
            background: guestMode ? T.sidebarActive : 'transparent',
            border: `1px solid ${guestMode ? T.purple : 'rgba(255,255,255,0.12)'}`,
            borderRadius: T.radiusSm, cursor: 'pointer',
            color: guestMode ? T.sidebarActiveText : T.sidebarText,
            fontSize: 12, fontWeight: guestMode ? 700 : 400, transition: 'all 0.15s',
          }}
        >
          <User size={14} strokeWidth={guestMode ? 2.2 : 1.7} />
          <span>{guestMode ? 'Gäst' : 'Gäst'}</span>
        </button>

        {/* Settings gear */}
        <button
          onClick={() => onNavigate('installningar')}
          title="Inställningar"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0',
            background: activePage === 'installningar' ? T.sidebarActive : 'transparent',
            border: `1px solid ${activePage === 'installningar' ? T.purple : 'rgba(255,255,255,0.12)'}`,
            borderRadius: T.radiusSm, cursor: 'pointer',
            color: activePage === 'installningar' ? T.sidebarActiveText : T.sidebarText,
            fontSize: 12, fontWeight: activePage === 'installningar' ? 700 : 400, transition: 'all 0.15s',
          }}
        >
          <Settings size={14} strokeWidth={activePage === 'installningar' ? 2.2 : 1.7} />
          <span>Inställningar</span>
        </button>
      </div>
    </div>
  );
}
