"use client";

import { BookOpen, FlaskConical, GraduationCap, MapPin, Settings2, Star, Users } from "lucide-react";
import { useClockTick } from "@/hooks/os/useClock";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";

type SchoolClass = { id: string; name: string; start: string; end: string; location?: string; instructor?: string };
type Assignment = { id: string; title: string; due: string; course?: string; completed: boolean };

export default function SchoolCalendarKioskWidget() {
  const kiosk = useDeveloperKioskData();
  const tick = useClockTick(60_000);
  const now = tick === null ? new Date() : new Date(tick);
  const school = kiosk.data?.school;
  const classes = [...(school?.classes ?? [])]
    .filter((item) => new Date(item.end) >= now)
    .filter((item) => new Date(item.start).getTime() <= now.getTime() + 7 * 86_400_000)
    .sort((a,b) => +new Date(a.start) - +new Date(b.start))
    .slice(0,6);
  const assignments = [...(school?.assignments ?? [])]
    .filter((item) => !item.completed && new Date(item.due) >= now)
    .filter((item) => new Date(item.due).getTime() <= now.getTime() + 7 * 86_400_000)
    .sort((a,b) => +new Date(a.due) - +new Date(b.due));

  return <section className="cosmos-kiosk-school-calendar">
    <div className="cosmos-kiosk-school-bg" aria-hidden="true" />
    <div className="cosmos-kiosk-school-shade" aria-hidden="true" />
    <header className="cosmos-kiosk-school-brand"><strong>COSMOS</strong><b>•</b><span>SCHOOL</span></header>
    <div className="cosmos-kiosk-school-heading">
      <h1>School Calendar</h1>
      <p><strong>Today</strong><span>|</span>{now.toLocaleDateString([], {weekday:"long", month:"long", day:"numeric"})}</p>
    </div>
    <div className="cosmos-kiosk-school-layout">
      <div className="cosmos-kiosk-school-schedule">
        {classes.length ? classes.map((item,index)=><ClassRow key={item.id} item={item} next={index===0} />) :
          <div className="cosmos-kiosk-school-empty">{kiosk.loading ? "Loading school schedule…" : "No upcoming classes."}</div>}
      </div>
      <aside className="cosmos-kiosk-school-side">
        <MiniMonth now={now} classes={classes} assignments={assignments} />
        <section className="cosmos-kiosk-school-reminders">
          <header>ACADEMIC REMINDERS</header>
          {assignments.length ? assignments.map((item,index)=><AssignmentRow key={item.id} item={item} index={index} now={now} />) :
            <p className="cosmos-kiosk-school-no-reminders">No assignments due soon.</p>}
        </section>
      </aside>
    </div>
  </section>;
}

function ClassRow({item,next}:{item:SchoolClass;next:boolean}) {
  const start=new Date(item.start), end=new Date(item.end);
  const meta=classMeta(item.name);
  const Icon=meta.icon;
  return <article className={"cosmos-kiosk-school-class "+(next?"is-next":"")}>
    <div className="cosmos-kiosk-school-time"><em>{dayLabel(start)}</em><strong>{start.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</strong><span>– {end.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</span></div>
    <div className="cosmos-kiosk-school-icon"><Icon size={26} strokeWidth={1.8}/></div>
    <div className="cosmos-kiosk-school-class-main">{next?<span className="cosmos-kiosk-school-next">UP NEXT</span>:null}<h2>{item.name}</h2><p><MapPin size={16}/>{item.location || item.instructor || "Campus"}</p></div>
    <span className={"cosmos-kiosk-school-type "+meta.kind}>{meta.label}</span>
  </article>;
}

function AssignmentRow({item,index,now}:{item:Assignment;index:number;now:Date}) {
  const due=new Date(item.due);
  const sameDay=due.toDateString()===now.toDateString();
  return <article className={"cosmos-kiosk-school-reminder r"+index}>
    <div className="cosmos-kiosk-school-reminder-icon">{index===2?<GraduationCap size={21}/>:index===1?<BookOpen size={21}/>:<FlaskConical size={21}/>}</div>
    <div><strong>{item.title}</strong><span>{sameDay?"Due Today":item.course || "Upcoming assignment"}</span></div>
    <time><strong>{due.toLocaleDateString([], {month:"short",day:"numeric"})}</strong><span>{due.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</span></time>
  </article>;
}

function MiniMonth({now,classes,assignments}:{now:Date;classes:SchoolClass[];assignments:Assignment[]}) {
  const year=now.getFullYear(), month=now.getMonth(), today=now.getDate(), lead=new Date(year,month,1).getDay();
  const dim=new Date(year,month+1,0).getDate(), prev=new Date(year,month,0).getDate();
  const marked=new Set([...classes.map(x=>new Date(x.start)),...assignments.map(x=>new Date(x.due))].filter(d=>d.getMonth()===month).map(d=>d.getDate()));
  const cells=Array.from({length:42},(_,i)=>{const d=i-lead+1;return d<1?{d:prev+d,m:true}:d>dim?{d:d-dim,m:true}:{d,m:false}});
  return <section className="cosmos-kiosk-school-month"><h2>{now.toLocaleDateString([], {month:"long",year:"numeric"})}</h2><div className="cosmos-kiosk-school-weekdays">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(x=><span key={x}>{x}</span>)}</div><div className="cosmos-kiosk-school-days">{cells.map((c,i)=><span key={i} className={(c.m?"muted ":"") + (!c.m&&c.d===today?"today ":"") + (!c.m&&marked.has(c.d)?"marked":"")}>{c.d}</span>)}</div></section>;
}

function dayLabel(value:Date) {
  const today=new Date(); today.setHours(0,0,0,0);
  const day=new Date(value); day.setHours(0,0,0,0);
  const delta=Math.round((day.getTime()-today.getTime())/86_400_000);
  if(delta===0) return "TODAY";
  if(delta===1) return "TOMORROW";
  return value.toLocaleDateString([], {weekday:"short",month:"short",day:"numeric"}).toUpperCase();
}

function classMeta(name:string) {
  const n=name.toLowerCase();
  if(n.includes("chem")) return {label:"Lecture",kind:"lecture",icon:FlaskConical};
  if(n.includes("engr")) return {label:"Class",kind:"class",icon:Settings2};
  if(n.includes("math")) return {label:"Class",kind:"class",icon:BookOpen};
  if(n.includes("english")||n.includes("engl")) return {label:"Class",kind:"class",icon:BookOpen};
  if(n.includes("leadership")||n.includes("lab")) return {label:"Lab",kind:"lab",icon:Users};
  if(n.includes("afrotc")||n.includes("heritage")) return {label:"Meeting",kind:"meeting",icon:Star};
  return {label:"Class",kind:"class",icon:BookOpen};
}
