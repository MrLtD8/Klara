import React, { useState } from 'react';
import { useLocalStorage } from '../useLocalStorage';
import { T } from './theme';
import Sidebar from './Sidebar';
import Hem from './pages/Hem';
import Kalender from './pages/Kalender';
import Uppgifter from './pages/Uppgifter';
import Planering from './pages/Planering';
import Skola from './pages/Skola';
import Familj from './pages/Familj';
import Meddelanden from './pages/Meddelanden';
import FilerLankar from './pages/FilerLankar';
import Installningar from './pages/Installningar';

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
  { id: 't1', title: 'Boka läkarbesök till Ella',  lane: 'ready',    mids: ['m2'], tags: ['Familj'],    prio: 'high' },
  { id: 't2', title: 'Planera sommarlov',           lane: 'ready',    mids: ['m1'], tags: ['Aktivitet'], prio: 'med'  },
  { id: 't3', title: 'Handla inför helgen',         lane: 'ready',    mids: ['m1'], tags: ['Hem'],       prio: 'low'  },
  { id: 't4', title: 'Lämna in SO-läxa',            lane: 'ready',    mids: ['m3'], tags: ['Skola'],     prio: 'high' },
  { id: 't5', title: 'Planera fotbollscup',         lane: 'progress', mids: ['m4'], tags: ['Aktivitet'], prio: 'med'  },
  { id: 't6', title: 'Betala räkningar',            lane: 'done',     mids: ['m1'], tags: ['Ekonomi'],   prio: 'high' },
  { id: 't7', title: 'Boka tandläkare',             lane: 'done',     mids: ['m2'], tags: ['Hälsa'],     prio: 'med'  },
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

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function KlaraLayout() {
  const [page, setPage] = useState('hem');

  const [members,  setMembers]  = useLocalStorage('kl_members',  defaultMembers);
  const [tasks,    setTasks]    = useLocalStorage('kl_tasks',    defaultTasks);
  const [events,   setEvents]   = useLocalStorage('kl_events',   defaultEvents);
  const [school,   setSchool]   = useLocalStorage('kl_school',   []);
  const [messages, setMessages] = useLocalStorage('kl_messages', defaultMessages);
  const [files,    setFiles]    = useLocalStorage('kl_files',    defaultFiles);
  const [focus,    setFocus]    = useLocalStorage('kl_focus',    'En sak i taget gör stor skillnad.');

  const unreadCount = messages.filter(m => !m.read).length;

  const commonProps = { members, tasks, events, onNavigate: setPage };

  function renderPage() {
    switch (page) {
      case 'hem':          return <Hem {...commonProps} />;
      case 'kalender':     return <Kalender events={events} members={members} setEvents={setEvents} />;
      case 'uppgifter':    return <Uppgifter tasks={tasks} setTasks={setTasks} members={members} />;
      case 'planering':    return <Planering events={events} members={members} setEvents={setEvents} />;
      case 'skola':        return <Skola school={school} setSchool={setSchool} members={members} />;
      case 'familj':       return <Familj members={members} setMembers={setMembers} tasks={tasks} events={events} />;
      case 'meddelanden':  return <Meddelanden messages={messages} setMessages={setMessages} members={members} />;
      case 'filer':        return <FilerLankar files={files} setFiles={setFiles} />;
      case 'installningar':return <Installningar members={members} setMembers={setMembers} focus={focus} setFocus={setFocus} />;
      default:             return <Hem {...commonProps} />;
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar
        activePage={page}
        onNavigate={setPage}
        members={members}
        unreadCount={unreadCount}
        focus={focus}
      />
      <main style={{
        marginLeft: 240,
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
