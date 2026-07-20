// Delade hjälpare för AI-förslag från mail (används av Mail- och Assistent-sidan).
// Servern (runMailDigest) ger varje viktigt mail en lista `suggestions`:
//   [{ type: 'task' | 'event', title, date }]
// Äldre digest-format (suggestTask/suggestEvent) stöds som fallback.

let seq = 0;
const uid = (p) => `${p}_${Date.now()}_${(seq++).toString(36)}`;

/** Normaliserar ett digest-mail till en lista med förslag (nya + äldre format). */
export function mailSuggestions(item) {
  if (Array.isArray(item?.suggestions)) return item.suggestions;
  const out = [];
  if (item?.suggestTask) out.push({ type: 'task', title: item.suggestTask, date: '' });
  if (item?.suggestEvent?.title) out.push({ type: 'event', title: item.suggestEvent.title, date: item.suggestEvent.date });
  return out;
}

/** Stabil nyckel för ett förslag (för att markera "tillagd"). */
export function suggestionKey(mailId, sugg, idx) {
  return `${mailId}::${sugg.type}::${idx}::${sugg.title}`;
}

/** Bygg en Kanban-uppgift av ett förslag. */
export function buildTask(sugg, mail) {
  return {
    id: uid('t'),
    title: sugg.title,
    desc: mail ? `Från mail: ${mail.subject}${mail.from ? ` (${mail.from})` : ''}` : '',
    lane: 'ready', mids: [], tags: ['Mail'], prio: 'med',
    estimate: '', deadline: sugg.date || '', subtasks: [], epic: '', recur: 'none',
  };
}

/** Bygg en kalenderhändelse av ett förslag. */
export function buildEvent(sugg) {
  return {
    id: uid('ev'),
    title: sugg.title, date: sugg.date,
    who: '', type: 'note', recur: 'none',
  };
}
