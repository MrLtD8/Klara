import React from 'react';
import { T } from './theme';
import {
  Home, Calendar, CheckSquare, FolderOpen,
  Wrench, Wallet, Star, List, Heart, Bot, BarChart2,
  Users, MessageCircle, Pill, Settings, User, Package, Plus,
  ChevronLeft, ChevronRight, Zap, Mail,
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
  { id: 'automationer',label: 'Automationer',     Icon: Zap },
  { id: 'mail',        label: 'Viktiga mail',     Icon: Mail },
  { id: 'kravdatabas', label: 'Kravdatabas',     Icon: BarChart2 },
  // Dolda som standard
  { id: 'familj',      label: 'Familj',          Icon: Users },
  { id: 'meddelanden', label: 'Meddelanden',     Icon: MessageCircle },
  { id: 'medicin',     label: 'Medicin',         Icon: Pill },
];

export default function Sidebar({
  activePage, onNavigate, members, unreadCount,
  focus, showFocus, guestMode, onToggleGuest, visiblePages = {},
  collapsed = false, onToggleCollapse,
}) {
  const [installedApps] = useLocalStorage('kl_extra_apps', []);

  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item =>
    item.alwaysOn || visiblePages[item.id]
  );

  const W = collapsed ? 52 : 220;

  return (
    <div style={{
      width: W,
      minWidth: W,
      height: '100vh',
      background: T.sidebar,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
    }}>
      {/* Logo + collapse toggle */}
      <div style={{ padding: collapsed ? '20px 8px 16px' : '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, transition: 'padding 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px ${T.purple}55`,
              flexShrink: 0, cursor: 'pointer',
            }} onClick={onToggleCollapse} title={collapsed ? 'Expandera meny' : 'Minimera meny'}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', lineHeight: 1, paddingBottom: 1 }}>K</span>
              {!collapsed && <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 16, lineHeight: 1, marginLeft: 1 }}>.</span>}
            </div>
            {!collapsed && <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.2px' }}>Klara</span>}
          </div>
          {!collapsed && (
            <button onClick={onToggleCollapse} title="Minimera meny" style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center', transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Nav items — scrollable middle */}
      <nav style={{ flex: 1, padding: collapsed ? '10px 8px 0' : '10px 10px 0', overflowY: 'auto', transition: 'padding 0.2s ease' }}>
        {NAV_ITEMS.map(item => {
          const isActive  = activePage === item.id;
          const showBadge = item.id === 'meddelanden' && unreadCount > 0;
          const { Icon }  = item;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: collapsed ? '9px 0' : '9px 11px', marginBottom: 2,
                justifyContent: collapsed ? 'center' : 'flex-start',
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
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && showBadge && (
                <span style={{ background: T.purple, color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 16, textAlign: 'center' }}>
                  {unreadCount}
                </span>
              )}
              {collapsed && showBadge && (
                <span style={{ position: 'absolute', top: 4, right: 4, background: T.purple, color: '#fff', borderRadius: 999, fontSize: 9, fontWeight: 700, padding: '1px 4px', minWidth: 14, textAlign: 'center' }}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── APPAR ─── */}
      <div style={{ padding: collapsed ? '4px 8px 0' : '4px 10px 0', flexShrink: 0, transition: 'padding 0.2s ease' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginBottom: 2 }}>
          {!collapsed && (
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.2, textTransform: 'uppercase', padding: '4px 4px 6px' }}>
              Appar
            </div>
          )}
          {installedApps.map(app => {
            const isActive = activePage === `app:${app.id}`;
            return (
              <button
                key={app.id}
                onClick={() => onNavigate(`app:${app.id}`)}
                title={collapsed ? app.name : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: collapsed ? '7px 0' : '7px 11px', marginBottom: 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
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
                {!collapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</span>}
              </button>
            );
          })}
          <button
            onClick={() => onNavigate('appar')}
            title={collapsed ? 'Hantera appar' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: collapsed ? '7px 0' : '7px 11px', marginBottom: 2,
              justifyContent: collapsed ? 'center' : 'flex-start',
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
            {!collapsed && <><span style={{ flex: 1 }}>Hantera appar</span><Plus size={12} style={{ opacity: 0.5 }} /></>}
          </button>
        </div>
      </div>

      {/* Dagens fokus — valfri, döljs i ikonläge */}
      {!collapsed && showFocus && focus && (
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

      {/* Bottom — knappar */}
      <div style={{ padding: collapsed ? '8px 8px 10px' : '8px 10px 10px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, transition: 'padding 0.2s ease' }}>
        <div style={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', gap: 6 }}>
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
            {!collapsed && <span>Gäst</span>}
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
            {!collapsed && <span>Inställningar</span>}
          </button>

          {collapsed && (
            <button
              onClick={onToggleCollapse}
              title="Expandera meny"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 0',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: T.radiusSm, cursor: 'pointer',
                color: T.sidebarText,
                transition: 'all 0.15s',
              }}
            >
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
