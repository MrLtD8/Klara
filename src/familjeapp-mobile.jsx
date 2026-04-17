import { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";

/* ─────────────────────────────────────────────────────────────
   DESIGN DIRECTION: Warm, refined iOS-native feel.
   Deep cream background, rich amber accents, card-based.
   Typography: Fraunces display + DM Sans body.
   One color that rules: #C07830 (warm amber).
   ───────────────────────────────────────────────────────────── */

const C = {
  bg:        "#F7F2EC",
  surface:   "#FFFFFF",
  card:      "#FFFFFF",
  border:    "rgba(180,155,120,0.18)",
  amber:     "#C07830",
  amberDark: "#9A5F22",
  amberBg:   "#FDF4EB",
  amberMid:  "#F0DCC4",
  green:     "#3D7A55",
  greenBg:   "#EAF4EF",
  red:       "#C04040",
  redBg:     "#FDEAEA",
  blue:      "#3060A8",
  blueBg:    "#EBF1FB",
  purple:    "#6B48A8",
  purpleBg:  "#F0EBFD",
  text:      "#1A1410",
  textMid:   "#5C4E3C",
  textDim:   "#A0907C",
  shadow:    "0 2px 16px rgba(100,70,30,0.10)",
  shadowMd:  "0 6px 28px rgba(100,70,30,0.14)",
  shadowLg:  "0 12px 40px rgba(100,70,30,0.18)",
};

/* ─── PRIORITY META ─────────────────────────────────────────── */
const P = {
  urgent: { label:"Akut",  color:"#C04040", bg:"#FDEAEA", dot:"#C04040", rank:0 },
  high:   { label:"Hög",   color:"#C07830", bg:"#FDF4EB", dot:"#C07830", rank:1 },
  medium: { label:"Medel", color:"#3060A8", bg:"#EBF1FB", dot:"#3060A8", rank:2 },
  low:    { label:"Låg",   color:"#3D7A55", bg:"#EAF4EF", dot:"#3D7A55", rank:3 },
};

const LANES = [
  { id:"ready",    label:"Redo",   short:"Redo",   color:"#3060A8" },
  { id:"progress", label:"Pågår",  short:"Pågår",  color:"#C07830" },
  { id:"done",     label:"Klart",  short:"Klart",  color:"#3D7A55" },
];

const RECUR = [
  {val:"none",     label:"Engång"},
  {val:"daily",    label:"Varje dag"},
  {val:"weekdays", label:"Vardagar"},
  {val:"weekly",   label:"Varje vecka"},
  {val:"monthly",  label:"Varje månad"},
];

const TAG_C = {
  Hem:"#5C4E3C",Mat:"#9A5F22",Skola:"#6B48A8",Sport:"#3D7A55",
  Hälsa:"#A83060",Jobb:"#3060A8",Fritid:"#C04040",Övrigt:"#7A7060",
};

/* ─── DEMO DATA ─────────────────────────────────────────────── */
const DEMO_MEMBERS = [
  {id:1,name:"Anna",  av:"A", color:"#C07830"},
  {id:2,name:"Johan", av:"J", color:"#3060A8"},
  {id:3,name:"Ella",  av:"E", color:"#6B48A8"},
  {id:4,name:"Max",   av:"M", color:"#3D7A55"},
];

let _id = 200;
const mk = (o) => ({id:_id++, title:"", desc:"", tags:[], mids:[], prio:"medium", lane:"ready", recur:"none", hideGuest:false, done:false, ...o});

const DEMO_TASKS = [
  mk({title:"Boka läkartid Max",        prio:"urgent", lane:"progress", tags:["Hälsa"],  mids:[1],   desc:"Ringa vårdcentralen"}),
  mk({title:"Betala räkningar",          prio:"high",   lane:"progress", tags:["Jobb"],   mids:[2],   recur:"monthly"}),
  mk({title:"Handla mat inför veckan",   prio:"high",   lane:"ready",    tags:["Mat"],    mids:[1,2], recur:"weekly"}),
  mk({title:"Gå ut med hunden",          prio:"urgent", lane:"progress", tags:["Hälsa"],  mids:[2],   recur:"daily", desc:"Morgon och kväll"}),
  mk({title:"Planera helgens aktivitet", prio:"medium", lane:"ready",    tags:["Fritid"], mids:[]}),
  mk({title:"Tvätt & vikning",           prio:"medium", lane:"ready",    tags:["Hem"],    mids:[1],   recur:"weekly"}),
  mk({title:"Fotbollsträning (Ella)",    prio:"low",    lane:"done",     tags:["Sport"],  mids:[3],   recur:"weekly"}),
  mk({title:"Diskmaskinen",              prio:"low",    lane:"done",     tags:["Hem"],    mids:[],    recur:"daily"}),
  mk({title:"Läxhjälp matematik",        prio:"high",   lane:"ready",    tags:["Skola"],  mids:[3,4]}),
  mk({title:"Semester-planering",        prio:"low",    lane:"ready",    tags:["Fritid"], mids:[1,2], desc:"Boka sommarresa till Italien"}),
];

/* ─── HELPERS ───────────────────────────────────────────────── */
function useClock(){
  const [now,setNow]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);
  return now;
}

function useSwipe(onLeft, onRight){
  const startX=useRef(null);
  return {
    onTouchStart:e=>startX.current=e.touches[0].clientX,
    onTouchEnd:e=>{
      if(startX.current===null)return;
      const dx=e.changedTouches[0].clientX-startX.current;
      if(Math.abs(dx)>50){ dx<0?onLeft():onRight(); }
      startX.current=null;
    }
  };
}

function byPrio(a,b){ return (P[a.prio]?.rank??9)-(P[b.prio]?.rank??9); }

function getGreeting(h){
  if(h<5)  return "God natt";
  if(h<10) return "God morgon";
  if(h<13) return "God förmiddag";
  if(h<18) return "God eftermiddag";
  return "God kväll";
}

/* ─── BOTTOM NAV ────────────────────────────────────────────── */
const NAV_TABS = [
  {id:"home",    icon:"⌂",  label:"Hem"},
  {id:"tasks",   icon:"▦",  label:"Tavlan"},
  {id:"quick",   icon:"+",  label:"Lägg till", special:true},
  {id:"plan",    icon:"≡",  label:"Plan"},
  {id:"profile", icon:"◉",  label:"Profil"},
];

function BottomNav({active, setActive}){
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:C.surface,borderTop:`1px solid ${C.border}`,paddingBottom:"env(safe-area-inset-bottom,8px)",display:"flex",alignItems:"center",justifyContent:"space-around",padding:"6px 0 calc(6px + env(safe-area-inset-bottom,0px))"}}>
      {NAV_TABS.map(tab=>{
        if(tab.special) return (
          <button key={tab.id} onClick={()=>setActive(tab.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",border:"none",background:"none",cursor:"pointer",padding:"0 8px"}}>
            <div style={{width:46,height:46,borderRadius:16,background:`linear-gradient(135deg,${C.amber},${C.amberDark})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 14px ${C.amber}66`,fontSize:22,color:"#fff",fontWeight:300,marginBottom:-2,marginTop:-8}}>+</div>
          </button>
        );
        const isActive=active===tab.id;
        return (
          <button key={tab.id} onClick={()=>setActive(tab.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,border:"none",background:"none",cursor:"pointer",padding:"4px 12px",borderRadius:12,transition:"all .15s"}}>
            <span style={{fontSize:18,color:isActive?C.amber:C.textDim,transition:"color .15s",fontFamily:"serif"}}>{tab.icon}</span>
            <span style={{fontSize:9,fontWeight:isActive?700:400,color:isActive?C.amber:C.textDim,letterSpacing:.3,fontFamily:"'DM Sans',sans-serif"}}>{tab.label}</span>
            {isActive&&<div style={{width:16,height:2.5,borderRadius:2,background:C.amber,marginTop:-1}}/>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── PRIORITY BADGE ────────────────────────────────────────── */
function PBadge({prio,small}){
  const m=P[prio]||P.medium;
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:small?"1px 6px":"2px 8px",borderRadius:999,background:m.bg,fontSize:small?9:10,fontWeight:700,color:m.color,fontFamily:"'DM Sans',sans-serif",letterSpacing:.2}}>
    <span style={{width:5,height:5,borderRadius:"50%",background:m.dot,display:"inline-block",flexShrink:0}}/>
    {m.label}
  </span>;
}

/* ─── TASK CARD ─────────────────────────────────────────────── */
function TaskCard({task, members, onComplete, onMove, onEdit, style={}, compact}){
  const [expanded,setExpanded]=useState(false);
  const [swiping,setSwiping]=useState(null); // null | "left" | "right"
  const swipe=useSwipe(
    ()=>setSwiping("left"),
    ()=>setSwiping("right")
  );
  const mems=members.filter(m=>task.mids.includes(m.id));
  const lane=LANES.find(l=>l.id===task.lane)||LANES[0];
  const pm=P[task.prio]||P.medium;
  const recurLabel=RECUR.find(r=>r.val===task.recur)?.label;

  const handleSwipeAction=()=>{
    if(swiping==="left") onComplete(task.id);
    if(swiping==="right"){
      // move to next lane
      const li=LANES.findIndex(l=>l.id===task.lane);
      if(li<LANES.length-1) onMove(task.id,LANES[li+1].id);
    }
    setSwiping(null);
  };

  return (
    <div
      {...swipe}
      style={{
        position:"relative",overflow:"hidden",borderRadius:16,marginBottom:10,
        boxShadow:expanded?C.shadowMd:C.shadow,
        transition:"transform .2s, box-shadow .2s",
        transform:swiping==="left"?"translateX(-8px)":swiping==="right"?"translateX(8px)":"none",
        ...style,
      }}
    >
      {/* Swipe hint strip */}
      {swiping&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:swiping==="left"?"flex-end":"flex-start",padding:"0 16px",background:swiping==="left"?C.greenBg:C.blueBg,borderRadius:16,zIndex:0}}>
        <span style={{fontSize:20}}>{swiping==="left"?"✓":"→"}</span>
      </div>}

      <div onTouchEnd={swiping?handleSwipeAction:undefined} style={{position:"relative",zIndex:1,background:C.card,borderRadius:16,border:`1px solid ${C.border}`}}>
        {/* Priority left bar */}
        <div style={{position:"absolute",left:0,top:12,bottom:12,width:3,borderRadius:2,background:pm.color,margin:"0 0 0 0"}}/>

        <div style={{padding:compact?"12px 14px 12px 16px":"14px 14px 14px 16px"}} onClick={()=>!compact&&setExpanded(e=>!e)}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            {/* Checkbox */}
            <button onClick={e=>{e.stopPropagation();onComplete(task.id);}} style={{width:22,height:22,borderRadius:7,border:`2px solid ${task.lane==="done"?C.green:C.border}`,background:task.lane==="done"?C.greenBg:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
              {task.lane==="done"&&<span style={{color:C.green,fontSize:11,fontWeight:700}}>✓</span>}
            </button>

            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:compact?13:14,fontWeight:600,color:task.lane==="done"?C.textDim:C.text,fontFamily:"'DM Sans',sans-serif",lineHeight:1.35,textDecoration:task.lane==="done"?"line-through":"none",marginBottom:5}}>{task.title}</p>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                <PBadge prio={task.prio} small/>
                {task.lane!=="done"&&<span style={{fontSize:9,padding:"1px 7px",borderRadius:999,border:`1px solid ${lane.color}44`,color:lane.color,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{lane.short}</span>}
                {task.recur!=="none"&&<span style={{fontSize:9,padding:"1px 7px",borderRadius:999,background:C.blueBg,color:C.blue,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>🔁</span>}
                {task.tags.slice(0,2).map(t=><span key={t} style={{fontSize:9,padding:"1px 7px",borderRadius:999,background:C.bg,color:TAG_C[t]||C.textDim,fontWeight:600,fontFamily:"'DM Sans',sans-serif",border:`1px solid ${C.border}`}}>{t}</span>)}
              </div>
            </div>

            {/* Avatars */}
            <div style={{display:"flex",flexShrink:0}}>
              {mems.slice(0,2).map((m,i)=>(
                <div key={m.id} style={{width:24,height:24,borderRadius:"50%",background:m.color+"22",border:`2px solid ${C.surface}`,outline:`1.5px solid ${m.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:m.color,fontWeight:700,marginLeft:i>0?-7:0,fontFamily:"'DM Sans',sans-serif"}}>{m.av}</div>
              ))}
            </div>

            {!compact&&<span style={{fontSize:12,color:C.textDim,transform:expanded?"rotate(0)":"rotate(-90deg)",transition:"transform .2s",flexShrink:0,marginTop:2}}>▾</span>}
          </div>

          {/* Expanded detail */}
          {expanded&&!compact&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
            {task.desc&&<p style={{fontSize:12,color:C.textMid,lineHeight:1.6,marginBottom:10,fontFamily:"'DM Sans',sans-serif"}}>{task.desc}</p>}
            {task.recur!=="none"&&<p style={{fontSize:11,color:C.blue,marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>🔁 {RECUR.find(r=>r.val===task.recur)?.label}</p>}
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {LANES.filter(l=>l.id!==task.lane).map(l=>(
                <button key={l.id} onClick={e=>{e.stopPropagation();onMove(task.id,l.id);}} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${l.color}44`,background:`${l.color}0f`,color:l.color,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                  → {l.label}
                </button>
              ))}
              <button onClick={e=>{e.stopPropagation();onEdit(task);}} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:C.bg,color:C.textMid,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                ✏️ Redigera
              </button>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}

/* ─── HOME SCREEN ───────────────────────────────────────────── */
function HomeScreen({tasks,setTasks,members}){
  const now=useClock();
  const h=now.getHours();
  const name=members[0]?.name||"";

  const inProgress=[...tasks.filter(t=>t.lane==="progress")].sort(byPrio);
  const urgent=tasks.filter(t=>t.prio==="urgent"&&t.lane!=="done");
  const todayDone=tasks.filter(t=>t.lane==="done").length;
  const total=tasks.length;

  const complete=id=>setTasks(p=>p.map(t=>t.id===id?{...t,lane:"done"}:t));
  const move=(id,lane)=>setTasks(p=>p.map(t=>t.id===id?{...t,lane}:t));

  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
      {/* Hero header */}
      <div style={{padding:"24px 20px 20px",background:`linear-gradient(160deg,${C.amber}18,${C.bg})`,borderBottom:`1px solid ${C.border}`}}>
        <p style={{fontSize:12,color:C.amber,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",marginBottom:4}}>
          {now.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"})}
        </p>
        <h1 style={{fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:700,color:C.text,lineHeight:1.1,marginBottom:16}}>
          {getGreeting(h)}{name?`,`:"!"}<br/>
          {name&&<span style={{color:C.amber}}>{name}! 👋</span>}
        </h1>

        {/* Progress ring + stats */}
        <div style={{display:"flex",gap:10}}>
          {/* Progress bar card */}
          <div style={{flex:1,background:C.surface,borderRadius:16,padding:"14px 16px",boxShadow:C.shadow,border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:12,color:C.textMid,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Dagens framsteg</span>
              <span style={{fontSize:14,fontWeight:700,color:C.amber,fontFamily:"'DM Sans',sans-serif"}}>{Math.round(todayDone/Math.max(total,1)*100)}%</span>
            </div>
            <div style={{height:8,background:C.amberMid,borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",background:`linear-gradient(90deg,${C.amber},${C.amberDark})`,borderRadius:4,width:`${Math.round(todayDone/Math.max(total,1)*100)}%`,transition:"width .5s"}}/>
            </div>
            <p style={{fontSize:11,color:C.textDim,marginTop:6,fontFamily:"'DM Sans',sans-serif"}}>{todayDone} av {total} uppgifter klara</p>
          </div>
          {/* Urgent count */}
          {urgent.length>0&&<div style={{width:80,background:C.redBg,borderRadius:16,padding:"14px 10px",boxShadow:C.shadow,border:`1px solid ${C.red}33`,textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:700,color:C.red,fontFamily:"'DM Sans',sans-serif",lineHeight:1}}>{urgent.length}</div>
            <div style={{fontSize:10,color:C.red,fontWeight:700,marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>Akuta</div>
          </div>}
        </div>
      </div>

      {/* IN PROGRESS — sorted by priority */}
      <div style={{padding:"20px 16px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:C.amber,boxShadow:`0 0 8px ${C.amber}`}}/>
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:17,fontWeight:700,color:C.text}}>Pågår just nu</h2>
          </div>
          <span style={{fontSize:12,color:C.amber,fontWeight:700,fontFamily:"'DM Sans',sans-serif",background:C.amberBg,padding:"2px 10px",borderRadius:999}}>{inProgress.length}</span>
        </div>

        {inProgress.length===0&&(
          <div style={{textAlign:"center",padding:"32px 16px",background:C.surface,borderRadius:20,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:36,marginBottom:8}}>🎉</div>
            <p style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:600,color:C.text}}>Inget pågår just nu!</p>
            <p style={{fontSize:12,color:C.textDim,marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>Välj uppgifter från "Redo" att starta</p>
          </div>
        )}

        {inProgress.map(task=>(
          <TaskCard key={task.id} task={task} members={members} onComplete={complete} onMove={move} onEdit={()=>{}}/>
        ))}

        {/* READY — high priority only */}
        {(() => {
          const readyHigh=tasks.filter(t=>t.lane==="ready"&&(t.prio==="urgent"||t.prio==="high")).sort(byPrio);
          if(readyHigh.length===0)return null;
          return <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"20px 0 12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:C.blue}}/>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:17,fontWeight:700,color:C.text}}>Hög prioritet — redo</h2>
              </div>
              <span style={{fontSize:12,color:C.blue,fontWeight:700,fontFamily:"'DM Sans',sans-serif",background:C.blueBg,padding:"2px 10px",borderRadius:999}}>{readyHigh.length}</span>
            </div>
            {readyHigh.map(task=>(
              <TaskCard key={task.id} task={task} members={members} onComplete={complete} onMove={move} onEdit={()=>{}} compact/>
            ))}
          </>;
        })()}

        {/* Done today */}
        {todayDone>0&&<div style={{margin:"20px 0 12px",display:"flex",alignItems:"center",gap:8}}>
          <div style={{height:1,flex:1,background:C.border}}/>
          <span style={{fontSize:11,color:C.textDim,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>✓ {todayDone} klara idag</span>
          <div style={{height:1,flex:1,background:C.border}}/>
        </div>}
        {tasks.filter(t=>t.lane==="done").map(task=>(
          <TaskCard key={task.id} task={task} members={members} onComplete={()=>{}} onMove={move} onEdit={()=>{}} compact/>
        ))}
      </div>
    </div>
  );
}

/* ─── KANBAN SCREEN ─────────────────────────────────────────── */
function KanbanScreen({tasks,setTasks,members}){
  const [active,setActive]=useState("progress");
  const [filterMid,setFilterMid]=useState("all");
  const swipe=useSwipe(
    ()=>{const i=LANES.findIndex(l=>l.id===active);if(i<LANES.length-1)setActive(LANES[i+1].id);},
    ()=>{const i=LANES.findIndex(l=>l.id===active);if(i>0)setActive(LANES[i-1].id);}
  );

  const complete=id=>setTasks(p=>p.map(t=>t.id===id?{...t,lane:"done"}:t));
  const move=(id,lane)=>setTasks(p=>p.map(t=>t.id===id?{...t,lane}:t));

  const filtered=tasks
    .filter(t=>t.lane===active&&(filterMid==="all"||t.mids.includes(filterMid)))
    .sort(byPrio);

  const lane=LANES.find(l=>l.id===active);

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Lane selector tabs */}
      <div style={{padding:"12px 16px 0",background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{display:"flex",gap:4,marginBottom:12}}>
          {LANES.map(l=>{
            const count=tasks.filter(t=>t.lane===l.id).length;
            const isActive=active===l.id;
            return <button key={l.id} onClick={()=>setActive(l.id)} style={{flex:1,padding:"8px 4px",borderRadius:12,border:`2px solid ${isActive?l.color:C.border}`,background:isActive?`${l.color}14`:C.bg,cursor:"pointer",transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{fontSize:13,fontWeight:700,color:isActive?l.color:C.textDim}}>{l.short}</div>
              <div style={{fontSize:16,fontWeight:700,color:isActive?l.color:C.textDim,fontFamily:"'DM Sans',sans-serif"}}>{count}</div>
            </button>;
          })}
        </div>
        {/* Member filter */}
        <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:10}}>
          <button onClick={()=>setFilterMid("all")} style={{flexShrink:0,padding:"4px 12px",borderRadius:999,border:`1px solid ${filterMid==="all"?C.amber:C.border}`,background:filterMid==="all"?C.amberBg:C.bg,color:filterMid==="all"?C.amber:C.textDim,fontSize:11,fontWeight:filterMid==="all"?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Alla</button>
          {members.map(m=>(
            <button key={m.id} onClick={()=>setFilterMid(filterMid===m.id?"all":m.id)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:999,border:`1.5px solid ${filterMid===m.id?m.color:C.border}`,background:filterMid===m.id?m.color+"18":C.bg,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>{m.av}</div>
              <span style={{fontSize:11,color:filterMid===m.id?m.color:C.textDim,fontWeight:filterMid===m.id?700:500}}>{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task list with swipe hint */}
      <div {...swipe} style={{flex:1,overflowY:"auto",padding:"14px 16px",paddingBottom:90}}>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"48px 16px"}}>
          <div style={{fontSize:40,marginBottom:10}}>📭</div>
          <p style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:600,color:C.text,marginBottom:4}}>Inga uppgifter här</p>
          <p style={{fontSize:12,color:C.textDim,fontFamily:"'DM Sans',sans-serif"}}>Svep åt sidan för att byta lane</p>
        </div>}
        {filtered.map(task=>(
          <TaskCard key={task.id} task={task} members={members} onComplete={complete} onMove={move} onEdit={()=>{}}/>
        ))}
        <p style={{textAlign:"center",fontSize:11,color:C.textDim,marginTop:8,fontFamily:"'DM Sans',sans-serif"}}>← Svep för att byta kolumn →</p>
      </div>
    </div>
  );
}

/* ─── QUICK ADD SCREEN ──────────────────────────────────────── */
function QuickAdd({members,onSave,onClose}){
  const [title,setTitle]=useState("");
  const [prio,setPrio]=useState("medium");
  const [lane,setLane]=useState("ready");
  const [recur,setRecur]=useState("none");
  const [mids,setMids]=useState([]);
  const [tags,setTags]=useState([]);
  const [step,setStep]=useState(0); // 0=basic, 1=details
  const inputRef=useRef(null);
  useEffect(()=>{setTimeout(()=>inputRef.current?.focus(),100);},[]);

  const toggleMid=id=>setMids(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleTag=t=>setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...t,t]);

  const save=()=>{
    if(!title.trim())return;
    onSave({title,prio,lane,recur,mids,tags,desc:"",hideGuest:false});
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"20px 20px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h2 style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,color:C.text}}>Ny uppgift</h2>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",border:`1px solid ${C.border}`,background:C.bg,cursor:"pointer",fontSize:16,color:C.textDim,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        <input ref={inputRef} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Vad ska göras?"
          style={{width:"100%",padding:"14px 16px",borderRadius:14,border:`2px solid ${title?C.amber:C.border}`,background:C.surface,color:C.text,fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:16,transition:"border .2s",boxSizing:"border-box"}}/>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 20px 20px"}}>
        {/* Priority */}
        <p style={{fontSize:11,color:C.textDim,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>Prioritet</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
          {Object.entries(P).map(([k,v])=>(
            <button key={k} onClick={()=>setPrio(k)} style={{padding:"10px 8px",borderRadius:12,border:`2px solid ${prio===k?v.color:C.border}`,background:prio===k?v.bg:C.surface,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:v.dot,flexShrink:0}}/>
              <span style={{fontSize:13,fontWeight:prio===k?700:500,color:prio===k?v.color:C.textMid}}>{v.label}</span>
            </button>
          ))}
        </div>

        {/* Lane */}
        <p style={{fontSize:11,color:C.textDim,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>Swimlane</p>
        <div style={{display:"flex",gap:6,marginBottom:18}}>
          {LANES.map(l=>(
            <button key={l.id} onClick={()=>setLane(l.id)} style={{flex:1,padding:"9px 4px",borderRadius:12,border:`2px solid ${lane===l.id?l.color:C.border}`,background:lane===l.id?`${l.color}14`:C.surface,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
              <span style={{fontSize:12,fontWeight:lane===l.id?700:500,color:lane===l.id?l.color:C.textMid}}>{l.label}</span>
            </button>
          ))}
        </div>

        {/* Recurring */}
        <p style={{fontSize:11,color:C.textDim,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>Återkommer</p>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:18}}>
          {RECUR.map(r=>(
            <button key={r.val} onClick={()=>setRecur(r.val)} style={{padding:"7px 12px",borderRadius:20,border:`1.5px solid ${recur===r.val?C.amber:C.border}`,background:recur===r.val?C.amberBg:C.surface,color:recur===r.val?C.amber:C.textDim,fontSize:12,fontWeight:recur===r.val?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
              {r.val!=="none"&&"🔁 "}{r.label}
            </button>
          ))}
        </div>

        {/* Members */}
        {members.length>0&&<>
          <p style={{fontSize:11,color:C.textDim,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>Ansvarig</p>
          <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
            {members.map(m=>{
              const sel=mids.includes(m.id);
              return <button key={m.id} onClick={()=>toggleMid(m.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:999,border:`2px solid ${sel?m.color:C.border}`,background:sel?m.color+"18":C.surface,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700}}>{m.av}</div>
                <span style={{fontSize:13,fontWeight:sel?700:500,color:sel?m.color:C.textMid}}>{m.name}</span>
              </button>;
            })}
          </div>
        </>}

        {/* Tags */}
        <p style={{fontSize:11,color:C.textDim,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>Taggar</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:24}}>
          {Object.keys(TAG_C).map(t=>{
            const sel=tags.includes(t);
            return <button key={t} onClick={()=>toggleTag(t)} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${sel?TAG_C[t]:C.border}`,background:sel?TAG_C[t]+"18":C.surface,color:sel?TAG_C[t]:C.textDim,fontSize:12,fontWeight:sel?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>{t}</button>;
          })}
        </div>

        {/* Save */}
        <button onClick={save} disabled={!title.trim()} style={{width:"100%",padding:"15px",borderRadius:16,border:"none",background:title.trim()?`linear-gradient(135deg,${C.amber},${C.amberDark})`:"#E0D5C8",color:"#fff",fontWeight:700,fontSize:16,cursor:title.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif",boxShadow:title.trim()?`0 6px 20px ${C.amber}44`:"none",transition:"all .2s",marginBottom:8}}>
          Spara uppgift
        </button>
      </div>
    </div>
  );
}

/* ─── PLANNING SCREEN ───────────────────────────────────────── */
function PlanningScreen({tasks,setTasks,members}){
  const sorted=[...tasks].sort((a,b)=>{
    if(a.lane!==b.lane){
      const lOrder={ready:0,progress:1,done:2};
      return (lOrder[a.lane]||0)-(lOrder[b.lane]||0);
    }
    return byPrio(a,b);
  });

  const move=(id,lane)=>setTasks(p=>p.map(t=>t.id===id?{...t,lane}:t));
  const del=id=>setTasks(p=>p.filter(t=>t.id!==id));

  // Group by prio
  const groups=[
    {label:"🔴 Akuta",  tasks:sorted.filter(t=>t.prio==="urgent"&&t.lane!=="done")},
    {label:"🟠 Hög",    tasks:sorted.filter(t=>t.prio==="high"&&t.lane!=="done")},
    {label:"🔵 Medel",  tasks:sorted.filter(t=>t.prio==="medium"&&t.lane!=="done")},
    {label:"🟢 Låg",    tasks:sorted.filter(t=>t.prio==="low"&&t.lane!=="done")},
  ].filter(g=>g.tasks.length>0);

  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"20px 16px 0"}}>
        <h2 style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,color:C.text,marginBottom:4}}>Planering</h2>
        <p style={{fontSize:12,color:C.textDim,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>Alla uppgifter sorterade efter prioritet</p>

        {/* Summary row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:22}}>
          {LANES.map(l=>{
            const c=tasks.filter(t=>t.lane===l.id).length;
            return <div key={l.id} style={{background:C.surface,borderRadius:14,padding:"12px",textAlign:"center",border:`1px solid ${C.border}`,boxShadow:C.shadow}}>
              <div style={{fontSize:22,fontWeight:700,color:l.color,fontFamily:"'DM Sans',sans-serif"}}>{c}</div>
              <div style={{fontSize:10,color:C.textDim,fontWeight:600,marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>{l.label}</div>
            </div>;
          })}
        </div>

        {/* Grouped by priority */}
        {groups.map(g=>(
          <div key={g.label} style={{marginBottom:20}}>
            <p style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:10,fontFamily:"'DM Sans',sans-serif",letterSpacing:.3}}>{g.label} <span style={{color:C.textDim,fontWeight:500}}>({g.tasks.length})</span></p>
            {g.tasks.map(task=>(
              <TaskCard key={task.id} task={task} members={members} onComplete={id=>move(id,"done")} onMove={move} onEdit={()=>{}} compact/>
            ))}
          </div>
        ))}

        {tasks.filter(t=>t.lane==="done").length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{height:1,flex:1,background:C.border}}/>
              <p style={{fontSize:12,fontWeight:700,color:C.green,fontFamily:"'DM Sans',sans-serif"}}>✓ Klart ({tasks.filter(t=>t.lane==="done").length})</p>
              <div style={{height:1,flex:1,background:C.border}}/>
            </div>
            {tasks.filter(t=>t.lane==="done").map(task=>(
              <TaskCard key={task.id} task={task} members={members} onComplete={()=>{}} onMove={move} onEdit={()=>{}} compact/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PROFILE SCREEN ────────────────────────────────────────── */
function ProfileScreen({members,family,tasks}){
  const stats=[
    {label:"Totalt",  val:tasks.length,   color:C.amber},
    {label:"Pågår",   val:tasks.filter(t=>t.lane==="progress").length, color:C.blue},
    {label:"Klart",   val:tasks.filter(t=>t.lane==="done").length, color:C.green},
  ];
  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"24px 20px"}}>
        {/* Family header */}
        <div style={{background:`linear-gradient(135deg,${C.amber}22,${C.amberMid}44)`,borderRadius:20,padding:"24px 20px",marginBottom:20,border:`1px solid ${C.amber}33`,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:8}}>🏡</div>
          <h1 style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,color:C.text,marginBottom:4}}>{family?.name||"Familjen"}</h1>
          <p style={{fontSize:13,color:C.textMid,fontFamily:"'DM Sans',sans-serif"}}>{members.length} familjemedlemmar</p>
          <div style={{display:"flex",justifyContent:"center",gap:-8,marginTop:14}}>
            {members.map((m,i)=>(
              <div key={m.id} style={{width:40,height:40,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#fff",fontWeight:700,border:`3px solid ${C.surface}`,marginLeft:i>0?-10:0,boxShadow:C.shadow,fontFamily:"'DM Sans',sans-serif"}}>{m.av}</div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>
          {stats.map(s=>(
            <div key={s.label} style={{background:C.surface,borderRadius:16,padding:"16px 10px",textAlign:"center",boxShadow:C.shadow,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:28,fontWeight:700,color:s.color,fontFamily:"'DM Sans',sans-serif"}}>{s.val}</div>
              <div style={{fontSize:11,color:C.textDim,marginTop:4,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Members */}
        <h3 style={{fontFamily:"'Fraunces',serif",fontSize:17,fontWeight:700,color:C.text,marginBottom:12}}>Familjemedlemmar</h3>
        {members.map(m=>{
          const memberTasks=tasks.filter(t=>t.mids.includes(m.id));
          const done=memberTasks.filter(t=>t.lane==="done").length;
          return <div key={m.id} style={{background:C.surface,borderRadius:16,padding:"14px 16px",marginBottom:10,boxShadow:C.shadow,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:14,background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#fff",fontWeight:700,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>{m.av}</div>
            <div style={{flex:1}}>
              <p style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'DM Sans',sans-serif",marginBottom:4}}>{m.name}</p>
              <div style={{height:5,background:C.amberMid,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",background:m.color,width:`${memberTasks.length?done/memberTasks.length*100:0}%`,borderRadius:3,transition:"width .5s"}}/>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:16,fontWeight:700,color:m.color,fontFamily:"'DM Sans',sans-serif"}}>{done}/{memberTasks.length}</p>
              <p style={{fontSize:10,color:C.textDim,fontFamily:"'DM Sans',sans-serif"}}>klara</p>
            </div>
          </div>;
        })}

        {/* App info */}
        <div style={{marginTop:24,padding:"16px",background:C.amberBg,borderRadius:16,border:`1px solid ${C.amber}33`,textAlign:"center"}}>
          <p style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,color:C.amber,marginBottom:4}}>FamiljePlan Mobile</p>
          <p style={{fontSize:11,color:C.textMid,fontFamily:"'DM Sans',sans-serif"}}>Version 1.0 · För familjen, av familjen</p>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ──────────────────────────────────────────────── */
export default function MobileApp(){
  const [tab,setTab]=useState("home");
  // Delar fp_tasks och fp_family med dashboard-appen (samma localStorage-nycklar)
  const [tasks,setTasks]=useLocalStorage("fp_tasks",[]);
  const [family]=useLocalStorage("fp_family",{name:"Familjen",members:[]});
  const members=family.members||[];
  const [showQuick,setShowQuick]=useState(false);

  const handleTab=(id)=>{
    if(id==="quick"){setShowQuick(true);}
    else {setShowQuick(false);setTab(id);}
  };

  const addTask=(form)=>{
    setTasks(p=>[{id:Date.now(),...form},...p]);
    setShowQuick(false);
    setTab("home");
  };

  const activeTasks=tasks.filter(t=>t.lane==="progress");

  return <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
      body{background:${C.bg};font-family:'DM Sans',sans-serif;color:${C.text};overscroll-behavior:none;}
      ::-webkit-scrollbar{display:none;}
      input{font-family:'DM Sans',sans-serif;}
      button{transition:opacity .1s;} button:active{opacity:.7;}
      input[type=range]{accent-color:${C.amber};}
      @keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
      .screen-enter{animation:slideUp .25s ease;}
    `}</style>

    {/* Phone shell */}
    <div style={{maxWidth:390,margin:"0 auto",height:"100vh",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",background:C.bg}}>

      {/* Status bar sim */}
      <div style={{height:44,background:C.surface,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",color:C.text}}>
          {new Date().toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"})}
        </span>
        <span style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:14,color:C.amber}}>{family.name}</span>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {activeTasks.length>0&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:999,background:C.amberBg,color:C.amber,fontWeight:700}}>{activeTasks.length} pågår</span>}
          <span style={{fontSize:13,color:C.textDim}}>●●●</span>
        </div>
      </div>

      {/* Content */}
      <div className="screen-enter" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {showQuick
          ?<QuickAdd members={members} onSave={addTask} onClose={()=>setShowQuick(false)}/>
          :tab==="home"    ?<HomeScreen    tasks={tasks} setTasks={setTasks} members={members}/>
          :tab==="tasks"   ?<KanbanScreen  tasks={tasks} setTasks={setTasks} members={members}/>
          :tab==="plan"    ?<PlanningScreen tasks={tasks} setTasks={setTasks} members={members}/>
          :tab==="profile" ?<ProfileScreen members={members} family={family} tasks={tasks}/>
          :null
        }
      </div>

      {/* Bottom Nav */}
      {!showQuick&&<BottomNav active={tab} setActive={handleTab}/>}
    </div>
  </>;
}
