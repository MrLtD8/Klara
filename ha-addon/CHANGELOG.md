# Ändringslogg — Familjeapp

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
