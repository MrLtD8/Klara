# Ändringslogg — Familjeapp

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
