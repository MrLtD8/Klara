/**
 * constants.js
 *
 * Syfte: Samlar alla globala konstanter för familjeappen på ett ställe.
 * Exporterar: THEMES, PRIO_META, LANES, RECUR_OPTIONS, TAG_COLORS, ALL_TAGS,
 *             FLOWS, WEEKDAYS_SV, MONTHS_SV, EVENT_TYPES, DEFAULT_FAMILY_MEALS,
 *             DEFAULT_SCHOOL_MENU, INIT_LAMPS, CHORES_LIST, LEVELS, BADGES,
 *             REWARDS, DEMO_KIDS
 * Beroenden: Inga externa beroenden.
 */

/* ═══ TEMAN ══════════════════════════════════════════════════════
 * Ljust och mörkt färgtema för hela appen.
 * Används via T = cfg.dark ? THEMES.dark : THEMES.light
 * ═══════════════════════════════════════════════════════════════ */
export const THEMES = {
  light: {
    bg:"rgba(255,252,248,0.85)", surface:"rgba(255,253,250,0.92)", card:"rgba(255,255,255,0.90)",
    lane:"rgba(248,244,238,0.80)", border:"rgba(180,160,130,0.22)", borderMid:"rgba(180,160,130,0.45)",
    text:"#1C1810", textMid:"#5A4E3C", textDim:"#9A8E7C",
    amber:"#B8722A", amberBg:"#FDF0E0",
    green:"#3A7A52", greenBg:"#E8F5EE",
    red:"#A84040",   redBg:"#FDEAEA",
    blue:"#2A5FA8",  blueBg:"#E8F0FD",
    purple:"#6B4EA8",purpleBg:"#F0EBFD",
    sage:"#6A8870",  sageBg:"#EDF2EF", sageDark:"#3A5844",
    overlay:"rgba(0,0,0,0.25)", blur:"blur(20px) saturate(1.6)",
    shadow:"0 2px 12px rgba(60,40,10,0.09)",
    calPaper:"rgba(254,252,248,0.94)",
    calBorder:"rgba(90,110,95,0.18)",
  },
  dark: {
    bg:"rgba(12,11,9,0.82)", surface:"rgba(22,20,16,0.92)", card:"rgba(28,26,22,0.90)",
    lane:"rgba(20,18,14,0.70)", border:"rgba(80,70,50,0.38)", borderMid:"rgba(100,90,60,0.52)",
    text:"#F5EDD8", textMid:"#A89880", textDim:"#6A5E4C",
    amber:"#E8A84C", amberBg:"rgba(232,168,76,0.14)",
    green:"#5BAF7A", greenBg:"rgba(91,175,122,0.14)",
    red:"#C96B6B",   redBg:"rgba(201,107,107,0.14)",
    blue:"#6B9EC9",  blueBg:"rgba(107,158,201,0.14)",
    purple:"#9B8DC9",purpleBg:"rgba(155,141,201,0.14)",
    sage:"#7AAA88",  sageBg:"rgba(90,140,110,0.14)", sageDark:"#9ACAAA",
    overlay:"rgba(0,0,0,0.52)", blur:"blur(20px) saturate(1.4)",
    shadow:"0 4px 24px rgba(0,0,0,0.38)",
    calPaper:"rgba(28,26,22,0.90)",
    calBorder:"rgba(90,120,100,0.25)",
  }
};

/* ═══ PRIORITETSNIVÅER ═══════════════════════════════════════════
 * Definierar de fyra prioritetsnivåerna med etiketter, färger och ikon.
 * rank avgör sorteringsordning (0 = högst prioritet).
 * ═══════════════════════════════════════════════════════════════ */
export const PRIO_META = {
  urgent:{label:"Akut",  color:"#C62828",bg:"#FDEAEA",icon:"🔴",rank:0},
  high:  {label:"Hög",   color:"#B8722A",bg:"#FDF0E0",icon:"🟠",rank:1},
  medium:{label:"Medel", color:"#2A5FA8",bg:"#E8F0FD",icon:"🔵",rank:2},
  low:   {label:"Låg",   color:"#3A7A52",bg:"#E8F5EE",icon:"🟢",rank:3},
};

/* ═══ KANBAN-KOLUMNER ════════════════════════════════════════════
 * De tre kolumnerna på kanban-tavlan med id, etikett och färg.
 * ═══════════════════════════════════════════════════════════════ */
export const LANES = [
  {id:"ready",    label:"Redo att starta",color:"#2A5FA8",bg:"rgba(42,95,168,0.07)"},
  {id:"progress", label:"Pågår",          color:"#B8722A",bg:"rgba(184,114,42,0.07)"},
  {id:"done",     label:"Klart",          color:"#3A7A52",bg:"rgba(58,122,82,0.07)"},
];

/* ═══ ÅTERKOMMANDE ALTERNATIV ════════════════════════════════════
 * Tillgängliga upprepningsfrekvenser för uppgifter.
 * ═══════════════════════════════════════════════════════════════ */
export const RECUR_OPTIONS = [
  {val:"none",    label:"Ingen"},
  {val:"daily",   label:"Varje dag"},
  {val:"weekdays",label:"Vardagar"},
  {val:"weekly",  label:"Varje vecka"},
  {val:"monthly", label:"Varje månad"},
];

/* ═══ TAGGFÄRGER ═════════════════════════════════════════════════
 * Bakgrunds- och textfärg för varje tagg.
 * ═══════════════════════════════════════════════════════════════ */
export const TAG_COLORS = {
  Hem:    {bg:"#F0F0F0",text:"#555"},
  Sport:  {bg:"#E8F5EE",text:"#3A7A52"},
  Skola:  {bg:"#F0EBFD",text:"#6B4EA8"},
  Mat:    {bg:"#FDF0E0",text:"#B8722A"},
  Hälsa:  {bg:"#FDF0FB",text:"#9B4EA8"},
  Fritid: {bg:"#FDEAEA",text:"#A84040"},
  Jobb:   {bg:"#E8F0FD",text:"#2A5FA8"},
  Övrigt: {bg:"#F5F5F5",text:"#777"},
};

/* ═══ ALLA TAGGAR (lista) ════════════════════════════════════════
 * Genereras automatiskt från TAG_COLORS-nycklarna.
 * ═══════════════════════════════════════════════════════════════ */
export const ALL_TAGS = Object.keys(TAG_COLORS);

/* ═══ DAGLIGA FLÖDEN ══════════════════════════════════════════════
 * Fyra tidsblock under dagen (Morgon, Dag, Eftermiddag, Kväll).
 * Varje flöde har en medicin-lista med standardvärden.
 * ═══════════════════════════════════════════════════════════════ */
export const FLOWS = [
  {
    id:"morning", label:"Morgon", icon:"☀️", range:"06–10", startH:6, endH:10, color:"#B8722A",
    meds:[
      {name:"Loratadin", who:"Ella",  dose:"1 tabl.", done:false},
      {name:"Omega-3",   who:"Johan", dose:"2 kaps.", done:false},
      {name:"Järn",      who:"Anna",  dose:"1 tabl.", done:false},
    ]
  },
  {id:"day",       label:"Dag",         icon:"🌤️", range:"10–16", startH:10, endH:16, color:"#2A5FA8", meds:[]},
  {
    id:"afternoon", label:"Eftermiddag", icon:"⛅",  range:"16–19", startH:16, endH:19, color:"#6B4EA8",
    meds:[{name:"Loratadin", who:"Ella", dose:"vid behov", done:false}]
  },
  {id:"evening",   label:"Kväll",       icon:"🌙", range:"19–23", startH:19, endH:24, color:"#3A7A52", meds:[]},
];

/* ═══ SVENSKA VECKODAGAR OCH MÅNADER ════════════════════════════
 * Används för att visa datum på svenska i kalendern.
 * Måndag = index 0 (inte söndag som i JS Date).
 * ═══════════════════════════════════════════════════════════════ */
export const WEEKDAYS_SV = ["Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag","Söndag"];
export const MONTHS_SV   = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];

/* ═══ HÄNDELSETYPER (kalender) ═══════════════════════════════════
 * Typer av händelser som kan läggas in i kalendern med ikon och färg.
 * ═══════════════════════════════════════════════════════════════ */
export const EVENT_TYPES = {
  heart:   {icon:"❤️", label:"Kärlek",       bg:"#FDE8EE", border:"#E8A0B0"},
  birthday:{icon:"🎈", label:"Födelsedag",   bg:"#FFF0D8", border:"#F0C060"},
  doctor:  {icon:"⚕️", label:"Läkare",       bg:"#FDE8E8", border:"#E06060"},
  school:  {icon:"🎒", label:"Skola",         bg:"#E8F0FD", border:"#7090D0"},
  sport:   {icon:"⚽", label:"Sport",         bg:"#E8F5EE", border:"#70A880"},
  travel:  {icon:"✈️", label:"Resa",          bg:"#EDF2EF", border:"#7A9080"},
  holiday: {icon:"🎉", label:"Helgdag",       bg:"#FFF5E0", border:"#D4A030"},
  note:    {icon:"📌", label:"Anteckning",    bg:"#F5F0E8", border:"#B09870"},
  dance:   {icon:"💃", label:"Dans",          bg:"#FDE8F5", border:"#D060A0"},
  swim:    {icon:"🏊", label:"Simning",       bg:"#E0F0FF", border:"#5090D0"},
  party:   {icon:"🎂", label:"Kalas",         bg:"#FFF0E0", border:"#E0A030"},
  paddle:  {icon:"🏓", label:"Paddling",      bg:"#E8F8EE", border:"#50A060"},
  tennis:  {icon:"🎾", label:"Tennis",        bg:"#F0FFE8", border:"#70A030"},
  football:{icon:"⚽", label:"Fotboll",       bg:"#E8F5E8", border:"#409040"},
  gym:     {icon:"💪", label:"Träning",       bg:"#FFF0E8", border:"#D07030"},
  music:   {icon:"🎵", label:"Musik",         bg:"#F0E8FF", border:"#9060C0"},
  dentist: {icon:"🦷", label:"Tandläkare",    bg:"#F0F8FF", border:"#6080C0"},
  meeting: {icon:"👥", label:"Möte",          bg:"#F5F5F0", border:"#909080"},
};

/* ═══ FAMILJENS STANDARDMIDDAGAR ═════════════════════════════════
 * Roterande middagslista som visas i kalendern.
 * Familjen kan redigera listan i inställningarna.
 * ═══════════════════════════════════════════════════════════════ */
export const DEFAULT_FAMILY_MEALS = [
  "Tacos 🌮","Köttbullar & brunsås","Lax med dillsås","Pasta carbonara",
  "Kycklingwok & nudlar","Pizza 🍕","Grillat & sallad","Fiskgratäng & ris",
  "Pannkakor 🥞","Hamburgare","Soppa & bröd","Helstekt kyckling","Makaroner & köttfärs",
];

/* ═══ SKOLANS STANDARD-MATSEDEL ══════════════════════════════════
 * Upprepas varje vecka mån–fre och visas i kalendern på vardagar.
 * Redigeras i inställningarna under "Skolans mat".
 * ═══════════════════════════════════════════════════════════════ */
export const DEFAULT_SCHOOL_MENU = {
  monday:   "Köttbullar & makaroner",
  tuesday:  "Kycklinggryta & ris",
  wednesday:"Fiskpinnar & potatismos",
  thursday: "Vegetarisk pasta",
  friday:   "Hamburgare",
};

/* ═══ PHILIPS HUE-LAMPOR (initialtillstånd) ══════════════════════
 * Startläge för lamporna i Hue-raden längst ned.
 * ═══════════════════════════════════════════════════════════════ */
export const INIT_LAMPS = [
  {id:1, name:"Vardagsrum", on:true,  bri:200, color:"#FFD580"},
  {id:2, name:"Kök",        on:true,  bri:254, color:"#FFFFFF"},
  {id:3, name:"Sovrum",     on:false, bri:100, color:"#FFB347"},
  {id:4, name:"Ellas rum",  on:true,  bri:180, color:"#A8D8FF"},
  {id:5, name:"Max rum",    on:false, bri:150, color:"#B8FFB8"},
  {id:6, name:"Kontor",     on:true,  bri:220, color:"#FFF0D0"},
];

/* ═══ SYSSLOLISTA (barn-poängsystem) ════════════════════════════
 * Alla tillgängliga hushållssysslor med poängvärde och kategori.
 * ═══════════════════════════════════════════════════════════════ */
export const CHORES_LIST = [
  { id:1,  title:"Diska / stapla diskmaskinen", icon:"🍽️",  points:10, category:"Kök"     },
  { id:2,  title:"Damma sitt rum",              icon:"🧹",  points:15, category:"Städning" },
  { id:3,  title:"Sopa golvet",                 icon:"🪣",  points:10, category:"Städning" },
  { id:4,  title:"Lägga in tvätt",              icon:"👕",  points:15, category:"Tvätt"    },
  { id:5,  title:"Vika och lägga undan tvätt",  icon:"🧺",  points:20, category:"Tvätt"    },
  { id:6,  title:"Duka bordet",                 icon:"🥄",  points:8,  category:"Kök"      },
  { id:7,  title:"Städa sitt rum",              icon:"🏠",  points:25, category:"Städning" },
  { id:8,  title:"Gå ärenden / handla",         icon:"🛒",  points:30, category:"Övrigt"   },
  { id:9,  title:"Mata djuret",                 icon:"🐾",  points:10, category:"Djur"     },
  { id:10, title:"Gå ut med hunden",            icon:"🐕",  points:20, category:"Djur"     },
  { id:11, title:"Hjälpa till med middagen",    icon:"🍳",  points:20, category:"Kök"      },
  { id:12, title:"Ta ut soporna",               icon:"🗑️",  points:15, category:"Övrigt"   },
  { id:13, title:"Vattna blommorna",            icon:"🌱",  points:8,  category:"Övrigt"   },
  { id:14, title:"Städa toaletten",             icon:"🚽",  points:25, category:"Städning" },
  { id:15, title:"Läxor utan påminnelse",       icon:"📚",  points:30, category:"Skola"    },
];

/* ═══ NIVÅER (poängtrappan) ══════════════════════════════════════
 * Varje nivå definierar ett poängintervall, titel, ikon och färg.
 * ═══════════════════════════════════════════════════════════════ */
export const LEVELS = [
  { min:0,    max:99,   title:"Nybörjare",      icon:"🌱", color:"#7A9080" },
  { min:100,  max:249,  title:"Hjälpsam",       icon:"⭐", color:"#B8722A" },
  { min:250,  max:499,  title:"Städstjärna",    icon:"🌟", color:"#D4A030" },
  { min:500,  max:999,  title:"Syssloproff",    icon:"🏆", color:"#2A5FA8" },
  { min:1000, max:9999, title:"Familjehjälten", icon:"👑", color:"#C04040" },
];

/* ═══ BADGES ════════════════════════════════════════════════════
 * Utmärkelser som barnen kan tjäna in baserat på sin statistik.
 * req(stats) returnerar true om barnet uppfyller kriteriet.
 * ═══════════════════════════════════════════════════════════════ */
export const BADGES = [
  { id:"first",     title:"Första sysslan!",     icon:"🎯", desc:"Slutförd 1 syssla",       req: s => s.total >= 1 },
  { id:"ten",       title:"10 sysslor!",          icon:"🔟", desc:"Slutförd 10 sysslor",     req: s => s.total >= 10 },
  { id:"streak3",   title:"3 dagar i rad!",       icon:"🔥", desc:"Jobbat 3 dagar i rad",    req: s => s.streak >= 3 },
  { id:"points500", title:"500 poäng!",           icon:"💎", desc:"Tjänat 500 poäng",        req: s => s.points >= 500 },
  { id:"clean",     title:"Städmästare",          icon:"✨", desc:"Städat 5 gånger",         req: s => s.byCategory?.Städning >= 5 },
  { id:"kitchen",   title:"Köksproffs",           icon:"👨‍🍳",desc:"Jobbat i köket 5 gånger", req: s => s.byCategory?.Kök >= 5 },
];

/* ═══ BELÖNINGAR ════════════════════════════════════════════════
 * Belöningar barnen kan lösa in med sina intjänade poäng.
 * cost = antal poäng som krävs.
 * ═══════════════════════════════════════════════════════════════ */
export const REWARDS = [
  { id:"r1", title:"Välj kvällsmat",         icon:"🍕", cost:50  },
  { id:"r2", title:"30 min extra skärmtid",  icon:"📱", cost:80  },
  { id:"r3", title:"Välj film på lördag",    icon:"🎬", cost:100 },
  { id:"r4", title:"Slippa en syssla",       icon:"😴", cost:150 },
  { id:"r5", title:"Biobesök",               icon:"🎭", cost:300 },
  { id:"r6", title:"Självvald aktivitet",    icon:"⭐", cost:500 },
];

/* ═══ DEMO-BARN (startdata) ══════════════════════════════════════
 * Exempeldata för barn-poäng-fliken när appen startar för första gången.
 * ═══════════════════════════════════════════════════════════════ */
export const DEMO_KIDS = [
  {
    id:3, name:"Ella", av:"E", color:"#6B4EA8", age:10,
    stats:{ points:340, total:18, streak:3, byCategory:{Kök:5, Städning:6, Tvätt:3, Övrigt:4} },
    history:["Diskade","Städade rummet","Hjälpte med maten"],
  },
  {
    id:4, name:"Max", av:"M", color:"#3A7A52", age:7,
    stats:{ points:210, total:11, streak:1, byCategory:{Kök:2, Städning:3, Djur:4, Övrigt:2} },
    history:["Matade hunden","Dukade bordet"],
  },
];
