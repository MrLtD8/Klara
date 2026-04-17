# 🏡 FamiljePlan — Installationsguide

## Vad du behöver installera först

1. **Node.js** — ladda ner från [nodejs.org](https://nodejs.org) (välj LTS-versionen)
2. Det är allt!

---

## Steg-för-steg

### 1. Skapa ett nytt projekt

Öppna **Kommandotolken** (sök på "cmd" i Start-menyn) och kör:

```
npx create-react-app familjeplan
cd familjeplan
```

Vänta ca 1–2 minuter medan det installeras.

### 2. Kopiera in filerna

Gå till mappen `familjeplan/src/` och **ersätt** dessa filer med dina:

| Din fil | Klistra in i |
|---|---|
| `App.jsx` | `src/App.jsx` (ersätt den befintliga) |
| `index.js` | `src/index.js` (ersätt den befintliga) |
| `familjedashboard.jsx` | `src/familjedashboard.jsx` (ny fil) |
| `familjeapp-mobile.jsx` | `src/familjeapp-mobile.jsx` (ny fil) |

Ta bort dessa filer som create-react-app skapade (de behövs inte):
- `src/App.css`
- `src/App.test.js`
- `src/logo.svg`
- `src/reportWebVitals.js`
- `src/setupTests.js`

### 3. Starta appen

```
npm start
```

Webbläsaren öppnas automatiskt på http://localhost:3000 🚀

---

## Byta mellan dashboard och mobilapp

Öppna `src/App.jsx` och kommentera/avkommentera:

```jsx
// iPad-dashboard (standard):
import App from './familjedashboard';

// Mobilapp (kommentera bort raden ovan, avkommentera denna):
// import App from './familjeapp-mobile';
```

---

## Bygga för produktion (Vercel / egen server)

```
npm run build
```

Skapar en `build/`-mapp som du laddar upp till Vercel eller din server.

### Publicera på Vercel (gratis)
1. Skapa konto på [vercel.com](https://vercel.com)
2. Installera Vercel CLI: `npm install -g vercel`
3. Kör: `vercel` i projektmappen
4. Följ instruktionerna — du får en publik URL direkt!

---

## iPad-installation

1. Öppna er Vercel-URL i **Safari** på iPaden
2. Tryck på dela-ikonen (□↑)
3. Välj **"Lägg till på hemskärmen"**
4. Den ser nu ut som en riktig app!
5. Aktivera **Guided Access** (Inställningar → Tillgänglighet → Guided Access) 
   så skärmen aldrig låser sig

---

## Filer i projektet

```
familjeplan/
├── src/
│   ├── App.jsx                ← väljer vilken app som visas
│   ├── index.js               ← React-startpunkt
│   ├── familjedashboard.jsx   ← iPad-dashboarden
│   └── familjeapp-mobile.jsx  ← Mobilappen
├── public/
│   └── index.html             ← skapas av create-react-app
└── package.json               ← projektinfo
```

---

## Vanliga problem

**"npm: command not found"**
→ Node.js är inte installerat. Gå till nodejs.org och installera.

**Sidan är tom / röd feltext**
→ Kontrollera att du ersatt App.jsx och index.js korrekt.

**"Cannot find module './familjedashboard'"**
→ Kontrollera att familjedashboard.jsx ligger i src/-mappen.

---

Lycka till! 🎉
