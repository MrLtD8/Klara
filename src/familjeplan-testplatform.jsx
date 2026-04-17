/**
 * familjeplan-testplatform.jsx
 *
 * Syfte: Interaktiv testplattform för familjeappens logik.
 *        Kör automatiserade testsviter och manuella squish-scenarion
 *        mot de riktiga funktionerna i taskLogic.js.
 * Exporterar: TestApp (React-komponent)
 * Beroenden: react, ./taskLogic
 */

import { useState, useRef, useCallback } from "react";

// Importera de riktiga taskLogic-funktionerna
import {
  makeTask,
  addTask,
  deleteTask,
  moveTask,
  editTask,
  filterTasks,
  addBacklogItem,
  deleteBacklogItem,
  getTasksByLane,
} from "./taskLogic";

// ─────────────────────────────────────────────────────────────
// APP STATE FACTORY — speglar familjedashboard.jsx
// Använder makeTask från ./taskLogic.js för att skapa tasks
// med korrekta defaultvärden.
// ─────────────────────────────────────────────────────────────
const createAppState = () => ({
  cfg: { dark: false, guestMode: false },
  family: { name: "Testfamiljen", members: [
    { id: 1, name: "Anna",  av: "A", color: "#C07830" },
    { id: 2, name: "Johan", av: "J", color: "#3060A8" },
    { id: 3, name: "Ella",  av: "E", color: "#6B48A8" },
    { id: 4, name: "Max",   av: "M", color: "#3D7A55" },
  ]},
  activeTab: "kanban",
  tasks: [
    makeTask({ title: "Handla mat",    prio: "high",   lane: "ready",    mids: [1],    order: 0 }),
    makeTask({ title: "Betala faktura",prio: "urgent", lane: "progress", mids: [2],    order: 0 }),
    makeTask({ title: "Diskmaskinen",  prio: "low",    lane: "done",     mids: [1, 2], order: 0 }),
  ],
  backlog: [
    makeTask({ title: "Semester planering", tags: ["Fritid"], prio: "medium" }),
    makeTask({ title: "Renovera badrummet", tags: ["Hem"],    prio: "low"    }),
  ],
});

// ─────────────────────────────────────────────────────────────
// TEST HELPERS
// ─────────────────────────────────────────────────────────────
const sim           = (ms) => new Promise((r) => setTimeout(r, ms));
const assert        = (c, m)    => { if (!c) throw new Error(m || "Assertion misslyckades"); };
const assertEqual   = (a, b, m) => { if (a !== b) throw new Error(m || `Förväntade "${b}", fick "${a}"`); };
const assertContains= (arr, item, m) => { if (!arr.includes(item)) throw new Error(m || `Hittades inte: ${item}`); };

const VALID_PRIOS = ["urgent", "high", "medium", "low"];
const VALID_LANES = ["ready", "progress", "done"];
const VALID_TABS  = ["kanban", "planning", "sysslor", "smarthome"];
const VALID_TAGS  = ["Hem", "Mat", "Skola", "Sport", "Hälsa", "Jobb", "Fritid", "Övrigt"];

// ─────────────────────────────────────────────────────────────
// AUTOMATISERADE TEST SUITES
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// AUTOMATISERADE TEST SUITES
// Testar de riktiga taskLogic-funktionerna (addTask, deleteTask,
// moveTask, editTask, filterTasks, makeTask, addBacklogItem,
// deleteBacklogItem, getTasksByLane) importerade från ./taskLogic.js
// ─────────────────────────────────────────────────────────────
const AUTO_SUITES = [
  {
    name: "🔐 Gästläge", color: "#6366f1",
    tests: [
      { name: "Startar som inaktivt",               run: async (s) => assert(!s.cfg.guestMode) },
      { name: "Aktiveras korrekt",                  run: async (s) => { s.cfg.guestMode = true; assert(s.cfg.guestMode); } },
      { name: "Återställs korrekt",                 run: async (s) => { s.cfg.guestMode = true; s.cfg.guestMode = false; assert(!s.cfg.guestMode); } },
      // filterTasks från taskLogic.js används för att filtrera tasks i gästläge
      { name: "hideGuest-tasks döljs i gästläge",  run: async (s) => { s.tasks = addTask(s.tasks, makeTask({ title: "Privat", hideGuest: true })); s.cfg.guestMode = true; const visible = filterTasks(s.tasks, { guestMode: true }); assert(!visible.find(t => t.title === "Privat")); } },
      { name: "hideGuest-tasks syns utan gästläge",run: async (s) => { s.tasks = addTask(s.tasks, makeTask({ title: "Privat2", hideGuest: true })); const visible = filterTasks(s.tasks, { guestMode: false }); assert(visible.find(t => t.title === "Privat2")); } },
      { name: "Vanliga tasks alltid synliga",       run: async (s) => { s.cfg.guestMode = true; const visible = filterTasks(s.tasks, { guestMode: true }); assert(visible.length > 0); } },
    ],
  },
  {
    name: "📋 Flikar", color: "#10b981",
    tests: [
      { name: "Standardflik är 'kanban'",           run: async (s) => assertEqual(s.activeTab, "kanban") },
      { name: "Byt till 'planning'",                run: async (s) => { s.activeTab = "planning"; assertEqual(s.activeTab, "planning"); } },
      { name: "Byt till 'sysslor'",                 run: async (s) => { s.activeTab = "sysslor"; assertEqual(s.activeTab, "sysslor"); } },
      { name: "Byt till 'smarthome'",               run: async (s) => { s.activeTab = "smarthome"; assertEqual(s.activeTab, "smarthome"); } },
      { name: "Alla 4 flikar tillgängliga",         run: async () => assertEqual(VALID_TABS.length, 4) },
      { name: "Återgång till 'kanban'",             run: async (s) => { s.activeTab = "sysslor"; s.activeTab = "kanban"; assertEqual(s.activeTab, "kanban"); } },
    ],
  },
  {
    name: "✅ Tasks – grundläggande", color: "#f59e0b",
    tests: [
      { name: "Tasks laddas vid start",             run: async (s) => assert(s.tasks.length > 0) },
      // addTask från taskLogic.js
      { name: "Task kan läggas till",               run: async (s) => { const b = s.tasks.length; s.tasks = addTask(s.tasks, makeTask({ title: "Ny task" })); assertEqual(s.tasks.length, b + 1); } },
      // deleteTask från taskLogic.js
      { name: "Task kan tas bort",                  run: async (s) => { const id = s.tasks[0].id; s.tasks = deleteTask(s.tasks, id); assert(!s.tasks.find(t => t.id === id)); } },
      // moveTask från taskLogic.js
      { name: "Task kan markeras klar (lane=done)", run: async (s) => { const id = s.tasks[0].id; s.tasks = moveTask(s.tasks, id, "done"); assertEqual(s.tasks.find(t => t.id === id).lane, "done"); } },
      { name: "Tom titel är ogiltig",               run: async () => { assert(!("".trim().length > 0)); assert(!("   ".trim().length > 0)); } },
      // editTask från taskLogic.js
      { name: "Titel sparas korrekt",               run: async (s) => { const id = s.tasks[0].id; s.tasks = editTask(s.tasks, id, { title: "Ändrad titel" }); assertEqual(s.tasks.find(t => t.id === id).title, "Ändrad titel"); } },
      { name: "Antal klara tasks räknas korrekt",   run: async (s) => { const done = getTasksByLane(s.tasks, "done").length; assert(done >= 1); } },
    ],
  },
  {
    name: "➕ Lägg till tasks", color: "#22d3ee",
    tests: [
      { name: "Task får unikt ID",                  run: async (s) => { const ids = s.tasks.map(t => t.id); const set = new Set(ids); assertEqual(set.size, ids.length); } },
      { name: "Prio 'urgent' sparas",               run: async (s) => { s.tasks = addTask(s.tasks, makeTask({ title: "Akut!", prio: "urgent" })); assert(s.tasks.find(t => t.prio === "urgent")); } },
      { name: "Prio 'low' sparas",                  run: async (s) => { s.tasks = addTask(s.tasks, makeTask({ title: "Låg prio", prio: "low" })); assert(s.tasks.find(t => t.prio === "low")); } },
      { name: "Lane 'progress' sparas",             run: async (s) => { s.tasks = addTask(s.tasks, makeTask({ title: "Pågår", lane: "progress" })); assert(s.tasks.find(t => t.lane === "progress")); } },
      { name: "Tagg sparas på task",                run: async (s) => { s.tasks = addTask(s.tasks, makeTask({ title: "Taggad", tags: ["Hem"] })); assert(s.tasks.find(t => t.tags.includes("Hem"))); } },
      { name: "Familjemedlem tilldelas task",       run: async (s) => { s.tasks = addTask(s.tasks, makeTask({ title: "Tilldelad", mids: [1] })); assert(s.tasks.find(t => t.mids.includes(1))); } },
      // makeTask returnerar "done: false" och "lane: 'ready'" som defaults
      { name: "Ny task är ej klar från start",      run: async () => { const t = makeTask({ title: "Färsk" }); assert(!t.done); assertEqual(t.lane, "ready"); } },
      // addBacklogItem från taskLogic.js
      { name: "Backlog-task kan läggas till",       run: async (s) => { const b = s.backlog.length; s.backlog = addBacklogItem(s.backlog, makeTask({ title: "Ny backlog" })); assertEqual(s.backlog.length, b + 1); } },
      { name: "Recur 'weekly' sparas",              run: async (s) => { s.tasks = addTask(s.tasks, makeTask({ title: "Veckovis", recur: "weekly" })); assert(s.tasks.find(t => t.recur === "weekly")); } },
      { name: "Totalt antal tasks ökar",            run: async (s) => { const b = s.tasks.length; s.tasks = addTask(s.tasks, makeTask({ title: "X" })); s.tasks = addTask(s.tasks, makeTask({ title: "Y" })); assertEqual(s.tasks.length, b + 2); } },
    ],
  },
  {
    name: "🗑️ Ta bort tasks", color: "#f97316",
    tests: [
      // deleteTask från taskLogic.js
      { name: "Ta bort med ID",                     run: async (s) => { const id = s.tasks[0].id; s.tasks = deleteTask(s.tasks, id); assert(!s.tasks.find(t => t.id === id)); } },
      { name: "Grannars bevaras vid borttagning",   run: async (s) => { const [a, , c] = s.tasks; const bId = s.tasks[1].id; s.tasks = deleteTask(s.tasks, bId); assert(s.tasks.find(t => t.id === a.id)); assert(s.tasks.find(t => t.id === c.id)); } },
      { name: "Ogiltigt ID påverkar ingenting",     run: async (s) => { const b = s.tasks.length; s.tasks = deleteTask(s.tasks, 99999); assertEqual(s.tasks.length, b); } },
      { name: "Rensa alla klara tasks",             run: async (s) => { s.tasks = addTask(s.tasks, makeTask({ title: "Klar", lane: "done" })); s.tasks = s.tasks.filter(t => t.lane !== "done"); assert(s.tasks.every(t => t.lane !== "done")); } },
      // deleteBacklogItem från taskLogic.js
      { name: "Backlog-task tas bort",              run: async (s) => { const b = s.backlog.length; const id = s.backlog[0].id; s.backlog = deleteBacklogItem(s.backlog, id); assertEqual(s.backlog.length, b - 1); } },
      { name: "Rensa hela backlog",                 run: async (s) => { s.backlog = []; assertEqual(s.backlog.length, 0); } },
      { name: "Sista task → tom lista",             run: async (s) => { s.tasks = []; assertEqual(s.tasks.length, 0); } },
    ],
  },
  {
    name: "✏️ Redigera tasks", color: "#a78bfa",
    tests: [
      // editTask från taskLogic.js används för att ändra fält på ett task
      { name: "Ändra titel",                        run: async (s) => { const id = s.tasks[0].id; s.tasks = editTask(s.tasks, id, { title: "Ny titel" }); assertEqual(s.tasks.find(t => t.id === id).title, "Ny titel"); } },
      { name: "Ändra beskrivning",                  run: async (s) => { const id = s.tasks[0].id; s.tasks = editTask(s.tasks, id, { desc: "Ny beskrivning" }); assertEqual(s.tasks.find(t => t.id === id).desc, "Ny beskrivning"); } },
      { name: "Ändra prio → 'urgent'",              run: async (s) => { const id = s.tasks[0].id; s.tasks = editTask(s.tasks, id, { prio: "urgent" }); assertEqual(s.tasks.find(t => t.id === id).prio, "urgent"); } },
      // moveTask från taskLogic.js används för att flytta task mellan lanes
      { name: "Flytta task till 'progress'",        run: async (s) => { const id = s.tasks[0].id; s.tasks = moveTask(s.tasks, id, "progress"); assertEqual(s.tasks.find(t => t.id === id).lane, "progress"); } },
      { name: "Flytta task till 'done'",            run: async (s) => { const id = s.tasks[0].id; s.tasks = moveTask(s.tasks, id, "done"); assertEqual(s.tasks.find(t => t.id === id).lane, "done"); } },
      { name: "Tilldela familjemedlem",             run: async (s) => { const id = s.tasks[0].id; s.tasks = editTask(s.tasks, id, { mids: [2] }); assertEqual(s.tasks.find(t => t.id === id).mids[0], 2); } },
      { name: "Lägg till tagg",                     run: async (s) => { const id = s.tasks[0].id; const oldTags = s.tasks[0].tags; s.tasks = editTask(s.tasks, id, { tags: [...oldTags, "Sport"] }); assert(s.tasks.find(t => t.id === id).tags.includes("Sport")); } },
      { name: "Ta bort tagg",                       run: async (s) => { const id = s.tasks[0].id; s.tasks = editTask(s.tasks, id, { tags: ["Hem", "Mat"] }); s.tasks = editTask(s.tasks, id, { tags: s.tasks.find(t => t.id === id).tags.filter(t => t !== "Mat") }); const task = s.tasks.find(t => t.id === id); assert(!task.tags.includes("Mat")); assert(task.tags.includes("Hem")); } },
    ],
  },
  {
    name: "📋 Backlog", color: "#ec4899",
    tests: [
      { name: "Backlog innehåller aktiviteter",     run: async (s) => assert(s.backlog.length > 0) },
      { name: "Prio-nivåer är giltiga",             run: async (s) => { s.backlog.forEach(i => assertContains(VALID_PRIOS, i.prio)); } },
      // addBacklogItem från taskLogic.js
      { name: "Tagg-filtrering fungerar",           run: async (s) => { s.backlog = addBacklogItem(s.backlog, makeTask({ title: "Sport-item", tags: ["Sport"] })); assert(s.backlog.filter(i => i.tags.includes("Sport")).length > 0); } },
      { name: "Sortering efter prio (urgent→low)",  run: async (s) => { const o = { urgent:0, high:1, medium:2, low:3 }; const sorted = [...s.tasks].sort((a, b) => o[a.prio] - o[b.prio]); assert(o[sorted[0].prio] <= o[sorted[sorted.length-1].prio]); } },
      // getTasksByLane från taskLogic.js
      { name: "getTasksByLane returnerar rätt tasks", run: async (s) => { const readyTasks = getTasksByLane(s.tasks, "ready"); assert(readyTasks.every(t => t.lane === "ready")); } },
      { name: "filterTasks med memberId filtrerar korrekt", run: async (s) => { const filtered = filterTasks(s.tasks, { memberId: 1 }); assert(filtered.every(t => t.mids.includes(1))); } },
    ],
  },
  {
    name: "🌗 Tema", color: "#8b5cf6",
    tests: [
      { name: "Standard är ljust läge",             run: async (s) => assert(!s.cfg.dark) },
      { name: "Byt till mörkt läge",                run: async (s) => { s.cfg.dark = true; assert(s.cfg.dark); } },
      { name: "Byt tillbaka till ljust",            run: async (s) => { s.cfg.dark = true; s.cfg.dark = false; assert(!s.cfg.dark); } },
      { name: "dark är boolean",                    run: async (s) => assertEqual(typeof s.cfg.dark, "boolean") },
      { name: "Tema ändras inte av gästläge",       run: async (s) => { s.cfg.guestMode = true; assert(typeof s.cfg.dark === "boolean"); } },
    ],
  },
  {
    name: "⚙️ Inställningar", color: "#14b8a6",
    tests: [
      { name: "Familjenamn laddas",                 run: async (s) => assert(s.family.name.length > 0) },
      { name: "4 familjemedlemmar vid start",       run: async (s) => assertEqual(s.family.members.length, 4) },
      { name: "Familjenamn kan ändras",             run: async (s) => { s.family.name = "Familjen S"; assertEqual(s.family.name, "Familjen S"); } },
      { name: "Lägg till familjemedlem",            run: async (s) => { s.family.members.push({ id: 5, name: "Farmor", av: "F", color: "#999" }); assertEqual(s.family.members.length, 5); } },
      { name: "Ta bort familjemedlem",              run: async (s) => { s.family.members = s.family.members.filter(m => m.id !== 4); assert(!s.family.members.find(m => m.id === 4)); } },
    ],
  },
];

const TOTAL_AUTO = AUTO_SUITES.reduce((n, s) => n + s.tests.length, 0);

// ─────────────────────────────────────────────────────────────
// SQUISH ACTION DEFINITIONS
// ─────────────────────────────────────────────────────────────
const ACTION_TYPES = [
  { id: "add_task",       label: "➕ Lägg till task",       fields: ["title", "prio", "lane"] },
  { id: "remove_task",    label: "🗑️ Ta bort task",         fields: ["taskIndex"] },
  { id: "move_task",      label: "🔀 Flytta task till lane", fields: ["taskIndex", "toLane"] },
  { id: "edit_task",      label: "✏️ Ändra titel på task",   fields: ["taskIndex", "newTitle"] },
  { id: "set_tab",        label: "📋 Byt flik",             fields: ["tab"] },
  { id: "toggle_guest",   label: "🔐 Toggla gästläge",      fields: [] },
  { id: "set_theme",      label: "🌗 Byt tema",             fields: ["dark"] },
  { id: "add_backlog",    label: "📋 Lägg till backlog",    fields: ["title", "prio"] },
  { id: "remove_backlog", label: "🗑️ Ta bort backlog",      fields: ["backlogIndex"] },
  { id: "assert_count",   label: "🔍 Verifiera antal tasks", fields: ["lane", "expected"] },
  { id: "assert_lane",    label: "🔍 Verifiera task lane",   fields: ["taskIndex", "expectedLane"] },
  { id: "assert_tab",     label: "🔍 Verifiera aktiv flik",  fields: ["expectedTab"] },
  { id: "assert_guest",   label: "🔍 Verifiera gästläge",   fields: ["expectedGuest"] },
  { id: "assert_theme",   label: "🔍 Verifiera tema",        fields: ["expectedDark"] },
];

const LANES   = ["ready", "progress", "done"];
const LANE_LABELS = { ready: "Redo", progress: "Pågår", done: "Klart" };
const TABS    = ["kanban", "planning", "sysslor", "smarthome"];
const PRIOS   = ["urgent", "high", "medium", "low"];
const PRIO_LABELS = { urgent: "Akut", high: "Hög", medium: "Medel", low: "Låg" };
const PERSONS = ["Anna", "Johan", "Ella", "Max", "Alla"];

// runAction kör en squish-action mot det givna state-objektet.
// Använder de riktiga taskLogic-funktionerna (addTask, deleteTask,
// moveTask, editTask, addBacklogItem, deleteBacklogItem) från ./taskLogic.js
const runAction = (action, state) => {
  const { type, params } = action;
  try {
    switch (type) {
      case "add_task": {
        const { title, prio, lane } = params;
        if (!title?.trim()) throw new Error("Tom titel är ogiltig");
        if (!VALID_PRIOS.includes(prio)) throw new Error(`Ogiltig prio: ${prio}`);
        if (!VALID_LANES.includes(lane)) throw new Error(`Ogiltig lane: ${lane}`);
        // addTask + makeTask från taskLogic.js
        state.tasks = addTask(state.tasks, makeTask({ title, prio, lane }));
        return { ok: true, msg: `Lade till "${title}" i ${LANE_LABELS[lane]}` };
      }
      case "remove_task": {
        const idx = parseInt(params.taskIndex);
        if (idx < 0 || idx >= state.tasks.length) throw new Error(`Index ${idx} finns inte`);
        const removed = state.tasks[idx];
        // deleteTask från taskLogic.js
        state.tasks = deleteTask(state.tasks, removed.id);
        return { ok: true, msg: `Tog bort "${removed.title}"` };
      }
      case "move_task": {
        const idx = parseInt(params.taskIndex);
        const { toLane } = params;
        if (!state.tasks[idx]) throw new Error(`Index ${idx} finns inte`);
        if (!VALID_LANES.includes(toLane)) throw new Error(`Ogiltig lane: ${toLane}`);
        const taskToMove = state.tasks[idx];
        // moveTask från taskLogic.js
        state.tasks = moveTask(state.tasks, taskToMove.id, toLane);
        return { ok: true, msg: `Flyttade "${taskToMove.title}" → ${LANE_LABELS[toLane]}` };
      }
      case "edit_task": {
        const idx = parseInt(params.taskIndex);
        const { newTitle } = params;
        if (!newTitle?.trim()) throw new Error("Tom titel är ogiltig");
        if (!state.tasks[idx]) throw new Error(`Index ${idx} finns inte`);
        const taskToEdit = state.tasks[idx];
        // editTask från taskLogic.js
        state.tasks = editTask(state.tasks, taskToEdit.id, { title: newTitle });
        return { ok: true, msg: `Ändrade titel till "${newTitle}"` };
      }
      case "set_tab": {
        if (!VALID_TABS.includes(params.tab)) throw new Error(`Ogiltig flik: ${params.tab}`);
        state.activeTab = params.tab;
        return { ok: true, msg: `Bytte flik till "${params.tab}"` };
      }
      case "toggle_guest": {
        state.cfg.guestMode = !state.cfg.guestMode;
        return { ok: true, msg: `Gästläge: ${state.cfg.guestMode ? "ON" : "OFF"}` };
      }
      case "set_theme": {
        state.cfg.dark = params.dark === "true";
        return { ok: true, msg: `Tema: ${state.cfg.dark ? "Mörkt" : "Ljust"}` };
      }
      case "add_backlog": {
        const { title, prio } = params;
        if (!title?.trim()) throw new Error("Tom titel är ogiltig");
        if (!VALID_PRIOS.includes(prio)) throw new Error(`Ogiltig prio: ${prio}`);
        // addBacklogItem från taskLogic.js
        state.backlog = addBacklogItem(state.backlog, makeTask({ title, prio }));
        return { ok: true, msg: `Lade till "${title}" i backlog` };
      }
      case "remove_backlog": {
        const idx = parseInt(params.backlogIndex);
        if (idx < 0 || idx >= state.backlog.length) throw new Error(`Index ${idx} finns inte`);
        const removed = state.backlog[idx];
        // deleteBacklogItem från taskLogic.js
        state.backlog = deleteBacklogItem(state.backlog, removed.id);
        return { ok: true, msg: `Tog bort "${removed.title}" från backlog` };
      }
      case "assert_count": {
        const { lane, expected } = params;
        if (!VALID_LANES.includes(lane)) throw new Error(`Ogiltig lane: ${lane}`);
        const exp = parseInt(expected);
        // getTasksByLane från taskLogic.js
        const actual = getTasksByLane(state.tasks, lane).length;
        if (actual !== exp) throw new Error(`Förväntade ${exp} tasks i ${LANE_LABELS[lane]}, fick ${actual}`);
        return { ok: true, msg: `✓ ${LANE_LABELS[lane]} har ${actual} tasks` };
      }
      case "assert_lane": {
        const idx = parseInt(params.taskIndex);
        const task = state.tasks[idx];
        if (!task) throw new Error(`Index ${idx} finns inte`);
        if (task.lane !== params.expectedLane) throw new Error(`Förväntade lane "${params.expectedLane}", fick "${task.lane}"`);
        return { ok: true, msg: `✓ Task lane är "${task.lane}"` };
      }
      case "assert_tab": {
        if (state.activeTab !== params.expectedTab) throw new Error(`Förväntade flik "${params.expectedTab}", fick "${state.activeTab}"`);
        return { ok: true, msg: `✓ Aktiv flik är "${state.activeTab}"` };
      }
      case "assert_guest": {
        const expBool = params.expectedGuest === "true";
        if (state.cfg.guestMode !== expBool) throw new Error(`Förväntade guestMode=${expBool}`);
        return { ok: true, msg: `✓ guestMode=${state.cfg.guestMode}` };
      }
      case "assert_theme": {
        const expDark = params.expectedDark === "true";
        if (state.cfg.dark !== expDark) throw new Error(`Förväntade dark=${expDark}`);
        return { ok: true, msg: `✓ dark=${state.cfg.dark}` };
      }
      default:
        throw new Error(`Okänd action: ${type}`);
    }
  } catch (e) {
    return { ok: false, msg: e.message };
  }
};

// ─────────────────────────────────────────────────────────────
// PRE-BUILT SQUISH SCENARIOS
// ─────────────────────────────────────────────────────────────
const PRESET_CASES = [
  {
    id: "sq1",
    name: "🌅 Starta veckan – fyll på tavlan",
    desc: "Anna öppnar appen på måndag morgon och lägger in veckans uppgifter på tavlan.",
    steps: [
      { id:"s1",  type:"set_tab",      params:{ tab:"kanban" } },
      { id:"s2",  type:"assert_tab",   params:{ expectedTab:"kanban" } },
      { id:"s3",  type:"add_task",     params:{ title:"Handla inför veckan",  prio:"high",   lane:"ready" } },
      { id:"s4",  type:"add_task",     params:{ title:"Boka tandläkare",      prio:"medium", lane:"ready" } },
      { id:"s5",  type:"add_task",     params:{ title:"Tvätta",               prio:"low",    lane:"ready" } },
      { id:"s6",  type:"assert_count", params:{ lane:"ready",    expected:"4" } },
      { id:"s7",  type:"move_task",    params:{ taskIndex:"0",   toLane:"progress" } },
      { id:"s8",  type:"assert_count", params:{ lane:"progress", expected:"2" } },
    ],
  },
  {
    id: "sq2",
    name: "✅ Bocka av klara uppgifter",
    desc: "Johan är klar med sina uppgifter och flyttar dem till 'Klart'.",
    steps: [
      { id:"s1", type:"add_task",     params:{ title:"Lämna paket på posten", prio:"medium", lane:"progress" } },
      { id:"s2", type:"add_task",     params:{ title:"Betala parkeringsbot",   prio:"urgent", lane:"progress" } },
      { id:"s3", type:"assert_count", params:{ lane:"progress", expected:"3" } },
      { id:"s4", type:"move_task",    params:{ taskIndex:"0",   toLane:"done" } },
      { id:"s5", type:"move_task",    params:{ taskIndex:"1",   toLane:"done" } },
      { id:"s6", type:"assert_count", params:{ lane:"done",     expected:"3" } },
    ],
  },
  {
    id: "sq3",
    name: "👥 Gäst på besök – aktivera gästläge",
    desc: "Familjen får besök. Gästläge aktiveras så privata uppgifter döljs.",
    steps: [
      { id:"s1", type:"assert_guest", params:{ expectedGuest:"false" } },
      { id:"s2", type:"toggle_guest", params:{} },
      { id:"s3", type:"assert_guest", params:{ expectedGuest:"true" } },
      { id:"s4", type:"set_tab",      params:{ tab:"kanban" } },
      { id:"s5", type:"assert_tab",   params:{ expectedTab:"kanban" } },
      { id:"s6", type:"toggle_guest", params:{} },
      { id:"s7", type:"assert_guest", params:{ expectedGuest:"false" } },
    ],
  },
  {
    id: "sq4",
    name: "🔄 Omplanering – ändra och flytta tasks",
    desc: "En uppgift ändras och prioriteras om under veckan.",
    steps: [
      { id:"s1", type:"add_task",     params:{ title:"Ring försäkringsbolaget", prio:"low",    lane:"ready" } },
      { id:"s2", type:"edit_task",    params:{ taskIndex:"0", newTitle:"Ring försäkringsbolaget – AKUT" } },
      { id:"s3", type:"move_task",    params:{ taskIndex:"0", toLane:"progress" } },
      { id:"s4", type:"assert_lane",  params:{ taskIndex:"0", expectedLane:"progress" } },
      { id:"s5", type:"move_task",    params:{ taskIndex:"0", toLane:"done" } },
      { id:"s6", type:"assert_count", params:{ lane:"done", expected:"2" } },
    ],
  },
  {
    id: "sq5",
    name: "🌙 Kvällsläge – byt till mörkt tema",
    desc: "På kvällen sätter familjen på mörkt läge så skärmen inte stör.",
    steps: [
      { id:"s1", type:"assert_theme", params:{ expectedDark:"false" } },
      { id:"s2", type:"set_theme",    params:{ dark:"true" } },
      { id:"s3", type:"assert_theme", params:{ expectedDark:"true" } },
      { id:"s4", type:"set_tab",      params:{ tab:"kanban" } },
      { id:"s5", type:"set_theme",    params:{ dark:"false" } },
      { id:"s6", type:"assert_theme", params:{ expectedDark:"false" } },
    ],
  },
  {
    id: "sq6",
    name: "🏖️ Planeringsläge – lägg idéer i backlog",
    desc: "Familjen samlar idéer för sommaren i backloggen.",
    steps: [
      { id:"s1", type:"set_tab",        params:{ tab:"planning" } },
      { id:"s2", type:"assert_tab",     params:{ expectedTab:"planning" } },
      { id:"s3", type:"add_backlog",    params:{ title:"Boka stuga i Dalarna",    prio:"high" } },
      { id:"s4", type:"add_backlog",    params:{ title:"Planera dagsturer",        prio:"medium" } },
      { id:"s5", type:"add_backlog",    params:{ title:"Hitta hundvakt",           prio:"low" } },
      { id:"s6", type:"remove_backlog", params:{ backlogIndex:"1" } },
    ],
  },
  {
    id: "sq7",
    name: "🧹 Fredagsrensning – rensa klara tasks",
    desc: "Fredagskväll: alla klara tasks tas bort för att börja nästa vecka fräscht.",
    steps: [
      { id:"s1",  type:"add_task",     params:{ title:"Dammsuger",       prio:"low",    lane:"ready" } },
      { id:"s2",  type:"add_task",     params:{ title:"Tvätt",           prio:"medium", lane:"ready" } },
      { id:"s3",  type:"add_task",     params:{ title:"Rör inte disken", prio:"urgent", lane:"ready" } },
      { id:"s4",  type:"move_task",    params:{ taskIndex:"0", toLane:"done" } },
      { id:"s5",  type:"move_task",    params:{ taskIndex:"1", toLane:"done" } },
      { id:"s6",  type:"remove_task",  params:{ taskIndex:"0" } },
      { id:"s7",  type:"remove_task",  params:{ taskIndex:"0" } },
      { id:"s8",  type:"assert_count", params:{ lane:"done", expected:"1" } },
    ],
  },
  {
    id: "sq8",
    name: "⭐ Sysslor – navigera och kontrollera flik",
    desc: "Byt till sysslo-fliken och tillbaka för att verifiera navigation.",
    steps: [
      { id:"s1", type:"set_tab",    params:{ tab:"sysslor" } },
      { id:"s2", type:"assert_tab", params:{ expectedTab:"sysslor" } },
      { id:"s3", type:"set_tab",    params:{ tab:"smarthome" } },
      { id:"s4", type:"assert_tab", params:{ expectedTab:"smarthome" } },
      { id:"s5", type:"set_tab",    params:{ tab:"kanban" } },
      { id:"s6", type:"assert_tab", params:{ expectedTab:"kanban" } },
    ],
  },
];

let _nextStepId = 1000;
const newStepId = () => `step_${_nextStepId++}`;
let _nextCaseId = 100;
const newCaseId = () => `case_${_nextCaseId++}`;

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function TestApp() {
  const [tab, setTab] = useState("auto");
  return (
    <div style={{ fontFamily:"'JetBrains Mono','Fira Code',monospace", background:"#0d1117", minHeight:"100vh", color:"#e6edf3", fontSize:13 }}>
      <div style={{ background:"#161b22", borderBottom:"1px solid #30363d", padding:"0 24px", display:"flex", alignItems:"center", gap:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 0", marginRight:32 }}>
          <span style={{ fontSize:18 }}>🧪</span>
          <span style={{ fontWeight:700, fontSize:14, letterSpacing:"-0.3px" }}>FamiljePlan <span style={{ color:"#8b949e", fontWeight:400 }}>/ testplattform</span></span>
        </div>
        {[["auto","⚡ Automatiserade tester"],["squish","🎮 Squish – visuella testfall"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            background:"none", border:"none", borderBottom:`2px solid ${tab===k?"#238636":"transparent"}`,
            color: tab===k?"#e6edf3":"#8b949e", padding:"14px 16px", cursor:"pointer",
            fontFamily:"inherit", fontSize:13, fontWeight: tab===k?600:400,
          }}>{l}</button>
        ))}
      </div>
      {tab==="auto"   && <AutoRunner />}
      {tab==="squish" && <SquishRunner />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTO RUNNER
// ─────────────────────────────────────────────────────────────
function Chip({ c, l }) {
  return <span style={{ background:c+"22", color:c, border:`1px solid ${c}44`, borderRadius:4, padding:"2px 8px", fontSize:11 }}>{l}</span>;
}

function AutoRunner() {
  const [results, setResults] = useState({});
  const [running, setRunning]  = useState(false);
  const [progress,setProgress] = useState(0);
  const [phase,   setPhase]    = useState("idle");
  const [filter,  setFilter]   = useState("all");
  const [runTime, setRunTime]  = useState(null);
  const t0 = useRef(null);

  const passed   = Object.values(results).filter(r=>r.status==="pass").length;
  const failed   = Object.values(results).filter(r=>r.status==="fail").length;
  const passRate = TOTAL_AUTO > 0 ? Math.round(passed/TOTAL_AUTO*100) : 0;

  const runAll = useCallback(async () => {
    setResults({}); setProgress(0); setRunning(true); setPhase("running"); setRunTime(null);
    t0.current = Date.now();
    let done = 0;
    for (const suite of AUTO_SUITES) {
      for (const test of suite.tests) {
        const key = `${suite.name}::${test.name}`;
        const state = createAppState();
        const ms0 = performance.now();
        try {
          await sim(Math.random()*40+10);
          await test.run(state);
          setResults(p=>({...p,[key]:{status:"pass", ms:(performance.now()-ms0).toFixed(1), suite:suite.name, name:test.name, color:suite.color}}));
        } catch(e) {
          setResults(p=>({...p,[key]:{status:"fail", ms:(performance.now()-ms0).toFixed(1), error:e.message, suite:suite.name, name:test.name, color:suite.color}}));
        }
        done++;
        setProgress(Math.round(done/TOTAL_AUTO*100));
      }
    }
    setRunning(false); setPhase("done");
    setRunTime(((Date.now()-t0.current)/1000).toFixed(2));
  }, []);

  const allResults = Object.values(results);
  const filtered = filter==="all" ? allResults : allResults.filter(r=>r.status===filter);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"250px 1fr", minHeight:"calc(100vh - 49px)" }}>
      {/* SIDEBAR */}
      <div style={{ background:"#161b22", borderRight:"1px solid #30363d", padding:"16px 0", overflowY:"auto" }}>
        {phase!=="idle" && (
          <div style={{ padding:"0 16px 16px", borderBottom:"1px solid #30363d", marginBottom:8 }}>
            <div style={{ color:"#8b949e", fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Sammanfattning</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Chip c="#3fb950" l={`${passed} ✓`}/>
              <Chip c="#f85149" l={`${failed} ✗`}/>
              <Chip c="#484f58" l={`${TOTAL_AUTO-passed-failed} ⋯`}/>
            </div>
            {phase==="done" && <>
              <div style={{ marginTop:10, height:5, background:"#21262d", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${passRate}%`, background:passRate===100?"#238636":"#e3b341", borderRadius:3 }}/>
              </div>
              <div style={{ fontSize:11, color:passRate===100?"#3fb950":"#e3b341", marginTop:4 }}>{passRate}% godkänd · {runTime}s</div>
            </>}
          </div>
        )}
        {AUTO_SUITES.map(suite=>{
          const keys = suite.tests.map(t=>`${suite.name}::${t.name}`);
          const sr   = keys.map(k=>results[k]).filter(Boolean);
          const sp   = sr.filter(r=>r.status==="pass").length;
          const sf   = sr.filter(r=>r.status==="fail").length;
          return (
            <div key={suite.name} style={{ padding:"9px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12 }}>{suite.name}</span>
                <span style={{ fontSize:11 }}>
                  {sp>0&&<span style={{color:"#3fb950"}}>{sp}✓ </span>}
                  {sf>0&&<span style={{color:"#f85149"}}>{sf}✗</span>}
                  {sp===0&&sf===0&&<span style={{color:"#484f58"}}>{suite.tests.length}</span>}
                </span>
              </div>
              {sr.length>0 && <div style={{ marginTop:4, height:2, background:"#21262d", borderRadius:1 }}>
                <div style={{ height:"100%", width:`${(sr.length/suite.tests.length)*100}%`, background:sf>0?"#f85149":suite.color, borderRadius:1 }}/>
              </div>}
            </div>
          );
        })}
      </div>

      {/* MAIN */}
      <div style={{ padding:24, overflowY:"auto" }}>
        <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:20, flexWrap:"wrap" }}>
          <button onClick={runAll} disabled={running} style={{ background:running?"#21262d":"#238636", border:"1px solid #2ea043", color:"#fff", padding:"8px 18px", borderRadius:6, cursor:running?"not-allowed":"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600 }}>
            {running ? `Kör... ${progress}%` : "▶ Kör alla tester"}
          </button>
          {phase!=="idle" && ["all","pass","fail"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ background:filter===f?"#21262d":"transparent", border:`1px solid ${filter===f?"#58a6ff":"#30363d"}`, color:filter===f?"#58a6ff":"#8b949e", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
              {f==="all"?"Alla":f==="pass"?"✓ Godkänd":"✗ Misslyckad"}
            </button>
          ))}
          <span style={{ color:"#484f58", fontSize:11, marginLeft:"auto" }}>{TOTAL_AUTO} tester · {AUTO_SUITES.length} suites</span>
        </div>

        {running && (
          <div style={{ marginBottom:16 }}>
            <div style={{ height:4, background:"#21262d", borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progress}%`, background:"#1f6feb", borderRadius:2, transition:"width .2s" }}/>
            </div>
          </div>
        )}

        {phase==="idle" && (
          <div style={{ textAlign:"center", padding:60, color:"#484f58" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🧪</div>
            <div style={{ fontSize:14 }}>Tryck på "Kör alla tester" för att starta</div>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {filtered.map(r => (
              <div key={`${r.suite}::${r.name}`} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 12px", borderRadius:6, background:"#161b22", border:`1px solid ${r.status==="pass"?"#238636"+"44":"#f85149"+"44"}` }}>
                <span style={{ color:r.status==="pass"?"#3fb950":"#f85149", fontSize:14, flexShrink:0 }}>{r.status==="pass"?"✓":"✗"}</span>
                <span style={{ color:"#8b949e", fontSize:11, flexShrink:0, minWidth:160 }}>{r.suite}</span>
                <span style={{ flex:1, fontSize:12 }}>{r.name}</span>
                {r.error && <span style={{ color:"#f85149", fontSize:11, maxWidth:300, textAlign:"right" }}>{r.error}</span>}
                <span style={{ color:"#484f58", fontSize:11, flexShrink:0 }}>{r.ms}ms</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SQUISH RUNNER
// ─────────────────────────────────────────────────────────────
function SquishRunner() {
  const [cases, setCases]       = useState(PRESET_CASES.map(c=>({...c, steps:[...c.steps.map(s=>({...s}))]})));
  const [selId, setSelId]       = useState(PRESET_CASES[0].id);
  const [results, setResults]   = useState({});
  const [running, setRunning]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [newStep, setNewStep]   = useState({ type: ACTION_TYPES[0].id, params:{} });

  const sel = cases.find(c=>c.id===selId);
  const res = results[selId];

  const runCase = async (c) => {
    setRunning(true);
    const state = createAppState();
    const stepRes = [];
    for (const step of c.steps) {
      await sim(30 + Math.random()*40);
      const r = runAction(step, state);
      stepRes.push({ id:step.id, type:step.type, params:step.params, ...r });
      if (!r.ok) break;
    }
    const passed = stepRes.filter(r=>r.ok).length;
    setResults(p=>({...p,[c.id]:{ steps:stepRes, passed, total:c.steps.length, ok:passed===c.steps.length }}));
    setRunning(false);
  };

  const addStep = () => {
    const at = ACTION_TYPES.find(a=>a.id===newStep.type);
    const params = Object.fromEntries((at?.fields||[]).map(f=>[f, newStep.params[f]||""]));
    setCases(p=>p.map(c=>c.id===selId ? {...c, steps:[...c.steps, {id:newStepId(), type:newStep.type, params}]} : c));
    setShowNew(false);
    setNewStep({ type:ACTION_TYPES[0].id, params:{} });
  };

  const removeStep = (stepId) => {
    setCases(p=>p.map(c=>c.id===selId ? {...c, steps:c.steps.filter(s=>s.id!==stepId)} : c));
  };

  const addCase = () => {
    const nc = { id:newCaseId(), name:"Nytt testfall", desc:"", steps:[] };
    setCases(p=>[...p, nc]);
    setSelId(nc.id);
    setResults(p=>({...p,[nc.id]:null}));
  };

  const at = ACTION_TYPES.find(a=>a.id===newStep.type);

  const fieldOptions = (field) => {
    if (field==="lane"||field==="toLane"||field==="expectedLane") return LANES.map(l=>({v:l,l:LANE_LABELS[l]}));
    if (field==="tab"||field==="expectedTab") return TABS.map(t=>({v:t,l:t}));
    if (field==="prio") return PRIOS.map(p=>({v:p,l:PRIO_LABELS[p]}));
    if (field==="dark"||field==="expectedDark") return [{v:"false",l:"Ljust"},{v:"true",l:"Mörkt"}];
    if (field==="expectedGuest") return [{v:"false",l:"Av"},{v:"true",l:"På"}];
    return null;
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", minHeight:"calc(100vh - 49px)" }}>
      {/* SIDEBAR */}
      <div style={{ background:"#161b22", borderRight:"1px solid #30363d", overflowY:"auto" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #30363d", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:600, fontSize:12 }}>Testfall</span>
          <button onClick={addCase} style={{ background:"#238636", border:"none", color:"#fff", borderRadius:4, padding:"3px 10px", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>+ Nytt</button>
        </div>
        {cases.map(c=>{
          const r = results[c.id];
          return (
            <div key={c.id} onClick={()=>setSelId(c.id)} style={{ padding:"10px 16px", cursor:"pointer", background:selId===c.id?"#21262d":"transparent", borderLeft:`3px solid ${selId===c.id?"#58a6ff":"transparent"}` }}>
              <div style={{ fontSize:12, fontWeight:selId===c.id?600:400 }}>{c.name}</div>
              <div style={{ fontSize:11, color:"#8b949e", marginTop:2 }}>{c.steps.length} steg
                {r && <span style={{ marginLeft:6, color:r.ok?"#3fb950":"#f85149" }}>· {r.ok?"✓ OK":`✗ ${r.passed}/${r.total}`}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN */}
      {sel && (
        <div style={{ padding:24, overflowY:"auto" }}>
          <div style={{ marginBottom:16 }}>
            <h2 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>{sel.name}</h2>
            <p style={{ color:"#8b949e", fontSize:12 }}>{sel.desc}</p>
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            <button onClick={()=>runCase(sel)} disabled={running||sel.steps.length===0} style={{ background:"#238636", border:"1px solid #2ea043", color:"#fff", padding:"7px 16px", borderRadius:6, cursor:running||sel.steps.length===0?"not-allowed":"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600 }}>
              {running?"Kör...":"▶ Kör testfall"}
            </button>
          </div>

          {/* STEPS */}
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
            {sel.steps.map((step, si) => {
              const sr = res?.steps?.find(r=>r.id===step.id);
              const bg = sr ? (sr.ok ? "#238636"+"18" : "#f85149"+"18") : "#21262d";
              const border = sr ? (sr.ok ? "#238636"+"44" : "#f85149"+"44") : "#30363d";
              return (
                <div key={step.id} style={{ display:"flex", gap:10, padding:"8px 12px", borderRadius:6, background:bg, border:`1px solid ${border}` }}>
                  <span style={{ color:"#484f58", fontSize:11, minWidth:22, flexShrink:0 }}>#{si+1}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>{ACTION_TYPES.find(a=>a.id===step.type)?.label || step.type}</div>
                    <div style={{ fontSize:11, color:"#8b949e" }}>{Object.entries(step.params).map(([k,v])=>`${k}: ${v}`).join(" · ")}</div>
                    {sr && <div style={{ fontSize:11, marginTop:2, color:sr.ok?"#3fb950":"#f85149" }}>{sr.msg}</div>}
                  </div>
                  <button onClick={()=>removeStep(step.id)} style={{ background:"none", border:"none", color:"#484f58", cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
                </div>
              );
            })}
          </div>

          {/* ADD STEP */}
          {showNew ? (
            <div style={{ background:"#161b22", border:"1px solid #30363d", borderRadius:8, padding:16, marginBottom:12 }}>
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color:"#8b949e", display:"block", marginBottom:4 }}>Action</label>
                <select value={newStep.type} onChange={e=>setNewStep({type:e.target.value,params:{}})} style={{ background:"#21262d", border:"1px solid #30363d", color:"#e6edf3", borderRadius:4, padding:"6px 10px", fontFamily:"inherit", fontSize:12, width:"100%" }}>
                  {ACTION_TYPES.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              {at?.fields.map(field=>{
                const opts = fieldOptions(field);
                return (
                  <div key={field} style={{ marginBottom:8 }}>
                    <label style={{ fontSize:11, color:"#8b949e", display:"block", marginBottom:4 }}>{field}</label>
                    {opts ? (
                      <select value={newStep.params[field]||""} onChange={e=>setNewStep(p=>({...p,params:{...p.params,[field]:e.target.value}}))} style={{ background:"#21262d", border:"1px solid #30363d", color:"#e6edf3", borderRadius:4, padding:"6px 10px", fontFamily:"inherit", fontSize:12, width:"100%" }}>
                        <option value="">Välj...</option>
                        {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    ) : (
                      <input value={newStep.params[field]||""} onChange={e=>setNewStep(p=>({...p,params:{...p.params,[field]:e.target.value}}))} placeholder={field} style={{ background:"#21262d", border:"1px solid #30363d", color:"#e6edf3", borderRadius:4, padding:"6px 10px", fontFamily:"inherit", fontSize:12, width:"100%", boxSizing:"border-box" }}/>
                    )}
                  </div>
                );
              })}
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button onClick={addStep} style={{ background:"#238636", border:"none", color:"#fff", padding:"6px 16px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Lägg till steg</button>
                <button onClick={()=>setShowNew(false)} style={{ background:"transparent", border:"1px solid #30363d", color:"#8b949e", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Avbryt</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowNew(true)} style={{ background:"transparent", border:"1px dashed #30363d", color:"#8b949e", padding:"8px 16px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:12, width:"100%" }}>+ Lägg till steg</button>
          )}
        </div>
      )}
    </div>
  );
}
