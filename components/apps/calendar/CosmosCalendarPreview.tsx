"use client";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
type CalendarEvent={id:string;title:string;start:string;end:string;allDay?:boolean;calendarName?:string;category?:string;source?:string};
const weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const dayKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const eventKey=(iso:string)=>{const d=new Date(iso);return dayKey(d)};
function category(event:CalendarEvent){return event.category==="school"?"school":event.category==="sports"?"sports":/work/i.test(event.calendarName??"")?"work":/cosmic ai/i.test(event.calendarName??"")?"cosmic":"personal"}
const colors:Record<string,string>={personal:"bg-violet-400",school:"bg-sky-400",work:"bg-emerald-400",cosmic:"bg-amber-400",sports:"bg-pink-400"};
export default function CosmosCalendarPreview(){
 const [month,setMonth]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1)});
 const [selected,setSelected]=useState(()=>dayKey(new Date()));
 const [events,setEvents]=useState<CalendarEvent[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [enabled,setEnabled]=useState<string[]>(["personal","school","work","cosmic","sports"]);
 const [warning,setWarning]=useState<string|null>(null);
 const first=new Date(month.getFullYear(),month.getMonth(),1);
 const gridStart=new Date(first);gridStart.setDate(first.getDate()-first.getDay());
 const gridEnd=new Date(gridStart);gridEnd.setDate(gridEnd.getDate()+42);
 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   setLoading(true);setError(null);setWarning(null);
   try{
    const params=new URLSearchParams({start:gridStart.toISOString(),end:gridEnd.toISOString()});
    const response=await fetch("/api/calendar?"+params,{cache:"no-store",signal:controller.signal});
    const data=await response.json() as {events?:CalendarEvent[];error?:string;accountCalendarError?:boolean;sportsCalendarError?:boolean};
    if(!response.ok)throw Error(data.error??"Calendar unavailable");
    setEvents(Array.isArray(data.events)?data.events:[]);
    if(data.accountCalendarError||data.sportsCalendarError)setWarning("One or more calendar sources are temporarily unavailable.");
   }catch(e){if(!controller.signal.aborted){setEvents([]);setError(e instanceof Error?e.message:"Unable to load Calendar");}}
   finally{if(!controller.signal.aborted)setLoading(false)}
  }
  void load();return()=>controller.abort();
 },[month]);
 const visible=useMemo(()=>events.filter(e=>enabled.includes(category(e))),[events,enabled]);
 const byDay=useMemo(()=>{const map=new Map<string,CalendarEvent[]>();for(const event of visible){const start=new Date(event.start),end=new Date(event.end);if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))continue;let day=new Date(start.getFullYear(),start.getMonth(),start.getDate());let count=0;while(day<end&&count++<42){const key=dayKey(day);map.set(key,[...(map.get(key)??[]),event]);day.setDate(day.getDate()+1)}if(count===0){const key=eventKey(event.start);map.set(key,[...(map.get(key)??[]),event])}}return map},[visible]);
 const days=Array.from({length:42},(_,i)=>{const d=new Date(gridStart);d.setDate(gridStart.getDate()+i);return d});
 const chosen=(byDay.get(selected)??[]).slice().sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime());
 function shift(delta:number){setMonth(new Date(month.getFullYear(),month.getMonth()+delta,1))}
 return <section className="min-h-screen space-y-5 pt-16 pb-12 text-white sm:pt-20 lg:pt-24">
  <div className="flex flex-wrap items-center justify-between gap-4">
   <div><p className="text-xs font-semibold uppercase tracking-[.22em] text-violet-300">COSMOS / CALENDAR</p><h1 className="mt-2 text-3xl font-semibold">Calendar</h1><p className="mt-1 text-sm text-white/50">Your time, all in one place</p></div>
   <div className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-3"><CalendarDays className="text-violet-300"/></div>
  </div>
  <div className="rounded-3xl border border-white/10 bg-slate-950/65 p-3 shadow-2xl backdrop-blur-xl sm:p-5">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-3"><button onClick={()=>shift(-1)} aria-label="Previous month" className="rounded-xl border border-white/10 p-2 hover:bg-white/10"><ChevronLeft size={18}/></button><h2 className="min-w-36 text-lg font-semibold">{month.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h2><button onClick={()=>shift(1)} aria-label="Next month" className="rounded-xl border border-white/10 p-2 hover:bg-white/10"><ChevronRight size={18}/></button><button onClick={()=>{const now=new Date();setMonth(new Date(now.getFullYear(),now.getMonth(),1));setSelected(dayKey(now))}} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10">Today</button></div>
    <span className="rounded-lg bg-violet-500/15 px-3 py-2 text-xs text-violet-200">Month preview</span>
   </div>
   <div className="my-4 flex flex-wrap gap-2" aria-label="Calendar categories">
    {Object.entries({personal:"Personal",school:"School",work:"Work",cosmic:"Cosmic AI",sports:"Sports"}).map(([key,label])=><button key={key} aria-pressed={enabled.includes(key)} onClick={()=>setEnabled(prev=>prev.includes(key)?prev.filter(x=>x!==key):[...prev,key])} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${enabled.includes(key)?"border-white/20 bg-white/10":"border-white/10 bg-white/[.02] opacity-40"}`}><span className={`h-2 w-2 rounded-full ${colors[key]}`}/>{label}</button>)}
   </div>
   {warning&&<p className="mb-3 flex items-center gap-2 text-xs text-amber-200"><AlertCircle size={15}/>{warning}</p>}
   {error&&<p role="alert" className="mb-3 rounded-xl border border-red-300/20 bg-red-950/40 p-3 text-sm">{error}</p>}
   <div className="grid grid-cols-7 gap-1">{weekdays.map(d=><div key={d} className="pb-2 text-center text-xs text-white/45">{d}</div>)}
    {days.map(d=>{const key=dayKey(d),items=byDay.get(key)??[],current=key===selected;return <button type="button" key={key} onClick={()=>setSelected(key)} aria-label={d.toDateString()+", "+items.length+" events"} aria-pressed={current} className={`min-h-20 rounded-lg border p-1 text-left align-top sm:min-h-24 sm:p-2 ${current?"border-violet-400/70 bg-violet-500/15":"border-white/10 bg-slate-800/30"} ${d.getMonth()!==month.getMonth()?"opacity-45":""}`}><span className="block text-xs font-medium">{d.getDate()}</span><div className="mt-1 space-y-1">{items.slice(0,2).map((e,i)=><p key={e.id+"-"+i} className="flex items-center gap-1 truncate rounded bg-white/5 px-1 py-0.5 text-[9px] text-white/80"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors[category(e)]}`}/><span className="truncate">{e.title}</span></p>)}{items.length>2&&<p className="text-[10px] text-white/45">+{items.length-2} more</p>}</div></button>})}
   </div>
  </div>
  <div className="rounded-3xl border border-white/10 bg-slate-950/65 p-4 sm:p-5">
   <h3 className="text-lg font-semibold">{new Date(selected+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</h3>
   <p className="mt-1 text-xs text-white/45">Selected day · {chosen.length} events</p>
   <div className="mt-4 space-y-2">{loading?<p className="text-sm text-white/50">Loading events…</p>:chosen.length?chosen.map((e,i)=><article key={e.id+"-"+i} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3"><span className={`w-1 shrink-0 rounded-full ${colors[category(e)]}`}/><div className="min-w-0"><p className="text-sm font-medium">{e.title}</p><p className="text-xs text-white/50">{e.allDay?"All day":new Date(e.start).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}{e.calendarName?" · "+e.calendarName:""}</p></div></article>):<p className="text-sm text-white/45">No matching events on this day.</p>}</div>
  </div>
 </section>
}
