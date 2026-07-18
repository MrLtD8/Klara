# Ändringslogg — Familjeapp

## 1.11.0 (2026-07-18)

### Säkerhetskopiering
- **Automatiska snapshots**: servern sparar en kopia av all data per dygn i `/data/backups` (de 14 senaste behålls).
- **Ladda ner backup** i Inställningar → Säkerhetskopiering — en off-device-kopia som skyddar även om HA-enheten går sönder.
- **Återställ** från nedladdad fil eller server-snapshot. En ångra-punkt (pre-restore-snapshot) sparas alltid först.
- Uppladdade filer valideras (måste innehålla `kl_*`-nycklar) och snapshot-namn skyddas mot path traversal.
- OBS: maillösenord och API-nycklar ligger i addonets konfiguration och ingår inte — de täcks av HA:s egen backup (Inställningar → System → Säkerhetskopior).

---

## 1.10.0 (2026-07-17)

### Viktiga mail som egen app + prioritering
- **Ny sida "Viktiga mail"** i Klara (aktiveras i Hantera appar): hela mail-digesten plus prioriteringsinställningar.
- **VIP-listan**: avsändare/domäner/nyckelord (t.ex. `unikum.net`, `samfällighet`) tas ALLTID med — deterministiskt, även om AI:n missar dem. VIP-mail märks med lila etikett och sorteras överst.
- **Blockeringslistan**: avsändare/nyckelord som aldrig visas och aldrig ens skickas till AI:n.
- Triage-prompten prioriterar nu uttryckligen skola/förskola, samfällighet och privata mail från riktiga personer.

---

## 1.9.0 (2026-07-17)

### Lokal AI via Ollama
- **AI-växel**: sätt addon-optionen `ollama_url` (t.ex. `http://192.168.50.244:11434`) så körs all AI — dagsrapport, sammanfattning och mail-triage — mot din lokala Ollama istället för Claude API. Ingen data lämnar hemmet och det kostar ingenting.
- `ollama_model` väljer modell (standard `llama3.2:3b`). Lämna `ollama_url` tom för att använda Claude API som tidigare.
- JSON-svar tvingas via Ollamas `format: json` — strukturerade svar även från små modeller.
- Ny endpoint `/api/ai/status` visar aktiv AI-leverantör och om den är nåbar.

---

## 1.8.0 (2026-07-14)

### Viktiga mail på dashboarden
- **Ny widget på Hem**: "Viktiga mail" — servern hämtar era senaste mail via IMAP och låter Claude sortera ut det som kräver handling (räkningar, skola, vård, bokningar). Nyhetsbrev och reklam filtreras bort.
- Varje mail visas med ämne, avsändare, en AI-sammanfattning och en föreslagen åtgärd.
- Automatisk skanning var 30:e minut + "Uppdatera"-knapp i widgeten.
- **Mailkonton** ställs in i addonets konfiguration (`mail_accounts`) med Gmail app-lösenord — lösenorden lagras bara på HA-enheten. Endast avsändare/ämne/kort utdrag skickas till Claude.

### Tekniskt
- Ny addon-option `mail_accounts` (lista: name, user, password, host)
- Gemensam `callClaude()`-hjälpare — dagsrapport, sammanfattning och mail-triage delar samma kod
- `imapflow` tillagd i Docker-imagen — **Rebuild krävs** för denna version

---

## 1.7.0 (2026-06-20)

### Automationer — nu med riktig backend
- **Regelmotor i addonet**: reglerna från Automationer-sidan utvärderas var 30:e sekund på servern.
- **Home Assistant-koppling** (`homeassistant_api: true`): addonet pratar med HA:s API utan token-konfiguration.
- **Dörrsensor-trigger**: välj valfri `binary_sensor` i Automationer-sidan — "Ytterdörren öppnas" triggar på riktigt.
- **Push-notiser via HA**: åtgärden "Push-notis" anropar HA:s notify-tjänst (väljbar i addon-inställningarna).
- **Händelselogg** i appen visar alla triggade regler.

### AI-dagsrapport (server-side)
- Ny knapp i Assistent: servern bygger en prompt av dagens kalender, öppna uppgifter och medicinstatus och låter Claude skriva en dagsrapport.
- **AI-förslag → tavlan**: föreslagna uppgifter kan läggas på Kanban-tavlan med ett klick (taggas "AI-förslag").
- API-nyckeln anges i addonets konfiguration (`anthropic_api_key`) — den lagras på HA-enheten, inte i webbläsaren.

### Addon-inställningar (nya)
- `anthropic_api_key` — Claude API-nyckel för dagsrapporten
- `notify_service` — HA notify-tjänst för push (standard: `notify`)

---

## 1.6.0 (2026-06-22)

### Onboarding (Klara)
- Ny **steg-för-steg-tutorial** vid första start: välkommen, familjenamn, familjemedlemmar, modulval och rundtur.
- **Familjenamn** visas i hälsningen på Hem-sidan ("God dag, Svenssons!") — ställs in i Inställningar eller vid onboarding.

### Google Kalender i veckovy (Familjen)
- Google Kalender-events visas nu direkt i **veckokalendern** i Familjen-designen (inte bara i sidopanelen). Events markeras med 📆 och är skrivskyddade.

### Touch drag-and-drop (iPad)
- **Kanban-tavlan** i Familjen-designen stödjer nu drag-and-drop på iPad/touch: håll fingret på ett kort (~200ms), dra till en annan kolumn och släpp.

### Övrigt
- Tog bort "Landerstedts" ur standardtext i Familjen-designen.

---

## 1.5.0 (2026-06-19)

### Två designer som delar data
- **Designväljare** i inställningarna: välj mellan **Klara** (lila) och **Familjen** (grå). Valet synkas mellan enheter.
- **Delat datalager** — båda designerna läser/skriver samma familj, uppgifter och kalender (`kl_*`-nycklar via adapter). Det du gör i den ena syns i den andra.

### Google Kalender — flera kalendrar
- Lägg till **flera hemliga iCal-länkar** (en per Google-kalender), var och en med eget namn, färg och på/av-knapp.
- **Återkommande händelser hanteras korrekt**: avslutade serier (UNTIL/COUNT) slutar visas, intervall (varannan vecka), specifika veckodagar (BYDAY) och undantagna datum (EXDATE) respekteras. Servern expanderar serier till konkreta datum.

### Kalender
- Tog bort **Planering**- och **Skola**-flikarna — bara kalendervyn.
- **Redigera egna händelser** genom att klicka på dem (vecko- och månadsvy). Google-händelser är skrivskyddade.
- **Vem** är nu en dropdown med familjens namn.
- **Snabb-bubblor** med de senaste händelserna högst upp i Ny händelse-rutan.
- Fixade kolumnjusteringen i månadsvyn (lång text klipps istället för att tänja ut rutan).

### Dashboard (Hem)
- Veckans kalender + statistik visar nu den **riktiga kalendern** (inkl. Google-kalendrar och upprepningar).
- **Flytta runt widgets** med draghandtag i Anpassa-läget; ordningen sparas.

### Tidigare i 1.3–1.4.1
- 1.3.0: dual-design + delat datalager. 1.4.0: flera kalendrar. 1.4.1: recurrence-fix.

---

## 1.2.0 (2026-06-16)

### Arkitektur
- Borttaget: Supabase-auth, molninloggning och familje-spaces — appen är nu helt lokal
- Borttaget: Google OAuth (Client ID / API-nyckel) för kalendersynk

### Google Kalender
- Ny iCal-baserad synk via hemlig `.ics`-länk — fungerar på iPad och alla enheter i hemmanätet utan OAuth
- Ny server-endpoint `/api/calendar` i HA-addonet hämtar och tolkar iCal-data server-side (ingen CORS-problematik)
- Kalender-händelser från Google visas med 📆-ikon, kan inte dras eller tas bort
- Inställningar → Google Kalender: enkelt fält för iCal-URL + aktiverings-toggle

### Inställningar
- Borttaget: "Din familj"-sektionen (familjenamn, inbjudningskod, lämna familjen)
- Borttaget: OAuth-fälten (Client ID, API-nyckel, Kalender-ID:n)
- Kvar: Familjemedlemmar (lokal CRUD), Menymoduler, Medicin, Dagens fokus, Om Klara

---

## 1.1.0 (2026-04-22)

### Nya moduler
- **Bil-påminnelser** — Quick-add-mallar, månadspiker, dagar-till-färgkodning, Klar-knapp
- **Hus-underhållsplan** — Kategorifilter, intervall-baserat nästa-datum, förfallet-detektering
- **Medicin-tracker** — Antal kvar, dos/dag, beställningströskel, FASS-länk, doslogg med tidsstämplar
- **Ekonomi-flik** — Budget (inkomst/utgifter/balans), kategorifördelning, kommande betalningar, spartips
- **Bucketlist** — Drömupplevelser med kategori/vem, progressbar, datum när bockat av
- **Sommarlovslista** — 15 förfyllda aktiviteter, kategorifilter, lägg till egna, checkboxar
- **Aktivitetshjulet** — SVG-snurrehjul med animation, 12 aktiviteter, konfigurerbar lista
- **Familjeassistenten** — Dagsrapport (hälsning/statistik/tasks/kalender) + AI-sammanfattning via Claude API

### Kalender
- Aktivitetsstickers (12 typer: dans, simning, kalas, läkare m.m.)
- Drag-och-släpp mellan dagar
- Återkommande stickers (vecka/år)

### Tasks
- Drag-och-släpp fixat, assignee-avatarer på kort, ordningssortering
- Estimat-picker (30min / 2h / halvdag / heldag) med badge på kort
- Subtasks med progressindikator, lägg till/bocka av inline
- Epics-vy i Planering, koppla tasks till epic, progressbar per epic

### Inställningar & onboarding
- Modulhantering — aktivera/avaktivera flikar per familj
- Onboarding-flöde för ny installation

### Auth
- Supabase auth (valfritt) med graceful fallback till lokalt läge

---

## 1.0.4 och tidigare
Grundläggande kalender, task-hantering och lokal datasynk via Animus Heart.
