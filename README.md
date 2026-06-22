# Klara — Familjeplanering för Home Assistant

En lokal familjedashboard som körs som ett Home Assistant-addon. Ingen molntjänst, inga konton — all data stannar hemma på ditt nätverk.

> **Aktuell version: 1.5.0** · [Ändringslogg](ha-addon/CHANGELOG.md)

## Funktioner

### Två designer, ett datalager

- **Klara** (lila) — detaljrik sidebar-design med full modulhantering
- **Familjen** (grå) — kompakt dashboarddesign med flödesvy
- Välj design i Inställningar — båda läser och skriver samma data

### Kalender

- Vecko- och månadsvy med 18 aktivitetsstickers
- Drag-och-släpp mellan dagar
- Klicka på en händelse för att redigera den
- Återkommande händelser (varje vecka / varje år)
- **Vem**-dropdown med familjens namn
- Snabb-bubblor för att återanvända senaste händelser

### Google Kalender-synk

- Koppla **flera Google-kalendrar** via hemlig iCal-länk — ingen OAuth
- Varje kalender får eget namn, färg och på/av-knapp
- Återkommande händelser expanderas server-side (UNTIL/COUNT/BYDAY/EXDATE)
- Google-händelser visas med 📆-ikon och är skrivskyddade
- **iCal-URL:en lagras bara på din enhet** — den skickas aldrig till någon server

### Dashboard (Hem)

- Veckans kalender med riktiga händelser (inkl. Google Kalender)
- Flytta runt widgets med draghandtag i Anpassa-läget
- Familjestatistik, tasks och fokus-widget

### Sidomenyn (Klara)

- Minimera till ikonläge med ett klick — sparas mellan sessioner
- Aktivera/avaktivera moduler i Hantera appar

### Övriga moduler

| Modul | Beskrivning |
|---|---|
| Uppgifter | Kanban med prioritet, estimat, subtasks och epics |
| Familj | Lokal CRUD med färgkodade avatarer |
| Medicin | Tracker med doslogg och beställningströskel |
| Ekonomi | Budget, kategorifördelning, kommande betalningar |
| Bil & Hus | Underhållsplan med intervallbaserade påminnelser |
| Kids & Sysslor | Poängsystem och aktivitetshjul |
| Listor | Bucketlist och sommarlovslista |
| Wellness | Hälsolog |
| Assistent | AI-dagsrapport via Claude API *(under utveckling)* |

## Krav

- Home Assistant (OS, Container, Supervised — eller Animus Heart)
- Node.js 18+ lokalt (för att bygga frontend)

## Installation

### 1. Hämta koden

```bash
git clone https://github.com/Landerstedt/familjeapp.git
cd familjeapp
```

### 2. Bygg frontend

```bash
npm install
npm run build
cp -r build ha-addon/app/build
```

### 3. Lägg addonet på Home Assistant

Kopiera `ha-addon/`-mappen till HA:s `addons/`-mapp som en mapp med namnet `familjeapp`. Via Samba-delningen på Windows:

```
\\homeassistant\addons\familjeapp\
```

Mappen ska innehålla:
```
familjeapp/
├── config.yaml
├── Dockerfile
├── server.js
└── app/
    └── build/      ← React-bygget från steg 2
```

### 4. Installera i Home Assistant

1. **Inställningar → Add-ons → Add-on Store**
2. Klicka **⋮ → Kontrollera uppdateringar** — "Familjeapp" dyker upp under Lokala tillägg
3. Installera och starta

Appen nås på `http://<din-ha-adress>:3000` eller direkt via HA:s sidopanel.

## Lokal utveckling

Starta hot-reload-miljö med real API (port 3000 + 3001):

```bash
npm run dev
```

Öppna `http://localhost:3000`. Data sparas i `.devdata/familjeapp.json` (gitignorerat).

## Google Kalender (valfritt)

Synka via hemlig iCal-länk — ingen OAuth eller Google Cloud-projekt behövs.

1. Öppna [Google Kalender](https://calendar.google.com) → Inställningar → välj din kalender
2. Scrolla till **Integrera kalender** → kopiera **Hemlig adress i iCal-format** (`.ics`-URL)
3. I appen: **Inställningar → Google Kalender → Lägg till kalender**
4. Klistra in URL:en, ge den ett namn och aktivera

Länken ger läsåtkomst till kalendern — dela den inte offentligt. Den lagras bara lokalt på din HA-enhet och skickas aldrig vidare.

## Uppdatera

```bash
git pull
npm run build
cp -r build ha-addon/app/build
```

Kopiera sedan `server.js`, `config.yaml` och `app/build/` till addons-mappen på HA och klicka **Rebuild** på addonet.

## iPad-installation

1. Öppna `http://<din-ha-adress>:3000` i Safari
2. Dela → **Lägg till på hemskärmen**
3. Aktivera **Guided Access** (Inställningar → Tillgänglighet) om du vill ha kiosläge

## Säkerhet

- All data lagras i en JSON-fil på din HA-enhet (`/data/familjeapp.json`)
- Ingen data skickas till externa servrar
- Google Kalender-synk sker server-side — appen hämtar iCal via HA-addonet, inte direkt från webbläsaren
- iCal-URL:er (hemliga kalenderlänkar) lagras bara i datafilen och committas aldrig till git

## Teknikstack

| Del | Teknik |
|---|---|
| Frontend | React 18, inline styles, designtokens |
| Backend | Express.js på Node 18 i Docker |
| Lagring | JSON-fil på HA + localStorage som fallback |
| Kalender-synk | Server-side iCal-proxy (ingen CORS) |

## Licens

MIT — använd, bygg vidare och dela gärna.
