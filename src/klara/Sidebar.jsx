import React from 'react';
import { T } from './theme';

const NAV_ITEMS = [
  { id: 'hem',          label: 'Hem',           icon: '🏠' },
  { id: 'kalender',     label: 'Kalender',       icon: '📅' },
  { id: 'uppgifter',    label: 'Uppgifter',      icon: '✅' },
  { id: 'planering',    label: 'Planering',      icon: '📋' },
  { id: 'skola',        label: 'Skola',          icon: '🎓' },
  { id: 'familj',       label: 'Familj',         icon: '👨‍👩‍👧‍👦' },
  { id: 'meddelanden',  label: 'Meddelanden',    icon: '💬' },
  { id: 'filer',        label: 'Filer & länkar', icon: '📁' },
  { id: 'medicin',      label: 'Medicin',        icon: '💊' },
  { id: 'bilhus',       label: 'Bil & Hus',      icon: '🏠' },
  { id: 'ekonomi',      label: 'Ekonomi',        icon: '💰' },
  { id: 'kids',         label: 'Kids & Sysslor', icon: '🎡' },
  { id: 'listor',       label: 'Listor',         icon: '🪣' },
  { id: 'wellness',     label: 'Wellness',       icon: '❤️' },
  { id: 'assistent',    label: 'Assistent',      icon: '🤖' },
  { id: 'installningar',label: 'Inställningar',  icon: '⚙️' },
  { id: 'kravdatabas',  label: 'Kravdatabas',    icon: '📊' },
];

export default function Sidebar({ activePage, onNavigate, members, unreadCount, focus, guestMode, onToggleGuest }) {
  return (
    <div style={{
      width: 240,
      minWidth: 240,
      height: '100vh',
      background: T.sidebar,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            Klara
          </span>
          <span style={{ fontSize: 26, fontWeight: 800, color: T.purple }}>.</span>
        </div>
        <div style={{ fontSize: 12, color: T.sidebarText, marginTop: 4 }}>
          Familjeplanering
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 12px 0' }}>
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.id;
          const showBadge = item.id === 'meddelanden' && unreadCount > 0;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                marginBottom: 2,
                background: isActive ? T.sidebarActive : 'transparent',
                border: 'none',
                borderRadius: T.radiusSm,
                cursor: 'pointer',
                color: isActive ? T.sidebarActiveText : T.sidebarText,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                textAlign: 'left',
                transition: 'background 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = T.sidebarHover;
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {showBadge && (
                <span style={{
                  background: T.purple,
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 7px',
                  minWidth: 18,
                  textAlign: 'center',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Guest mode toggle */}
      <div style={{ padding: '12px 12px 0' }}>
        <button
          onClick={onToggleGuest}
          style={{
            width: '100%', padding: '10px 12px', marginBottom: 2,
            background: guestMode ? T.sidebarActive : 'transparent',
            border: `1px solid ${guestMode ? T.purple : 'rgba(255,255,255,0.10)'}`,
            borderRadius: T.radiusSm, cursor: 'pointer',
            color: guestMode ? T.sidebarActiveText : T.sidebarText,
            fontSize: 13, fontWeight: guestMode ? 600 : 400,
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <span>👤</span>
          <span>{guestMode ? 'Gästläge: PÅ' : 'Gästläge'}</span>
        </button>
      </div>

      {/* Dagens fokus */}
      <div style={{ padding: '16px 12px 24px' }}>
        <div style={{
          background: T.sidebarHover,
          borderRadius: T.radiusSm,
          padding: '14px 14px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.sidebarText, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            ⭐ Dagens fokus
          </div>
          <div style={{ fontSize: 13, color: '#CCCCDD', fontStyle: 'italic', lineHeight: 1.5 }}>
            "{focus}"
          </div>
        </div>
      </div>
    </div>
  );
}
