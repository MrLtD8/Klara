/**
 * familjedashboard.jsx
 *
 * Syfte: Huvud-dashboarden för familjeappen. Innehåller alla UI-komponenter
 *        och hanterar appens globala state via useLocalStorage.
 *
 * Struktur:
 *   - Imports från externa moduler och delade filer (constants, utils, useLocalStorage, taskLogic)
 *   - Lokala demokonstanter (CAL_EVENTS_DEMO, MEMBER_COLORS, TOUR_STEPS)
 *   - UI-komponenter: Toggle, StickerCard, DayCol, CalendarView, ClockBlock,
 *     FlowPanel, TaskForm, TaskCard, KanbanBoard, PlanningTab, KidsPointsTab,
 *     CalPanel, HueLampRow, Settings, Onboarding, GuestToast
 *   - Huvud-export: App (rot-komponent med allt state)
 *
 * Beroenden:
 *   - ./constants    (THEMES, PRIO_META, LANES, RECUR_OPTIONS, TAG_COLORS, ALL_TAGS,
 *                     FLOWS, WEEKDAYS_SV, MONTHS_SV, EVENT_TYPES, DEFAULT_FAMILY_MEALS,
 *                     DEFAULT_SCHOOL_MENU, INIT_LAMPS, CHORES_LIST, LEVELS, BADGES,
 *                     REWARDS, DEMO_KIDS)
 *   - ./utils        (useClock, getISOWeek, getWeekStart, addDays, fmtDate, toMin,
 *                     getActiveFlowId)
 *   - ./useLocalStorage (useLocalStorage)
 *   - ./taskLogic    (makeTask)
 */

import { useState, useEffect, useRef } from "react";
import useGoogleCalendar from './useGoogleCalendar';

// Delade konstanter — definierade i ./constants.js
import {
  THEMES, PRIO_META, LANES, RECUR_OPTIONS, TAG_COLORS, ALL_TAGS,
  FLOWS, WEEKDAYS_SV, MONTHS_SV, EVENT_TYPES,
  DEFAULT_FAMILY_MEALS, DEFAULT_SCHOOL_MENU, INIT_LAMPS,
  CHORES_LIST, LEVELS, BADGES, REWARDS, DEMO_KIDS,
} from "./constants";

// Hjälpfunktioner och klockhook — definierade i ./utils.js
import {
  useClock, getISOWeek, getWeekStart, addDays, fmtDate, toMin, getActiveFlowId,
} from "./utils";

// localStorage-hook — definierad i ./useLocalStorage.js
import { useLocalStorage } from "./useLocalStorage";

// Task-fabrik — definierad i ./taskLogic.js (rena funktioner, inga hooks)
import { makeTask } from "./taskLogic";

/* ═══ LOKALA DEMOKONSTANTER ══════════════════════════════════════
 * Dessa används bara i denna fil och behöver inte delas.
 * ════════════════════════════════════════════════════════════════ */
const CAL_EVENTS_DEMO=[
  {time:"07:30",title:"Skolan börjar",who:"Ella & Max",color:"#6B4EA8"},
  {time:"08:15",title:"Standup (Johan)",who:"Johan",color:"#2A5FA8"},
  {time:"15:30",title:"Fotbollsträning",who:"Ella",color:"#6B4EA8"},
  {time:"17:00",title:"Simning",who:"Max",color:"#3A7A52"},
  {time:"18:30",title:"Middag hemma",who:"Alla",color:"#B8722A"},
];

// Standardmallar — återanvändbara grupper av uppgifter
const DEFAULT_TEMPLATES=[
  {id:1,name:"Veckostäd",icon:"🧹",tasks:[
    {title:"Starta robotdamsugare uppe",prio:"medium",tags:["Hem"],mids:[]},
    {title:"Starta robotdamsugare nere",prio:"medium",tags:["Hem"],mids:[]},
    {title:"Toalett uppe",prio:"medium",tags:["Hem"],mids:[]},
    {title:"Toalett nere",prio:"medium",tags:["Hem"],mids:[]},
    {title:"Damtorka",prio:"medium",tags:["Hem"],mids:[]},
    {title:"Tömma papperskorgar",prio:"low",tags:["Hem"],mids:[]},
  ]},
  {id:2,name:"Storstäd",icon:"🏠",tasks:[
    {title:"Dammsuga hela huset",prio:"high",tags:["Hem"],mids:[]},
    {title:"Moppa golv",prio:"medium",tags:["Hem"],mids:[]},
    {title:"Rengöra ugn",prio:"medium",tags:["Hem"],mids:[]},
    {title:"Byta lakan",prio:"medium",tags:["Hem"],mids:[]},
    {title:"Putsa fönster",prio:"low",tags:["Hem"],mids:[]},
  ]},
];
// Get school lunch for a given date from the repeating weekly menu
function getSchoolLunch(date, schoolMenu){
  const dayJS=date.getDay(); // 0=Sun, 1=Mon...
  const map={1:"monday",2:"tuesday",3:"wednesday",4:"thursday",5:"friday"};
  const key=map[dayJS];
  return key ? schoolMenu[key]||"" : "";
}

// Get family dinner for a date — rotate through family meal list
function getFamilyDinner(date, familyMeals, calendarMeals){
  const dk=fmtDate(date);
  if(calendarMeals[dk]?.dinner) return calendarMeals[dk].dinner;
  if(!familyMeals.length) return "";
  // Use day-of-year mod list length for rotation
  const start=new Date(date.getFullYear(),0,0);
  const diff=date-start;
  const dayOfYear=Math.floor(diff/(1000*60*60*24));
  return familyMeals[dayOfYear % familyMeals.length];
}

function Toggle({value,onChange,T,small}){
  const w=small?34:40,h=small?19:23,bw=small?13:17;
  return <div onClick={()=>onChange(!value)} style={{width:w,height:h,borderRadius:h/2,background:value?T.amber:T.borderMid,position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
    <div style={{width:bw,height:bw,borderRadius:"50%",background:"#fff",position:"absolute",top:(h-bw)/2,left:value?w-bw-(h-bw)/2:(h-bw)/2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
  </div>;
}

/* ═══ CALENDAR VIEW ═════════════════════════════════════════════ */
function StickerCard({event,T,onDelete,onDragStart}){
  const et=EVENT_TYPES[event.type]||EVENT_TYPES.note;
  return <div
    draggable
    onDragStart={e=>{e.dataTransfer.setData("eventId",event.id);if(onDragStart)onDragStart();}}
    style={{borderRadius:8,border:`1.5px solid ${et.border}`,background:et.bg,padding:"4px 7px",marginBottom:4,boxShadow:"0 1px 5px rgba(0,0,0,0.07)",cursor:"grab",userSelect:"none",position:"relative"}}
  >
    <div style={{display:"flex",alignItems:"flex-start",gap:4}}>
      <span style={{fontSize:12,flexShrink:0,lineHeight:1.2}}>{et.icon}</span>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:9,fontWeight:700,color:"#1C1810",lineHeight:1.3,fontFamily:"'DM Sans',sans-serif"}}>{event.title}{event.recur&&event.recur!=="none"&&<span style={{marginLeft:3,opacity:.6}}>🔁</span>}</p>
        {event.who&&<p style={{fontSize:8,color:"#9A8E7C",marginTop:1,fontFamily:"'DM Sans',sans-serif"}}>{event.who}</p>}
      </div>
      {onDelete&&<button onClick={e=>{e.stopPropagation();onDelete(event.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:9,color:"#999",padding:"0 2px",lineHeight:1,flexShrink:0}}>✕</button>}
    </div>
  </div>;
}

function DayCol({date,isToday,events,schoolLunch,dinner,T,onAddEvent,onEditMeal,onDropEvent,onDeleteEvent}){
  const dayName=WEEKDAYS_SV[(date.getDay()+6)%7];
  const dayNum=date.getDate();
  const isWeekend=date.getDay()===0||date.getDay()===6;
  const isHoliday=events.some(e=>e.type==="holiday");
  const [dragOver,setDragOver]=useState(false);

  return <div
    onDragOver={e=>{e.preventDefault();setDragOver(true);}}
    onDragLeave={()=>setDragOver(false)}
    onDrop={e=>{e.preventDefault();setDragOver(false);const id=e.dataTransfer.getData("eventId");if(id&&onDropEvent)onDropEvent(id,fmtDate(date));}}
    style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,
      background:dragOver?T.amberBg+"55":isToday?T.amberBg:isWeekend?T.bg:T.calPaper,
      borderRight:`1px solid ${T.calBorder}`,position:"relative",overflow:"hidden",
      transition:"background .15s"}}
  >
    {isToday&&<div style={{position:"absolute",top:0,left:0,right:0,height:2.5,background:T.amber}}/>}

    {/* Day header */}
    <div style={{padding:"7px 8px 5px",borderBottom:`1px solid ${T.calBorder}`,flexShrink:0,marginTop:isToday?2.5:0}}>
      <div style={{display:"flex",alignItems:"baseline",gap:3}}>
        <span style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:isToday?T.amber:isHoliday?T.red:T.text,lineHeight:1}}>{dayNum}</span>
        <span style={{fontSize:8,fontWeight:700,color:isToday?T.amber:T.textDim,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:.4}}>{dayName.slice(0,3)}</span>
        {isToday&&<span style={{marginLeft:2,fontSize:13}}>❤️</span>}
      </div>
    </div>

    {/* Events */}
    <div style={{flex:1,padding:"5px 6px 4px",overflowY:"auto",minHeight:50}}>
      {events.filter(e=>e.type!=="holiday").map((ev)=><StickerCard key={ev.id} event={ev} T={T} onDelete={onDeleteEvent}/>)}
      <button onClick={()=>onAddEvent(fmtDate(date))} style={{width:"100%",padding:"3px",borderRadius:5,border:`1px dashed ${T.calBorder}`,background:"transparent",color:T.textDim,fontSize:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:.7}}>+ händelse</button>
    </div>

    {/* Meal section */}
    <div onClick={()=>onEditMeal(fmtDate(date))} style={{borderTop:`1px solid ${T.calBorder}`,padding:"5px 7px 6px",cursor:"pointer",flexShrink:0,minHeight:58,background:isToday?T.amberBg+"88":"transparent"}}>
      {schoolLunch&&<>
        <p style={{fontSize:7,color:T.sage,fontWeight:700,textTransform:"uppercase",letterSpacing:.7,fontFamily:"'DM Sans',sans-serif",marginBottom:1}}>🏫 Skola</p>
        <p style={{fontSize:8,color:T.textMid,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic",lineHeight:1.3,marginBottom:3}}>{schoolLunch}</p>
      </>}
      {dinner&&<>
        <p style={{fontSize:7,color:T.sage,fontWeight:700,textTransform:"uppercase",letterSpacing:.7,fontFamily:"'DM Sans',sans-serif",marginBottom:1}}>🍽️ Middag</p>
        <p style={{fontSize:8,color:T.text,fontFamily:"'DM Sans',sans-serif",fontWeight:600,lineHeight:1.3}}>{dinner}</p>
      </>}
      {!schoolLunch&&!dinner&&<p style={{fontSize:8,color:T.textDim,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic",opacity:.6}}>Klicka för mat...</p>}
    </div>
  </div>;
}

function CalendarView({T,familyMeals,schoolMenu}){
  const today=new Date(); today.setHours(0,0,0,0);
  const [weekStart,setWeekStart]=useState(getWeekStart(today));
  const [calMeals,setCalMeals]=useLocalStorage("fp_calmeals",{});
  const [calEvents,setCalEvents]=useLocalStorage("fp_calevents",[]);
  const [addEvDate,setAddEvDate]=useState(null);
  const [editMealDate,setEditMealDate]=useState(null);
  const [editMealForm,setEditMealForm]=useState({dinner:"",lunch:""});
  const [addEvForm,setAddEvForm]=useState({type:"note",title:"",who:"",recur:"none"});

  const wk=getISOWeek(weekStart);
  const month=MONTHS_SV[weekStart.getMonth()];
  const days=Array.from({length:7},(_,i)=>addDays(weekStart,i));

  const getEv=dk=>calEvents.filter(e=>e.date===dk);

  const openMealEdit=(dk)=>{
    const d=new Date(dk);
    const sl=getSchoolLunch(d,schoolMenu);
    const din=getFamilyDinner(d,familyMeals,calMeals);
    setEditMealForm({dinner:calMeals[dk]?.dinner||din||"",lunch:calMeals[dk]?.lunch||sl||""});
    setEditMealDate(dk);
  };
  const saveMeal=()=>{
    setCalMeals(p=>({...p,[editMealDate]:{...editMealForm}}));
    setEditMealDate(null);
  };
  const saveEvent=()=>{
    if(!addEvForm.title.trim())return;
    setCalEvents(p=>[...p,{...addEvForm,date:addEvDate,id:Date.now().toString()}]);
    setAddEvDate(null);
    setAddEvForm({type:"note",title:"",who:"",recur:"none"});
  };
  const deleteEvent=(id)=>setCalEvents(p=>p.filter(e=>e.id!==id));
  const dropEvent=(id,newDate)=>setCalEvents(p=>p.map(e=>e.id===id?{...e,date:newDate}:e));
  const getEvWithRecur=(dk)=>{
    const direct=calEvents.filter(e=>e.date===dk);
    const d=new Date(dk);
    const recurring=calEvents.filter(e=>{
      if(e.date===dk)return false;
      if(e.recur==="weekly"){const s=new Date(e.date);return s.getDay()===d.getDay();}
      if(e.recur==="yearly"){const s=new Date(e.date);return s.getMonth()===d.getMonth()&&s.getDate()===d.getDate();}
      return false;
    });
    return [...direct,...recurring];
  };

  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    {/* Cal header */}
    <div style={{padding:"9px 14px 7px",borderBottom:`1px solid ${T.calBorder}`,background:T.sageBg,flexShrink:0,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:6,flex:1}}>
        <span style={{fontSize:9,color:T.sage,fontWeight:700,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif"}}>Vecka</span>
        <span style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,color:T.sageDark,lineHeight:1}}>{wk}</span>
        <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:400,color:T.textMid}}>— {month}</span>
      </div>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        <button onClick={()=>setWeekStart(d=>addDays(d,-7))} style={{width:28,height:28,borderRadius:7,border:`1px solid ${T.calBorder}`,background:T.card,color:T.sage,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <button onClick={()=>setWeekStart(getWeekStart(today))} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${T.calBorder}`,background:T.card,color:T.sage,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Idag</button>
        <button onClick={()=>setWeekStart(d=>addDays(d,7))} style={{width:28,height:28,borderRadius:7,border:`1px solid ${T.calBorder}`,background:T.card,color:T.sage,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>→</button>
      </div>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:T.green}}/>
        <span style={{fontSize:9,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>Google Kalender</span>
        <span style={{fontSize:9,padding:"1px 7px",borderRadius:999,background:T.greenBg,color:T.green,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>Koppla</span>
      </div>
    </div>

    {/* Day grid */}
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {days.map(date=>{
        const dk=fmtDate(date);
        const isToday=date.getTime()===today.getTime();
        const sl=calMeals[dk]?.lunch||getSchoolLunch(date,schoolMenu)||"";
        const dinner=calMeals[dk]?.dinner||getFamilyDinner(date,familyMeals,calMeals)||"";
        return <DayCol key={dk} date={date} isToday={isToday} events={getEvWithRecur(dk)} schoolLunch={sl} dinner={dinner} T={T} onAddEvent={setAddEvDate} onEditMeal={openMealEdit} onDropEvent={dropEvent} onDeleteEvent={deleteEvent}/>;
      })}
    </div>

    {/* Legend */}
    <div style={{padding:"4px 12px",background:T.sageBg,borderTop:`1px solid ${T.calBorder}`,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",flexShrink:0}}>
      {Object.entries(EVENT_TYPES).slice(0,6).map(([k,v])=>(
        <div key={k} style={{display:"flex",alignItems:"center",gap:3}}>
          <span style={{fontSize:10}}>{v.icon}</span>
          <span style={{fontSize:8,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>{v.label}</span>
        </div>
      ))}
      <span style={{marginLeft:"auto",fontSize:8,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>❤️ = Idag · Klicka mat-fältet för att redigera</span>
    </div>

    {/* Meal edit overlay */}
    {editMealDate&&<div style={{position:"absolute",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(0,0,0,0.3)",backdropFilter:"blur(4px)"}} onClick={e=>{if(e.target===e.currentTarget)setEditMealDate(null);}}>
      <div style={{width:"100%",maxWidth:420,background:T.card,borderRadius:"16px 16px 0 0",padding:"16px 18px 20px",boxShadow:"0 -8px 30px rgba(0,0,0,0.18)"}}>
        <div style={{width:32,height:4,borderRadius:2,background:T.border,margin:"0 auto 12px"}}/>
        <h3 style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,color:T.text,marginBottom:12}}>
          🍽️ Mat — {WEEKDAYS_SV[(new Date(editMealDate).getDay()+6)%7]} {new Date(editMealDate).getDate()} {MONTHS_SV[new Date(editMealDate).getMonth()]}
        </h3>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
          <div>
            <label style={{fontSize:10,fontWeight:700,color:T.sage,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>🏫 Skollunch / Lunch hemma</label>
            <input value={editMealForm.lunch} onChange={e=>setEditMealForm(f=>({...f,lunch:e.target.value}))}
              style={{width:"100%",padding:"8px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:10,fontWeight:700,color:T.sage,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>🍽️ Middag</label>
            <input value={editMealForm.dinner} onChange={e=>setEditMealForm(f=>({...f,dinner:e.target.value}))}
              style={{width:"100%",padding:"8px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
          </div>
          {/* Quick pick from family meals */}
          {familyMeals.length>0&&<div>
            <label style={{fontSize:10,fontWeight:700,color:T.sage,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>Snabbval — era middagar</label>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {familyMeals.slice(0,8).map((m,i)=>(
                <button key={i} onClick={()=>setEditMealForm(f=>({...f,dinner:m}))} style={{padding:"3px 9px",borderRadius:999,border:`1px solid ${editMealForm.dinner===m?T.amber:T.border}`,background:editMealForm.dinner===m?T.amberBg:"transparent",color:editMealForm.dinner===m?T.amber:T.textMid,fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:editMealForm.dinner===m?700:400}}>{m}</button>
              ))}
            </div>
          </div>}
        </div>
        <div style={{display:"flex",gap:7}}>
          <button onClick={()=>setEditMealDate(null)} style={{flex:1,padding:"9px",borderRadius:9,border:`1px solid ${T.border}`,background:"transparent",color:T.textMid,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Avbryt</button>
          <button onClick={saveMeal} style={{flex:2,padding:"9px",borderRadius:9,border:"none",background:T.sage||T.amber,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Spara</button>
        </div>
      </div>
    </div>}

    {/* Add event overlay */}
    {addEvDate&&<div style={{position:"absolute",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(0,0,0,0.3)",backdropFilter:"blur(4px)"}} onClick={e=>{if(e.target===e.currentTarget)setAddEvDate(null);}}>
      <div style={{width:"100%",maxWidth:460,background:T.card,borderRadius:"16px 16px 0 0",padding:"16px 18px 20px",boxShadow:"0 -8px 30px rgba(0,0,0,0.18)",maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{width:32,height:4,borderRadius:2,background:T.border,margin:"0 auto 12px"}}/>
        <h3 style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,color:T.text,marginBottom:10}}>Ny aktivitet</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginBottom:10}}>
          {Object.entries(EVENT_TYPES).map(([k,v])=>(
            <button key={k} onClick={()=>setAddEvForm(f=>({...f,type:k,title:f.title||v.label}))} style={{padding:"6px 3px",borderRadius:8,border:`2px solid ${addEvForm.type===k?v.border:T.border}`,background:addEvForm.type===k?v.bg:T.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <span style={{fontSize:17}}>{v.icon}</span>
              <span style={{fontSize:7,fontFamily:"'DM Sans',sans-serif",color:addEvForm.type===k?"#333":T.textDim,fontWeight:addEvForm.type===k?700:400}}>{v.label}</span>
            </button>
          ))}
        </div>
        <input value={addEvForm.title} onChange={e=>setAddEvForm(f=>({...f,title:e.target.value}))} placeholder="Vad händer?"
          style={{width:"100%",padding:"8px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:6,boxSizing:"border-box"}}/>
        <input value={addEvForm.who} onChange={e=>setAddEvForm(f=>({...f,who:e.target.value}))} placeholder="Vem? (valfri)"
          style={{width:"100%",padding:"8px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:5,marginBottom:12}}>
          {[["none","Engångs"],["weekly","🔁 Varje vecka"],["yearly","🗓️ Varje år"]].map(([v,l])=>(
            <button key={v} onClick={()=>setAddEvForm(f=>({...f,recur:v}))} style={{flex:1,padding:"5px 4px",borderRadius:7,border:`1.5px solid ${addEvForm.recur===v?T.amber:T.border}`,background:addEvForm.recur===v?T.amberBg:"transparent",color:addEvForm.recur===v?T.amber:T.textMid,fontSize:10,fontWeight:addEvForm.recur===v?700:400,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:7}}>
          <button onClick={()=>setAddEvDate(null)} style={{flex:1,padding:"9px",borderRadius:9,border:`1px solid ${T.border}`,background:"transparent",color:T.textMid,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Avbryt</button>
          <button onClick={saveEvent} style={{flex:2,padding:"9px",borderRadius:9,border:"none",background:T.amber,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Lägg till</button>
        </div>
      </div>
    </div>}
  </div>;
}

/* ═══ CLOCK ═════════════════════════════════════════════════════ */
function ClockBlock({now,T}){
  const hh=String(now.getHours()).padStart(2,"0"),mm=String(now.getMinutes()).padStart(2,"0"),ss=String(now.getSeconds()).padStart(2,"0");
  return <div style={{padding:"20px 20px 12px"}}>
    <div style={{display:"flex",alignItems:"baseline",gap:3}}>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:52,fontWeight:400,color:T.text,letterSpacing:-2,lineHeight:1}}>{hh}:{mm}</span>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:22,color:T.textDim}}>{ss}</span>
    </div>
    <p style={{fontSize:11,color:T.textMid,textTransform:"capitalize",marginTop:3}}>{now.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"})}</p>
  </div>;
}

/* ═══ FLOW PANEL ════════════════════════════════════════════════ */
function FlowPanel({T,flowMeds,onToggleMed,guestMode}){
  const now=useClock();
  const [sel,setSel]=useState(getActiveFlowId(now.getHours()));
  const [medOpen,setMedOpen]=useState(true);
  useEffect(()=>setSel(getActiveFlowId(now.getHours())),[now.getHours()]);
  const flow=FLOWS.find(f=>f.id===sel),meds=flowMeds[sel]||[];
  return <div style={{display:"flex",flexDirection:"column",gap:8,padding:"0 12px 12px"}}>
    <div style={{display:"flex",gap:3}}>
      {FLOWS.map(f=>{const a=f.id===sel;return <button key={f.id} onClick={()=>setSel(f.id)} style={{flex:1,padding:"5px 2px",borderRadius:8,border:`1.5px solid ${a?f.color:T.border}`,background:a?f.color+"18":"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
        <span style={{fontSize:13}}>{f.icon}</span>
        <span style={{fontSize:8,fontWeight:a?700:400,color:a?f.color:T.textDim}}>{f.label}</span>
        <span style={{fontSize:7,color:a?f.color+"99":T.textDim}}>{f.range}</span>
      </button>;})}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      <div style={{width:5,height:5,borderRadius:"50%",background:flow.color,boxShadow:`0 0 6px ${flow.color}`}}/>
      <span style={{fontSize:9,color:flow.color,fontWeight:700,letterSpacing:1.3,textTransform:"uppercase"}}>Aktivt flöde</span>
    </div>
    {!guestMode&&<div style={{background:T.card,backdropFilter:T.blur,borderRadius:10,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:T.shadow}}>
      <button onClick={()=>setMedOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",gap:5,padding:"8px 11px",background:"none",border:"none",borderBottom:medOpen&&meds.length>0?`1px solid ${T.border}`:"none",cursor:"pointer",textAlign:"left"}}>
        <span style={{fontSize:12}}>💊</span>
        <span style={{fontSize:11,fontWeight:700,color:T.text,flex:1}}>Mediciner</span>
        {meds.length>0&&<span style={{fontSize:9,color:T.textDim,marginRight:3}}>{meds.filter(m=>m.done).length}/{meds.length}</span>}
        <span style={{fontSize:11,color:T.textDim,transform:medOpen?"rotate(0deg)":"rotate(-90deg)",transition:"transform .2s",display:"inline-block",lineHeight:1}}>▾</span>
      </button>
      {medOpen&&(meds.length>0?meds.map((med,i)=>{
        const daysLeft=med.antal!=null&&med.dosDag>0?Math.floor(med.antal/med.dosDag):null;
        const lowStock=med.bestallning!=null&&med.antal!=null&&med.antal<=med.bestallning;
        const stockColor=lowStock?"#c0392b":daysLeft!=null&&daysLeft<7?"#d68a00":T.textDim;
        return(
        <div key={i} style={{borderBottom:i<meds.length-1?`1px solid ${T.border}`:"none"}}>
          <div onClick={()=>onToggleMed(sel,i)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",cursor:"pointer",opacity:med.done?0.45:1}}>
            <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${med.done?T.green:T.borderMid}`,background:med.done?T.greenBg:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
              {med.done&&<span style={{color:T.green,fontSize:9,fontWeight:700}}>✓</span>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:11,color:T.text,fontWeight:600,textDecoration:med.done?"line-through":"none"}}>{med.name}</span>
                <span style={{fontSize:9,color:T.textDim}}>{med.dose}</span>
                {med.fassUrl&&<a href={med.fassUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:9,color:"#6B4EA8",textDecoration:"none",marginLeft:2}} title="FASS">🔗</a>}
              </div>
              {med.antal!=null&&<div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                <span style={{fontSize:9,color:stockColor,fontWeight:lowStock?700:400}}>{lowStock?"⚠️ ":""}{med.antal} kvar</span>
                {daysLeft!=null&&<span style={{fontSize:8,color:stockColor}}>({daysLeft}d)</span>}
              </div>}
            </div>
            <span style={{fontSize:8,padding:"1px 6px",borderRadius:999,background:flow.color+"18",color:flow.color,fontWeight:700,flexShrink:0}}>{med.who}</span>
          </div>
          {med.doslogg&&med.doslogg.length>0&&<div style={{padding:"2px 11px 6px 37px",display:"flex",gap:4,flexWrap:"wrap"}}>
            {med.doslogg.slice(-3).map((l,j)=><span key={j} style={{fontSize:8,color:T.textDim,background:T.surface,borderRadius:4,padding:"1px 5px"}}>{new Date(l.ts).toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"})}</span>)}
          </div>}
        </div>);
      }):<div style={{padding:"9px 11px",fontSize:11,color:T.textDim,textAlign:"center"}}>Inga mediciner detta flöde</div>)}
    </div>}
  </div>;
}

/* ═══ KANBAN ════════════════════════════════════════════════════ */
// makeTask importeras från ./taskLogic.js
const EMPTY_FORM={title:"",desc:"",tags:[],mids:[],prio:"medium",lane:"ready",recur:"none",hideGuest:false,estimate:"none",subtasks:[],epicId:null};
const ESTIMATES=[{val:"none",label:"Ingen",icon:"—"},{val:"30min",label:"30 min",icon:"🕐"},{val:"2h",label:"1–2 h",icon:"⏱️"},{val:"half",label:"Halvdag",icon:"🌅"},{val:"day",label:"Heldag",icon:"📅"}];

function TaskForm({T,members,init,onSave,onCancel,showLane,showHideGuest,epics}){
  const [f,setF]=useState(init?{...EMPTY_FORM,...init}:EMPTY_FORM);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  return <div style={{background:T.card,backdropFilter:T.blur,borderRadius:12,border:`2px solid ${T.amber}`,padding:12,display:"flex",flexDirection:"column",gap:7}}>
    <input placeholder="Titel *" value={f.title} onChange={e=>sf("title",e.target.value)} style={{padding:"7px 10px",borderRadius:9,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
    <input placeholder="Beskrivning" value={f.desc||""} onChange={e=>sf("desc",e.target.value)} style={{padding:"7px 10px",borderRadius:9,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
    <div style={{display:"flex",gap:5}}>
      {Object.entries(PRIO_META).map(([k,v])=><button key={k} onClick={()=>sf("prio",k)} style={{flex:1,padding:"5px 2px",borderRadius:7,border:`1.5px solid ${f.prio===k?v.color:T.border}`,background:f.prio===k?v.bg:"transparent",color:f.prio===k?v.color:T.textDim,fontSize:9,fontWeight:f.prio===k?700:400,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{v.icon}<br/><span style={{fontSize:8}}>{v.label}</span></button>)}
    </div>
    {/* Tidsestimering */}
    <div style={{display:"flex",gap:3}}>
      {ESTIMATES.map(e=><button key={e.val} onClick={()=>sf("estimate",e.val)} style={{flex:1,padding:"4px 2px",borderRadius:7,border:`1.5px solid ${f.estimate===e.val?T.blue:T.border}`,background:f.estimate===e.val?T.blueBg:"transparent",color:f.estimate===e.val?T.blue:T.textDim,fontSize:8,fontWeight:f.estimate===e.val?700:400,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{e.icon}<br/>{e.label}</button>)}
    </div>
    <select value={f.recur||"none"} onChange={e=>sf("recur",e.target.value)} style={{padding:"7px",borderRadius:9,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:11,fontFamily:"inherit"}}>
      {RECUR_OPTIONS.map(r=><option key={r.val} value={r.val}>{r.label}</option>)}
    </select>
    {epics&&epics.length>0&&<select value={f.epicId||""} onChange={e=>sf("epicId",e.target.value||null)} style={{padding:"7px",borderRadius:9,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:11,fontFamily:"inherit"}}>
      <option value="">— Inget epic —</option>
      {epics.map(ep=><option key={ep.id} value={ep.id}>{ep.icon} {ep.title}</option>)}
    </select>}
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {ALL_TAGS.map(t=>{const tc=TAG_COLORS[t];const s=(f.tags||[]).includes(t);return <button key={t} onClick={()=>sf("tags",s?(f.tags||[]).filter(x=>x!==t):[...(f.tags||[]),t])} style={{padding:"2px 8px",borderRadius:999,border:`1px solid ${s?tc.text:T.border}`,background:s?tc.bg:"transparent",color:s?tc.text:T.textDim,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>{t}</button>;})}
    </div>
    {members.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {members.map(m=>{const s=(f.mids||[]).includes(m.id);return <button key={m.id} onClick={()=>sf("mids",s?(f.mids||[]).filter(x=>x!==m.id):[...(f.mids||[]),m.id])} style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:999,border:`1.5px solid ${s?m.color:T.border}`,background:s?m.color+"22":"transparent",cursor:"pointer",fontFamily:"inherit"}}>
        <div style={{width:14,height:14,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700}}>{m.av}</div>
        <span style={{fontSize:10,color:s?m.color:T.textDim,fontWeight:s?700:400}}>{m.name}</span>
      </button>;})}
    </div>}
    {showLane&&<div style={{display:"flex",gap:4}}>{LANES.map(l=><button key={l.id} onClick={()=>sf("lane",l.id)} style={{flex:1,padding:"4px",borderRadius:7,border:`1.5px solid ${f.lane===l.id?l.color:T.border}`,background:f.lane===l.id?l.bg:"transparent",color:f.lane===l.id?l.color:T.textDim,fontSize:9,fontWeight:f.lane===l.id?700:400,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l.label}</button>)}</div>}
    {showHideGuest&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0"}}><div><span style={{fontSize:11,color:T.text,fontWeight:600}}>🙈 Göm vid gästläge</span><p style={{fontSize:9,color:T.textDim}}>Visas ej när gästläge är på</p></div><Toggle value={f.hideGuest} onChange={v=>sf("hideGuest",v)} T={T} small/></div>}
    <div style={{display:"flex",gap:5}}>
      <button onClick={onCancel} style={{flex:1,padding:"7px",borderRadius:9,border:`1px solid ${T.border}`,background:"transparent",color:T.textMid,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Avbryt</button>
      <button onClick={()=>f.title.trim()&&onSave(f)} style={{flex:2,padding:"7px",borderRadius:9,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Spara</button>
    </div>
  </div>;
}

function TaskCard({T,task,idx,lt,moveTask,moveUp,moveDown,setEditing,delTask,setDragTask,setDragOver,members,onUpdateTask}){
  const [exp,setExp]=useState(false);
  const [dragging,setDragging]=useState(false);
  const [newSub,setNewSub]=useState("");
  const pm=PRIO_META[task.prio]||PRIO_META.medium;
  const assignees=(members||[]).filter(m=>(task.mids||[]).includes(m.id));
  const subs=task.subtasks||[];
  const subsDone=subs.filter(s=>s.done).length;
  const est=ESTIMATES.find(e=>e.val===task.estimate);

  const toggleSub=(sid)=>onUpdateTask&&onUpdateTask(task.id,{subtasks:subs.map(s=>s.id===sid?{...s,done:!s.done}:s)});
  const addSub=()=>{if(!newSub.trim())return;onUpdateTask&&onUpdateTask(task.id,{subtasks:[...subs,{id:Date.now(),title:newSub.trim(),done:false}]});setNewSub("");};
  const delSub=(sid)=>onUpdateTask&&onUpdateTask(task.id,{subtasks:subs.filter(s=>s.id!==sid)});

  return <div key={task.id} draggable
    onDragStart={()=>{setDragTask(task.id);setDragging(true);}}
    onDragEnd={()=>{setDragTask(null);setDragOver(null);setDragging(false);}}
    style={{borderRadius:9,background:T.card,backdropFilter:T.blur,border:`1px solid ${T.border}`,boxShadow:T.shadow,overflow:"hidden",marginBottom:5,cursor:"grab",userSelect:"none",opacity:dragging?0.4:1,transition:"opacity .15s"}}>
    <div style={{display:"flex",gap:7,alignItems:"center",padding:"8px 9px"}}>
      <span style={{color:T.textDim,fontSize:12,flexShrink:0}}>⠿</span>
      <div style={{width:3,borderRadius:3,alignSelf:"stretch",background:pm.color,flexShrink:0,minHeight:22}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
        <div style={{display:"flex",gap:2,marginTop:2,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:8,padding:"1px 4px",borderRadius:999,background:pm.bg,color:pm.color,fontWeight:700}}>{pm.icon}</span>
          {task.recur!=="none"&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:999,background:T.blueBg,color:T.blue,fontWeight:700}}>🔁</span>}
          {est&&est.val!=="none"&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:999,background:T.blueBg+"88",color:T.blue,fontWeight:600}}>{est.icon} {est.label}</span>}
          {subs.length>0&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:999,background:subsDone===subs.length?T.greenBg:T.surface,color:subsDone===subs.length?T.green:T.textDim,fontWeight:700}}>☑ {subsDone}/{subs.length}</span>}
          {(task.tags||[]).slice(0,1).map(tg=>{const tc=TAG_COLORS[tg]||{bg:"#eee",text:"#666"};return <span key={tg} style={{fontSize:8,padding:"1px 4px",borderRadius:999,background:tc.bg,color:tc.text,fontWeight:700}}>{tg}</span>;})}
        </div>
      </div>
      {assignees.length>0&&<div style={{display:"flex",marginRight:2}}>
        {assignees.slice(0,3).map((m,i)=><div key={m.id} style={{width:18,height:18,borderRadius:"50%",background:m.color,border:`1.5px solid ${T.card}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,marginLeft:i>0?-5:0,flexShrink:0}}>{m.av}</div>)}
      </div>}
      <button onClick={()=>setExp(e=>!e)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:T.textDim,padding:"6px 8px",lineHeight:1,transform:exp?"rotate(0)":"rotate(-90deg)",transition:"transform .2s",flexShrink:0}}>▾</button>
    </div>
    {subs.length>0&&!exp&&<div style={{height:3,background:T.border,margin:"0 9px 6px"}}><div style={{height:"100%",borderRadius:2,background:subsDone===subs.length?T.green:T.amber,width:`${subs.length?subsDone/subs.length*100:0}%`,transition:"width .3s"}}/></div>}
    {exp&&<div style={{padding:"0 9px 8px",borderTop:`1px solid ${T.border}`,paddingTop:7,display:"flex",flexDirection:"column",gap:5}}>
      {task.desc&&<p style={{fontSize:10,color:T.textMid,lineHeight:1.4}}>{task.desc}</p>}
      {/* Subtasks */}
      {subs.length>0&&<div style={{display:"flex",flexDirection:"column",gap:3}}>
        {subs.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:6}}>
          <button onClick={()=>toggleSub(s.id)} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${s.done?T.green:T.border}`,background:s.done?T.greenBg:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,padding:0}}>
            {s.done&&<span style={{color:T.green,fontSize:9,fontWeight:700}}>✓</span>}
          </button>
          <span style={{fontSize:10,color:s.done?T.textDim:T.text,textDecoration:s.done?"line-through":"none",flex:1}}>{s.title}</span>
          <button onClick={()=>delSub(s.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:9,color:T.textDim,padding:"0 2px"}}>✕</button>
        </div>)}
      </div>}
      <div style={{display:"flex",gap:4}}>
        <input value={newSub} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSub()} placeholder="+ Ny undertask..." style={{flex:1,padding:"4px 7px",borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:10,fontFamily:"inherit",outline:"none"}}/>
        <button onClick={addSub} style={{padding:"4px 8px",borderRadius:6,border:"none",background:T.amber,color:"#fff",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>+</button>
      </div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {LANES.filter(l=>l.id!==task.lane).map(l=><button key={l.id} onClick={()=>moveTask(task.id,l.id)} style={{padding:"5px 11px",borderRadius:6,border:`1px solid ${l.color}44`,background:l.bg,color:l.color,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>→ {l.label}</button>)}
        <button onClick={()=>moveUp(task.id)} disabled={idx===0} style={{padding:"5px 11px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:idx===0?T.textDim:T.text,fontSize:11,cursor:idx===0?"default":"pointer",fontFamily:"inherit"}}>↑</button>
        <button onClick={()=>moveDown(task.id)} disabled={idx===lt.length-1} style={{padding:"5px 11px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:idx===lt.length-1?T.textDim:T.text,fontSize:11,cursor:idx===lt.length-1?"default":"pointer",fontFamily:"inherit"}}>↓</button>
        <button onClick={()=>setEditing(task)} style={{padding:"5px 11px",borderRadius:6,border:`1px solid ${T.blue}`,background:T.blueBg,color:T.blue,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✏️</button>
        <button onClick={()=>delTask(task.id)} style={{padding:"5px 11px",borderRadius:6,border:`1px solid ${T.red}`,background:T.redBg,color:T.red,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑</button>
      </div>
    </div>}
  </div>;
}

function KanbanBoard({T,tasks,setTasks,members,guestMode,epics}){
  const [filterMid,setFilterMid]=useState("all");
  const [editing,setEditing]=useState(null);
  const [dragTask,setDragTask]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  const moveTask=(id,lane)=>setTasks(p=>p.map(t=>t.id===id?{...t,lane}:t));
  const delTask=id=>setTasks(p=>p.filter(t=>t.id!==id));
  const updateTask=(id,changes)=>setTasks(p=>p.map(t=>t.id===id?{...t,...changes}:t));
  const moveUp=(id)=>setTasks(p=>{const lane=p.find(t=>t.id===id)?.lane;const il=p.filter(t=>t.lane===lane).sort((a,b)=>a.order-b.order);const idx=il.findIndex(t=>t.id===id);if(idx===0)return p;const no=[...il];[no[idx-1],no[idx]]=[no[idx],no[idx-1]];const om=Object.fromEntries(no.map((t,i)=>[t.id,i]));return p.map(t=>om[t.id]!==undefined?{...t,order:om[t.id]}:t);});
  const moveDown=(id)=>setTasks(p=>{const lane=p.find(t=>t.id===id)?.lane;const il=p.filter(t=>t.lane===lane).sort((a,b)=>a.order-b.order);const idx=il.findIndex(t=>t.id===id);if(idx===il.length-1)return p;const no=[...il];[no[idx],no[idx+1]]=[no[idx+1],no[idx]];const om=Object.fromEntries(no.map((t,i)=>[t.id,i]));return p.map(t=>om[t.id]!==undefined?{...t,order:om[t.id]}:t);});
  const saveTask=(f)=>{if(editing==="new")setTasks(p=>[...p,{...makeTask(),...f,id:Date.now(),order:p.filter(t=>t.lane===f.lane).length}]);else setTasks(p=>p.map(t=>t.id===editing.id?{...t,...f}:t));setEditing(null);};
  const filtered=tasks.filter(t=>{if(guestMode&&t.hideGuest)return false;if(filterMid==="all")return true;return t.mids.includes(filterMid);});
  const getLane=id=>filtered.filter(t=>t.lane===id).sort((a,b)=>(a.order??0)-(b.order??0));

  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <div style={{padding:"9px 12px 7px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",flexShrink:0}}>
      <div style={{display:"flex",gap:3,flex:1,overflowX:"auto",alignItems:"center"}}>
        <button onClick={()=>setFilterMid("all")} style={{flexShrink:0,padding:"3px 9px",borderRadius:999,border:`1px solid ${filterMid==="all"?T.amber:T.border}`,background:filterMid==="all"?T.amberBg:"transparent",color:filterMid==="all"?T.amber:T.textDim,fontSize:10,fontWeight:filterMid==="all"?700:400,cursor:"pointer",fontFamily:"inherit"}}>Alla</button>
        {members.map(m=><button key={m.id} onClick={()=>setFilterMid(filterMid===m.id?"all":m.id)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:999,border:`1.5px solid ${filterMid===m.id?m.color:T.border}`,background:filterMid===m.id?m.color+"18":"transparent",cursor:"pointer",fontFamily:"inherit"}}>
          <div style={{width:13,height:13,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700}}>{m.av}</div>
          <span style={{fontSize:9,color:filterMid===m.id?m.color:T.textDim,fontWeight:filterMid===m.id?700:400}}>{m.name}</span>
        </button>)}
      </div>
      <button onClick={()=>setEditing("new")} style={{flexShrink:0,padding:"3px 11px",borderRadius:7,border:"none",background:T.amber,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Ny uppgift</button>
    </div>
    {editing&&<div style={{padding:"0 10px 8px",flexShrink:0}}><TaskForm T={T} members={members} init={editing!=="new"?{...editing}:{...EMPTY_FORM}} onSave={saveTask} onCancel={()=>setEditing(null)} showLane showHideGuest epics={epics}/></div>}
    <div style={{flex:1,overflow:"hidden",display:"flex"}}>
      {LANES.map((lane,li)=>{
        const lt=getLane(lane.id);
        return <div key={lane.id} style={{flex:1,display:"flex",flexDirection:"column",borderRight:li<LANES.length-1?`1px solid ${T.border}`:"none",overflow:"hidden"}} onDragOver={e=>{e.preventDefault();setDragOver(lane.id);}} onDrop={()=>{if(dragTask)moveTask(dragTask,lane.id);setDragTask(null);setDragOver(null);}}>
          <div style={{padding:"7px 9px",background:dragOver===lane.id?lane.bg:"transparent",borderBottom:`2px solid ${lane.color}`,flexShrink:0,transition:"background .2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:lane.color}}/>
              <span style={{fontSize:10,fontWeight:700,color:lane.color}}>{lane.label}</span>
              <span style={{marginLeft:"auto",fontSize:9,padding:"1px 6px",borderRadius:999,background:lane.color+"18",color:lane.color,fontWeight:700}}>{lt.length}</span>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"7px 7px"}}>
            {lt.length===0&&<div style={{textAlign:"center",padding:"16px 8px",color:T.textDim,fontSize:10,border:`1px dashed ${T.border}`,borderRadius:7,marginTop:3}}>Dra hit</div>}
            {lt.map((task,idx)=>{
              if(guestMode&&task.hideGuest)return null;
              return <TaskCard key={task.id} T={T} task={task} idx={idx} lt={lt} moveTask={moveTask} moveUp={moveUp} moveDown={moveDown} setEditing={setEditing} delTask={delTask} setDragTask={setDragTask} setDragOver={setDragOver} members={members} onUpdateTask={updateTask}/>;
            })}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

/* ═══ TEMPLATE EDITOR ═══════════════════════════════════════════ */
function TemplateEditor({T,members,init,onSave,onCancel}){
  const [name,setName]=useState(init?.name||"");
  const [icon,setIcon]=useState(init?.icon||"📦");
  const [taskList,setTaskList]=useState(()=>init?.tasks?.length ? init.tasks.map(t=>({...t})) : [{title:"",prio:"medium",mids:[],tags:[]}]);

  const addTask=()=>setTaskList(p=>[...p,{title:"",prio:"medium",mids:[],tags:[]}]);
  const updTask=(i,field,val)=>setTaskList(p=>p.map((t,j)=>j===i?{...t,[field]:val}:t));
  const remTask=i=>setTaskList(p=>p.filter((_,j)=>j!==i));
  const toggleMid=(i,mid)=>updTask(i,"mids",(taskList[i].mids||[]).includes(mid)?(taskList[i].mids||[]).filter(x=>x!==mid):[...(taskList[i].mids||[]),mid]);

  const save=()=>{
    if(!name.trim())return;
    const tasks=taskList.filter(t=>t.title.trim());
    if(!tasks.length)return;
    onSave({...init,name:name.trim(),icon:icon.trim()||"📦",tasks});
  };

  return <div style={{background:T.card,backdropFilter:T.blur,borderRadius:12,border:`2px solid ${T.amber}`,padding:12,marginBottom:8}}>
    <p style={{fontSize:10,fontWeight:700,color:T.amber,marginBottom:8}}>{init?"✏️ Redigera":"📦 Ny"} mall</p>
    {/* Name + icon */}
    <div style={{display:"flex",gap:6,marginBottom:10}}>
      <input value={icon} onChange={e=>setIcon(e.target.value)} title="Emoji/ikon" style={{width:44,padding:"5px",borderRadius:7,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:18,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Mallens namn, t.ex. Veckostäd" style={{flex:1,padding:"6px 10px",borderRadius:7,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:12,fontFamily:"inherit",outline:"none"}}/>
    </div>
    {/* Tasks */}
    <p style={{fontSize:9,color:T.textDim,marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:.8}}>Uppgifter i mallen</p>
    <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:7}}>
      {taskList.map((t,i)=>(
        <div key={i} style={{borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,padding:"7px 8px",display:"flex",flexDirection:"column",gap:5}}>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            <input value={t.title} onChange={e=>updTask(i,"title",e.target.value)} placeholder={`Uppgift ${i+1}…`}
              style={{flex:1,padding:"5px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
            <button onClick={()=>remTask(i)} disabled={taskList.length===1} style={{background:"none",border:"none",cursor:taskList.length===1?"default":"pointer",color:T.textDim,fontSize:14,lineHeight:1,opacity:taskList.length===1?.3:1}}>✕</button>
          </div>
          <div style={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"center"}}>
            {/* Prio */}
            {Object.entries(PRIO_META).map(([k,v])=>(
              <button key={k} onClick={()=>updTask(i,"prio",k)} title={v.label} style={{padding:"2px 6px",borderRadius:5,border:`1.5px solid ${t.prio===k?v.color:T.border}`,background:t.prio===k?v.bg:"transparent",cursor:"pointer",fontSize:9,fontWeight:t.prio===k?700:400,color:t.prio===k?v.color:T.textDim}}>{v.icon} {v.label}</button>
            ))}
            {/* Members */}
            {members.length>0&&<>
              <span style={{fontSize:9,color:T.textDim,margin:"0 2px"}}>·</span>
              {members.map(m=>(
                <button key={m.id} onClick={()=>toggleMid(i,m.id)} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${(t.mids||[]).includes(m.id)?m.color:T.border}`,background:(t.mids||[]).includes(m.id)?m.color+"33":"transparent",cursor:"pointer",fontSize:9,fontWeight:700,color:m.color}}>{m.av}</button>
              ))}
            </>}
          </div>
        </div>
      ))}
    </div>
    <button onClick={addTask} style={{width:"100%",padding:"5px",borderRadius:7,border:`1px dashed ${T.border}`,background:"transparent",color:T.amber,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:8}}>+ Lägg till uppgift</button>
    <div style={{display:"flex",gap:6}}>
      <button onClick={onCancel} style={{flex:1,padding:"7px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.textMid,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Avbryt</button>
      <button onClick={save} style={{flex:2,padding:"7px",borderRadius:8,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Spara mall</button>
    </div>
  </div>;
}

/* ═══ PLANNING ══════════════════════════════════════════════════ */
function PlanningTab({T,backlog,setBacklog,tasks,setTasks,members,templates,setTemplates,epics,setEpics}){
  const [planView,setPlanView]=useState("backlog"); // backlog | templates | epics
  const [editing,setEditing]=useState(null);
  const [editTmpl,setEditTmpl]=useState(null); // null | "new" | {template obj}
  const [expandedTmpl,setExpandedTmpl]=useState(null);
  const [newEpic,setNewEpic]=useState({title:"",icon:"🎯",desc:""});
  const addEpic=()=>{if(!newEpic.title.trim())return;setEpics(p=>[...p,{...newEpic,id:Date.now(),createdAt:Date.now()}]);setNewEpic({title:"",icon:"🎯",desc:""});};
  const delEpic=(id)=>setEpics(p=>p.filter(e=>e.id!==id));

  // ── Backlog ──────────────────────────────────────────────────
  const saveToBacklog=(f)=>{if(editing==="new")setBacklog(p=>[...p,{...makeTask(),...f,id:Date.now()}]);else setBacklog(p=>p.map(b=>b.id===editing.id?{...b,...f}:b));setEditing(null);};
  const del=id=>setBacklog(p=>p.filter(b=>b.id!==id));
  const send=(item)=>{setTasks(p=>[...p,{...item,id:Date.now(),lane:"ready",order:p.filter(t=>t.lane==="ready").length}]);setBacklog(p=>p.filter(b=>b.id!==item.id));};
  const prioOrd={urgent:0,high:1,medium:2,low:3};
  const sorted=[...backlog].sort((a,b)=>prioOrd[a.prio]-prioOrd[b.prio]);

  // ── Templates ────────────────────────────────────────────────
  const activateTmpl=(tmpl)=>{
    const base=tasks.filter(t=>t.lane==="ready").length;
    const newTasks=tmpl.tasks.map((t,i)=>({
      ...makeTask(),...t,
      id:Date.now()+i,lane:"ready",order:base+i,
      desc:t.desc||"",recur:t.recur||"none",hideGuest:false,
    }));
    setTasks(p=>[...p,...newTasks]);
  };
  const deleteTmpl=id=>setTemplates(p=>p.filter(t=>t.id!==id));
  const saveTmpl=(tmpl)=>{
    if(editTmpl==="new")setTemplates(p=>[...p,{...tmpl,id:Date.now()}]);
    else setTemplates(p=>p.map(t=>t.id===tmpl.id?tmpl:t));
    setEditTmpl(null);
  };

  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>

    {/* ── Header with sub-tabs ── */}
    <div style={{padding:"9px 14px 0",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
        <span style={{fontSize:12,fontWeight:700,color:T.text}}>Planering</span>
        <button onClick={()=>planView==="backlog"?setEditing("new"):setEditTmpl("new")}
          style={{padding:"3px 11px",borderRadius:7,border:"none",background:T.amber,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Ny</button>
      </div>
      <div style={{display:"flex"}}>
        {[["backlog","📋 Backlogg"],["templates","📦 Mallar"],["epics","🎯 Epics"]].map(([id,label])=>(
          <button key={id} onClick={()=>setPlanView(id)} style={{
            flex:1,padding:"6px 4px",border:"none",
            borderBottom:`2.5px solid ${planView===id?T.amber:"transparent"}`,
            background:planView===id?T.amberBg:"transparent",
            color:planView===id?T.amber:T.textDim,
            fontSize:11,fontWeight:planView===id?700:500,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
          }}>{label}</button>
        ))}
      </div>
    </div>

    {/* ── BACKLOG ── */}
    {planView==="backlog"&&<>
      {editing&&<div style={{padding:"7px 14px",flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
        <TaskForm T={T} members={members} init={editing!=="new"?{...editing}:EMPTY_FORM} onSave={saveToBacklog} onCancel={()=>setEditing(null)} showLane={false} showHideGuest/>
      </div>}
      <div style={{flex:1,overflowY:"auto",padding:"9px 14px 12px",display:"flex",flexDirection:"column",gap:7}}>
        {sorted.length===0&&<div style={{textAlign:"center",padding:"28px",color:T.textDim,fontSize:13}}>Tom — tryck "+ Ny"</div>}
        {sorted.map(item=>{
          const pm=PRIO_META[item.prio]||PRIO_META.medium;
          return <div key={item.id} style={{borderRadius:12,background:T.card,backdropFilter:T.blur,border:`1px solid ${T.border}`,boxShadow:T.shadow,overflow:"hidden"}}>
            <div style={{padding:"10px 12px",display:"flex",gap:7,alignItems:"center"}}>
              <div style={{width:3,borderRadius:3,alignSelf:"stretch",background:pm.color,flexShrink:0,minHeight:30}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.text}}>{item.title}</span>
                  {item.hideGuest&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:999,background:"#9B8DC922",color:"#9B8DC9",fontWeight:700}}>🙈</span>}
                </div>
                <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:9,padding:"1px 5px",borderRadius:999,background:pm.bg,color:pm.color,fontWeight:700}}>{pm.icon} {pm.label}</span>
                  {item.recur!=="none"&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:999,background:T.blueBg,color:T.blue,fontWeight:700}}>🔁 {RECUR_OPTIONS.find(r=>r.val===item.recur)?.label}</span>}
                  {item.tags.map(tg=>{const tc=TAG_COLORS[tg]||{bg:"#eee",text:"#666"};return <span key={tg} style={{fontSize:9,padding:"1px 5px",borderRadius:999,background:tc.bg,color:tc.text,fontWeight:700}}>{tg}</span>;})}
                </div>
                {item.desc&&<p style={{fontSize:10,color:T.textMid,marginTop:3,lineHeight:1.4}}>{item.desc}</p>}
              </div>
            </div>
            <div style={{padding:"0 12px 9px",display:"flex",gap:4,flexWrap:"wrap",borderTop:`1px solid ${T.border}`,paddingTop:7}}>
              <button onClick={()=>send(item)} style={{padding:"2px 9px",borderRadius:6,border:`1px solid ${T.green}`,background:T.greenBg,color:T.green,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>→ Tavlan</button>
              <button onClick={()=>setEditing(item)} style={{padding:"2px 9px",borderRadius:6,border:`1px solid ${T.blue}`,background:T.blueBg,color:T.blue,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✏️</button>
              <button onClick={()=>del(item.id)} style={{padding:"2px 9px",borderRadius:6,border:`1px solid ${T.red}`,background:T.redBg,color:T.red,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑</button>
            </div>
          </div>;
        })}
      </div>
    </>}

    {/* ── MALLAR ── */}
    {planView==="templates"&&<div style={{flex:1,overflowY:"auto",padding:"9px 14px 12px",display:"flex",flexDirection:"column",gap:8}}>
      {/* Template editor (inline) */}
      {editTmpl&&<TemplateEditor T={T} members={members}
        init={editTmpl==="new"?null:editTmpl}
        onSave={saveTmpl} onCancel={()=>setEditTmpl(null)}/>}

      {templates.length===0&&!editTmpl&&<div style={{textAlign:"center",padding:"28px",color:T.textDim,fontSize:13}}>
        Inga mallar ännu — tryck "+ Ny" för att skapa den första
      </div>}

      {templates.map(tmpl=>{
        const expanded=expandedTmpl===tmpl.id;
        return <div key={tmpl.id} style={{borderRadius:12,background:T.card,backdropFilter:T.blur,border:`1px solid ${T.border}`,boxShadow:T.shadow,overflow:"hidden"}}>
          {/* Header row */}
          <div style={{padding:"11px 12px",display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:22,flexShrink:0,lineHeight:1}}>{tmpl.icon||"📦"}</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:700,color:T.text,lineHeight:1.2}}>{tmpl.name}</p>
              <p style={{fontSize:10,color:T.textDim,marginTop:2}}>{tmpl.tasks.length} uppgifter</p>
            </div>
            <button onClick={()=>setExpandedTmpl(expanded?null:tmpl.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:T.textDim,transform:expanded?"rotate(0deg)":"rotate(-90deg)",transition:"transform .2s",lineHeight:1,flexShrink:0}}>▾</button>
          </div>

          {/* Expanded task list */}
          {expanded&&<div style={{borderTop:`1px solid ${T.border}`,padding:"8px 12px 10px"}}>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:9}}>
              {tmpl.tasks.map((t,i)=>{
                const pm=PRIO_META[t.prio]||PRIO_META.medium;
                const assignees=members.filter(m=>(t.mids||[]).includes(m.id));
                return <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 9px",borderRadius:7,background:T.surface,border:`1px solid ${T.border}`}}>
                  <div style={{width:3,minHeight:14,alignSelf:"stretch",borderRadius:2,background:pm.color,flexShrink:0}}/>
                  <span style={{fontSize:11,color:T.text,flex:1,lineHeight:1.3}}>{t.title}</span>
                  {assignees.map(m=><div key={m.id} style={{width:18,height:18,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,flexShrink:0}}>{m.av}</div>)}
                  <span style={{fontSize:9,color:pm.color,fontWeight:700,flexShrink:0}}>{pm.icon}</span>
                </div>;
              })}
            </div>
            <div style={{display:"flex",gap:5}}>
              <button onClick={()=>{activateTmpl(tmpl);setExpandedTmpl(null);}}
                style={{flex:2,padding:"7px 10px",borderRadius:8,border:"none",background:T.green,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✅ Aktivera → Tavlan</button>
              <button onClick={()=>setEditTmpl(tmpl)}
                style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${T.blue}`,background:T.blueBg,color:T.blue,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✏️</button>
              <button onClick={()=>deleteTmpl(tmpl.id)}
                style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${T.red}`,background:T.redBg,color:T.red,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑</button>
            </div>
          </div>}

          {/* Quick activate (collapsed) */}
          {!expanded&&<div style={{padding:"0 12px 10px"}}>
            <button onClick={()=>activateTmpl(tmpl)}
              style={{width:"100%",padding:"6px",borderRadius:8,border:`1px solid ${T.green}33`,background:T.greenBg,color:T.green,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              ✅ Aktivera — {tmpl.tasks.length} uppgifter → Tavlan
            </button>
          </div>}
        </div>;
      })}
    </div>}

    {/* ── EPICS ── */}
    {planView==="epics"&&<div style={{flex:1,overflowY:"auto",padding:"9px 14px 12px",display:"flex",flexDirection:"column",gap:8}}>
      {/* Skapa nytt epic */}
      <div style={{background:T.card,borderRadius:12,border:`1.5px solid ${T.amber}`,padding:12}}>
        <p style={{fontSize:10,fontWeight:700,color:T.amber,marginBottom:8}}>🎯 Nytt epic</p>
        <div style={{display:"flex",gap:6,marginBottom:7}}>
          <input value={newEpic.icon} onChange={e=>setNewEpic(p=>({...p,icon:e.target.value}))} style={{width:40,padding:"6px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:18,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
          <input value={newEpic.title} onChange={e=>setNewEpic(p=>({...p,title:e.target.value}))} placeholder="Epicets titel, t.ex. Renovera badrum" style={{flex:1,padding:"6px 10px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:12,fontFamily:"inherit",outline:"none"}}/>
        </div>
        <input value={newEpic.desc} onChange={e=>setNewEpic(p=>({...p,desc:e.target.value}))} placeholder="Beskrivning (valfri)" style={{width:"100%",padding:"6px 10px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:7}}/>
        <button onClick={addEpic} style={{width:"100%",padding:"6px",borderRadius:8,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Skapa epic</button>
      </div>
      {(epics||[]).length===0&&<div style={{textAlign:"center",padding:"24px",color:T.textDim,fontSize:11,border:`1px dashed ${T.border}`,borderRadius:10}}>Inga epics ännu. Skapa ett ovan.</div>}
      {(epics||[]).map(ep=>{
        const linked=tasks.filter(t=>t.epicId===String(ep.id));
        const done=linked.filter(t=>t.lane==="done").length;
        const pct=linked.length?Math.round(done/linked.length*100):0;
        return <div key={ep.id} style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:"11px 12px",boxShadow:T.shadow}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:22}}>{ep.icon}</span>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:700,color:T.text}}>{ep.title}</p>
              {ep.desc&&<p style={{fontSize:10,color:T.textDim,marginTop:2}}>{ep.desc}</p>}
            </div>
            <button onClick={()=>delEpic(ep.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.textDim,fontSize:12,padding:"2px 4px"}}>🗑</button>
          </div>
          <div style={{height:6,background:T.border,borderRadius:3,marginBottom:6,overflow:"hidden"}}>
            <div style={{height:"100%",background:pct===100?T.green:T.amber,width:`${pct}%`,borderRadius:3,transition:"width .4s"}}/>
          </div>
          <p style={{fontSize:9,color:T.textDim,marginBottom:6}}>{done}/{linked.length} tasks klara · {pct}%</p>
          {linked.length>0&&<div style={{display:"flex",flexDirection:"column",gap:3}}>
            {linked.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:t.lane==="done"?T.green:t.lane==="progress"?T.amber:T.border,flexShrink:0}}/>
              <span style={{fontSize:10,color:t.lane==="done"?T.textDim:T.text,textDecoration:t.lane==="done"?"line-through":"none",flex:1}}>{t.title}</span>
              <span style={{fontSize:8,color:T.textDim}}>{LANES.find(l=>l.id===t.lane)?.label}</span>
            </div>)}
          </div>}
        </div>;
      })}
    </div>}

  </div>;
}

/* ═══ KIDS POINTS / GAMIFICATION ════════════════════════════════
 * CHORES_LIST, LEVELS, BADGES, REWARDS och DEMO_KIDS importeras
 * från ./constants.js
 * ══════════════════════════════════════════════════════════════ */

function getLevel(points){ return LEVELS.find(l=>points>=l.min&&points<=l.max)||LEVELS[0]; }
function getLevelPct(points){ const l=getLevel(points); return Math.round((points-l.min)/(l.max-l.min+1)*100); }

// Tomt stats-objekt för en ny familjemedlem
const emptyStats=()=>({points:0,total:0,streak:0,byCategory:{}});

function KidsPointsTab({T,members,choresDone,setChoresDone,choresList}){
  // Sparade stats per person-id: { [id]: {points, total, streak, byCategory} }
  const [savedStats,setSavedStats]=useLocalStorage("fp_kids_stats",{});
  const done=choresDone, setDone=setChoresDone;
  const [history,setHistory]=useLocalStorage("fp_chores_history",{}); // {[id]: ["syssla1", ...]}
  const [choreWeek,setChoreWeek]=useLocalStorage("fp_chores_week","");
  // Auto-återställ sysslor varje ny ISO-vecka
  useEffect(()=>{
    const w=`${new Date().getFullYear()}-W${String(getISOWeek(new Date())).padStart(2,"0")}`;
    if(choreWeek!==w){setDone({});setChoreWeek(w);}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Bygg kids-listan — bara de members som är markerade som "med i sysslor"
  // Om ingen är markerad visas alla (fallback så sysslor-fliken aldrig är tom)
  const sysslorMembers=members.filter(m=>m.inSysslor);
  const activeMembers=sysslorMembers.length>0 ? sysslorMembers : members;
  const kids=activeMembers.map(m=>({
    ...m,
    stats: savedStats[m.id] || emptyStats(),
    history: history[m.id] || [],
  }));

  const [selKid,setSelKid]=useState(activeMembers[0]?.id);
  const [view,setView]=useState("chores"); // chores | rewards | history
  const [flash,setFlash]=useState(null); // {kidId, points, title}
  const [confetti,setConfetti]=useState([]);

  // Synka selKid om activeMembers ändras (t.ex. efter inställningar)
  useEffect(()=>{
    if(!activeMembers.find(m=>m.id===selKid)){
      setSelKid(activeMembers[0]?.id);
    }
  },[activeMembers,selKid]);

  // Null-guard: om inga barn finns i sysslor
  if(!kids.length) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:10,color:T.textDim}}>
      <span style={{fontSize:36}}>⭐</span>
      <p style={{fontSize:13,fontWeight:600,color:T.textMid}}>Inga barn i sysslor</p>
      <p style={{fontSize:11,textAlign:"center",maxWidth:220,lineHeight:1.5}}>Gå till ⚙️ Inställningar och tryck ⭐ bredvid de familjemedlemmar som ska vara med i sysslor.</p>
    </div>
  );

  // Fallback om selKid inte finns bland members (t.ex. efter att en person tagits bort)
  const kid=kids.find(k=>k.id===selKid)||kids[0];

  // Null-guard: om kid fortfarande är undefined
  if(!kid) return null;
  const level=getLevel(kid?.stats.points||0);
  const pct=getLevelPct(kid?.stats.points||0);

  const earnedBadges=BADGES.filter(b=>b.req(kid?.stats||emptyStats()));

  const isDone=(choreId)=>!!done[`${choreId}_${selKid}`];

  // Hjälpfunktion: spara uppdaterade stats för en person i localStorage
  const updateStats=(id,updater)=>{
    setSavedStats(prev=>{
      const current=prev[id]||emptyStats();
      return {...prev,[id]:updater(current)};
    });
  };

  const completeChore=(chore)=>{
    const key=`${chore.id}_${selKid}`;
    if(done[key]) return;
    setDone(d=>({...d,[key]:true}));

    // Confetti-animation
    const newConf=Array.from({length:14},(_,i)=>({
      id:Date.now()+i, x:20+Math.random()*60, color:["#FFD700","#FF6B6B","#6BCB77","#4D96FF","#C77DFF"][i%5],
      delay:i*40, size:6+Math.random()*6,
    }));
    setConfetti(newConf);
    setTimeout(()=>setConfetti([]),2200);

    // Spara uppdaterade stats kopplat till person-id (inte hårdkodat namn)
    updateStats(selKid,s=>({
      ...s,
      points:s.points+chore.points,
      total:s.total+1,
      byCategory:{...s.byCategory,[chore.category]:(s.byCategory[chore.category]||0)+1},
    }));

    // Spara historik per person
    setHistory(prev=>({
      ...prev,
      [selKid]:[chore.title,...(prev[selKid]||[])].slice(0,10),
    }));

    setFlash({kidId:selKid,points:chore.points,title:chore.title});
    setTimeout(()=>setFlash(null),2000);
  };

  const redeemReward=(reward)=>{
    if((kid?.stats.points||0)<reward.cost) return;
    updateStats(selKid,s=>({...s,points:s.points-reward.cost}));
    setFlash({kidId:selKid,points:-reward.cost,title:reward.title});
    setTimeout(()=>setFlash(null),2000);
  };

  const groupedChores=(choresList||CHORES_LIST).reduce((acc,c)=>{
    if(!acc[c.category]) acc[c.category]=[];
    acc[c.category].push(c); return acc;
  },{});

  const totalDoneToday=Object.keys(done).filter(k=>k.endsWith(`_${selKid}`)).length;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>

      {/* Confetti */}
      {confetti.map(c=>(
        <div key={c.id} style={{position:"absolute",left:`${c.x}%`,top:"30%",width:c.size,height:c.size,
          background:c.color,borderRadius:"50%",zIndex:50,pointerEvents:"none",
          animation:`confettiFall 2s ease-in forwards`,animationDelay:`${c.delay}ms`}}/>
      ))}

      {/* Flash toast */}
      {flash&&<div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",zIndex:60,
        padding:"10px 20px",borderRadius:14,
        background:flash.points>0?"linear-gradient(135deg,#3A7A52,#5BAF7A)":"linear-gradient(135deg,#C07830,#E8A84C)",
        color:"#fff",fontWeight:700,fontSize:14,boxShadow:"0 6px 24px rgba(0,0,0,0.25)",
        display:"flex",alignItems:"center",gap:8,animation:"slideDownFade .3s ease",whiteSpace:"nowrap"}}>
        <span style={{fontSize:20}}>{flash.points>0?"⭐":"🎁"}</span>
        <span>{flash.points>0?`+${flash.points} poäng! ${flash.title}`:`−${Math.abs(flash.points)} — ${flash.title}`}</span>
      </div>}

      {/* Kid selector */}
      <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${T.border}`,background:T.surface,flexShrink:0}}>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          {kids.map(k=>{
            const lv=getLevel(k.stats.points);
            const active=selKid===k.id;
            return <button key={k.id} onClick={()=>setSelKid(k.id)} style={{
              flex:1,padding:"10px 8px",borderRadius:14,cursor:"pointer",
              border:`2px solid ${active?k.color:T.border}`,
              background:active?k.color+"18":T.bg,
              transition:"all .2s",fontFamily:"inherit",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:k.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",fontWeight:700,flexShrink:0,boxShadow:active?`0 0 12px ${k.color}66`:"none"}}>{k.av}</div>
                <div style={{flex:1,textAlign:"left"}}>
                  <p style={{fontSize:13,fontWeight:700,color:active?k.color:T.text}}>{k.name}</p>
                  <p style={{fontSize:10,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>{lv.icon} {lv.title}</p>
                </div>
                <div style={{textAlign:"right"}}>
                  <p style={{fontSize:16,fontWeight:700,color:active?k.color:T.textMid,fontFamily:"'DM Sans',sans-serif"}}>{k.stats.points}</p>
                  <p style={{fontSize:9,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>poäng</p>
                </div>
              </div>
              {/* Mini progress */}
              <div style={{height:4,background:T.border,borderRadius:2,marginTop:8,overflow:"hidden"}}>
                <div style={{height:"100%",background:k.color,width:`${getLevelPct(k.stats.points)}%`,borderRadius:2,transition:"width .5s"}}/>
              </div>
            </button>;
          })}
        </div>

        {/* Level + streak for selected kid */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1,background:kid.color+"14",borderRadius:10,padding:"7px 10px",border:`1px solid ${kid.color}33`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <span style={{fontSize:11,fontWeight:700,color:kid.color,fontFamily:"'DM Sans',sans-serif"}}>{level.icon} {level.title}</span>
              <span style={{fontSize:10,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>{kid.stats.points} / {getLevel(kid.stats.points).max+1} p</span>
            </div>
            <div style={{height:6,background:T.border,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",background:`linear-gradient(90deg,${kid.color},${kid.color}cc)`,width:`${pct}%`,borderRadius:3,transition:"width .5s",boxShadow:`0 0 8px ${kid.color}66`}}/>
            </div>
          </div>
          {kid.stats.streak>0&&<div style={{textAlign:"center",padding:"6px 10px",background:T.amberBg,borderRadius:10,border:`1px solid ${T.amber}44`}}>
            <div style={{fontSize:18}}>🔥</div>
            <p style={{fontSize:10,fontWeight:700,color:T.amber,fontFamily:"'DM Sans',sans-serif"}}>{kid.stats.streak} dagar</p>
          </div>}
          {totalDoneToday>0&&<div style={{textAlign:"center",padding:"6px 10px",background:T.greenBg,borderRadius:10,border:`1px solid ${T.green}44`}}>
            <div style={{fontSize:18}}>✅</div>
            <p style={{fontSize:10,fontWeight:700,color:T.green,fontFamily:"'DM Sans',sans-serif"}}>{totalDoneToday} idag</p>
          </div>}
        </div>
      </div>

      {/* View tabs */}
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`,flexShrink:0,background:T.surface}}>
        {[["chores","🧹 Sysslor"],["rewards","🎁 Belöningar"],["history","📜 Historik"]].map(([id,label])=>(
          <button key={id} onClick={()=>setView(id)} style={{
            flex:1,padding:"7px 4px",border:"none",cursor:"pointer",fontFamily:"inherit",
            borderBottom:`2.5px solid ${view===id?kid.color:"transparent"}`,
            background:view===id?kid.color+"10":"transparent",
            color:view===id?kid.color:T.textDim,
            fontWeight:view===id?700:500,fontSize:11,transition:"all .15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"10px 12px 14px"}}>

        {/* ── CHORES ── */}
        {view==="chores"&&<>
          {/* Badges row */}
          {earnedBadges.length>0&&<div style={{marginBottom:12}}>
            <p style={{fontSize:9,color:T.textDim,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6,fontFamily:"'DM Sans',sans-serif"}}>🏅 Intjänade badges</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {earnedBadges.map(b=>(
                <div key={b.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",borderRadius:999,background:kid.color+"18",border:`1px solid ${kid.color}44`}}>
                  <span style={{fontSize:14}}>{b.icon}</span>
                  <span style={{fontSize:10,fontWeight:700,color:kid.color,fontFamily:"'DM Sans',sans-serif"}}>{b.title}</span>
                </div>
              ))}
            </div>
          </div>}

          {/* Chores by category */}
          {Object.entries(groupedChores).map(([cat,chores])=>(
            <div key={cat} style={{marginBottom:14}}>
              <p style={{fontSize:10,color:T.textMid,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6,fontFamily:"'DM Sans',sans-serif"}}>
                {cat} <span style={{color:T.textDim,fontWeight:400}}>({chores.filter(c=>isDone(c.id)).length}/{chores.length})</span>
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {chores.map(chore=>{
                  const d=isDone(chore.id);
                  return <div key={chore.id} onClick={()=>!d&&completeChore(chore)} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
                    borderRadius:11,cursor:d?"default":"pointer",
                    background:d?T.greenBg:T.card,
                    border:`1.5px solid ${d?T.green:T.border}`,
                    boxShadow:T.shadow,opacity:d?0.65:1,
                    transition:"all .2s",
                  }}>
                    <span style={{fontSize:18,flexShrink:0}}>{chore.icon}</span>
                    <span style={{flex:1,fontSize:12,fontWeight:d?500:600,color:d?T.green:T.text,textDecoration:d?"line-through":"none",fontFamily:"'DM Sans',sans-serif",lineHeight:1.3}}>{chore.title}</span>
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      <span style={{fontSize:12,fontWeight:700,color:d?T.green:kid.color,fontFamily:"'DM Sans',sans-serif"}}>+{chore.points}</span>
                      <span style={{fontSize:10,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>⭐</span>
                    </div>
                    <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${d?T.green:T.border}`,background:d?T.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                      {d&&<span style={{color:"#fff",fontSize:11,fontWeight:700}}>✓</span>}
                    </div>
                  </div>;
                })}
              </div>
            </div>
          ))}
        </>}

        {/* ── REWARDS ── */}
        {view==="rewards"&&<>
          <div style={{background:kid.color+"14",borderRadius:12,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,border:`1px solid ${kid.color}33`}}>
            <span style={{fontSize:28}}>⭐</span>
            <div>
              <p style={{fontSize:18,fontWeight:700,color:kid.color,fontFamily:"'DM Sans',sans-serif",lineHeight:1}}>{kid.stats.points} poäng</p>
              <p style={{fontSize:11,color:T.textMid,fontFamily:"'DM Sans',sans-serif"}}>Klicka på en belöning för att lösa in</p>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {REWARDS.map(r=>{
              const canAfford=kid.stats.points>=r.cost;
              return <div key={r.id} onClick={()=>canAfford&&redeemReward(r)} style={{
                display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
                borderRadius:12,cursor:canAfford?"pointer":"default",
                background:canAfford?T.card:T.bg,
                border:`1.5px solid ${canAfford?T.border:T.border}`,
                boxShadow:canAfford?T.shadow:"none",
                opacity:canAfford?1:0.45,transition:"all .2s",
              }}>
                <div style={{width:44,height:44,borderRadius:12,background:canAfford?kid.color+"22":T.bg,border:`2px solid ${canAfford?kid.color:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{r.icon}</div>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"'DM Sans',sans-serif"}}>{r.title}</p>
                  <p style={{fontSize:10,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>{canAfford?"Tryck för att lösa in":"Inte tillräckligt med poäng"}</p>
                </div>
                <div style={{textAlign:"center",flexShrink:0}}>
                  <p style={{fontSize:15,fontWeight:700,color:canAfford?kid.color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>{r.cost}</p>
                  <p style={{fontSize:9,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>⭐ poäng</p>
                </div>
              </div>;
            })}
          </div>
        </>}

        {/* ── HISTORY ── */}
        {view==="history"&&<>
          {/* Leaderboard */}
          <p style={{fontSize:10,color:T.textDim,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>🏆 Poängtavla</p>
          {[...kids].sort((a,b)=>b.stats.points-a.stats.points).map((k,i)=>{
            const lv=getLevel(k.stats.points);
            return <div key={k.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:11,background:i===0?k.color+"14":T.card,border:`1px solid ${i===0?k.color+"44":T.border}`,marginBottom:7,boxShadow:T.shadow}}>
              <span style={{fontSize:18,fontWeight:700,color:i===0?k.color:T.textDim,minWidth:24,fontFamily:"'DM Sans',sans-serif"}}>{i===0?"🥇":i===1?"🥈":"🥉"}</span>
              <div style={{width:32,height:32,borderRadius:"50%",background:k.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"#fff",fontWeight:700,flexShrink:0}}>{k.av}</div>
              <div style={{flex:1}}>
                <p style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"'DM Sans',sans-serif"}}>{k.name}</p>
                <p style={{fontSize:10,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>{lv.icon} {lv.title} · {k.stats.total} sysslor</p>
              </div>
              <p style={{fontSize:20,fontWeight:700,color:k.color,fontFamily:"'DM Sans',sans-serif"}}>{k.stats.points}</p>
            </div>;
          })}

          {/* Recent activity */}
          <p style={{fontSize:10,color:T.textDim,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",margin:"14px 0 8px",fontFamily:"'DM Sans',sans-serif"}}>📋 Senaste aktivitet — {kid.name}</p>
          {(kid.history||[]).length===0&&<p style={{fontSize:12,color:T.textDim,textAlign:"center",padding:"20px",fontFamily:"'DM Sans',sans-serif"}}>Inga sysslor ännu</p>}
          {(kid.history||[]).map((h,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",borderRadius:9,background:T.card,border:`1px solid ${T.border}`,marginBottom:5}}>
              <span style={{fontSize:14}}>✅</span>
              <span style={{fontSize:12,color:T.text,flex:1,fontFamily:"'DM Sans',sans-serif"}}>{h}</span>
              <span style={{fontSize:10,color:T.textDim,fontFamily:"'DM Sans',sans-serif"}}>+poäng</span>
            </div>
          ))}

          {/* Category breakdown */}
          <p style={{fontSize:10,color:T.textDim,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",margin:"14px 0 8px",fontFamily:"'DM Sans',sans-serif"}}>📊 Per kategori</p>
          {Object.entries(kid.stats.byCategory||{}).sort((a,b)=>b[1]-a[1]).map(([cat,count])=>(
            <div key={cat} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:11,color:T.textMid,minWidth:70,fontFamily:"'DM Sans',sans-serif"}}>{cat}</span>
              <div style={{flex:1,height:8,background:T.border,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",background:kid.color,width:`${Math.min(count/10*100,100)}%`,borderRadius:4,transition:"width .5s"}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:kid.color,minWidth:20,textAlign:"right",fontFamily:"'DM Sans',sans-serif"}}>{count}</span>
            </div>
          ))}
        </>}
      </div>
    </div>
  );
}

/* ═══ CALENDAR PANEL (right col) ════════════════════════════════ */
function CalPanel({T,now,gcal}){
  const cur=now.getHours()*60+now.getMinutes();
  const todayStr=now.toISOString().slice(0,10);
  const wk=getISOWeek(now);
  // Visa riktiga events om kopplad, annars demo-data
  const todayEvents=gcal?.connected ? gcal.events.filter(e=>e.date===todayStr) : CAL_EVENTS_DEMO;
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <div style={{padding:"12px 14px 9px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
        <div style={{fontSize:9,color:T.textDim,letterSpacing:2,textTransform:"uppercase"}}>Google Kalender</div>
        {gcal?.connected&&<div style={{width:6,height:6,borderRadius:"50%",background:T.green,flexShrink:0}}/>}
        <div style={{marginLeft:"auto",background:T.amberBg,borderRadius:5,padding:"2px 7px",display:"flex",alignItems:"baseline",gap:2}}>
          <span style={{fontSize:7,color:T.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>v.</span>
          <span style={{fontSize:13,fontWeight:700,color:T.amber,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{wk}</span>
        </div>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:T.text,textTransform:"capitalize"}}>{now.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"})}</div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"6px 8px"}}>
      {gcal?.loading&&<div style={{textAlign:"center",padding:20,color:T.textDim,fontSize:11}}>Hämtar events...</div>}
      {gcal?.error&&<div style={{padding:"6px 8px",background:T.redBg,borderRadius:7,fontSize:10,color:T.red,margin:"4px 0"}}>{gcal.error}</div>}
      {!gcal?.loading&&todayEvents.length===0&&<div style={{textAlign:"center",padding:20,color:T.textDim,fontSize:11}}>Inga events idag</div>}
      {todayEvents.map((ev,i)=>{const evMin=toMin(ev.time);const isPast=evMin<cur;const isNow=evMin<=cur&&evMin+60>cur;return <div key={ev.id||i} style={{display:"flex",gap:7,padding:"6px 7px",borderRadius:8,marginBottom:3,background:isNow?ev.color+"18":"transparent",border:`1px solid ${isNow?ev.color+"55":"transparent"}`,opacity:isPast&&!isNow?0.32:1,transition:"all .3s"}}>
        <div style={{width:28,flexShrink:0,textAlign:"right"}}><span style={{fontSize:9,color:isNow?ev.color:T.textDim,fontFamily:"'DM Mono',monospace",fontWeight:isNow?700:400}}>{ev.time}</span></div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,flexShrink:0}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:isNow?ev.color:T.borderMid,marginTop:2,boxShadow:isNow?`0 0 5px ${ev.color}`:"none"}}/>
          {i<todayEvents.length-1&&<div style={{width:1,flex:1,minHeight:10,background:T.border}}/>}
        </div>
        <div style={{flex:1}}><div style={{fontSize:11,color:isNow?T.text:T.textMid,fontWeight:isNow?700:400,lineHeight:1.2}}>{ev.title}</div><div style={{fontSize:9,color:ev.color+(isNow?"FF":"77"),marginTop:1}}>{ev.who}</div></div>
      </div>;})}
    </div>
    <div style={{margin:"0 8px 8px",padding:"6px 9px",borderRadius:7,background:gcal?.connected?T.greenBg:T.amberBg,border:`1px solid ${gcal?.connected?T.green:T.amber}33`,display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
      <span style={{fontSize:11}}>📅</span>
      <span style={{fontSize:9,color:T.textMid,flex:1}}>{gcal?.connected?"Kopplad":"Koppla Google Kalender"}</span>
      {gcal?.connected
        ?<div onClick={gcal.disconnect} style={{padding:"2px 7px",borderRadius:5,background:T.red,fontSize:9,color:"#fff",fontWeight:700,cursor:"pointer"}}>Koppla ifrån</div>
        :<div onClick={gcal?.connect} style={{padding:"2px 7px",borderRadius:5,background:T.amber,fontSize:9,color:"#fff",fontWeight:700,cursor:"pointer"}}>Koppla</div>}
    </div>
  </div>;
}

/* ═══ HUE ROW ═══════════════════════════════════════════════════ */
function HueLampRow({T,lamps,setLamps}){
  const toggleLamp=id=>setLamps(p=>p.map(l=>l.id===id?{...l,on:!l.on}:l));
  const avg=Math.round(lamps.filter(l=>l.on).reduce((a,l)=>a+l.bri,0)/(lamps.filter(l=>l.on).length||1));
  return <div style={{background:T.surface,backdropFilter:T.blur,borderTop:`1px solid ${T.border}`,padding:"6px 14px",flexShrink:0}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#FFD580",boxShadow:"0 0 6px #FFD580"}}/>
        <span style={{fontSize:10,fontWeight:700,color:T.textMid}}>Philips Hue</span>
      </div>
      <div style={{display:"flex",gap:5,flex:1,overflowX:"auto"}}>
        {lamps.map(l=><div key={l.id} onClick={()=>toggleLamp(l.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0,cursor:"pointer"}}>
          <div style={{width:26,height:26,borderRadius:"50%",background:l.on?l.color:"transparent",border:`2px solid ${l.on?l.color:T.borderMid}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:l.on?`0 0 9px ${l.color}77`:"none",transition:"all .25s",fontSize:12}}>{l.on?"💡":""}</div>
          <span style={{fontSize:8,color:l.on?T.text:T.textDim,fontWeight:l.on?700:400,textAlign:"center",maxWidth:40,lineHeight:1.2}}>{l.name}</span>
        </div>)}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
        <span style={{fontSize:10,color:T.textDim}}>☀</span>
        <input type="range" min="1" max="254" step="1" value={avg} onChange={e=>setLamps(p=>p.map(l=>l.on?{...l,bri:Number(e.target.value)}:l))} style={{width:70,accentColor:T.amber}}/>
      </div>
    </div>
  </div>;
}

/* ═══ SMART SCHOOL-MENU PARSER ══════════════════════════════════
 * Hanterar copy-paste från PDF-matsedlar (radbruten tabelltext).
 * Regel: ny rätt = rad börjar med stor bokstav OCH föregående rad
 *        slutar INTE med ett bindningsord (med, och, &, …).
 * ════════════════════════════════════════════════════════════════ */
function parseSchoolPaste(raw){
  const DAYS_SV=["monday","tuesday","wednesday","thursday","friday"];
  const DAY_RE=/måndag|tisdag|onsdag|torsdag|fredag/i;
  const WEEK_RE=/^vecka\s+\d+/i;
  const CONNECTOR=/\b(med|och|i|på|av|till|från|ur|samt)\s*$|[&]\s*$/i;
  const CAPITAL=/^[A-ZÅÄÖ]/;

  // 1. Rensa headers
  const lines=raw.split("\n")
    .map(l=>l.trim()).filter(Boolean)
    .filter(l=>!WEEK_RE.test(l))                          // "Vecka 17"
    .filter(l=>(l.match(DAY_RE)||[]).length<2);           // dagnamnsrad

  // 2. Slå ihop radbrutna maträtter
  const meals=[];
  let cur="";
  lines.forEach((line,i)=>{
    const prev=i>0?lines[i-1]:"";
    const isNew=CAPITAL.test(line)&&!CONNECTOR.test(prev)&&i>0;
    if(isNew&&cur){meals.push(cur.trim());cur=line;}
    else{cur=cur?cur+" "+line:line;}
  });
  if(cur.trim())meals.push(cur.trim());

  // 3. Fördela på dagar
  // Om vi fick 10 rätter → 2 rätter/dag (kött + vego), visa som "rätt 1 / rätt 2"
  const n=meals.length;
  const result={};
  if(n>=10){
    DAYS_SV.forEach((d,i)=>{
      result[d]=[meals[i],meals[i+5]].filter(Boolean).join(" / ");
    });
  } else if(n>=5){
    DAYS_SV.forEach((d,i)=>{result[d]=meals[i]||"";});
  } else if(n>0){
    // Färre rätter än 5 — fyll in så många vi har
    DAYS_SV.forEach((d,i)=>{if(meals[i])result[d]=meals[i];});
  }
  return result;
}

/* ═══ SETTINGS ══════════════════════════════════════════════════ */
function Settings({T,cfg,setCfg,family,setFamily,familyMeals,setFamilyMeals,schoolMenu,setSchoolMenu,gcal,gcalClientId,setGcalClientId,flowMeds,setFlowMeds,choresList,setChoresList,setChoresDone,onClose}){
  const set=(k,v)=>setCfg(s=>({...s,[k]:v}));
  const [fname,setFname]=useState(family.name);
  const [fmembers,setFmembers]=useState(family.members.map(m=>({...m})));
  const [newMeal,setNewMeal]=useState("");
  const [mealPaste,setMealPaste]=useState("");
  const [meals,setMeals]=useState([...familyMeals]);
  const [school,setSchool]=useState({...schoolMenu});
  const [schoolPaste,setSchoolPaste]=useState("");
  const [section,setSection]=useState("general"); // general | mediciner | meals | school | sysslor
  const [localMeds,setLocalMeds]=useState(()=>JSON.parse(JSON.stringify(flowMeds)));
  const [newMed,setNewMed]=useState({flowId:"morning",name:"",dose:"",who:"",antal:"",dosDag:"1",bestallning:"",fassUrl:""});
  const [localChores,setLocalChores]=useState(()=>[...(choresList||CHORES_LIST)]);
  const [newChore,setNewChore]=useState({title:"",icon:"⭐",category:"Övrigt",points:5});

  const MEMBER_COLORS=["#B8722A","#2A5FA8","#6B4EA8","#3A7A52","#C62828","#9B4EA8"];
  const addM=()=>setFmembers(p=>[...p,{id:Date.now(),name:"",color:MEMBER_COLORS[p.length%MEMBER_COLORS.length],av:"?",inSysslor:false}]);
  const updM=(id,name)=>setFmembers(p=>p.map(m=>m.id===id?{...m,name,av:name.charAt(0).toUpperCase()||"?"}:m));
  const toggleSysslor=id=>setFmembers(p=>p.map(m=>m.id===id?{...m,inSysslor:!m.inSysslor}:m));
  const delM=id=>setFmembers(p=>p.filter(m=>m.id!==id));

  const addMeal=()=>{if(!newMeal.trim())return;setMeals(p=>[...p,newMeal.trim()]);setNewMeal("");};
  const delMeal=i=>setMeals(p=>p.filter((_,idx)=>idx!==i));

  const saveAll=()=>{
    setFamily({name:fname||"Familjen",members:fmembers.filter(m=>m.name.trim()).map(m=>({...m,av:m.name.charAt(0).toUpperCase()}))});
    setFamilyMeals(meals);
    setSchoolMenu(school);
    setFlowMeds(localMeds);
    setChoresList(localChores);
    onClose();
  };

  const Row=({label,children})=><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:12,color:T.text}}>{label}</span>{children}</div>;
  const SCHOOL_DAYS=[["monday","Måndag"],["tuesday","Tisdag"],["wednesday","Onsdag"],["thursday","Torsdag"],["friday","Fredag"]];

  return <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:T.overlay,backdropFilter:"blur(8px)"}} onClick={e=>{if(e.target===e.currentTarget)saveAll();}}>
    <div style={{width:460,background:T.card,backdropFilter:T.blur,borderRadius:18,border:`1px solid ${T.border}`,boxShadow:T.shadow,overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:"88vh"}}>
      {/* Header */}
      <div style={{padding:"13px 17px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:700,color:T.text}}>⚙️ Inställningar</span>
        <button onClick={saveAll} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.textDim,lineHeight:1}}>✕</button>
      </div>
      {/* Section tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0,overflowX:"auto"}}>
        {[["general","⚙️ Allmänt"],["mediciner","💊 Mediciner"],["meals","🍽️ Mat"],["school","🏫 Skola"],["sysslor","⭐ Sysslor"]].map(([id,label])=>(
          <button key={id} onClick={()=>setSection(id)} style={{flexShrink:0,flex:1,padding:"8px 6px",border:"none",borderBottom:`2px solid ${section===id?T.amber:"transparent"}`,background:section===id?T.amberBg:"transparent",color:section===id?T.amber:T.textMid,fontSize:10,fontWeight:section===id?700:500,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}>{label}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"4px 17px 18px"}}>

        {/* ── GENERAL ── */}
        {section==="general"&&<>
          <p style={{fontSize:9,color:T.textDim,letterSpacing:1.5,textTransform:"uppercase",margin:"12px 0 6px"}}>Familj</p>
          <Row label="Familjens namn">
            <input value={fname} onChange={e=>setFname(e.target.value)} style={{padding:"4px 8px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:12,fontFamily:"inherit",outline:"none",width:140,textAlign:"right"}}/>
          </Row>
          <div style={{marginTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <p style={{fontSize:11,color:T.textMid,fontWeight:600}}>Familjemedlemmar</p>
              <span style={{fontSize:10,color:T.textDim}}>⭐ = med i sysslor</span>
            </div>
            {fmembers.map((m,i)=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700,flexShrink:0}}>{m.av}</div>
                <input value={m.name} onChange={e=>updM(m.id,e.target.value)} placeholder={`Person ${i+1}`} style={{flex:1,padding:"5px 8px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:12,fontFamily:"inherit",outline:"none"}}/>
                {/* ⭐-knapp: toggla om personen ska vara med i sysslor */}
                <button onClick={()=>toggleSysslor(m.id)} title="Med i sysslor?" style={{background:m.inSysslor?T.amberBg:"transparent",border:`1.5px solid ${m.inSysslor?T.amber:T.border}`,borderRadius:7,padding:"3px 7px",cursor:"pointer",fontSize:13,lineHeight:1,flexShrink:0}}>⭐</button>
                <button onClick={()=>delM(m.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.textDim,fontSize:14,lineHeight:1}}>✕</button>
              </div>
            ))}
            <button onClick={addM} style={{width:"100%",padding:"6px",borderRadius:8,border:`1px dashed ${T.border}`,background:"transparent",color:T.amber,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:4}}>+ Lägg till person</button>
          </div>
          <p style={{fontSize:9,color:T.textDim,letterSpacing:1.5,textTransform:"uppercase",margin:"14px 0 2px"}}>Utseende</p>
          <Row label="Mörkt tema"><Toggle value={cfg.dark} onChange={v=>set("dark",v)} T={T} small/></Row>
          <Row label="Familjebild i bakgrunden"><Toggle value={cfg.showPhoto} onChange={v=>set("showPhoto",v)} T={T} small/></Row>
          {cfg.showPhoto&&<Row label="Bakgrundens dimning"><div style={{display:"flex",alignItems:"center",gap:6}}><input type="range" min="0" max="80" step="5" value={cfg.photoDim} onChange={e=>set("photoDim",Number(e.target.value))} style={{width:80}}/><span style={{fontSize:10,color:T.textMid,minWidth:24}}>{cfg.photoDim}%</span></div></Row>}
          <p style={{fontSize:9,color:T.textDim,letterSpacing:1.5,textTransform:"uppercase",margin:"14px 0 2px"}}>Integritet</p>
          <Row label="Gästläge"><Toggle value={cfg.guestMode} onChange={v=>set("guestMode",v)} T={T} small/></Row>
          <p style={{fontSize:9,color:T.textDim,letterSpacing:1.5,textTransform:"uppercase",margin:"14px 0 6px"}}>Google Kalender</p>
          {gcal?.connected ? (
            <div style={{padding:"10px 12px",borderRadius:9,background:T.greenBg,border:`1px solid ${T.green}33`,marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontSize:12,color:T.green,fontWeight:700}}>✓ Ansluten</p>
                  <p style={{fontSize:10,color:T.textDim,marginTop:2}}>Events hämtas automatiskt</p>
                </div>
                <button onClick={gcal.disconnect} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${T.red}`,background:T.redBg,color:T.red,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Koppla ifrån</button>
              </div>
            </div>
          ) : (
            <div style={{padding:"10px 12px",borderRadius:9,background:T.surface,border:`1px solid ${T.border}`,marginBottom:8}}>
              <p style={{fontSize:11,color:T.textMid,marginBottom:8,lineHeight:1.6}}>
                Kräver ett OAuth 2.0 Client ID från <span style={{color:T.blue,fontWeight:600}}>console.cloud.google.com</span>
              </p>
              <input value={gcalClientId||""} onChange={e=>setGcalClientId(e.target.value)}
                placeholder="Klistra in ditt OAuth Client ID..."
                style={{width:"100%",padding:"7px 10px",borderRadius:7,border:`1.5px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
              <button onClick={gcal?.connect} disabled={!gcalClientId?.trim()}
                style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:gcalClientId?.trim()?T.blue:"#ccc",color:"#fff",fontWeight:700,fontSize:12,cursor:gcalClientId?.trim()?"pointer":"not-allowed",fontFamily:"inherit"}}>
                Anslut Google Kalender
              </button>
              <p style={{fontSize:9,color:T.textDim,marginTop:6,lineHeight:1.5}}>
                1. Aktivera Calendar API &nbsp;2. Skapa OAuth 2.0 Client ID &nbsp;3. Lägg till http://localhost:3000 som auktoriserad origin
              </p>
            </div>
          )}
        </>}

        {/* ── FAMILY MEALS ── */}
        {section==="meals"&&<>
          <p style={{fontSize:9,color:T.textDim,letterSpacing:1.5,textTransform:"uppercase",margin:"12px 0 4px"}}>Era middagar</p>
          <p style={{fontSize:11,color:T.textMid,marginBottom:10,lineHeight:1.5}}>
            Lägg till alla middagar ni brukar äta. Systemet roterar automatiskt igenom listan i kalendern.
          </p>
          {/* Paste import */}
          <div style={{marginBottom:12,padding:"10px 12px",borderRadius:9,background:T.surface,border:`1px solid ${T.border}`}}>
            <p style={{fontSize:10,fontWeight:700,color:T.textMid,marginBottom:6}}>📋 Klistra in hela listan</p>
            <textarea value={mealPaste} onChange={e=>setMealPaste(e.target.value)}
              placeholder={"En middag per rad:\nTacos\nLax med dillsås\nKöttbullar med makaroner\n..."}
              rows={5} style={{width:"100%",padding:"8px 10px",borderRadius:7,border:`1.5px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none",resize:"vertical",marginBottom:6,boxSizing:"border-box"}}/>
            <button onClick={()=>{
              const items=mealPaste.split("\n").map(l=>l.trim()).filter(Boolean);
              if(!items.length)return;
              setMeals(p=>[...p,...items.filter(i=>!p.includes(i))]);
              setMealPaste("");
            }} style={{width:"100%",padding:"6px",borderRadius:7,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
              Importera ({mealPaste.split("\n").filter(l=>l.trim()).length} rader)
            </button>
          </div>
          {/* Manual add */}
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            <input value={newMeal} onChange={e=>setNewMeal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMeal()} placeholder="ex. Tacos, Lax med dillsås..."
              style={{flex:1,padding:"8px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,background:T.surface,color:T.text,fontSize:12,fontFamily:"inherit",outline:"none"}}/>
            <button onClick={addMeal} style={{padding:"8px 14px",borderRadius:9,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>+</button>
          </div>
          {/* Meal list */}
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {meals.length===0&&<p style={{fontSize:11,color:T.textDim,textAlign:"center",padding:"20px"}}>Inga middagar tillagda ännu</p>}
            {meals.map((m,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",borderRadius:9,background:T.surface,border:`1px solid ${T.border}`}}>
                <span style={{fontSize:14,flexShrink:0}}>🍽️</span>
                <span style={{flex:1,fontSize:12,color:T.text}}>{m}</span>
                <span style={{fontSize:10,color:T.textDim,marginRight:4}}>#{(i%7)+1}</span>
                <button onClick={()=>delMeal(i)} style={{background:"none",border:"none",cursor:"pointer",color:T.textDim,fontSize:13,lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
          {meals.length>0&&<div style={{marginTop:10,padding:"10px 12px",borderRadius:9,background:T.amberBg,border:`1px solid ${T.amber}33`}}>
            <p style={{fontSize:10,color:T.amber,fontWeight:700,marginBottom:2}}>💡 Så fungerar rotationen</p>
            <p style={{fontSize:10,color:T.textMid,lineHeight:1.5}}>Systemet delar in {meals.length} middagar jämnt över veckor. Du kan alltid klicka på en dag i kalendern för att byta.</p>
          </div>}
        </>}

        {/* ── SCHOOL MENU ── */}
        {section==="school"&&<>
          <p style={{fontSize:9,color:T.textDim,letterSpacing:1.5,textTransform:"uppercase",margin:"12px 0 4px"}}>Skolans matsedel</p>
          <p style={{fontSize:11,color:T.textMid,marginBottom:10,lineHeight:1.5}}>
            Matsedeln upprepas varje vecka och visas automatiskt i kalendern på vardagar.
          </p>
          {/* Paste import */}
          <div style={{marginBottom:12,padding:"10px 12px",borderRadius:9,background:T.surface,border:`1px solid ${T.border}`}}>
            <p style={{fontSize:10,fontWeight:700,color:T.textMid,marginBottom:6}}>📋 Klistra in veckomeny</p>
            <textarea value={schoolPaste} onChange={e=>setSchoolPaste(e.target.value)}
              placeholder={"Klistra in matsedeln här — fungerar med PDF-kopia!\n\nExempel:\nVecka 17\nMåndag 20/4  Tisdag 21/4  Onsdag 22/4 ...\nSojafärssås med\npasta\nKebabtallrik med\nris & vitlökssås\n..."}
              rows={6} style={{width:"100%",padding:"8px 10px",borderRadius:7,border:`1.5px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none",resize:"vertical",marginBottom:6,boxSizing:"border-box"}}/>
            <button onClick={()=>{
              const parsed=parseSchoolPaste(schoolPaste);
              if(Object.keys(parsed).length===0){alert("Kunde inte tolka matsedeln — prova att klistra in hela texten inklusive dagnamnen.");return;}
              setSchool(s=>({...s,...parsed}));
              setSchoolPaste("");
            }} style={{width:"100%",padding:"6px",borderRadius:7,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Tolka och fyll i automatiskt</button>
          </div>
          {/* Day-by-day manual */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {SCHOOL_DAYS.map(([key,label])=>(
              <div key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 11px",borderRadius:9,background:T.surface,border:`1px solid ${T.border}`}}>
                <span style={{fontSize:11,fontWeight:700,color:T.amber,minWidth:60,fontFamily:"'DM Sans',sans-serif"}}>{label}</span>
                <input value={school[key]||""} onChange={e=>setSchool(s=>({...s,[key]:e.target.value}))} placeholder="ex. Pasta med köttfärssås"
                  style={{flex:1,padding:"6px 9px",borderRadius:7,border:`1.5px solid ${T.border}`,background:T.bg,color:T.text,fontSize:12,fontFamily:"inherit",outline:"none"}}/>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,padding:"10px 12px",borderRadius:9,background:T.amberBg,border:`1px solid ${T.amber}33`}}>
            <p style={{fontSize:10,color:T.amber,fontWeight:700,marginBottom:2}}>🏫 Tips</p>
            <p style={{fontSize:10,color:T.textMid,lineHeight:1.5}}>Matsedeln visas i botten av varje vardag i kalendern. Du kan alltid skriva över för enskilda dagar direkt i kalendern.</p>
          </div>
        </>}

        {/* ── MEDICINER ── */}
        {section==="mediciner"&&<>
          <p style={{fontSize:9,color:T.textDim,letterSpacing:1.5,textTransform:"uppercase",margin:"12px 0 4px"}}>Mediciner per tidpunkt</p>
          <p style={{fontSize:11,color:T.textMid,marginBottom:10,lineHeight:1.5}}>
            Hantera medicinerna som visas i FlowPanel för varje tidpunkt på dagen.
          </p>
          {FLOWS.map(flow=>(
            <div key={flow.id} style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,padding:"5px 10px",borderRadius:7,background:flow.color+"18",border:`1px solid ${flow.color}33`}}>
                <span style={{fontSize:13}}>{flow.icon}</span>
                <span style={{fontSize:11,fontWeight:700,color:flow.color}}>{flow.label}</span>
                <span style={{fontSize:9,color:T.textDim,marginLeft:2}}>{flow.range}</span>
              </div>
              {(localMeds[flow.id]||[]).length===0&&<p style={{fontSize:10,color:T.textDim,padding:"4px 10px",fontStyle:"italic"}}>Inga mediciner tillagda</p>}
              {(localMeds[flow.id]||[]).map((med,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:8,background:T.surface,border:`1px solid ${T.border}`,marginBottom:4}}>
                  <span style={{fontSize:11}}>💊</span>
                  <span style={{flex:1,fontSize:11,color:T.text,fontWeight:600}}>{med.name}</span>
                  <span style={{fontSize:10,color:T.textDim}}>{med.dose}</span>
                  <span style={{fontSize:10,padding:"1px 6px",borderRadius:999,background:flow.color+"18",color:flow.color,fontWeight:700,marginLeft:3}}>{med.who}</span>
                  <button onClick={()=>setLocalMeds(p=>({...p,[flow.id]:p[flow.id].filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",cursor:"pointer",color:T.textDim,fontSize:14,lineHeight:1,marginLeft:2}}>✕</button>
                </div>
              ))}
            </div>
          ))}
          {/* Add new medicine */}
          <div style={{padding:"10px 12px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`,marginTop:2}}>
            <p style={{fontSize:10,fontWeight:700,color:T.textMid,marginBottom:8}}>➕ Ny medicin</p>
            <div style={{display:"flex",gap:4,marginBottom:7,flexWrap:"wrap"}}>
              {FLOWS.map(f=><button key={f.id} onClick={()=>setNewMed(m=>({...m,flowId:f.id}))} style={{padding:"3px 8px",borderRadius:6,border:`1.5px solid ${newMed.flowId===f.id?f.color:T.border}`,background:newMed.flowId===f.id?f.color+"18":"transparent",color:newMed.flowId===f.id?f.color:T.textDim,fontSize:9,fontWeight:newMed.flowId===f.id?700:400,cursor:"pointer",fontFamily:"inherit"}}>{f.icon} {f.label}</button>)}
            </div>
            <input value={newMed.name} onChange={e=>setNewMed(m=>({...m,name:e.target.value}))} placeholder="Namn" style={{width:"100%",padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none",marginBottom:5,boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:5,marginBottom:5}}>
              <input value={newMed.dose} onChange={e=>setNewMed(m=>({...m,dose:e.target.value}))} placeholder="Dos (t.ex. 1 tabl.)" style={{flex:1,minWidth:0,padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
              <input value={newMed.who} onChange={e=>setNewMed(m=>({...m,who:e.target.value}))} placeholder="Vem" style={{flex:1,minWidth:0,padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
            </div>
            <div style={{display:"flex",gap:5,marginBottom:5}}>
              <input value={newMed.antal} onChange={e=>setNewMed(m=>({...m,antal:e.target.value}))} placeholder="Antal kvar" type="number" min="0" style={{flex:1,minWidth:0,padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
              <input value={newMed.dosDag} onChange={e=>setNewMed(m=>({...m,dosDag:e.target.value}))} placeholder="Dos/dag" type="number" min="1" style={{flex:1,minWidth:0,padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
              <input value={newMed.bestallning} onChange={e=>setNewMed(m=>({...m,bestallning:e.target.value}))} placeholder="Beställ vid" type="number" min="0" style={{flex:1,minWidth:0,padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
            </div>
            <input value={newMed.fassUrl} onChange={e=>setNewMed(m=>({...m,fassUrl:e.target.value}))} placeholder="FASS-länk (valfri URL)" style={{width:"100%",padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none",marginBottom:5,boxSizing:"border-box"}}/>
            <button onClick={()=>{
              if(!newMed.name.trim())return;
              setLocalMeds(p=>({...p,[newMed.flowId]:[...(p[newMed.flowId]||[]),{name:newMed.name.trim(),dose:newMed.dose.trim(),who:newMed.who.trim(),done:false,antal:newMed.antal===''?null:Number(newMed.antal),dosDag:Number(newMed.dosDag)||1,bestallning:newMed.bestallning===''?null:Number(newMed.bestallning),fassUrl:newMed.fassUrl.trim(),doslogg:[]}]}));
              setNewMed(m=>({...m,name:"",dose:"",who:"",antal:"",dosDag:"1",bestallning:"",fassUrl:""}));
            }} style={{width:"100%",padding:"7px",borderRadius:8,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Lägg till medicin</button>
          </div>
        </>}

        {/* ── SYSSLOR ── */}
        {section==="sysslor"&&<>
          <p style={{fontSize:9,color:T.textDim,letterSpacing:1.5,textTransform:"uppercase",margin:"12px 0 4px"}}>Hantera sysslor</p>
          <p style={{fontSize:11,color:T.textMid,marginBottom:10,lineHeight:1.5}}>
            Välj vilka sysslor som visas. Sysslor återställs automatiskt varje ny vecka (måndag).
          </p>
          {/* Weekly reset */}
          <div style={{padding:"10px 12px",borderRadius:9,background:T.amberBg,border:`1px solid ${T.amber}33`,marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>🔄</span>
            <div style={{flex:1}}>
              <p style={{fontSize:11,fontWeight:700,color:T.amber}}>Återställ veckan manuellt</p>
              <p style={{fontSize:9,color:T.textDim,marginTop:1}}>Alla sysslor markeras som ej gjorda</p>
            </div>
            <button onClick={()=>setChoresDone({})} style={{padding:"6px 13px",borderRadius:7,border:`1px solid ${T.amber}`,background:T.amber,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Återställ</button>
          </div>
          {/* Chores list */}
          <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12,maxHeight:280,overflowY:"auto"}}>
            {localChores.map((c,i)=>(
              <div key={c.id||i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,background:T.surface,border:`1px solid ${T.border}`}}>
                <span style={{fontSize:16,flexShrink:0}}>{c.icon}</span>
                <span style={{flex:1,fontSize:11,color:T.text,fontWeight:600}}>{c.title}</span>
                <span style={{fontSize:9,color:T.textDim,minWidth:55}}>{c.category}</span>
                <span style={{fontSize:9,padding:"1px 6px",borderRadius:999,background:T.amberBg,color:T.amber,fontWeight:700}}>{c.points}⭐</span>
                <button onClick={()=>setLocalChores(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:T.textDim,fontSize:14,lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
          {/* Add new chore */}
          <div style={{padding:"10px 12px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`}}>
            <p style={{fontSize:10,fontWeight:700,color:T.textMid,marginBottom:8}}>➕ Ny syssla</p>
            <div style={{display:"flex",gap:5,marginBottom:5}}>
              <input value={newChore.icon} onChange={e=>setNewChore(c=>({...c,icon:e.target.value}))} placeholder="🏠" style={{width:44,padding:"6px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:16,fontFamily:"inherit",outline:"none",textAlign:"center"}}/>
              <input value={newChore.title} onChange={e=>setNewChore(c=>({...c,title:e.target.value}))} placeholder="Titel" style={{flex:1,padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
            </div>
            <div style={{display:"flex",gap:5,marginBottom:8}}>
              <input value={newChore.category} onChange={e=>setNewChore(c=>({...c,category:e.target.value}))} placeholder="Kategori" style={{flex:1,padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
              <input type="number" value={newChore.points} onChange={e=>setNewChore(c=>({...c,points:Number(e.target.value)}))} placeholder="Poäng" style={{width:68,padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
            </div>
            <button onClick={()=>{
              if(!newChore.title.trim())return;
              setLocalChores(p=>[...p,{id:Date.now(),...newChore}]);
              setNewChore({title:"",icon:"⭐",category:"Övrigt",points:5});
            }} style={{width:"100%",padding:"7px",borderRadius:8,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Lägg till syssla</button>
          </div>
        </>}

      </div>
      {/* Save footer */}
      <div style={{padding:"10px 17px",borderTop:`1px solid ${T.border}`,flexShrink:0}}>
        <button onClick={saveAll} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          Spara och stäng
        </button>
      </div>
    </div>
  </div>;
}

/* ═══ ONBOARDING ════════════════════════════════════════════════ */
const TOUR_STEPS=[
  {title:"Välkommen! 🏡",body:"Er personliga familjedashboard. Vi sätter upp den på 2 minuter.",icon:"🏡"},
  {title:"Kalendervy 📅",body:"Klicka på 📅-knappen i toppraden för att byta till kalendervy — precis som er väggkalender, med klistermärken, mat och händelser.",icon:"📅"},
  {title:"Kanban-tavlan 📋",body:"Tre kolumner: Redo → Pågår → Klart. Dra uppgifter, sortera prioritet, filtrera per familjemedlem.",icon:"📋"},
  {title:"Mat i inställningar 🍽️",body:"Gå till ⚙️ → 'Familjens mat' och lägg in alla middagar ni brukar äta. De roterar automatiskt in i kalendern varje vecka!",icon:"🍽️"},
  {title:"Skolans mat 🏫",body:"Under ⚙️ → 'Skolans mat' fyller ni i matsedeln (mån–fre). Den dyker automatiskt upp i rätt dag i kalendern.",icon:"🏫"},
  {title:"Gästläge 🙈",body:"Tryck på 👁️-knappen för att dölja mediciner och känsliga uppgifter när ni har besök.",icon:"🙈"},
  {title:"Smarta hem 🏠",body:"Styr Roborock, Hue-lampor, Spotify och Nest-högtalare direkt från dashboarden.",icon:"🏠"},
  {title:"Allt klart! 🎉",body:"Ändra familjens namn, members, mat och skola när som helst i ⚙️-inställningarna.",icon:"🎉"},
];
const MEMBER_COLORS=["#B8722A","#2A5FA8","#6B4EA8","#3A7A52","#C62828","#9B4EA8"];

function Onboarding({onDone}){
  const [step,setStep]=useState(0);
  const [fname,setFname]=useState("");
  const [members,setMembers]=useState([{id:1,name:"",color:MEMBER_COLORS[0],av:"",inSysslor:false},{id:2,name:"",color:MEMBER_COLORS[1],av:"",inSysslor:false}]);
  const [tourStep,setTourStep]=useState(0);
  const addM=()=>setMembers(p=>[...p,{id:Date.now(),name:"",color:MEMBER_COLORS[p.length%MEMBER_COLORS.length],av:"",inSysslor:false}]);
  const updM=(id,n)=>setMembers(p=>p.map(m=>m.id===id?{...m,name:n,av:n.charAt(0).toUpperCase()||"?"}:m));
  const toggleSysslor=id=>setMembers(p=>p.map(m=>m.id===id?{...m,inSysslor:!m.inSysslor}:m));
  const delM=id=>setMembers(p=>p.filter(m=>m.id!==id));
  const finish=()=>onDone({name:fname||"Familjen",members:members.filter(m=>m.name.trim()).map(m=>({...m,av:m.name.charAt(0).toUpperCase()}))});
  const overlay={position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"};
  const box={width:460,background:"#fff",borderRadius:20,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"};

  if(step===3){
    const ts=TOUR_STEPS[tourStep];
    return <div style={overlay}><div style={box}>
      <div style={{background:"linear-gradient(135deg,#B8722A,#E8A84C)",padding:"26px",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:6}}>{ts.icon}</div>
        <h2 style={{fontFamily:"'Fraunces',serif",fontSize:19,fontWeight:700,color:"#fff",lineHeight:1.3}}>{ts.title}</h2>
      </div>
      <div style={{padding:"20px 24px"}}>
        <p style={{fontSize:13,color:"#5A4E3C",lineHeight:1.7,marginBottom:18,textAlign:"center"}}>{ts.body}</p>
        <div style={{display:"flex",justifyContent:"center",gap:5,marginBottom:16}}>
          {TOUR_STEPS.map((_,i)=><div key={i} style={{width:i===tourStep?18:6,height:6,borderRadius:3,background:i===tourStep?"#B8722A":"#EDE0D4",transition:"all .3s"}}/>)}
        </div>
        <div style={{display:"flex",gap:7}}>
          {tourStep>0&&<button onClick={()=>setTourStep(t=>t-1)} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid #EDE0D4",background:"transparent",color:"#9A8E7C",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Tillbaka</button>}
          {tourStep<TOUR_STEPS.length-1
            ?<button onClick={()=>setTourStep(t=>t+1)} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"#B8722A",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Nästa →</button>
            :<button onClick={finish} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"#3A7A52",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>🎉 Starta!</button>}
        </div>
        <button onClick={finish} style={{display:"block",width:"100%",marginTop:8,padding:"6px",borderRadius:8,border:"none",background:"transparent",color:"#9A8E7C",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Hoppa över tour</button>
      </div>
    </div></div>;
  }

  return <div style={overlay}><div style={box}>
    <div style={{background:"linear-gradient(135deg,#B8722A,#E8A84C)",padding:"26px",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:6}}>🏡</div>
      {step===0&&<h2 style={{fontFamily:"'Fraunces',serif",fontSize:21,fontWeight:700,color:"#fff"}}>Välkommen till er dashboard!</h2>}
      {step===1&&<h2 style={{fontFamily:"'Fraunces',serif",fontSize:21,fontWeight:700,color:"#fff"}}>Vad heter er familj?</h2>}
      {step===2&&<h2 style={{fontFamily:"'Fraunces',serif",fontSize:21,fontWeight:700,color:"#fff"}}>Vilka är i familjen?</h2>}
      <div style={{display:"flex",justifyContent:"center",gap:4,marginTop:10}}>
        {[0,1,2].map(i=><div key={i} style={{width:i===step?18:6,height:6,borderRadius:3,background:"rgba(255,255,255,"+(i===step?"1)":"0.4)"),transition:"all .3s"}}/>)}
      </div>
    </div>
    <div style={{padding:"22px 24px"}}>
      {step===0&&<><p style={{fontSize:14,color:"#5A4E3C",lineHeight:1.7,textAlign:"center",marginBottom:20}}>Kalender, uppgifter, mediciner, matsedel och smarta hem — allt på ett ställe. Vi sätter upp det på 2 minuter!</p>
        <button onClick={()=>setStep(1)} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:"#B8722A",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Kom igång →</button></>}
      {step===1&&<><p style={{fontSize:12,color:"#9A8E7C",marginBottom:10,textAlign:"center"}}>Visas i toppraden — t.ex. "Landerstedts" eller "Familjen Berg"</p>
        <input value={fname} onChange={e=>setFname(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setStep(2)} placeholder="er familjs namn..."
          style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"2px solid #EDE0D4",fontSize:15,fontFamily:"'Fraunces',serif",color:"#1C1810",outline:"none",marginBottom:16,textAlign:"center",boxSizing:"border-box"}} autoFocus/>
        <div style={{display:"flex",gap:7}}><button onClick={()=>setStep(0)} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid #EDE0D4",background:"transparent",color:"#9A8E7C",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Tillbaka</button>
          <button onClick={()=>setStep(2)} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"#B8722A",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Nästa →</button></div></>}
      {step===2&&<><p style={{fontSize:12,color:"#9A8E7C",marginBottom:6,textAlign:"center"}}>Kan ändras i inställningarna senare</p>
        <p style={{fontSize:11,color:"#B8722A",marginBottom:10,textAlign:"center",fontWeight:600}}>⭐ = med i sysslor &amp; poängsystem</p>
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:220,overflowY:"auto",marginBottom:10}}>
          {members.map((m,i)=><div key={m.id} style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:700,flexShrink:0}}>{m.av||"?"}</div>
            <input value={m.name} onChange={e=>updM(m.id,e.target.value)} placeholder={`Person ${i+1}...`}
              style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid #EDE0D4",fontSize:13,fontFamily:"inherit",color:"#1C1810",outline:"none"}}/>
            {/* ⭐-knapp: markera som barn/med i sysslor */}
            <button onClick={()=>toggleSysslor(m.id)} title="Med i sysslor?" style={{background:m.inSysslor?"#FDF0E0":"transparent",border:`1.5px solid ${m.inSysslor?"#B8722A":"#EDE0D4"}`,borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:14,lineHeight:1,flexShrink:0}} >⭐</button>
            {members.length>1&&<button onClick={()=>delM(m.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#C9A0A0",fontSize:15,lineHeight:1}}>✕</button>}
          </div>)}
        </div>
        <button onClick={addM} style={{width:"100%",padding:"7px",borderRadius:8,border:"1px dashed #EDE0D4",background:"transparent",color:"#B8722A",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:14}}>+ Lägg till person</button>
        <div style={{display:"flex",gap:7}}>
          <button onClick={()=>setStep(1)} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid #EDE0D4",background:"transparent",color:"#9A8E7C",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Tillbaka</button>
          <button onClick={()=>setStep(3)} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"#B8722A",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Visa tour →</button>
        </div>
        <button onClick={finish} style={{display:"block",width:"100%",marginTop:8,padding:"6px",borderRadius:8,border:"none",background:"transparent",color:"#9A8E7C",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Hoppa över — gå direkt till dashboarden</button></>}
    </div>
  </div></div>;
}

/* ═══ GUEST TOAST ═══════════════════════════════════════════════ */
function GuestToast({guestMode,T}){
  const [vis,setVis]=useState(false);const prev=useRef(guestMode);
  useEffect(()=>{if(guestMode!==prev.current){prev.current=guestMode;setVis(true);const t=setTimeout(()=>setVis(false),2800);return()=>clearTimeout(t);}});
  if(!vis)return null;
  return <div style={{position:"fixed",bottom:72,left:"50%",transform:"translateX(-50%)",zIndex:500,padding:"9px 18px",borderRadius:12,background:guestMode?"#9B8DC9":T.green,color:"#fff",fontWeight:700,fontSize:13,boxShadow:"0 6px 24px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",gap:8,animation:"slideUp .3s ease"}}>
    <span style={{fontSize:17}}>{guestMode?"🙈":"👁️"}</span>
    {guestMode?"Gästläge — mediciner dolda":"Familjeläge — allt synligt"}
  </div>;
}

/* ═══ BIL & HUS ═════════════════════════════════════════════════ */
const CAR_TEMPLATES=[
  {title:"Sommardäck",icon:"🔄",month:4,recur:"yearly",cat:"Bil"},
  {title:"Vinterdäck",icon:"❄️",month:10,recur:"yearly",cat:"Bil"},
  {title:"Besiktning",icon:"🔍",month:6,recur:"yearly",cat:"Bil"},
  {title:"Service",icon:"🔧",month:3,recur:"yearly",cat:"Bil"},
  {title:"Biltvätt",icon:"🚿",month:5,recur:"yearly",cat:"Bil"},
];
const HOUSE_CATS=["Utvändigt","Inomhus","Teknik","Trädgård","Städning"];
const HOUSE_TEMPLATES=[
  {title:"Rengöra värmepump",icon:"🌡️",intervalMonths:6,cat:"Teknik"},
  {title:"Byta batterier brandvarnare",icon:"🔋",intervalMonths:12,cat:"Teknik"},
  {title:"Rensa hängrännor",icon:"🪣",intervalMonths:6,cat:"Utvändigt"},
  {title:"Måla träfasad",icon:"🎨",intervalMonths:60,cat:"Utvändigt"},
  {title:"Kontrollera tak",icon:"🏠",intervalMonths:24,cat:"Utvändigt"},
  {title:"Rensa avlopp",icon:"🚿",intervalMonths:12,cat:"Inomhus"},
  {title:"Klippa häck",icon:"✂️",intervalMonths:3,cat:"Trädgård"},
];
const MONTH_SV=["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

function CarHouseTab({T,carReminders,setCarReminders,houseItems,setHouseItems}){
  const [view,setView]=useState("car"); // car | house
  const [newCar,setNewCar]=useState({title:"",icon:"🚗",month:new Date().getMonth()+1,notes:""});
  const [newHouse,setNewHouse]=useState({title:"",icon:"🏠",intervalMonths:12,cat:"Inomhus",notes:"",lastDone:""});
  const today=new Date();

  const addCar=()=>{if(!newCar.title.trim())return;setCarReminders(p=>[...p,{...newCar,id:Date.now()}]);setNewCar({title:"",icon:"🚗",month:today.getMonth()+1,notes:""});};
  const delCar=id=>setCarReminders(p=>p.filter(r=>r.id!==id));
  const doneCarNow=id=>setCarReminders(p=>p.map(r=>r.id===id?{...r,lastDone:today.toISOString().slice(0,10)}:r));

  const addHouse=()=>{if(!newHouse.title.trim())return;setHouseItems(p=>[...p,{...newHouse,id:Date.now(),lastDone:""}]);setNewHouse({title:"",icon:"🏠",intervalMonths:12,cat:"Inomhus",notes:"",lastDone:""});};
  const delHouse=id=>setHouseItems(p=>p.filter(r=>r.id!==id));
  const doneHouseNow=id=>setHouseItems(p=>p.map(r=>r.id===id?{...r,lastDone:today.toISOString().slice(0,10)}:r));

  const daysUntilMonth=(m)=>{const t=new Date(today.getFullYear(),m-1,1);if(t<today)t.setFullYear(today.getFullYear()+1);return Math.round((t-today)/(1000*60*60*24));};
  const houseOverdue=(item)=>{if(!item.lastDone)return true;const last=new Date(item.lastDone);const next=new Date(last);next.setMonth(next.getMonth()+item.intervalMonths);return next<=today;};
  const houseNextDate=(item)=>{if(!item.lastDone)return"Aldrig gjort";const last=new Date(item.lastDone);const next=new Date(last);next.setMonth(next.getMonth()+item.intervalMonths);return next.toLocaleDateString("sv-SE",{year:"numeric",month:"short",day:"numeric"});};

  const sortedCar=[...carReminders].sort((a,b)=>daysUntilMonth(a.month)-daysUntilMonth(b.month));
  const sortedHouse=[...houseItems].sort((a,b)=>(houseOverdue(a)?-1:1)-(houseOverdue(b)?-1:1));

  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    {/* Sub-nav */}
    <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0,padding:"0 12px"}}>
      {[["car","🚗 Bil"],["house","🏠 Hus"]].map(([id,label])=>(
        <button key={id} onClick={()=>setView(id)} style={{padding:"8px 16px",border:"none",borderBottom:`2.5px solid ${view===id?T.amber:"transparent"}`,background:"transparent",color:view===id?T.amber:T.textDim,fontSize:11,fontWeight:view===id?700:400,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{label}</button>
      ))}
    </div>

    <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
      {/* ── BIL ── */}
      {view==="car"&&<>
        {/* Snabbmallar */}
        <div style={{marginBottom:12}}>
          <p style={{fontSize:9,fontWeight:700,color:T.textDim,textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>Snabblägg till</p>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {CAR_TEMPLATES.map(t=><button key={t.title} onClick={()=>setCarReminders(p=>[...p,{...t,id:Date.now()}])} style={{padding:"4px 10px",borderRadius:999,border:`1px solid ${T.border}`,background:T.surface,color:T.textMid,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>{t.icon} {t.title}</button>)}
          </div>
        </div>
        {/* Ny påminnelse */}
        <div style={{background:T.card,borderRadius:12,border:`1.5px solid ${T.amber}`,padding:"10px 12px",marginBottom:12}}>
          <p style={{fontSize:10,fontWeight:700,color:T.amber,marginBottom:8}}>➕ Ny bilpåminnelse</p>
          <div style={{display:"flex",gap:5,marginBottom:6}}>
            <input value={newCar.icon} onChange={e=>setNewCar(p=>({...p,icon:e.target.value}))} style={{width:36,padding:"5px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:16,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
            <input value={newCar.title} onChange={e=>setNewCar(p=>({...p,title:e.target.value}))} placeholder="Vad ska göras?" style={{flex:1,padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
            <select value={newCar.month} onChange={e=>setNewCar(p=>({...p,month:Number(e.target.value)}))} style={{padding:"5px 7px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:11,fontFamily:"inherit"}}>
              {MONTH_SV.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <button onClick={addCar} style={{width:"100%",padding:"6px",borderRadius:8,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Lägg till</button>
        </div>
        {sortedCar.length===0&&<div style={{textAlign:"center",padding:20,color:T.textDim,fontSize:11}}>Inga bilpåminnelser. Lägg till ovan.</div>}
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {sortedCar.map(r=>{const days=daysUntilMonth(r.month);const soon=days<30;const veryClose=days<7;return <div key={r.id} style={{background:T.card,borderRadius:10,border:`1.5px solid ${veryClose?T.red:soon?T.amber:T.border}`,padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>{r.icon}</span>
            <div style={{flex:1}}>
              <p style={{fontSize:12,fontWeight:700,color:T.text}}>{r.title}</p>
              <p style={{fontSize:10,color:soon?T.amber:T.textDim}}>{MONTH_SV[r.month-1]} — om {days} dagar</p>
              {r.lastDone&&<p style={{fontSize:9,color:T.textDim}}>Senast: {r.lastDone}</p>}
            </div>
            <button onClick={()=>doneCarNow(r.id)} style={{padding:"4px 9px",borderRadius:7,border:`1px solid ${T.green}`,background:T.greenBg,color:T.green,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Klar</button>
            <button onClick={()=>delCar(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.textDim,fontSize:12}}>🗑</button>
          </div>;})}
        </div>
      </>}

      {/* ── HUS ── */}
      {view==="house"&&<>
        {/* Snabbmallar */}
        <div style={{marginBottom:12}}>
          <p style={{fontSize:9,fontWeight:700,color:T.textDim,textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>Snabblägg till</p>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {HOUSE_TEMPLATES.map(t=><button key={t.title} onClick={()=>setHouseItems(p=>[...p,{...t,id:Date.now(),lastDone:""}])} style={{padding:"4px 10px",borderRadius:999,border:`1px solid ${T.border}`,background:T.surface,color:T.textMid,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>{t.icon} {t.title}</button>)}
          </div>
        </div>
        {/* Ny post */}
        <div style={{background:T.card,borderRadius:12,border:`1.5px solid ${T.amber}`,padding:"10px 12px",marginBottom:12}}>
          <p style={{fontSize:10,fontWeight:700,color:T.amber,marginBottom:8}}>➕ Ny underhållspost</p>
          <div style={{display:"flex",gap:5,marginBottom:6}}>
            <input value={newHouse.icon} onChange={e=>setNewHouse(p=>({...p,icon:e.target.value}))} style={{width:36,padding:"5px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:16,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
            <input value={newHouse.title} onChange={e=>setNewHouse(p=>({...p,title:e.target.value}))} placeholder="Vad ska göras?" style={{flex:1,padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"}}/>
          </div>
          <div style={{display:"flex",gap:5,marginBottom:6}}>
            <select value={newHouse.cat} onChange={e=>setNewHouse(p=>({...p,cat:e.target.value}))} style={{flex:1,padding:"5px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:10,fontFamily:"inherit"}}>
              {HOUSE_CATS.map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={newHouse.intervalMonths} onChange={e=>setNewHouse(p=>({...p,intervalMonths:Number(e.target.value)}))} style={{flex:1,padding:"5px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:10,fontFamily:"inherit"}}>
              {[[1,"Varje månad"],[3,"Var 3:e månad"],[6,"Var 6:e månad"],[12,"Varje år"],[24,"Vartannat år"],[60,"Vart 5:e år"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <button onClick={addHouse} style={{width:"100%",padding:"6px",borderRadius:8,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Lägg till</button>
        </div>
        {sortedHouse.length===0&&<div style={{textAlign:"center",padding:20,color:T.textDim,fontSize:11}}>Inga underhållsposter. Lägg till ovan.</div>}
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {sortedHouse.map(r=>{const overdue=houseOverdue(r);const next=houseNextDate(r);return <div key={r.id} style={{background:T.card,borderRadius:10,border:`1.5px solid ${overdue?T.red:T.border}`,padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>{r.icon}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:2}}>
                <p style={{fontSize:12,fontWeight:700,color:T.text}}>{r.title}</p>
                <span style={{fontSize:8,padding:"1px 5px",borderRadius:999,background:overdue?T.redBg:T.greenBg,color:overdue?T.red:T.green,fontWeight:700}}>{r.cat}</span>
              </div>
              <p style={{fontSize:10,color:overdue?T.red:T.textDim}}>{overdue?"⚠️ Förfallet!":""} Nästa: {next}</p>
              {r.lastDone&&<p style={{fontSize:9,color:T.textDim}}>Senast: {r.lastDone}</p>}
            </div>
            <button onClick={()=>doneHouseNow(r.id)} style={{padding:"4px 9px",borderRadius:7,border:`1px solid ${T.green}`,background:T.greenBg,color:T.green,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Klar</button>
            <button onClick={()=>delHouse(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.textDim,fontSize:12}}>🗑</button>
          </div>;})}
        </div>
      </>}
    </div>
  </div>;
}

/* ═══ EKONOMI ═══════════════════════════════════════════════════ */
const EXPENSE_CATS=["Boende","Mat","Transport","Nöje","Kläder","Hälsa","Övrigt"];
const SPARTIPS=[
  "Byt till LED-lampor — sparar ~600 kr/år","Handla med inköpslista och minska matsvinnet",
  "Jämför försäkringar en gång per år","Pausa prenumerationer du inte använder",
  "Sätt av 10% av lönen automatiskt första dagen","Köp vinterkläder på sommarsea och tvärtom",
  "Byt till ett rörligt elavtal om spotpriset är lågt","Planera veckomenyn och handla en gång per vecka",
  "Säg upp gymkort om du inte går dit","Laga mat hemma istället för takeaway tre kvällar/vecka",
];
function EkonomiTab({T,budget,setBudget}){
  const now=new Date();
  const [view,setView]=useState("budget"); // budget|kalender|tips
  const [month,setMonth]=useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({label:"",amount:"",cat:EXPENSE_CATS[0],type:"expense",day:now.getDate()});

  const entries=budget.filter(e=>e.month===month);
  const income=entries.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0);
  const expenses=entries.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0);
  const balance=income-expenses;
  const tip=SPARTIPS[now.getDate()%SPARTIPS.length];

  function addEntry(){
    if(!form.label.trim()||!form.amount)return;
    setBudget(p=>[...p,{id:Date.now(),month,label:form.label.trim(),amount:Number(form.amount),cat:form.cat,type:form.type,day:Number(form.day)}]);
    setForm(f=>({...f,label:"",amount:""}));
    setShowForm(false);
  }
  function delEntry(id){setBudget(p=>p.filter(e=>e.id!==id));}

  const catTotals=EXPENSE_CATS.map(c=>({cat:c,total:entries.filter(e=>e.cat===c&&e.type==="expense").reduce((s,e)=>s+e.amount,0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  const upcoming=budget.filter(e=>e.type==="expense"&&e.day>=now.getDate()&&e.month===month).sort((a,b)=>a.day-b.day).slice(0,5);

  const btnStyle=(active)=>({padding:"6px 14px",borderRadius:20,border:`1.5px solid ${active?T.amber:T.border}`,background:active?T.amberBg:"transparent",color:active?T.amber:T.textMid,fontSize:11,fontWeight:active?700:400,cursor:"pointer",fontFamily:"inherit"});
  const inputS={padding:"7px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"};

  return <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:14}}>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:5}}>
        {[["budget","💰 Budget"],["kalender","📅 Kommande"],["tips","💡 Spartips"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setView(id)} style={btnStyle(view===id)}>{lbl}</button>
        ))}
      </div>
      <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{...inputS,marginLeft:"auto"}}/>
    </div>

    {/* Budget view */}
    {view==="budget"&&<>
      {/* Summary cards */}
      <div style={{display:"flex",gap:10}}>
        {[{lbl:"Inkomst",val:income,c:"#27ae60",bg:"#e9f7ef"},{lbl:"Utgifter",val:expenses,c:"#e74c3c",bg:"#fdecea"},{lbl:"Balans",val:balance,c:balance>=0?"#27ae60":"#e74c3c",bg:balance>=0?"#e9f7ef":"#fdecea"}].map(({lbl,val,c,bg})=>(
          <div key={lbl} style={{flex:1,background:bg,borderRadius:10,padding:"10px 12px",border:`1px solid ${c}33`}}>
            <p style={{fontSize:9,color:c,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",margin:"0 0 2px"}}>{lbl}</p>
            <p style={{fontSize:18,fontWeight:700,color:c,margin:0}}>{val.toLocaleString("sv-SE")} kr</p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {catTotals.length>0&&<div style={{background:T.card,borderRadius:10,border:`1px solid ${T.border}`,padding:"10px 12px"}}>
        <p style={{fontSize:9,color:T.textDim,letterSpacing:1.3,textTransform:"uppercase",margin:"0 0 8px"}}>Kategorifördelning</p>
        {catTotals.map(({cat,total})=>(
          <div key={cat} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:10,color:T.text,width:80,flexShrink:0}}>{cat}</span>
            <div style={{flex:1,background:T.border,borderRadius:4,height:6,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:4,background:T.amber,width:`${Math.min(100,(total/Math.max(expenses,1))*100)}%`,transition:"width .3s"}}/>
            </div>
            <span style={{fontSize:10,color:T.textMid,width:70,textAlign:"right"}}>{total.toLocaleString("sv-SE")} kr</span>
          </div>
        ))}
      </div>}

      {/* Entries list */}
      <div style={{background:T.card,borderRadius:10,border:`1px solid ${T.border}`,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",padding:"8px 12px",borderBottom:`1px solid ${T.border}`}}>
          <span style={{fontSize:11,fontWeight:700,color:T.text,flex:1}}>Transaktioner</span>
          <button onClick={()=>setShowForm(f=>!f)} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${T.amber}`,background:T.amberBg,color:T.amber,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Lägg till</button>
        </div>
        {showForm&&<div style={{padding:"10px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:6}}>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="Beskrivning" style={{...inputS,flex:2,minWidth:120}}/>
            <input value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="Belopp kr" type="number" min="0" style={{...inputS,flex:1,minWidth:80}}/>
            <input value={form.day} onChange={e=>setForm(f=>({...f,day:e.target.value}))} placeholder="Dag" type="number" min="1" max="31" style={{...inputS,width:60}}/>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={{...inputS,flex:1}}>
              {EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{...inputS,flex:1}}>
              <option value="expense">Utgift</option>
              <option value="income">Inkomst</option>
            </select>
            <button onClick={addEntry} style={{padding:"7px 14px",borderRadius:8,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Spara</button>
          </div>
        </div>}
        {entries.length===0&&<p style={{padding:"14px",fontSize:11,color:T.textDim,textAlign:"center"}}>Inga transaktioner för {month}. Lägg till ovan.</p>}
        {entries.sort((a,b)=>b.day-a.day).map(e=>(
          <div key={e.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:10,color:T.textDim,width:24,textAlign:"center"}}>{e.day}</span>
            <span style={{flex:1,fontSize:11,color:T.text}}>{e.label}</span>
            <span style={{fontSize:9,padding:"1px 7px",borderRadius:999,background:T.surface,color:T.textDim}}>{e.cat}</span>
            <span style={{fontSize:11,fontWeight:700,color:e.type==="income"?"#27ae60":"#e74c3c",width:80,textAlign:"right"}}>{e.type==="income"?"+":"-"}{e.amount.toLocaleString("sv-SE")} kr</span>
            <button onClick={()=>delEntry(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.textDim,fontSize:13}}>✕</button>
          </div>
        ))}
      </div>
    </>}

    {/* Kommande view */}
    {view==="kalender"&&<div style={{background:T.card,borderRadius:10,border:`1px solid ${T.border}`,overflow:"hidden"}}>
      <p style={{padding:"10px 12px",fontSize:9,color:T.textDim,letterSpacing:1.3,textTransform:"uppercase",margin:0,borderBottom:`1px solid ${T.border}`}}>Kommande betalningar denna månad</p>
      {upcoming.length===0?<p style={{padding:"14px",fontSize:11,color:T.textDim,textAlign:"center"}}>Inga kommande utgifter registrerade.</p>:upcoming.map(e=>(
        <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{width:32,height:32,borderRadius:8,background:T.amberBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:12,fontWeight:700,color:T.amber}}>{e.day}</span>
          </div>
          <div style={{flex:1}}><p style={{fontSize:11,color:T.text,fontWeight:600,margin:0}}>{e.label}</p><p style={{fontSize:9,color:T.textDim,margin:0}}>{e.cat}</p></div>
          <span style={{fontSize:12,fontWeight:700,color:"#e74c3c"}}>{e.amount.toLocaleString("sv-SE")} kr</span>
        </div>
      ))}
    </div>}

    {/* Spartips view */}
    {view==="tips"&&<>
      <div style={{background:"#fffbea",borderRadius:12,border:"1px solid #f0d060",padding:"14px 16px",marginBottom:4}}>
        <p style={{fontSize:9,color:"#b8860b",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",margin:"0 0 4px"}}>💡 Dagens tips</p>
        <p style={{fontSize:13,color:"#5A4E3C",fontWeight:600,margin:0,lineHeight:1.5}}>{tip}</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {SPARTIPS.map((t,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:9,background:T.card,border:`1px solid ${T.border}`}}>
            <span style={{fontSize:14,flexShrink:0}}>💡</span>
            <p style={{fontSize:11,color:T.text,margin:0,lineHeight:1.5}}>{t}</p>
          </div>
        ))}
      </div>
    </>}
  </div>;
}

/* ═══ LISTOR (BUCKETLIST + SOMMARLOV) ═══════════════════════════ */
const BUCKET_CATS=["Resa","Upplevelse","Lära sig","Äventyr","Mat & dryck","Övrigt"];
const SOMMAR_DEFAULTS=[
  {title:"Bada i sjö",cat:"Natur",done:false},{title:"Grilla på stranden",cat:"Mat",done:false},
  {title:"Besök ett museum",cat:"Stad",done:false},{title:"Bygg sandslott",cat:"Vattenlek",done:false},
  {title:"Campa under stjärnorna",cat:"Äventyr",done:false},{title:"Plocka bär i skogen",cat:"Natur",done:false},
  {title:"Gör glass hemma",cat:"Mat",done:false},{title:"Cykla en ny stig",cat:"Äventyr",done:false},
  {title:"Besök ett zoo",cat:"Stad",done:false},{title:"Vattenballong-krig",cat:"Vattenlek",done:false},
  {title:"Måla/rita utomhus",cat:"Kreativt",done:false},{title:"Fiska",cat:"Natur",done:false},
  {title:"Laga pizza från grunden",cat:"Mat",done:false},{title:"Bygga kojor",cat:"Äventyr",done:false},
  {title:"Solnedgångspromenad",cat:"Natur",done:false},
];
const SOMMAR_CATS=["Alla","Natur","Äventyr","Stad","Vattenlek","Mat","Kreativt"];
function ListorTab({T,bucketList,setBucketList,sommarList,setSommarList}){
  const [view,setView]=useState("bucket"); // bucket|sommar
  const [newBucket,setNewBucket]=useState({title:"",cat:BUCKET_CATS[0],who:""});
  const [newSommar,setNewSommar]=useState({title:"",cat:SOMMAR_CATS[1]});
  const [sommarFilter,setSommarFilter]=useState("Alla");

  const bucketDone=bucketList.filter(i=>i.done).length;
  const sommarDone=sommarList.filter(i=>i.done).length;
  const filteredSommar=sommarFilter==="Alla"?sommarList:sommarList.filter(i=>i.cat===sommarFilter);

  function addBucket(){
    if(!newBucket.title.trim())return;
    setBucketList(p=>[...p,{id:Date.now(),...newBucket,done:false,addedAt:Date.now()}]);
    setNewBucket(b=>({...b,title:"",who:""}));
  }
  function addSommar(){
    if(!newSommar.title.trim())return;
    setSommarList(p=>[...p,{id:Date.now(),...newSommar,done:false}]);
    setNewSommar(s=>({...s,title:""}));
  }

  const btnStyle=(active)=>({padding:"6px 14px",borderRadius:20,border:`1.5px solid ${active?T.amber:T.border}`,background:active?T.amberBg:"transparent",color:active?T.amber:T.textMid,fontSize:11,fontWeight:active?700:400,cursor:"pointer",fontFamily:"inherit"});
  const inputS={padding:"7px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:11,fontFamily:"inherit",outline:"none"};

  return <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"flex",gap:6}}>
      <button onClick={()=>setView("bucket")} style={btnStyle(view==="bucket")}>🪣 Bucketlist ({bucketDone}/{bucketList.length})</button>
      <button onClick={()=>setView("sommar")} style={btnStyle(view==="sommar")}>☀️ Sommarlov ({sommarDone}/{sommarList.length})</button>
    </div>

    {view==="bucket"&&<>
      {/* Progress */}
      {bucketList.length>0&&<div style={{background:T.card,borderRadius:10,border:`1px solid ${T.border}`,padding:"10px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:10,fontWeight:700,color:T.text}}>Familjensbucketlist</span>
          <span style={{fontSize:10,color:T.textDim}}>{bucketDone} av {bucketList.length} klara</span>
        </div>
        <div style={{background:T.border,borderRadius:4,height:6,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:4,background:"linear-gradient(90deg,#6B4EA8,#a880e0)",width:`${bucketList.length?bucketDone/bucketList.length*100:0}%`,transition:"width .4s"}}/>
        </div>
      </div>}
      {/* Add form */}
      <div style={{background:T.card,borderRadius:10,border:`1px solid ${T.border}`,padding:"10px 12px",display:"flex",gap:5,flexWrap:"wrap"}}>
        <input value={newBucket.title} onChange={e=>setNewBucket(b=>({...b,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addBucket()} placeholder="Lägg till drömupplevelse…" style={{...inputS,flex:3,minWidth:150}}/>
        <input value={newBucket.who} onChange={e=>setNewBucket(b=>({...b,who:e.target.value}))} placeholder="Vem?" style={{...inputS,flex:1,minWidth:70}}/>
        <select value={newBucket.cat} onChange={e=>setNewBucket(b=>({...b,cat:e.target.value}))} style={{...inputS,flex:1,minWidth:90}}>
          {BUCKET_CATS.map(c=><option key={c}>{c}</option>)}
        </select>
        <button onClick={addBucket} style={{padding:"7px 14px",borderRadius:8,border:"none",background:T.amber,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>+ Lägg till</button>
      </div>
      {/* List */}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {bucketList.length===0&&<p style={{fontSize:11,color:T.textDim,textAlign:"center",padding:"20px 0"}}>Inga drömmar ännu — lägg till er första bucketlist-upplevelse!</p>}
        {bucketList.map(item=>(
          <div key={item.id} onClick={()=>setBucketList(p=>p.map(i=>i.id===item.id?{...i,done:!i.done,doneAt:!i.done?Date.now():null}:i))} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:item.done?"#f0f7f0":T.card,border:`1px solid ${item.done?"#b2dfdb":T.border}`,cursor:"pointer",opacity:item.done?0.7:1,transition:"all .2s"}}>
            <div style={{width:22,height:22,borderRadius:"50%",border:`2.5px solid ${item.done?"#27ae60":"#9B84D8"}`,background:item.done?"#27ae60":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {item.done&&<span style={{color:"#fff",fontSize:11,fontWeight:700}}>✓</span>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:12,color:T.text,fontWeight:600,margin:0,textDecoration:item.done?"line-through":"none"}}>{item.title}</p>
              <div style={{display:"flex",gap:6,marginTop:2}}>
                <span style={{fontSize:9,padding:"1px 6px",borderRadius:999,background:"#9B84D818",color:"#6B4EA8",fontWeight:600}}>{item.cat}</span>
                {item.who&&<span style={{fontSize:9,color:T.textDim}}>{item.who}</span>}
                {item.done&&item.doneAt&&<span style={{fontSize:9,color:"#27ae60"}}>✓ {new Date(item.doneAt).toLocaleDateString("sv-SE")}</span>}
              </div>
            </div>
            <button onClick={e=>{e.stopPropagation();setBucketList(p=>p.filter(i=>i.id!==item.id));}} style={{background:"none",border:"none",cursor:"pointer",color:T.textDim,fontSize:14,flexShrink:0}}>✕</button>
          </div>
        ))}
      </div>
    </>}

    {view==="sommar"&&<>
      {/* Progress */}
      <div style={{background:"linear-gradient(135deg,#fff8e1,#fffde7)",borderRadius:12,border:"1px solid #ffe082",padding:"12px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <div><p style={{fontSize:13,fontWeight:700,color:"#e65100",margin:0}}>☀️ Sommarlovslistan {new Date().getFullYear()}</p><p style={{fontSize:10,color:"#bf360c",margin:"2px 0 0"}}>Bocka av allt kul ni gör!</p></div>
          <div style={{textAlign:"right"}}><p style={{fontSize:22,fontWeight:700,color:"#e65100",margin:0}}>{sommarDone}/{sommarList.length}</p><p style={{fontSize:9,color:"#bf360c",margin:0}}>klara</p></div>
        </div>
        <div style={{background:"#ffcc80",borderRadius:4,height:7,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:4,background:"linear-gradient(90deg,#ff8f00,#ffca28)",width:`${sommarList.length?sommarDone/sommarList.length*100:0}%`,transition:"width .4s"}}/>
        </div>
      </div>
      {/* Category filter */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {SOMMAR_CATS.map(c=><button key={c} onClick={()=>setSommarFilter(c)} style={{padding:"4px 10px",borderRadius:999,border:`1.5px solid ${sommarFilter===c?"#e65100":T.border}`,background:sommarFilter===c?"#fff3e0":"transparent",color:sommarFilter===c?"#e65100":T.textDim,fontSize:10,fontWeight:sommarFilter===c?700:400,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>)}
      </div>
      {/* Add custom */}
      <div style={{display:"flex",gap:5}}>
        <input value={newSommar.title} onChange={e=>setNewSommar(s=>({...s,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addSommar()} placeholder="Lägg till sommaraktivitet…" style={{...inputS,flex:3}}/>
        <select value={newSommar.cat} onChange={e=>setNewSommar(s=>({...s,cat:e.target.value}))} style={{...inputS,flex:1}}>
          {SOMMAR_CATS.filter(c=>c!=="Alla").map(c=><option key={c}>{c}</option>)}
        </select>
        <button onClick={addSommar} style={{padding:"7px 12px",borderRadius:8,border:"none",background:"#ff8f00",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>+</button>
      </div>
      {/* List */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {filteredSommar.map(item=>(
          <div key={item.id} onClick={()=>setSommarList(p=>p.map(i=>i.id===item.id?{...i,done:!i.done}:i))} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 11px",borderRadius:9,background:item.done?"#fff8e1":T.card,border:`1px solid ${item.done?"#ffe082":T.border}`,cursor:"pointer",transition:"all .2s"}}>
            <span style={{fontSize:18,flexShrink:0}}>{item.done?"✅":"⬜"}</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:11,color:T.text,fontWeight:600,margin:0,textDecoration:item.done?"line-through":"none"}}>{item.title}</p>
              <span style={{fontSize:9,color:"#e65100"}}>{item.cat}</span>
            </div>
          </div>
        ))}
        {filteredSommar.length===0&&<p style={{fontSize:11,color:T.textDim,gridColumn:"span 2",textAlign:"center",padding:"16px 0"}}>Inga aktiviteter i denna kategori.</p>}
      </div>
    </>}
  </div>;
}

/* ═══ MAIN APP ══════════════════════════════════════════════════ */
export default function App(){
  const now=useClock();
  const [showOnboarding,setShowOnboarding]=useLocalStorage("fp_onboarding",true);
  const [family,setFamily]=useLocalStorage("fp_family",{name:"Familjen",members:[]});
  const [cfg,setCfg]=useLocalStorage("fp_cfg",{dark:false,showPhoto:true,photoDim:28,guestMode:false,morningOn:true,morningT:"07:00",eveningOn:true,eveningT:"20:00",keepAwake:true});
  const [showSettings,setShowSettings]=useState(false);
  const [activeTab,setActiveTab]=useState("kanban");
  const [calendarMode,setCalendarMode]=useState(false);
  const [tasks,setTasks]=useLocalStorage("fp_tasks",[]);
  const [backlog,setBacklog]=useLocalStorage("fp_backlog",[]);
  const [flowMeds,setFlowMeds]=useLocalStorage("fp_meds",Object.fromEntries(FLOWS.map(f=>[f.id,f.meds.map(m=>({...m}))])));
  const [lamps,setLamps]=useLocalStorage("fp_lamps",INIT_LAMPS);
  const [familyMeals,setFamilyMeals]=useLocalStorage("fp_meals",DEFAULT_FAMILY_MEALS);
  const [schoolMenu,setSchoolMenu]=useLocalStorage("fp_schoolmenu",DEFAULT_SCHOOL_MENU);
  const [gcalClientId,setGcalClientId]=useLocalStorage("fp_gcal_clientid","");
  const gcal=useGoogleCalendar(gcalClientId);
  const [choresDone,setChoresDone]=useLocalStorage("fp_chores_done",{});
  const [choresList,setChoresList]=useLocalStorage("fp_chores_list",null); // null = använd CHORES_LIST från constants
  const [templates,setTemplates]=useLocalStorage("fp_templates",DEFAULT_TEMPLATES);
  const [epics,setEpics]=useLocalStorage("fp_epics",[]);
  const [carReminders,setCarReminders]=useLocalStorage("fp_car",[]);
  const [houseItems,setHouseItems]=useLocalStorage("fp_house",[]);
  const [budget,setBudget]=useLocalStorage("fp_budget",[]);
  const [bucketList,setBucketList]=useLocalStorage("fp_bucket",[]);
  const [sommarList,setSommarList]=useLocalStorage("fp_sommar",SOMMAR_DEFAULTS);

  const T=cfg.dark?THEMES.dark:THEMES.light;
  const toggleMed=(fid,idx)=>setFlowMeds(p=>{
    const arr=[...p[fid]];
    const med=arr[idx];
    const markingDone=!med.done;
    arr[idx]={...med,done:markingDone,
      antal:markingDone&&med.antal!=null?Math.max(0,med.antal-1):med.antal,
      doslogg:markingDone?[...(med.doslogg||[]),{ts:Date.now()}]:(med.doslogg||[])};
    return{...p,[fid]:arr};
  });
  const allMeds=Object.values(flowMeds).flat();
  const medsDone=allMeds.filter(m=>m.done).length;
  const doneTasks=tasks.filter(t=>t.lane==="done").length;
  const PHOTO="https://images.unsplash.com/photo-1511895426328-dc8714191011?w=1600&q=80";

  // 🔧 Smarta hem-fliken är tillfälligt dold — ta bort kommentaren för att aktivera igen:
  const TABS=[["kanban","📋 Tavlan"],["planning","🗂️ Planering"],["sysslor","⭐ Sysslor"],["bilhus","🚗 Bil & Hus"],["ekonomi","💰 Ekonomi"],["listor","📝 Listor"]];

  return <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      body{background:#1a1a1a;font-family:'Fraunces',Georgia,serif;}
      ::-webkit-scrollbar{width:3px;height:3px;}
      ::-webkit-scrollbar-thumb{background:rgba(128,100,60,0.28);border-radius:2px;}
      ::-webkit-scrollbar-track{background:transparent;}
      input,select,button{font-family:'Fraunces',Georgia,serif;}
      input[type=range]{accent-color:#B8722A;}
      @keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(12px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
      @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      @keyframes confettiFall{0%{opacity:1;transform:translateY(0) rotate(0deg) scale(1);}100%{opacity:0;transform:translateY(180px) rotate(720deg) scale(0.3);}}
      @keyframes slideDownFade{from{opacity:0;transform:translateX(-50%) translateY(-10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
    `}</style>

    {showOnboarding&&<Onboarding onDone={fam=>{setFamily(fam);setShowOnboarding(false);}}/>}

    <div style={{width:"100%",height:"100vh",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      {/* BG */}
      {cfg.showPhoto?<div style={{position:"fixed",inset:0,zIndex:0}}><img src={PHOTO} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}/><div style={{position:"absolute",inset:0,background:`rgba(${cfg.dark?"0,0,0":"245,230,210"},${cfg.photoDim/100})`}}/></div>
        :<div style={{position:"fixed",inset:0,zIndex:0,background:cfg.dark?"#0F0E0C":"#F5EDD8"}}/>}

      <div style={{position:"relative",zIndex:1,flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* TOP BAR */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 13px",background:T.surface,backdropFilter:T.blur,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          <span style={{fontWeight:700,fontSize:19,color:T.amber,fontFamily:"'Fraunces',serif",letterSpacing:-.5}}>{family.name||"Familjen"}</span>
          <div style={{display:"flex",gap:4,marginLeft:5}}>
            {[
              {label:`${doneTasks}/${tasks.length} klara`,c:doneTasks===tasks.length&&tasks.length>0?T.green:T.amber,bg:doneTasks===tasks.length&&tasks.length>0?T.greenBg:T.amberBg},
              ...(!cfg.guestMode?[{label:`Medicin ${medsDone}/${allMeds.length}`,c:medsDone===allMeds.length?T.green:T.red,bg:medsDone===allMeds.length?T.greenBg:T.redBg}]:[]),
            ].map((p,i)=><div key={i} style={{padding:"2px 8px",borderRadius:999,border:`1px solid ${p.c}44`,background:p.bg,fontSize:9,color:p.c,fontWeight:700,whiteSpace:"nowrap"}}>{p.label}</div>)}
          </div>
          <div style={{flex:1}}/>

          {/* 📅 Calendar toggle button */}
          <button onClick={()=>setCalendarMode(c=>!c)} title={calendarMode?"Tillbaka till tavlan":"Kalendervy"} style={{
            display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:10,
            border:`2px solid ${calendarMode?T.sage:T.border}`,
            background:calendarMode?T.sageBg:T.card,
            backdropFilter:T.blur,cursor:"pointer",fontFamily:"inherit",transition:"all .2s",
          }}>
            <span style={{fontSize:14}}>📅</span>
            <span style={{fontSize:10,fontWeight:700,color:calendarMode?T.sage:T.textMid}}>{calendarMode?"← Tavlan":"Kalendervy"}</span>
          </button>

          {/* Guest mode */}
          <button onClick={()=>setCfg(c=>({...c,guestMode:!c.guestMode}))} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:16,border:`2px solid ${cfg.guestMode?"#9B8DC9":T.border}`,background:cfg.guestMode?"#9B8DC918":T.card,backdropFilter:T.blur,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
            <span style={{fontSize:13}}>{cfg.guestMode?"🙈":"👁️"}</span>
            <div style={{display:"flex",flexDirection:"column",lineHeight:1.2}}>
              <span style={{fontSize:9,fontWeight:700,color:cfg.guestMode?"#9B8DC9":T.textMid}}>{cfg.guestMode?"Gästläge":"Familjeläge"}</span>
              <span style={{fontSize:7,color:T.textDim}}>{cfg.guestMode?"Mediciner dolda":"Allt synligt"}</span>
            </div>
          </button>
          <div style={{display:"flex"}}>
            {family.members.map((m,i)=><div key={m.id} style={{width:26,height:26,borderRadius:"50%",background:m.color+"22",border:`2px solid ${m.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:m.color,fontWeight:700,marginLeft:i>0?-5:0,position:"relative",zIndex:family.members.length-i}}>{m.av}</div>)}
          </div>
          <button onClick={()=>setShowSettings(true)} style={{width:30,height:30,borderRadius:"50%",border:`1px solid ${T.border}`,background:T.card,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:T.blur}}>⚙️</button>
        </div>

        {/* MAIN CONTENT */}
        {calendarMode ? (
          /* ── CALENDAR MODE: full width calendar replacing center+right ── */
          <div style={{flex:1,display:"grid",gridTemplateColumns:"255px 1fr",overflow:"hidden",minHeight:0}}>
            {/* Left col stays */}
            <div style={{display:"flex",flexDirection:"column",borderRight:`1px solid ${T.border}`,overflow:"hidden",background:T.surface,backdropFilter:T.blur}}>
              <ClockBlock now={now} T={T}/>
              <div style={{flex:1,overflowY:"auto"}}>
                <FlowPanel T={T} flowMeds={flowMeds} onToggleMed={toggleMed} guestMode={cfg.guestMode}/>
              </div>
            </div>
            {/* Calendar takes over right side */}
            <div style={{display:"flex",flexDirection:"column",overflow:"hidden",background:T.card,backdropFilter:T.blur,position:"relative",animation:"fadeIn .2s ease"}}>
              <CalendarView T={T} familyMeals={familyMeals} schoolMenu={schoolMenu}/>
            </div>
          </div>
        ) : (
          /* ── NORMAL MODE: 3-column layout ── */
          <div style={{flex:1,display:"grid",gridTemplateColumns:"255px 1fr 245px",overflow:"hidden",minHeight:0}}>
            {/* LEFT */}
            <div style={{display:"flex",flexDirection:"column",borderRight:`1px solid ${T.border}`,overflow:"hidden",background:T.surface,backdropFilter:T.blur}}>
              <ClockBlock now={now} T={T}/>
              <div style={{flex:1,overflowY:"auto"}}>
                <FlowPanel T={T} flowMeds={flowMeds} onToggleMed={toggleMed} guestMode={cfg.guestMode}/>
              </div>
            </div>
            {/* CENTER */}
            <div style={{display:"flex",flexDirection:"column",overflow:"hidden",background:T.bg,backdropFilter:T.blur}}>
              <div style={{display:"flex",padding:"8px 13px 0",gap:3,flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
                {TABS.map(([id,label])=>(
                  <button key={id} onClick={()=>setActiveTab(id)} style={{padding:"6px 12px",borderRadius:"7px 7px 0 0",border:`1px solid ${T.border}`,borderBottom:"none",background:activeTab===id?T.card:"transparent",backdropFilter:activeTab===id?T.blur:"none",color:activeTab===id?T.amber:T.textMid,fontWeight:activeTab===id?700:400,fontSize:11,cursor:"pointer",fontFamily:"inherit",marginBottom:-1,whiteSpace:"nowrap"}}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{flex:1,overflow:"hidden",background:T.card,backdropFilter:T.blur}}>
                {activeTab==="kanban"&&<KanbanBoard T={T} tasks={tasks} setTasks={setTasks} members={family.members} guestMode={cfg.guestMode} epics={epics}/>}
                {activeTab==="planning"&&<PlanningTab T={T} backlog={backlog} setBacklog={setBacklog} tasks={tasks} setTasks={setTasks} members={family.members} templates={templates} setTemplates={setTemplates} epics={epics} setEpics={setEpics}/>}
                {activeTab==="sysslor"&&<KidsPointsTab T={T} members={family.members} choresDone={choresDone} setChoresDone={setChoresDone} choresList={choresList||CHORES_LIST}/>}
                {activeTab==="bilhus"&&<CarHouseTab T={T} carReminders={carReminders} setCarReminders={setCarReminders} houseItems={houseItems} setHouseItems={setHouseItems}/>}
                {activeTab==="ekonomi"&&<EkonomiTab T={T} budget={budget} setBudget={setBudget}/>}
                {activeTab==="listor"&&<ListorTab T={T} bucketList={bucketList} setBucketList={setBucketList} sommarList={sommarList} setSommarList={setSommarList}/>}
              </div>
            </div>
            {/* RIGHT */}
            <div style={{borderLeft:`1px solid ${T.border}`,overflow:"hidden",background:T.surface,backdropFilter:T.blur}}>
              <CalPanel T={T} now={now} gcal={gcal}/>
            </div>
          </div>
        )}

        {/* 🔧 HUE ROW tillfälligt dold — ta bort kommentaren för att aktivera igen: */}
        {/* <HueLampRow T={T} lamps={lamps} setLamps={setLamps}/> */}
      </div>

      <GuestToast guestMode={cfg.guestMode} T={T}/>
      {showSettings&&<Settings T={T} cfg={cfg} setCfg={setCfg} family={family} setFamily={setFamily}
        familyMeals={familyMeals} setFamilyMeals={setFamilyMeals}
        schoolMenu={schoolMenu} setSchoolMenu={setSchoolMenu}
        gcal={gcal} gcalClientId={gcalClientId} setGcalClientId={setGcalClientId}
        flowMeds={flowMeds} setFlowMeds={setFlowMeds}
        choresList={choresList||CHORES_LIST} setChoresList={setChoresList}
        setChoresDone={setChoresDone}
        onClose={()=>setShowSettings(false)}/>}
    </div>
  </>;
}
