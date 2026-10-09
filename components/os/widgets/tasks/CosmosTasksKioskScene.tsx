"use client";

import { Check, Circle, Clock3, GraduationCap, BriefcaseBusiness, UserRound, FolderKanban, Play, Plus, ChevronRight } from "lucide-react";
import { useClockTick } from "@/hooks/os/useClock";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";
import useWeather from "@/hooks/os/useWeather";

type Task={id:string;title:string;subtitle?:string;due?:Date;category:"school"|"project"|"personal"|"work";priority?:string;completed?:boolean};

export default function CosmosTasksKioskScene(){
 const now=useClockTick(1000); const kiosk=useDeveloperKioskData(); const weather=useWeather();
 const school:Task[]=(kiosk.data?.school.assignments??[]).map(x=>({id:x.id,title:x.title,subtitle:x.course,due:new Date(x.due),category:"school"}));
 const projects:Task[]=(kiosk.data?.projects.openTasks??[]).map(x=>({id:x.id,title:x.title,subtitle:x.projectTitle,due:x.dueDate?new Date(x.dueDate+"T12:00:00"):undefined,category:"project",priority:x.priority}));
 const tasks=[...school,...projects].sort((a,b)=>(a.due?.getTime()??9e15)-(b.due?.getTime()??9e15));
 const d=now?new Date(now):new Date(); const today=tasks.filter(x=>x.due&&sameDay(x.due,d)).slice(0,5); const upcoming=tasks.filter(x=>!x.due||x.due>d&&!sameDay(x.due,d)).slice(0,5);
 const counts={school:school.length,project:projects.length,personal:0,work:0}; const total=tasks.length;
 return <section data-kiosk-rebuild="tasks" className="relative h-full w-full overflow-hidden bg-[#070b17] text-white" style={{height:"100dvh",maxHeight:"100dvh"}}>
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(249,115,22,.22),transparent_28%),radial-gradient(circle_at_73%_20%,rgba(59,130,246,.28),transparent_32%),radial-gradient(circle_at_72%_78%,rgba(124,58,237,.24),transparent_35%),linear-gradient(135deg,#090b12,#0a1830_45%,#140b24)]"/>
  <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(90deg,transparent_49%,rgba(255,255,255,.025)_50%,transparent_51%),linear-gradient(0deg,transparent_49%,rgba(255,255,255,.018)_50%,transparent_51%)] [background-size:90px_90px]"/>
  <div className="relative z-10 flex h-full min-h-0 flex-col px-[3.3vw] py-[2.2vh]">
   <header className="flex h-[15vh] shrink-0 items-start justify-between">
    <div><h1 className="text-[clamp(2.2rem,4.5vw,4.8rem)] font-light tracking-[.22em]">COSMOS</h1><p className="mt-1 text-center text-[clamp(.8rem,1.35vw,1.3rem)] tracking-[.55em] text-white/55">TASKS</p></div>
    <div className="flex items-start gap-[2vw] text-right"><div><p className="text-sm text-white/75">{fmtDate(d)}</p><p className="text-[clamp(2rem,4vw,4rem)] font-light leading-tight">{fmtTime(d)}</p></div><div className="border-l border-white/15 pl-[2vw]"><p className="text-[clamp(1.4rem,2.2vw,2.4rem)] font-semibold">{weather.weather?.temp!==undefined?Math.round(weather.weather.temp)+"°":"—"}</p><p className="text-sm text-white/75">{weather.weather?.condition??"Weather"}</p><p className="mt-1 text-xs text-white/45">{kiosk.data?.location?.label??weather.weather?.city??""}</p></div></div>
   </header>
   <div className="grid min-h-0 flex-1 grid-cols-[1.12fr_.92fr_1fr] grid-rows-[minmax(0,1fr)_minmax(0,22vh)] gap-[1.2vw]">
    <Glass title="TODAY" badge={today.length+" TASK"+(today.length===1?"":"S")} className="row-span-1">{today.length?today.map((t,i)=><TaskRow key={t.id} task={t} color={i<2?"blue":"slate"}/>):<Empty text={kiosk.loading?"Loading today…":"Nothing due today"}/>}</Glass>
    <Glass title="UPCOMING" badge="Next 7 Days">{upcoming.length?upcoming.map((t,i)=><Upcoming key={t.id} task={t} index={i}/>):<Empty text={kiosk.loading?"Loading tasks…":"No upcoming tasks"}/>}</Glass>
    <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,.42fr)] gap-[1.2vw]">
      <Glass title="TASK STATS" badge="This Week"><div className="flex h-full items-center gap-[2vw]"><Ring total={total}/><div className="space-y-2 text-sm"><Stat dot="bg-sky-400" label="Open" value={total}/><Stat dot="bg-blue-500" label="School" value={counts.school}/><Stat dot="bg-violet-500" label="Projects" value={counts.project}/><Stat dot="bg-orange-400" label="Work" value={counts.work}/></div></div></Glass>
      <Glass title="FOCUS"><div className="flex h-full items-center justify-between"><p className="text-sm text-white/55">No active focus session</p><button className="flex items-center gap-2 rounded-full border border-sky-400/70 bg-sky-400/5 px-5 py-2 text-sm"><Play className="h-4 w-4"/> Start Focus</button></div></Glass>
    </div>
    <Glass title="QUICK ADD" className="col-span-1 h-full min-h-0"><div className="flex h-full flex-col justify-center"><div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/[.04] px-4 py-3 text-white/45"><Plus className="h-5 w-5"/><span className="flex-1">Add a new task…</span><span className="rounded-full border border-white/20 p-2"><ChevronRight className="h-4 w-4"/></span></div><div className="mt-2 flex gap-2"><Chip label="School"/><Chip label="Projects"/><Chip label="Personal"/><Chip label="Work"/></div></div></Glass>
    <Glass title="CATEGORIES" className="col-span-2 h-full min-h-0"><div className="grid h-[calc(100%-2.4rem)] min-h-0 grid-cols-4 gap-3 overflow-hidden"><Category icon={<GraduationCap/>} label="School" count={counts.school}/><Category icon={<FolderKanban/>} label="Projects" count={counts.project}/><Category icon={<UserRound/>} label="Personal" count={counts.personal}/><Category icon={<BriefcaseBusiness/>} label="Work" count={counts.work}/></div></Glass>
   </div>
  </div>
 </section>
}
function Glass({title,badge,children,className=""}:{title:string;badge?:string;children:React.ReactNode;className?:string}){return <article className={"min-h-0 overflow-hidden rounded-[1.35vw] border border-white/15 bg-[linear-gradient(135deg,rgba(9,18,35,.84),rgba(7,12,25,.72))] p-[clamp(.65rem,1.15vw,1.15rem)] shadow-[inset_0_1px_0_rgba(255,255,255,.1),0_14px_35px_rgba(0,0,0,.28)] backdrop-blur-2xl "+className}><div className="mb-[1vh] flex items-center justify-between border-b border-white/10 pb-[1vh]"><h2 className="text-[clamp(.65rem,1vw,1rem)] tracking-[.28em]">{title}</h2>{badge?<span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs text-white/65">{badge}</span>:null}</div>{children}</article>}
function TaskRow({task,color}:{task:Task;color:string}){return <div className="flex items-center gap-4 border-b border-white/10 py-[.72vh] last:border-0"><span className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-full border "+(color==="blue"?"border-sky-400 bg-sky-400 text-slate-950":"border-white/55")} >{task.completed?<Check className="h-4 w-4"/>:null}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.title}</p>{task.subtitle?<p className="truncate text-xs text-white/45">{task.subtitle}</p>:null}</div><span className="text-xs text-white/55">{task.due?task.due.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}</span></div>}
function Upcoming({task,index}:{task:Task;index:number}){const c=["bg-red-500","bg-blue-500","bg-emerald-500","bg-violet-500","bg-sky-400"][index%5];return <div className="flex items-center gap-3 border-b border-white/10 py-[.62vh] last:border-0"><span className={"h-8 w-1.5 rounded-full "+c}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.title}</p><p className="truncate text-xs text-white/45">{task.subtitle??task.category}</p></div><span className="text-xs text-white/65">{task.due?task.due.toLocaleDateString([],{month:"short",day:"numeric"}):"Later"}</span></div>}
function Ring({total}:{total:number}){return <div className="relative flex h-[10vw] w-[10vw] max-h-[130px] max-w-[130px] items-center justify-center rounded-full bg-[conic-gradient(#38bdf8_0_68%,rgba(255,255,255,.16)_68%)] p-[11px]"><div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#0a1425]"><span className="text-3xl">{total}</span><span className="text-[10px] text-white/50">open tasks</span></div></div>}
function Stat({dot,label,value}:{dot:string;label:string;value:number}){return <div className="flex min-w-[9vw] items-center gap-2"><span className={"h-2.5 w-2.5 rounded-full "+dot}/><span className="flex-1 text-white/65">{label}</span><span>{value}</span></div>}
function Category({icon,label,count}:{icon:React.ReactNode;label:string;count:number}){return <div className="flex min-h-0 flex-col justify-center rounded-xl border border-white/10 bg-white/[.035] px-4 py-2"><div className="h-5 w-5 shrink-0 text-sky-400">{icon}</div><p className="mt-1 text-sm">{label}</p><p className="text-xs text-white/45">{count} task{count===1?"":"s"}</p><div className="mt-1.5 h-1.5 rounded-full bg-white/10"><div className="h-full w-1/3 rounded-full bg-sky-400"/></div></div>}
function Chip({label}:{label:string}){return <span className="rounded-full border border-sky-400/30 bg-sky-400/5 px-3 py-1 text-xs text-white/65">{label}</span>}
function Empty({text}:{text:string}){return <div className="flex h-[75%] items-center justify-center text-sm text-white/35">{text}</div>}
function sameDay(a:Date,b:Date){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function fmtDate(d:Date){return d.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric",year:"numeric"})}
function fmtTime(d:Date){return d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}
