import React, { useState } from 'react';
import { useLocalStorage } from '../useLocalStorage';
import { T } from './theme';
import Sidebar from './Sidebar';
import KlaraOnboarding from './Onboarding';
import Hem from './pages/Hem';
import Kalender from './pages/Kalender';
import Uppgifter from './pages/Uppgifter';
import Familj from './pages/Familj';
import Meddelanden from './pages/Meddelanden';
import FilerLankar from './pages/FilerLankar';
import Installningar from './pages/Installningar';
import KravDatabas from './pages/KravDatabas';
import Medicin from './pages/Medicin';
import BilHus from './pages/BilHus';
import Ekonomi from './pages/Ekonomi';
import Kids from './pages/Kids';
import Listor from './pages/Listor';
import Wellness from './pages/Wellness';
import Assistent from './pages/Assistent';
import Appar from './pages/Appar';
import Automationer from './pages/Automationer';
import MailPage from './pages/Mail';
import Garderob from './pages/Garderob';

// ─── Hjälpfunktion för datum ─────────────────────────────────────────────────
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// ─── Standarddata ─────────────────────────────────────────────────────────────
const defaultMembers = [
  { id: 'm1', name: 'Alex',  role: 'Förälder', color: '#7C5CBF', initials: 'A' },
  { id: 'm2', name: 'Sara',  role: 'Förälder', color: '#F97316', initials: 'S' },
  { id: 'm3', name: 'Ella',  role: '12 år',    color: '#22C55E', initials: 'E' },
  { id: 'm4', name: 'Noah',  role: '9 år',     color: '#3B82F6', initials: 'N' },
];

const defaultTasks = [
  { id: 't1', title: 'Boka läkarbesök till Ella',  lane: 'ready',    mids: ['m2'], tags: ['Hälsa'],  prio: 'high', estimate: '2h',      deadline: '', subtasks: [], epic: '' },
  { id: 't2', title: 'Planera sommarlov',           lane: 'ready',    mids: ['m1'], tags: ['Fritid'], prio: 'med',  estimate: 'Halvdag', deadline: '', subtasks: [], epic: '' },
  { id: 't3', title: 'Handla inför helgen',         lane: 'ready',    mids: ['m1'], tags: ['Hem'],    prio: 'low',  estimate: '2h',      deadline: '', subtasks: [], epic: '' },
  { id: 't4', title: 'Lämna in SO-läxa',            lane: 'ready',    mids: ['m3'], tags: ['Skola'],  prio: 'high', estimate: '30 min',  deadline: '', subtasks: [], epic: '' },
  { id: 't5', title: 'Planera fotbollscup',         lane: 'progress', mids: ['m4'], tags: ['Sport'],  prio: 'med',  estimate: 'Halvdag', deadline: '', subtasks: [], epic: '' },
  { id: 't6', title: 'Betala räkningar',            lane: 'done',     mids: ['m1'], tags: ['Hem'],    prio: 'high', estimate: '30 min',  deadline: '', subtasks: [], epic: '' },
  { id: 't7', title: 'Boka tandläkare',             lane: 'done',     mids: ['m2'], tags: ['Hälsa'],  prio: 'med',  estimate: '30 min',  deadline: '', subtasks: [], epic: '' },
];

const defaultEvents = [
  { id: 'e1', title: 'Familjefrukost',       date: daysFromNow(0),  color: '#7C5CBF', memberIds: ['m1','m2','m3','m4'] },
  { id: 'e2', title: 'Fotbollsträning Noah', date: daysFromNow(1),  color: '#3B82F6', memberIds: ['m4'] },
  { id: 'e3', title: 'Ellas pianolektioner', date: daysFromNow(2),  color: '#22C55E', memberIds: ['m3'] },
  { id: 'e4', title: 'Läkarbesök',           date: daysFromNow(3),  color: '#F97316', memberIds: ['m2','m3'] },
  { id: 'e5', title: 'Biokvällen',           date: daysFromNow(4),  color: '#7C5CBF', memberIds: ['m1','m2','m3','m4'] },
  { id: 'e6', title: 'Tandläkare Sara',      date: daysFromNow(5),  color: '#EF4444', memberIds: ['m2'] },
];

const defaultMessages = [
  { id: 'msg1', from: 'm2', text: 'Glöm inte hämta Ella 15:00', time: '10:30', read: false },
  { id: 'msg2', from: 'm3', text: 'Kan vi åka och bowla på fredag?', time: '09:15', read: true  },
];

const defaultFiles = [
  { id: 'f1', name: 'Familjens schema VT2025', type: 'doc',  url: '#' },
  { id: 'f2', name: 'Försäkringsbrev',         type: 'pdf',  url: '#' },
  { id: 'f3', name: 'Recept favoriter',        type: 'link', url: '#' },
];

// ─── Default meny-synlighet ───────────────────────────────────────────────────
const DEFAULT_VISIBLE = {
  hem:           true,   // alltid på
  kalender:      true,
  uppgifter:     true,
  installningar: true,   // alltid på
  // dolda som standard — aktiveras i Hantera appar
  skola:         false,
  filer:         false,
  bilhus:        false,
  ekonomi:       false,
  kids:          false,
  listor:        false,
  wellness:      false,
  assistent:     false,
  automationer:  false,
  mail:          false,
  garderob:      false,
  kravdatabas:   false,
  meddelanden:   false,
  familj:        false,
  medicin:       false,
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function KlaraLayout() {
  const [page, setPage] = useState('hem');
  const [guestMode, setGuestMode] = useState(false);

  const [members,      setMembers]      = useLocalStorage('kl_members',      defaultMembers);
  const [tasks,        setTasks]        = useLocalStorage('kl_tasks',        defaultTasks);
  const [events,       setEvents]       = useLocalStorage('kl_events',       defaultEvents);
  const [messages,     setMessages]     = useLocalStorage('kl_messages',     defaultMessages);
  const [files,        setFiles]        = useLocalStorage('kl_files',        defaultFiles);
  const [focus,        setFocus]        = useLocalStorage('kl_focus',        'En sak i taget gör stor skillnad.');
  const [familyName,   setFamilyName]   = useLocalStorage('kl_family_name',  '');
  const [visiblePages,     setVisiblePages]     = useLocalStorage('kl_visible_pages', DEFAULT_VISIBLE);
  const [showFocus,        setShowFocus]        = useLocalStorage('kl_show_focus',    false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('kl_sidebar_collapsed', false);
  const [onboardingDone,   setOnboardingDone]   = useLocalStorage('kl_onboarding_done', false);

  const unreadCount = messages.filter(m => !m.read).length;

  function handleOnboardingDone({ familyName: fname, members: newMembers, visiblePages: newVisible }) {
    if (fname) setFamilyName(fname);
    if (newMembers?.length) setMembers(newMembers);
    if (newVisible)  setVisiblePages(v => ({ ...v, ...newVisible }));
    setOnboardingDone(true);
  }

  const commonProps = { members, tasks, events, onNavigate: setPage };

  function renderPage() {
    switch (page) {
      case 'hem':          return <Hem {...commonProps} setTasks={setTasks} guestMode={guestMode} familyName={familyName} />;
      case 'kalender':     return <Kalender members={members} />;
      case 'uppgifter':    return <Uppgifter tasks={tasks} setTasks={setTasks} members={members} />;
      case 'familj':       return <Familj members={members} setMembers={setMembers} tasks={tasks} events={events} />;
      case 'meddelanden':  return <Meddelanden messages={messages} setMessages={setMessages} members={members} />;
      case 'filer':        return <FilerLankar files={files} setFiles={setFiles} />;
      case 'installningar':return <Installningar members={members} setMembers={setMembers} focus={focus} setFocus={setFocus} onNavigate={setPage} showFocus={showFocus} setShowFocus={setShowFocus} familyName={familyName} setFamilyName={setFamilyName} />;
      case 'kravdatabas':  return <KravDatabas />;
      case 'medicin':      return <Medicin members={members} guestMode={guestMode} />;
      case 'bilhus':       return <BilHus />;
      case 'ekonomi':      return <Ekonomi guestMode={guestMode} />;
      case 'kids':         return <Kids members={members} />;
      case 'listor':       return <Listor members={members} />;
      case 'wellness':     return <Wellness members={members} />;
      case 'assistent':    return <Assistent members={members} />;
      case 'automationer': return <Automationer members={members} />;
      case 'mail':         return <MailPage />;
      case 'garderob':     return <Garderob members={members} />;
      case 'appar':        return <Appar members={members} tasks={tasks} events={events} visiblePages={visiblePages} setVisiblePages={setVisiblePages} />;
      default: {
        // Installerade extra-appar: 'app:custom_123'
        if (page.startsWith('app:')) {
          return <Appar members={members} tasks={tasks} events={events} visiblePages={visiblePages} setVisiblePages={setVisiblePages} />;
        }
        return <Hem {...commonProps} guestMode={guestMode} />;
      }
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: T.fontBody }}>
      {!onboardingDone && <KlaraOnboarding onDone={handleOnboardingDone} />}
      <Sidebar
        activePage={page}
        onNavigate={setPage}
        members={members}
        unreadCount={unreadCount}
        focus={focus}
        showFocus={showFocus}
        guestMode={guestMode}
        onToggleGuest={() => setGuestMode(g => !g)}
        visiblePages={visiblePages}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />
      <main style={{
        marginLeft: sidebarCollapsed ? 52 : 220,
        transition: 'margin-left 0.2s ease',
        flex: 1,
        minHeight: '100vh',
        background: T.bg,
        overflowY: 'auto',
      }}>
        {renderPage()}
      </main>
    </div>
  );
}
