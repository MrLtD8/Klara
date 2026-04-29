import React, { useState } from 'react';
import { T } from '../theme';
import { useLocalStorage } from '../../useLocalStorage';

const CATS = ['Bostad', 'Mat', 'Transport', 'Nöje', 'Hälsa', 'Kläder', 'Sparande', 'Övrigt', 'Lön', 'Bidrag'];

const SAVINGS_TIPS = [
  'Planera veckans mat på söndagen för att minska matsvinn.',
  'Handla storpack på förbrukningsvaror när det är rea.',
  'Säg upp prenumerationer du inte använder varje månad.',
  'Jämför elpriser och byt leverantör om det lönar sig.',
  'Samåk till jobbet eller skolan för att spara på bränsle.',
  'Köp secondhand — kläder och möbler håller länge.',
  'Lägg in automatisk sparöverföring på lönedagen.',
  'Laga och underhåll prylar istället för att köpa nytt.',
  'Använd biblioteket för böcker, filmer och spel.',
  'Planera semestern tidigt för bättre priser.',
];

const defaultBudget = [
  { id: 'b1', title: 'Lön Alex',       amount: 35000, category: 'Lön',      type: 'income',  recurring: true,  date: '2026-04-25' },
  { id: 'b2', title: 'Lön Sara',        amount: 32000, category: 'Lön',      type: 'income',  recurring: true,  date: '2026-04-25' },
  { id: 'b3', title: 'Barnbidrag',      amount: 2500,  category: 'Bidrag',   type: 'income',  recurring: true,  date: '2026-04-20' },
  { id: 'b4', title: 'Boränta',         amount: 8500,  category: 'Bostad',   type: 'expense', recurring: true,  date: '2026-04-28' },
  { id: 'b5', title: 'Mataffär',        amount: 6000,  category: 'Mat',      type: 'expense', recurring: true,  date: '2026-04-15' },
  { id: 'b6', title: 'Bil (bensin)',    amount: 1200,  category: 'Transport',type: 'expense', recurring: true,  date: '2026-04-10' },
  { id: 'b7', title: 'Netflix',         amount: 179,   category: 'Nöje',     type: 'expense', recurring: true,  date: '2026-05-05' },
  { id: 'b8', title: 'Försäkringsförnyelse', amount: 4200, category: 'Bostad', type: 'expense', recurring: false, date: '2026-06-01' },
];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 14, color: T.text,
  marginBottom: 14, outline: 'none', background: T.bg,
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 5 };

function fmt(n) { return n.toLocaleString('sv-SE') + ' kr'; }

export default function Ekonomi({ guestMode = false }) {
  const [budget, setBudget] = useLocalStorage('kl_budget', defaultBudget);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [fTitle, setFTitle] = useState('');
  const [fAmount, setFAmount] = useState(0);
  const [fCat, setFCat] = useState('Övrigt');
  const [fType, setFType] = useState('expense');
  const [fRecurring, setFRecurring] = useState(false);
  const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0]);

  if (guestMode) {
    return (
      <div style={{ padding: '32px 36px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>💰 Ekonomi</h1>
        <div style={{ marginTop: 40, textAlign: 'center', color: T.textMuted, fontSize: 18 }}>
          🔒 Dold i gästläge
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  const thisMonth = budget.filter(e => e.date && e.date.startsWith(currentMonth));

  const totalIncome = thisMonth.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = thisMonth.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const upcoming = budget.filter(e => e.date > today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  // Category breakdown for expenses
  const expCats = {};
  thisMonth.filter(e => e.type === 'expense').forEach(e => {
    expCats[e.category] = (expCats[e.category] || 0) + e.amount;
  });
  const expCatArr = Object.entries(expCats).sort((a, b) => b[1] - a[1]);

  function openAdd() {
    setEditId(null);
    setFTitle(''); setFAmount(0); setFCat('Övrigt'); setFType('expense'); setFRecurring(false);
    setFDate(today);
    setShowModal(true);
  }

  function openEdit(item) {
    setEditId(item.id);
    setFTitle(item.title); setFAmount(item.amount); setFCat(item.category);
    setFType(item.type); setFRecurring(item.recurring); setFDate(item.date);
    setShowModal(true);
  }

  function saveEntry() {
    if (!fTitle.trim() || !fAmount) return;
    if (editId) {
      setBudget(prev => prev.map(e => e.id === editId ? { ...e, title: fTitle, amount: Number(fAmount), category: fCat, type: fType, recurring: fRecurring, date: fDate } : e));
    } else {
      setBudget(prev => [...prev, { id: 'b_' + Date.now(), title: fTitle, amount: Number(fAmount), category: fCat, type: fType, recurring: fRecurring, date: fDate }]);
    }
    setShowModal(false);
  }

  function removeEntry(id) {
    setBudget(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>💰 Ekonomi</h1>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 14 }}>
            Månadsöversikt — {new Date().toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={openAdd} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Lägg till post
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ background: T.greenLight, border: `1px solid ${T.green}44`, borderRadius: T.radius, padding: 20 }}>
          <div style={{ fontSize: 12, color: T.greenText, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Inkomst</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.green }}>{fmt(totalIncome)}</div>
        </div>
        <div style={{ background: T.redLight, border: `1px solid ${T.red}44`, borderRadius: T.radius, padding: 20 }}>
          <div style={{ fontSize: 12, color: T.red, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Utgifter</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.red }}>{fmt(totalExpense)}</div>
        </div>
        <div style={{
          background: balance >= 0 ? T.greenLight : T.redLight,
          border: `1px solid ${(balance >= 0 ? T.green : T.red)}44`,
          borderRadius: T.radius, padding: 20
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, color: balance >= 0 ? T.greenText : T.red }}>Saldo</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: balance >= 0 ? T.green : T.red }}>
            {balance >= 0 ? '+' : ''}{fmt(balance)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Category breakdown */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text }}>Utgifter per kategori</h2>
          {expCatArr.length === 0 && <div style={{ color: T.textMuted, fontSize: 14 }}>Inga utgifter denna månad</div>}
          {expCatArr.map(([cat, amount]) => {
            const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: T.text, fontWeight: 500 }}>{cat}</span>
                  <span style={{ color: T.textMuted }}>{fmt(amount)} ({pct}%)</span>
                </div>
                <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ background: T.purple, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming payments */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text }}>Kommande betalningar</h2>
          {upcoming.length === 0 && <div style={{ color: T.textMuted, fontSize: 14 }}>Inga kommande betalningar</div>}
          {upcoming.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '8px 10px', background: T.bg, borderRadius: T.radiusSm }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.title}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{item.date}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: item.type === 'income' ? T.green : T.red }}>
                {item.type === 'income' ? '+' : '-'}{fmt(item.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All entries */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text }}>Alla poster</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {budget.map(item => (
            <div key={item.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: T.bg, borderRadius: T.radiusSm,
              borderLeft: `3px solid ${item.type === 'income' ? T.green : T.red}`,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.title}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{item.category} · {item.date}{item.recurring ? ' · 🔁' : ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: item.type === 'income' ? T.green : T.red }}>
                  {item.type === 'income' ? '+' : '-'}{fmt(item.amount)}
                </div>
                <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14 }}>✏️</button>
                <button onClick={() => removeEntry(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.red, fontSize: 14 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Savings tips */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: T.text }}>💡 Spartips</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {SAVINGS_TIPS.map((tip, i) => (
            <div key={i} style={{ background: T.purpleLight, borderRadius: T.radiusSm, padding: '12px 16px', fontSize: 13, color: T.text, lineHeight: 1.5 }}>
              <span style={{ color: T.purple, fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>
              {tip}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 420, boxShadow: T.shadowMd }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: T.text }}>{editId ? 'Redigera post' : '+ Ny post'}</h2>

            <label style={labelStyle}>Typ</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button onClick={() => setFType('income')} style={{ flex: 1, background: fType === 'income' ? T.green : T.bg, color: fType === 'income' ? '#fff' : T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>Inkomst</button>
              <button onClick={() => setFType('expense')} style={{ flex: 1, background: fType === 'expense' ? T.red : T.bg, color: fType === 'expense' ? '#fff' : T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>Utgift</button>
            </div>

            <label style={labelStyle}>Titel</label>
            <input autoFocus value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Vad?" style={inputStyle} />

            <label style={labelStyle}>Belopp (kr)</label>
            <input type="number" min="0" value={fAmount} onChange={e => setFAmount(e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Kategori</label>
            <select value={fCat} onChange={e => setFCat(e.target.value)} style={inputStyle}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={labelStyle}>Datum</label>
            <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={inputStyle} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text, marginBottom: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={fRecurring} onChange={e => setFRecurring(e.target.checked)} />
              Återkommande post
            </label>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={saveEntry} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Spara</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
