# FamiljePlan — Roadmap

**Uppdaterad:** 2026-04-20

---

## ✅ IMPLEMENTERAT (2026-04-20)

| Modul | Status | Vad som byggdes |
|-------|--------|-----------------|
| Kalender – Aktivitetsstickers | ✅ Klart | Klickbara ikoner (dans, simning, kalas, läkare m.m.), drag-och-släpp mellan dagar, återkommande (vecka/år) |
| Tasks – Buggfix | ✅ Klart | Drag-och-släpp fixat, assignee-avatarer på kort, ordningssortering |
| Tasks – Tidsättning | ✅ Klart | Estimat-picker (30min/2h/halvdag/heldag) på varje task, badge på kort |
| Tasks – Subtasks | ✅ Klart | Undertasks med progressindikator på taskkortet, lägg till/bocka av inline |
| Tasks – Epics | ✅ Klart | Epics-vy i Planering, koppla tasks till epic, progressbar per epic |
| Bil-påminnelser | ✅ Klart | Quick-add-mallar, månadspiker, dagar-till-färgkodning, "Klar"-knapp |
| Hus-underhållsplan | ✅ Klart | Kategorifilter, intervall-baserat nästa-datum, förfallet-detektering |
| Medicin-tracker (utökad) | ✅ Klart | Antal kvar, dos/dag, beställningströskel, FASS-länk, doslogg med tidsstämplar, varning vid lågt lager |
| Ekonomi-flik | ✅ Klart | Budget (inkomst/utgifter/balans), kategorifördelning, kommande betalningar, 10 spartips |
| Bucketlist | ✅ Klart | Drömupplevelser med kategori/vem, progressbar, datum när man bockat av |
| Sommarlovslista | ✅ Klart | 15 förfyllda aktiviteter i grid, kategorifilter, lägg till egna, checkboxar |
| Aktivitetshjulet | ✅ Klart | SVG-snurrehjul med CSS-animation, 12 aktiviteter, konfigurerbar lista |
| Familjeassistenten | ✅ Klart | Dagsrapport (hälsning/statistik/tasks/kalender) + AI-mailsammanfattning via Claude API |
| Supabase auth | ✅ Klart | Graceful fallback — app fungerar lokalt utan molnkredentialer |

---

## KALENDER

| Feature | Prio | Beskrivning |
|---------|------|-------------|
| Aktivitetsstickers | ✅ Klart | Se ovan |
| Reseinspiration | Låg | AI-förslag baserat på familj, åldrar och skollov. Djuplänkar till TUI/Ving/Apollo. Koppling till bucketlistan. |

---

## TASKS

| Feature | Prio | Beskrivning |
|---------|------|-------------|
| Buggfixa befintligt task-system | ✅ Klart | Se ovan |
| Tidsättning på tasks | ✅ Klart | Se ovan |
| Subtasks | ✅ Klart | Se ovan |
| Epics | ✅ Klart | Se ovan |

---

## NYA FLIKAR & MODULER

| Feature | Prio | Beskrivning |
|---------|------|-------------|
| Bil-påminnelser | ✅ Klart | Se ovan |
| Hus-underhållsplan | ✅ Klart | Se ovan |
| Medicin-tracker | ✅ Klart | Se ovan |
| Ekonomi-flik | ✅ Klart | Se ovan |
| Familjens bucketlist | ✅ Klart | Se ovan |
| Sommarlovslista | ✅ Klart | Se ovan |
| Aktivitetshjulet (kids) | ✅ Klart | Se ovan |
| Reseinspiration | Låg | AI-förslag baserat på familj, åldrar och skollov. |

---

## FAMILJEASSISTENTEN — SEPARAT ADDON

| Feature | Prio | Beskrivning |
|---------|------|-------------|
| AI-mailsammanfattning (in-app) | ✅ Klart | Klistra in text → sammanfatta via Claude Haiku. API-nyckel lagras lokalt. |
| Dagsrapport (in-app) | ✅ Klart | Morgon-/kvällsrapport med tasks, kalender, mediciner och tips. |
| AI-mailsammanfattning via Gmail MCP | Medel | Läser Gmail direkt via MCP. Kräver OAuth + cloud-deployment. |
| Morgon- & kvällsrapport via SMS | Medel | Twilio/46elks + Vercel Cron. Kräver cloud-deployment. |
| Kalender-intelligens & konfliktdetektering | Medel | Läser båda föräldrars Google Calendar. Flaggar dubbelbokningar och barnvaktsbehov. |
| Medicin- & underhållslarm (push) | Medel | Aviserar när medicin börjar ta slut. Kräver push-notifikations-infrastruktur. |
| Task-coaching | Låg | "Ni har inte rört X på 3 veckor, kanske dags?" Proaktiv, inte påträngande. |
| Väderdriven aktivitetsförslag | Låg | Kopplar väder till aktivitetshjulet och sommarlovslistan. |

---

## FRAMTID / BACKLOGG

| Feature | Prio | Beskrivning |
|---------|------|-------------|
| Separerat föräldraläge | Framtid | Växelvis boende-schema, delad barnkalender, ekonomiedelning, packlista vid byte. Kräver molnlösning. |
| Resehjälpmedel | Framtid | Packlista per familjemedlem, tidszoner, nödnummer, medicinblad som PDF, resebudget, valutaomvandlare. |

---

## INFRASTRUKTUR (pågående)

| Feature | Status | Beskrivning |
|---------|--------|-------------|
| Animus Heart / HA OS | ✅ Klart | React-appen körs som HA add-on på lokal server |
| Supabase auth | ✅ Klart | Valfritt auth med graceful local fallback |
| Cloudflare Tunnel + Access | 🔄 Pågående | Fast domän, HTTPS, Google OAuth, säker fjärråtkomst |

---

## MOLNVERSION — ANALYTICS & ANVÄNDARBETEENDE

**Designprincip:** Analytics-data samlas endast in för vuxna användare. Barns aktivitet spåras aldrig.

| Feature | Prio | Beskrivning |
|---------|------|-------------|
| DAU / MAU | Hög | Dagliga & månatliga aktiva användare |
| Retention rate | Hög | Återkommande användare vecka för vecka |
| Session-längd | Medel | Aktiv tid per besök |
| Feature usage tracking | Medel | Vilka delar av appen används mest |
