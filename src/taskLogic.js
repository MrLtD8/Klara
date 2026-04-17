/**
 * taskLogic.js
 *
 * Syfte: Rena (pure) funktioner för att manipulera task- och backlog-arrayer.
 *        Inga hooks, inget JSX, inga sidoeffekter — enbart datamutationslogik.
 *        Alla funktioner returnerar nya arrayer (immutable pattern).
 * Exporterar: makeTask, addTask, deleteTask, moveTask, editTask, filterTasks,
 *             addBacklogItem, deleteBacklogItem, getTasksByLane
 * Beroenden: Inga externa beroenden.
 */

/* ═══ SKAPA TASK ═════════════════════════════════════════════════
 * Fabriks-funktion som skapar ett nytt task-objekt med alla standardfält.
 * Alla fält kan åsidosättas via overrides-parametern.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * makeTask
 * Skapar ett nytt task-objekt med standardvärden. Fält i overrides
 * skriver över standardvärdena.
 *
 * @param {Object} [overrides={}] - Fält att skriva över, t.ex. { title: "Handla", prio: "high" }.
 * @returns {Object} Komplett task-objekt redo att läggas in i tasks-arrayen.
 *
 * @example
 * const t = makeTask({ title: "Ring doktorn", prio: "urgent", lane: "ready" });
 */
export function makeTask(overrides = {}) {
  return {
    id:        Date.now() + Math.random(),
    title:     "",
    desc:      "",
    tags:      [],
    mids:      [],
    prio:      "medium",
    lane:      "ready",
    recur:     "none",
    hideGuest: false,
    order:     0,
    ...overrides,
  };
}

/* ═══ LÄGG TILL TASK ══════════════════════════════════════════════
 * Lägger till ett task i listan. order sätts automatiskt till
 * antalet befintliga tasks i samma lane (hamnar sist).
 * ═══════════════════════════════════════════════════════════════ */
/**
 * addTask
 * Returnerar en ny task-array med det nya task-objektet tillagt sist i sin lane.
 *
 * @param {Object[]} tasks    - Befintlig task-array.
 * @param {Object}   taskData - Task-data (t.ex. från makeTask eller ett formulär).
 * @returns {Object[]} Ny array med task tillagd.
 *
 * @example
 * const updated = addTask(tasks, makeTask({ title: "Diskmaskinen", lane: "ready" }));
 */
export function addTask(tasks, taskData) {
  const order = tasks.filter(t => t.lane === taskData.lane).length;
  return [...tasks, { ...taskData, order }];
}

/* ═══ TA BORT TASK ═══════════════════════════════════════════════
 * Filtrerar bort det task som har det givna id:t.
 * Påverkar inte andra tasks.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * deleteTask
 * Returnerar en ny task-array utan task med det angivna id:t.
 * Om id inte finns returneras arrayen oförändrad.
 *
 * @param {Object[]} tasks - Befintlig task-array.
 * @param {*}        id    - Id för task som ska tas bort.
 * @returns {Object[]} Ny array utan det borttagna task:et.
 *
 * @example
 * const updated = deleteTask(tasks, task.id);
 */
export function deleteTask(tasks, id) {
  return tasks.filter(t => t.id !== id);
}

/* ═══ FLYTTA TASK TILL NY LANE ════════════════════════════════════
 * Uppdaterar lane-fältet på ett specifikt task.
 * Alla andra fält förblir oförändrade.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * moveTask
 * Returnerar en ny task-array där task med det angivna id:t har fått
 * en ny lane.
 *
 * @param {Object[]} tasks   - Befintlig task-array.
 * @param {*}        id      - Id för task att flytta.
 * @param {string}   newLane - Ny lane: "ready" | "progress" | "done".
 * @returns {Object[]} Ny array med uppdaterad lane.
 *
 * @example
 * const updated = moveTask(tasks, task.id, "done");
 */
export function moveTask(tasks, id, newLane) {
  return tasks.map(t => t.id === id ? { ...t, lane: newLane } : t);
}

/* ═══ REDIGERA TASK ══════════════════════════════════════════════
 * Uppdaterar godtyckliga fält på ett specifikt task via ett changes-objekt.
 * Använd detta istället för att direkt mutera task-objektet.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * editTask
 * Returnerar en ny task-array där task med det angivna id:t har fått
 * sina fält uppdaterade med värdena i changes.
 *
 * @param {Object[]} tasks   - Befintlig task-array.
 * @param {*}        id      - Id för task att redigera.
 * @param {Object}   changes - Fält att uppdatera, t.ex. { title: "Ny titel", prio: "urgent" }.
 * @returns {Object[]} Ny array med uppdaterat task.
 *
 * @example
 * const updated = editTask(tasks, task.id, { title: "Ändrad titel", prio: "high" });
 */
export function editTask(tasks, id, changes) {
  return tasks.map(t => t.id === id ? { ...t, ...changes } : t);
}

/* ═══ FILTRERA TASKS ══════════════════════════════════════════════
 * Filtrerar task-listan baserat på gästläge och/eller vald familjemedlem.
 * - I gästläge döljs tasks med hideGuest: true.
 * - Om memberId är satt (inte "all") visas bara tasks tilldelade den personen.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * filterTasks
 * Returnerar en filtrerad kopia av tasks-arrayen.
 *
 * @param {Object[]} tasks               - Befintlig task-array.
 * @param {Object}   opts                - Filtreringsalternativ.
 * @param {boolean}  [opts.guestMode]    - Om true döljs hideGuest-tasks.
 * @param {*}        [opts.memberId]     - Om satt (och inte "all"), visas bara tasks med detta mids-värde.
 * @returns {Object[]} Filtrerad array.
 *
 * @example
 * const visible = filterTasks(tasks, { guestMode: true, memberId: "all" });
 */
export function filterTasks(tasks, { guestMode = false, memberId = "all" } = {}) {
  return tasks.filter(t => {
    if (guestMode && t.hideGuest) return false;
    if (memberId !== "all" && !t.mids.includes(memberId)) return false;
    return true;
  });
}

/* ═══ LÄGG TILL BACKLOG-ITEM ═════════════════════════════════════
 * Lägger till ett objekt i backlog-arrayen.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * addBacklogItem
 * Returnerar en ny backlog-array med item tillagd sist.
 *
 * @param {Object[]} backlog - Befintlig backlog-array.
 * @param {Object}   item    - Item att lägga till (bör ha minst title och prio).
 * @returns {Object[]} Ny array med item tillagd.
 *
 * @example
 * const updated = addBacklogItem(backlog, makeTask({ title: "Renovera badrummet" }));
 */
export function addBacklogItem(backlog, item) {
  return [...backlog, item];
}

/* ═══ TA BORT BACKLOG-ITEM ════════════════════════════════════════
 * Filtrerar bort det backlog-item som har det givna id:t.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * deleteBacklogItem
 * Returnerar en ny backlog-array utan item med det angivna id:t.
 *
 * @param {Object[]} backlog - Befintlig backlog-array.
 * @param {*}        id      - Id för item att ta bort.
 * @returns {Object[]} Ny array utan det borttagna item:et.
 *
 * @example
 * const updated = deleteBacklogItem(backlog, item.id);
 */
export function deleteBacklogItem(backlog, id) {
  return backlog.filter(b => b.id !== id);
}

/* ═══ HÄMTA TASKS PER LANE ════════════════════════════════════════
 * Returnerar tasks i en specifik lane, sorterade på order-fältet
 * (lägst order = överst i kolumnen).
 * ═══════════════════════════════════════════════════════════════ */
/**
 * getTasksByLane
 * Returnerar en ny array med tasks i den angivna lane:en, sorterade
 * på order-fältet i stigande ordning.
 *
 * @param {Object[]} tasks - Befintlig task-array.
 * @param {string}   lane  - Lane att filtrera på: "ready" | "progress" | "done".
 * @returns {Object[]} Sorterad array med tasks i den angivna lane:en.
 *
 * @example
 * const readyTasks = getTasksByLane(tasks, "ready");
 */
export function getTasksByLane(tasks, lane) {
  return tasks
    .filter(t => t.lane === lane)
    .sort((a, b) => a.order - b.order);
}
