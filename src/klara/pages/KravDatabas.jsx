import { useState } from "react";

const data = {
  modules: [
    {
      id: "M01", name: "Dashboard & Navigation", icon: "🏠", color: "#E8A87C",
      requirements: [
        { id: "M01-R01", prio: "Hög", status: "Byggt", req: "iPad-anpassad primär vy med daglig flödesöversikt", type: "UI" },
        { id: "M01-R02", prio: "Hög", status: "Byggt", req: "Mobil-variant av dashboarden", type: "UI" },
        { id: "M01-R03", prio: "Hög", status: "Byggt", req: "Dagsvyer: Morgon / Dagtid / Eftermiddag / Kväll", type: "Feature" },
        { id: "M01-R04", prio: "Hög", status: "Byggt", req: "Gästläge som döljer känslig information", type: "Feature" },
        { id: "M01-R05", prio: "Hög", status: "Byggt", req: "Mörkt läge (dark mode)", type: "UI" },
        { id: "M01-R06", prio: "Hög", status: "Byggt", req: "Glass-morphism design med backdrop-filter blur", type: "UI" },
        { id: "M01-R07", prio: "Hög", status: "Byggt", req: "Fraunces serif + DM Sans typografi", type: "UI" },
        { id: "M01-R08", prio: "Hög", status: "Byggt", req: "Amber/cream warm färgtema", type: "UI" },
        { id: "M01-R09", prio: "Med", status: "Planerad", req: "Supabase realtidssynk cross-device", type: "Backend" },
      ]
    },
    {
      id: "M02", name: "Kalender", icon: "📅", color: "#7CB9E8",
      requirements: [
        { id: "M02-R01", prio: "Hög", status: "Byggt", req: "Veckokalender med familjemedlemmar", type: "Feature" },
        { id: "M02-R02", prio: "Hög", status: "Byggt", req: "Fristående kalendervy (familjekalender.jsx)", type: "Feature" },
        { id: "M02-R03", prio: "Hög", status: "Planerad", req: "Aktivitetsstickers — klickbara ikoner direkt i kalendervyn", type: "Feature" },
        { id: "M02-R04", prio: "Hög", status: "Planerad", req: "Fördefinierade aktivitetstyper: dans, simning, kalas, läkare, paddling, gympakläder m.fl.", type: "Feature" },
        { id: "M02-R05", prio: "Hög", status: "Planerad", req: "Återkommande stickers per aktivitetstyp", type: "Feature" },
        { id: "M02-R06", prio: "Hög", status: "Planerad", req: "Drag-och-släpp av stickers på dagar", type: "Feature" },
        { id: "M02-R07", prio: "Hög", status: "Planerad", req: "Google Calendar API-integration (båda vuxna)", type: "Integration" },
        { id: "M02-R08", prio: "Hög", status: "Planerad", req: "Konfliktdetektering — båda vuxna borta samtidigt → barnvakt-larm", type: "Feature" },
        { id: "M02-R09", prio: "Med", status: "Planerad", req: "Klassificering av events: resa, fest, jobb, barnaktivitet", type: "Feature" },
        { id: "M02-R10", prio: "Med", status: "Planerad", req: "Skollov markeras automatiskt i kalendern", type: "Feature" },
      ]
    },
    {
      id: "M03", name: "Tasks & Backlogg", icon: "✅", color: "#87C87C",
      requirements: [
        { id: "M03-R01", prio: "Hög", status: "Byggt", req: "Veckobaserad todo med per-person tilldelning", type: "Feature" },
        { id: "M03-R02", prio: "Hög", status: "Byggt", req: "Backlogg/planering-flik", type: "Feature" },
        { id: "M03-R03", prio: "Hög", status: "Byggt", req: "Kanban-bord: Redo / Pågår / Klart", type: "Feature" },
        { id: "M03-R04", prio: "Hög", status: "Bugg", req: "Buggfixar: dra-och-släpp, statusuppdateringar, persontilldelning", type: "Bugg" },
        { id: "M03-R05", prio: "Med", status: "Planerad", req: "Tidsestimering per task (30 min, 2h, halvdag)", type: "Feature" },
        { id: "M03-R06", prio: "Med", status: "Planerad", req: "Subtasks — undertasks som bockas av en i taget", type: "Feature" },
        { id: "M03-R07", prio: "Med", status: "Planerad", req: "Prioritetsnivåer per task", type: "Feature" },
        { id: "M03-R08", prio: "Med", status: "Planerad", req: "Deadline-datum per task", type: "Feature" },
        { id: "M03-R09", prio: "Låg", status: "Framtid", req: "Epics — större mål med tasks under sig", type: "Feature" },
        { id: "M03-R10", prio: "Med", status: "Planerad", req: "AI föreslår vilka backlogg-tasks som bör in i nästa vecka", type: "AI" },
        { id: "M03-R11", prio: "Med", status: "Planerad", req: "Veckoplanning söndagkväll — AI balanserar tasks mot ledig kalendertid", type: "AI" },
      ]
    },
    {
      id: "M04", name: "Medicin-tracker", icon: "💊", color: "#E87C9A",
      requirements: [
        { id: "M04-R01", prio: "Med", status: "Planerad", req: "Lägg till medicin per familjemedlem", type: "Feature" },
        { id: "M04-R02", prio: "Med", status: "Planerad", req: "Fält: namn, form (tablett/mixtur/suppositorium), antal kvar, daglig dos", type: "Feature" },
        { id: "M04-R03", prio: "Med", status: "Planerad", req: "Beräkning: 'räcker till'-datum baserat på dos × antal kvar", type: "Feature" },
        { id: "M04-R04", prio: "Med", status: "Planerad", req: "Beställningströskel — påminnelse när X dagar kvar", type: "Feature" },
        { id: "M04-R05", prio: "Med", status: "Planerad", req: "Statusindikator per medicin: grön/gul/röd", type: "UI" },
        { id: "M04-R06", prio: "Hög", status: "Planerad", req: "Doslogg med tidsstämpel — 'senast given: idag 14:32'", type: "Feature" },
        { id: "M04-R07", prio: "Hög", status: "Planerad", req: "Dosrekommendation i ml baserat på barnets ålder (Alvedon, Ipren m.fl.)", type: "Feature" },
        { id: "M04-R08", prio: "Med", status: "Planerad", req: "Direktlänk till FASS per läkemedel", type: "Integration" },
        { id: "M04-R09", prio: "Hög", status: "Planerad", req: "Gästläge döljer all medicininfo", type: "Feature" },
        { id: "M04-R10", prio: "Låg", status: "Framtid", req: "Receptbelagda vs receptfria märks separat", type: "Feature" },
      ]
    },
    {
      id: "M05", name: "Hus-underhållsplan", icon: "🏠", color: "#C8A87C",
      requirements: [
        { id: "M05-R01", prio: "Med", status: "Planerad", req: "Ny flik: Hus-underhåll", type: "Feature" },
        { id: "M05-R02", prio: "Med", status: "Planerad", req: "Kategorier: utvändigt, inomhus, teknik, trädgård", type: "Feature" },
        { id: "M05-R03", prio: "Med", status: "Planerad", req: "Per uppgift: intervall (varje år, vart 5:e år) + senast utfört-datum", type: "Feature" },
        { id: "M05-R04", prio: "Med", status: "Planerad", req: "Filter: förfallet, kommande 3 månader", type: "Feature" },
        { id: "M05-R05", prio: "Låg", status: "Framtid", req: "Delar datamodell med Kanban/Epics", type: "Teknisk" },
        { id: "M05-R06", prio: "Med", status: "Planerad", req: "Garantiuppföljning per produkt/installation", type: "Feature" },
      ]
    },
    {
      id: "M06", name: "Bil-påminnelser", icon: "🚗", color: "#7CA8E8",
      requirements: [
        { id: "M06-R01", prio: "Med", status: "Planerad", req: "Återkommande årsreminders per bil", type: "Feature" },
        { id: "M06-R02", prio: "Med", status: "Planerad", req: "Typer: däckbyte vår, däckbyte höst, besiktning, service, städning", type: "Feature" },
        { id: "M06-R03", prio: "Med", status: "Planerad", req: "Påminnelse dyker upp i dagsvyn när datum närmar sig", type: "Feature" },
        { id: "M06-R04", prio: "Med", status: "Planerad", req: "Stöd för flera bilar i familjen", type: "Feature" },
        { id: "M06-R05", prio: "Låg", status: "Framtid", req: "Temperaturbaserad trigger för däckbytesbild", type: "Feature" },
      ]
    },
    {
      id: "M07", name: "Ekonomi", icon: "💰", color: "#87C8A8",
      requirements: [
        { id: "M07-R01", prio: "Med", status: "Planerad", req: "Ny flik: Ekonomi", type: "Feature" },
        { id: "M07-R02", prio: "Med", status: "Planerad", req: "Budget-översikt (manuell inmatning initialt)", type: "Feature" },
        { id: "M07-R03", prio: "Med", status: "Planerad", req: "Ekonomisk kalender: deklaration, försäkringsförnyelser, semesterkassa", type: "Feature" },
        { id: "M07-R04", prio: "Med", status: "Planerad", req: "Spartips-sektion", type: "Feature" },
        { id: "M07-R05", prio: "Med", status: "Planerad", req: "Diagram via Recharts", type: "UI" },
        { id: "M07-R06", prio: "Hög", status: "Planerad", req: "Gästläge döljer ALL ekonomiinfo", type: "Feature" },
        { id: "M07-R07", prio: "Låg", status: "Framtid", req: "Bank-API-integration", type: "Integration" },
        { id: "M07-R08", prio: "Med", status: "Planerad", req: "Månadsrapport ekonomi", type: "Feature" },
      ]
    },
    {
      id: "M08", name: "Matplanering", icon: "🍽️", color: "#E8C87C",
      requirements: [
        { id: "M08-R01", prio: "Hög", status: "Byggt", req: "Familjematsedel med automatisk rotation", type: "Feature" },
        { id: "M08-R02", prio: "Med", status: "Planerad", req: "Veckans middagar föreslås baserat på vad som finns hemma", type: "AI" },
        { id: "M08-R03", prio: "Med", status: "Planerad", req: "Automatisk inköpslista från matsedel", type: "Feature" },
        { id: "M08-R04", prio: "Med", status: "Planerad", req: "Koppling till butikserbjudanden — föreslå recept baserat på rea", type: "Feature" },
      ]
    },
    {
      id: "M09", name: "Butikserbjudanden", icon: "🏷️", color: "#C87CA8",
      requirements: [
        { id: "M09-R01", prio: "Med", status: "Planerad", req: "Ny flik: Veckans erbjudanden", type: "Feature" },
        { id: "M09-R02", prio: "Med", status: "Planerad", req: "Hämtar erbjudanden från butiker nära användaren (ICA, Willys, Lidl, Coop, Hemköp)", type: "Feature" },
        { id: "M09-R03", prio: "Med", status: "Planerad", req: "Platsbaserat filter — butiker inom X km", type: "Feature" },
        { id: "M09-R04", prio: "Med", status: "Planerad", req: "Matchar erbjudanden mot inköpslistan", type: "Feature" },
        { id: "M09-R05", prio: "Med", status: "Planerad", req: "Undersök Matpriskollen/Matspar API som datakälla", type: "Teknisk" },
      ]
    },
    {
      id: "M10", name: "Kids-funktioner", icon: "🎡", color: "#A87CE8",
      requirements: [
        { id: "M10-R01", prio: "Hög", status: "Byggt", req: "Sysslor-gamifiering med poäng och belöningar", type: "Feature" },
        { id: "M10-R02", prio: "Med", status: "Planerad", req: "Aktivitetshjulet — stort färgglatt snurrhjul med aktiviteter", type: "Feature" },
        { id: "M10-R03", prio: "Med", status: "Planerad", req: "Hjulet har inomhus- och utomhusläge", type: "Feature" },
        { id: "M10-R04", prio: "Med", status: "Planerad", req: "Konfetti-animation när pilen stannar", type: "UI" },
        { id: "M10-R05", prio: "Med", status: "Planerad", req: "Föräldrar kan anpassa aktiviteterna på hjulet", type: "Feature" },
        { id: "M10-R06", prio: "Låg", status: "Framtid", req: "Väderbaserat hjulläge — kopplas till väder-API", type: "Integration" },
      ]
    },
    {
      id: "M11", name: "Bucketlist & Sommarlovslista", icon: "🪣", color: "#E8877C",
      requirements: [
        { id: "M11-R01", prio: "Med", status: "Planerad", req: "Familjens bucketlist — upplevelser utan deadline", type: "Feature" },
        { id: "M11-R02", prio: "Med", status: "Planerad", req: "Sommarlovslista — säsongsbaserad krysslista", type: "Feature" },
        { id: "M11-R03", prio: "Med", status: "Planerad", req: "Sommarlovslistan aktiveras automatiskt när skolan slutar", type: "Feature" },
        { id: "M11-R04", prio: "Med", status: "Planerad", req: "Barnen kan vara med och fylla i och bocka av", type: "Feature" },
        { id: "M11-R05", prio: "Med", status: "Planerad", req: "Summering sparas som minne: 'Sommaren 2025 — ni klarade 8 av 10'", type: "Feature" },
        { id: "M11-R06", prio: "Låg", status: "Framtid", req: "Bucketlist kopplas till reseinspiration", type: "Feature" },
        { id: "M11-R07", prio: "Låg", status: "Framtid", req: "Sommarlovslistan kan matas in i aktivitetshjulet", type: "Feature" },
      ]
    },
    {
      id: "M12", name: "Wellness", icon: "❤️", color: "#E87C87",
      requirements: [
        { id: "M12-R01", prio: "Med", status: "Planerad", req: "Hälsologg per familjemedlem", type: "Feature" },
        { id: "M12-R02", prio: "Med", status: "Planerad", req: "Historikvy per person", type: "Feature" },
        { id: "M12-R03", prio: "Med", status: "Planerad", req: "Doseringsintervall-påminnelser", type: "Feature" },
        { id: "M12-R04", prio: "Låg", status: "Framtid", req: "Supabase-integration för välmående-data", type: "Backend" },
      ]
    },
    {
      id: "M13", name: "FamiljeAssistenten (Addon)", icon: "🤖", color: "#7CE8D4",
      requirements: [
        { id: "M13-R01", prio: "Med", status: "Planerad", req: "Separat addon-applikation / backend-tjänst", type: "Arkitektur" },
        { id: "M13-R02", prio: "Med", status: "Planerad", req: "Körs via Vercel Cron (schemalagda jobb)", type: "Backend" },
        { id: "M13-R03", prio: "Med", status: "Planerad", req: "SMS-utskick via Twilio eller 46elks", type: "Integration" },
        { id: "M13-R04", prio: "Med", status: "Planerad", req: "Morgonrapport kl 7 — vad händer idag, viktiga mail, veckans höjdpunkter", type: "Feature" },
        { id: "M13-R05", prio: "Med", status: "Planerad", req: "Kvällssammanfattning — imorgon händer detta", type: "Feature" },
        { id: "M13-R06", prio: "Med", status: "Planerad", req: "Veckoöversikt varje söndag kväll", type: "Feature" },
        { id: "M13-R07", prio: "Med", status: "Planerad", req: "Gmail-läsning via MCP — lyfter fram viktigt innehåll", type: "Integration" },
        { id: "M13-R08", prio: "Med", status: "Planerad", req: "Kalender-intelligens — läser båda vuxnas Google Calendar", type: "Integration" },
        { id: "M13-R09", prio: "Hög", status: "Planerad", req: "Konfliktdetektering — 'ni behöver barnvakt 14 juni'", type: "Feature" },
        { id: "M13-R10", prio: "Med", status: "Planerad", req: "Medicin-larm — 'Alvedon räcker 5 dagar, dags beställa'", type: "Feature" },
        { id: "M13-R11", prio: "Med", status: "Planerad", req: "Underhållslarm — bil och hus", type: "Feature" },
        { id: "M13-R12", prio: "Med", status: "Planerad", req: "Task-coaching — 'ni har inte rört X på 3 veckor'", type: "Feature" },
        { id: "M13-R13", prio: "Med", status: "Planerad", req: "Backlogg-analys — föreslår tasks till nästa vecka baserat på prio och deadline", type: "AI" },
        { id: "M13-R14", prio: "Med", status: "Planerad", req: "Balanserar task-förslag mot ledig tid i kalendern", type: "AI" },
        { id: "M13-R15", prio: "Låg", status: "Framtid", req: "Lär sig familjens mönster över tid — hur mycket ni klarar per vecka", type: "AI" },
        { id: "M13-R16", prio: "Låg", status: "Framtid", req: "Väderbaserade aktivitetsförslag kopplade till sommarlovslistan", type: "Feature" },
        { id: "M13-R17", prio: "Låg", status: "Framtid", req: "'Sportlovet om 6 veckor — vill ni planera något?'", type: "Feature" },
      ]
    },
    {
      id: "M14", name: "Reseinspiration", icon: "✈️", color: "#7CB4E8",
      requirements: [
        { id: "M14-R01", prio: "Låg", status: "Planerad", req: "Reseinspiration-widget eller flik", type: "Feature" },
        { id: "M14-R02", prio: "Låg", status: "Planerad", req: "Input: avreseort, datum/skollov, budget, antal+åldrar (hämtas automatiskt)", type: "Feature" },
        { id: "M14-R03", prio: "Låg", status: "Planerad", req: "AI-genererade destinationsförslag med motivering", type: "AI" },
        { id: "M14-R04", prio: "Låg", status: "Planerad", req: "Djuplänkar till TUI/Ving/Apollo med förfylld sökning", type: "Integration" },
        { id: "M14-R05", prio: "Låg", status: "Framtid", req: "Koppling till bucketlistan", type: "Feature" },
        { id: "M14-R06", prio: "Låg", status: "Framtid", req: "Koppling till skollovskalender — 'dags planera sportlovsresan'", type: "Feature" },
      ]
    },
    {
      id: "M15", name: "Resehjälpmedel", icon: "🧳", color: "#C8E87C",
      requirements: [
        { id: "M15-R01", prio: "Låg", status: "Framtid", req: "Packlista per familjemedlem anpassad efter destination och ålder", type: "Feature" },
        { id: "M15-R02", prio: "Låg", status: "Framtid", req: "Avresechecklista: pass, visum, valuta, försäkring, nyckel till granne", type: "Feature" },
        { id: "M15-R03", prio: "Låg", status: "Framtid", req: "Tidszonshantering på resmål", type: "Feature" },
        { id: "M15-R04", prio: "Låg", status: "Framtid", req: "Nödnummer för reslandet", type: "Feature" },
        { id: "M15-R05", prio: "Låg", status: "Framtid", req: "Medicinblad som PDF — exportera familjens mediciner för utlandsresa", type: "Feature" },
        { id: "M15-R06", prio: "Låg", status: "Framtid", req: "Resebudget och valutaomvandlare", type: "Feature" },
        { id: "M15-R07", prio: "Låg", status: "Framtid", req: "Resan visas som block i kalendervyn med destination-ikon", type: "Feature" },
      ]
    },
    {
      id: "M16", name: "Separerat föräldraläge", icon: "👨‍👧‍👦", color: "#E8C47C",
      requirements: [
        { id: "M16-R01", prio: "Låg", status: "Framtid", req: "Separat inloggning per förälder — kräver molnlösning", type: "Arkitektur" },
        { id: "M16-R02", prio: "Låg", status: "Framtid", req: "Växelvis boende-schema med visuell vy", type: "Feature" },
        { id: "M16-R03", prio: "Låg", status: "Framtid", req: "Delad barnkalender — båda ser aktiviteter oavsett vems vecka", type: "Feature" },
        { id: "M16-R04", prio: "Låg", status: "Framtid", req: "Ekonomidelning: utlägg, underhållsbidrag, kvitton", type: "Feature" },
        { id: "M16-R05", prio: "Låg", status: "Framtid", req: "Packlista vid lämning/hämtning", type: "Feature" },
        { id: "M16-R06", prio: "Låg", status: "Framtid", req: "Delade pin-koder och viktig info neutralt", type: "Feature" },
        { id: "M16-R07", prio: "Låg", status: "Framtid", req: "AI-filter på kommunikation — tonar ner konflikter", type: "AI" },
        { id: "M16-R08", prio: "Låg", status: "Framtid", req: "Medicinlogg synkad mellan båda hem", type: "Feature" },
        { id: "M16-R09", prio: "Låg", status: "Framtid", req: "Assistenten skickar påminnelser till rätt förälder beroende på vems vecka", type: "Feature" },
        { id: "M16-R10", prio: "Låg", status: "Framtid", req: "Privata saker separerade — man ser bara det som rör barnen", type: "Feature" },
      ]
    },
    {
      id: "M17", name: "Smart Hem-integration", icon: "💡", color: "#E8E87C",
      requirements: [
        { id: "M17-R01", prio: "Låg", status: "Framtid", req: "Philips Hue lokal bridge-integration (stub)", type: "Integration" },
        { id: "M17-R02", prio: "Låg", status: "Framtid", req: "Spotify / Google Cast-integration (stub)", type: "Integration" },
        { id: "M17-R03", prio: "Låg", status: "Framtid", req: "Google Photos-integration (stub)", type: "Integration" },
      ]
    },
    {
      id: "M18", name: "Teknisk infrastruktur", icon: "⚙️", color: "#B0B0B0",
      requirements: [
        { id: "M18-R01", prio: "Hög", status: "Byggt", req: "React (JSX) + create-react-app / Vite", type: "Teknisk" },
        { id: "M18-R02", prio: "Hög", status: "Byggt", req: "Lokal dev-server localhost:5173 / 3000", type: "Teknisk" },
        { id: "M18-R03", prio: "Med", status: "Planerad", req: "Supabase backend för realtidssynk", type: "Backend" },
        { id: "M18-R04", prio: "Med", status: "Planerad", req: "Vercel deployment", type: "Backend" },
        { id: "M18-R05", prio: "Låg", status: "Framtid", req: "Self-hosting Raspberry Pi + Cloudflare Tunnel", type: "Backend" },
        { id: "M18-R06", prio: "Med", status: "Byggt", req: "Testplattform med automatiserade testsviter", type: "QA" },
        { id: "M18-R07", prio: "Med", status: "Byggt", req: "Visuell testbyggare med familjescenario-testfall", type: "QA" },
      ]
    },
  ]
};

const prioColor = { "Hög": "#dc3545", "Med": "#fd7e14", "Låg": "#6c757d" };
const statusColor = { "Byggt": "#28a745", "Planerad": "#007bff", "Framtid": "#9b59b6", "Bugg": "#dc3545" };
const typeColor = {
  "Feature": "#17a2b8", "UI": "#e83e8c", "Backend": "#6610f2",
  "Integration": "#fd7e14", "AI": "#20c997", "Teknisk": "#6c757d",
  "Arkitektur": "#343a40", "QA": "#795548", "Bugg": "#dc3545"
};

export default function KravDatabas() {
  const [activeModule, setActiveModule] = useState(null);
  const [filterPrio, setFilterPrio] = useState("Alla");
  const [filterStatus, setFilterStatus] = useState("Alla");
  const [filterType, setFilterType] = useState("Alla");
  const [search, setSearch] = useState("");

  const allReqs = data.modules.flatMap(m => m.requirements.map(r => ({ ...r, moduleName: m.name, moduleIcon: m.icon, moduleColor: m.color })));
  const filtered = allReqs.filter(r => {
    const inModule = !activeModule || r.moduleName === activeModule;
    const inPrio = filterPrio === "Alla" || r.prio === filterPrio;
    const inStatus = filterStatus === "Alla" || r.status === filterStatus;
    const inType = filterType === "Alla" || r.type === filterType;
    const inSearch = !search || r.req.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return inModule && inPrio && inStatus && inType && inSearch;
  });

  const stats = {
    total: allReqs.length,
    byggt: allReqs.filter(r => r.status === "Byggt").length,
    planerad: allReqs.filter(r => r.status === "Planerad").length,
    framtid: allReqs.filter(r => r.status === "Framtid").length,
    bugg: allReqs.filter(r => r.status === "Bugg").length,
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#0f0f13", minHeight: "100vh", color: "#e8e4dc", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1520 0%, #0f0f13 100%)", borderBottom: "1px solid #2a2535", padding: "24px 32px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 32 }}>🏡</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", color: "#f5f0e8" }}>Klara. — Kravdatabas</div>
            <div style={{ fontSize: 13, color: "#8b8398" }}>v1.0 — {stats.total} krav across {data.modules.length} moduler</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Totalt", val: stats.total, color: "#8b8398" },
            { label: "✅ Byggt", val: stats.byggt, color: "#28a745" },
            { label: "📋 Planerad", val: stats.planerad, color: "#007bff" },
            { label: "🔮 Framtid", val: stats.framtid, color: "#9b59b6" },
            { label: "🐛 Bugg", val: stats.bugg, color: "#dc3545" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1e1a28", border: `1px solid ${s.color}33`, borderRadius: 8, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: 12, color: "#8b8398" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: 220, borderRight: "1px solid #2a2535", overflowY: "auto", padding: "16px 0", flexShrink: 0 }}>
          <div style={{ padding: "0 12px 8px", fontSize: 11, letterSpacing: "0.08em", color: "#5a5570", textTransform: "uppercase" }}>Moduler</div>
          <div
            onClick={() => setActiveModule(null)}
            style={{ padding: "8px 16px", cursor: "pointer", borderLeft: !activeModule ? "3px solid #E8A87C" : "3px solid transparent", background: !activeModule ? "#1e1a28" : "transparent", color: !activeModule ? "#f5f0e8" : "#8b8398", fontSize: 13, marginBottom: 2, display: "flex", justifyContent: "space-between" }}
          >
            <span>Alla moduler</span>
            <span style={{ fontSize: 11, color: "#5a5570" }}>{stats.total}</span>
          </div>
          {data.modules.map(m => (
            <div
              key={m.id}
              onClick={() => setActiveModule(m.name === activeModule ? null : m.name)}
              style={{
                padding: "8px 16px", cursor: "pointer", fontSize: 13, marginBottom: 2,
                borderLeft: activeModule === m.name ? `3px solid ${m.color}` : "3px solid transparent",
                background: activeModule === m.name ? "#1e1a28" : "transparent",
                color: activeModule === m.name ? "#f5f0e8" : "#8b8398",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6
              }}
            >
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span>{m.icon}</span>
                <span style={{ fontSize: 12 }}>{m.name}</span>
              </span>
              <span style={{ fontSize: 11, color: "#5a5570", flexShrink: 0 }}>{m.requirements.length}</span>
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <input
              placeholder="🔍 Sök krav eller ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: "#1e1a28", border: "1px solid #2a2535", borderRadius: 8, padding: "8px 12px", color: "#e8e4dc", fontSize: 13, flex: 1, minWidth: 180, outline: "none" }}
            />
            {[
              { label: "Prio", val: filterPrio, set: setFilterPrio, opts: ["Alla", "Hög", "Med", "Låg"] },
              { label: "Status", val: filterStatus, set: setFilterStatus, opts: ["Alla", "Byggt", "Planerad", "Framtid", "Bugg"] },
              { label: "Typ", val: filterType, set: setFilterType, opts: ["Alla", "Feature", "UI", "AI", "Backend", "Integration", "Teknisk", "Arkitektur", "QA", "Bugg"] },
            ].map(f => (
              <select
                key={f.label}
                value={f.val}
                onChange={e => f.set(e.target.value)}
                style={{ background: "#1e1a28", border: "1px solid #2a2535", borderRadius: 8, padding: "8px 12px", color: "#e8e4dc", fontSize: 13, cursor: "pointer", outline: "none" }}
              >
                {f.opts.map(o => <option key={o} value={o}>{f.label}: {o}</option>)}
              </select>
            ))}
            <div style={{ fontSize: 13, color: "#5a5570", whiteSpace: "nowrap" }}>{filtered.length} krav</div>
          </div>

          {/* Table */}
          <div style={{ background: "#1a1520", borderRadius: 12, border: "1px solid #2a2535", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#141020", borderBottom: "1px solid #2a2535" }}>
                  {["ID", "Modul", "Krav", "Typ", "Prio", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, letterSpacing: "0.06em", color: "#5a5570", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #1e1a28", background: i % 2 === 0 ? "transparent" : "#16121e" }}>
                    <td style={{ padding: "10px 14px", color: "#5a5570", fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>{r.id}</td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.moduleColor, display: "inline-block", flexShrink: 0 }} />
                        <span style={{ color: "#8b8398", fontSize: 12 }}>{r.moduleIcon} {r.moduleName}</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#e8e4dc", lineHeight: 1.5 }}>{r.req}</td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <span style={{ background: `${typeColor[r.type]}22`, color: typeColor[r.type], padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{r.type}</span>
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <span style={{ color: prioColor[r.prio], fontWeight: 600, fontSize: 12 }}>{r.prio}</span>
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <span style={{ background: `${statusColor[r.status]}22`, color: statusColor[r.status], padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
