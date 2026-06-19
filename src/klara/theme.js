// ─── Klara Design Tokens ─────────────────────────────────────────────────────
// Based on the dashboard UI kit (ui_kits/dashboard/index.html).
// Warm cream paper · plum-tinted ink · purple brand accent · frosted glass cards.

export const T = {
  // ── Brand accent ───────────────────────────────────────────────────────────
  purple:       '#7C5CBF',
  purpleDark:   '#5B3FA0',
  purpleLight:  '#EDE8FF',   // tinted bg for chips/highlights

  // ── Sidebar ────────────────────────────────────────────────────────────────
  sidebar:           '#1C1B2E',
  sidebarHover:      '#2A2845',
  sidebarActive:     '#7C5CBF',
  sidebarText:       '#9B9BB5',
  sidebarActiveText: '#FFFFFF',

  // ── Canvas & surfaces ──────────────────────────────────────────────────────
  bg:       '#F6F1EA',       // warm cream canvas (from design)
  bgWarm:   '#FFFBF6',       // warmest layer (behind cards)
  card:     '#FFFFFF',       // solid card
  cardGlass:'rgba(255,255,255,0.92)', // frosted-glass card on dashboard

  // ── Text (plum-tinted ink scale) ───────────────────────────────────────────
  text:      '#1F1218',       // fg-1 — primary
  textMuted: '#5A4250',       // fg-2 — secondary copy
  textHint:  '#9C8A95',       // fg-3 — tertiary / hints

  // ── Borders (warm translucent hairlines) ───────────────────────────────────
  border:    'rgba(180,155,120,0.22)',
  borderMid: 'rgba(180,160,130,0.48)',

  // ── Elevation (warm-tinted shadows) ────────────────────────────────────────
  shadow:   '0 2px 16px rgba(80,40,70,0.09)',
  shadowSm: '0 2px 8px rgba(60,30,50,0.07)',
  shadowMd: '0 6px 28px rgba(80,40,70,0.13)',

  // ── Radius ─────────────────────────────────────────────────────────────────
  radius:   12,
  radiusSm: 8,
  radiusLg: 20,

  // ── Semantic accents ───────────────────────────────────────────────────────
  green:      '#3D7A55',  greenLight:  '#EAF4EF',  greenText:  '#245C3A',
  red:        '#C04040',  redLight:    '#FDEAEA',
  orange:     '#C07830',  orangeLight: '#FDF4EB',  orangeText: '#8A4D10',
  blue:       '#3060A8',  blueLight:   '#EBF1FB',  blueText:   '#1A3D7A',
  sage:       '#6A8870',  sageLight:   '#EDF2EF',
  pink:       '#A83060',  pinkLight:   '#FDF0FB',

  // ── Typography families ───────────────────────────────────────────────────
  fontDisplay: "'Fraunces', ui-serif, Georgia, serif",
  fontBody:    "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono:    "'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace",
};
