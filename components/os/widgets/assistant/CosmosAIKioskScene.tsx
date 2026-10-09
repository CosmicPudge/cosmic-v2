"use client";

import { BrainCircuit, CalendarDays, Code2, FileText, Globe2, GraduationCap, ImageIcon, Lightbulb, Send, Sparkles, Upload, BookOpen, ChevronRight, MessageSquareText } from "lucide-react";
import { useClockTick } from "@/hooks/os/useClock";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";
import useWeather from "@/hooks/os/useWeather";

const suggestions=[
 {icon:GraduationCap,title:"Explain a concept",sub:"Get a simple explanation"},
 {icon:CalendarDays,title:"Plan my day",sub:"Schedule, tasks, and deadlines"},
 {icon:FileText,title:"Summarize this",sub:"Turn notes or readings into key points"},
 {icon:Code2,title:"Help with code",sub:"Debug, explain, or build"},
 {icon:BookOpen,title:"Study for a quiz",sub:"Practice questions and review"},
 {icon:Lightbulb,title:"Brainstorm ideas",sub:"Get ideas for projects or assignments"},
];
const aiTools=[{icon:Globe2,label:"Web Search"},{icon:Upload,label:"File Upload"},{icon:GraduationCap,label:"School Help"},{icon:Code2,label:"Code Assistant"},{icon:BookOpen,label:"Study Mode"},{icon:ImageIcon,label:"Image Analysis"}];

export default function CosmosAIKioskScene(){
 const now=useClockTick(1000);const kiosk=useDeveloperKioskData();const weather=useWeather();const d=now?new Date(now):new Date();
 const assignments=(kiosk.data?.school.assignments??[]).slice(0,3);
 const projectTasks=(kiosk.data?.projects.openTasks??[]).slice(0,2);
 const quick=[...assignments.map(x=>"Help me with "+x.title),...projectTasks.map(x=>"Help me plan "+x.title)].slice(0,5);
 return <section data-kiosk-rebuild="cosmic-ai" className="relative h-full w-full overflow-hidden bg-[#060914] text-white" style={{height:"100dvh",maxHeight:"100dvh"}}>
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_30%,rgba(249,115,22,.30),transparent_24%),radial-gradient(circle_at_78%_10%,rgba(59,130,246,.34),transparent_34%),radial-gradient(circle_at_68%_78%,rgba(147,51,234,.31),transparent_38%),linear-gradient(135deg,#090a12,#07172d_46%,#180a2d)]"/><div className="absolute -left-[7vw] top-[20vh] h-[42vh] w-[42vh] rounded-full bg-orange-500/10 blur-[90px]"/><div className="absolute right-[10vw] top-[8vh] h-[34vh] w-[34vh] rounded-full bg-blue-500/10 blur-[85px]"/>
  <div className="relative z-10 box-border flex h-full min-h-0 flex-col px-[3.1vw] pt-[2.5vh] pb-[4.5vh]">
   <header className="flex h-[16vh] shrink-0 items-start justify-between">
    <div><h1 className="text-[clamp(2.1rem,4.5vw,4.8rem)] font-light tracking-[.22em]">COSMOS</h1><p className="mt-1 text-center text-[clamp(.8rem,1.3vw,1.25rem)] tracking-[.55em] text-white/55">AI</p></div>
    <div className="flex gap-[2vw] text-right"><div><p className="text-sm text-white/70">{d.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</p><p className="text-[clamp(2rem,4vw,4rem)] font-light">{d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</p></div><div className="border-l border-white/15 pl-[2vw]"><p className="text-[clamp(1.4rem,2.2vw,2.3rem)] font-semibold">{weather.weather?.temp!==undefined?Math.round(weather.weather.temp)+"°":"—"}</p><p className="text-sm text-white/70">{weather.weather?.condition??"Weather"}</p><p className="text-xs text-white/45">{kiosk.data?.location?.label??weather.weather?.city??""}</p></div></div>
   </header>
   <div className="grid min-h-0 flex-1 grid-cols-[2.2fr_.95fr] grid-rows-[minmax(0,1fr)_minmax(0,26vh)] gap-[1.15vw]">
    <Glass className="relative overflow-hidden">
      <div className="absolute right-5 top-4 flex items-center gap-2 text-[10px] tracking-[.22em] text-amber-200/70"><span className="h-2 w-2 rounded-full bg-amber-400"/> AI SETUP PENDING</div>
      <div className="flex h-full items-center gap-[3vw] px-[2vw]"><div className="relative flex h-[13vw] w-[13vw] max-h-[170px] max-w-[170px] shrink-0 items-center justify-center rounded-[2.5rem] border border-cyan-300/35 bg-[radial-gradient(circle_at_50%_30%,rgba(56,189,248,.30),rgba(30,64,175,.16)_42%,rgba(10,16,35,.94)_70%)] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_0_55px_rgba(56,189,248,.26),0_18px_40px_rgba(0,0,0,.28)]"><BrainCircuit className="h-[48%] w-[48%] text-cyan-300"/></div><div className="min-w-0 flex-1"><p className="text-[clamp(1.8rem,3vw,3.5rem)] font-semibold">Hey <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">Stetson,</span></p><p className="text-[clamp(1.3rem,2vw,2.3rem)] text-white/65">How can I help today?</p><div className="mt-[3vh] flex items-center rounded-full border border-sky-300/80 bg-[linear-gradient(90deg,rgba(14,165,233,.12),rgba(79,70,229,.16),rgba(147,51,234,.12))] p-2 pl-5 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_0_38px_rgba(56,189,248,.24),0_0_70px_rgba(99,102,241,.12)] backdrop-blur-xl"><Sparkles className="mr-3 h-5 w-5 text-sky-300"/><span className="flex-1 text-white/40">AI provider not configured</span><span className="rounded-full border border-sky-400/60 p-3 text-sky-300"><Send className="h-5 w-5"/></span></div></div></div>
    </Glass>
    <Glass title="SUGGESTED"><div className="space-y-[.45vh]">{suggestions.map(({icon:Icon,title,sub})=><div key={title} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[.035] px-3 py-[.55vh]"><Icon className="h-5 w-5 shrink-0 text-sky-400"/><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{title}</p><p className="truncate text-[10px] text-white/45">{sub}</p></div><ChevronRight className="h-4 w-4 text-white/50"/></div>)}</div></Glass>
    <div className="grid min-h-0 grid-cols-[1fr_.96fr] gap-[1.15vw]">
      <Glass title="CONTEXT"><div className="space-y-2">{assignments.length?assignments.map(x=><div key={x.id} className="flex items-center gap-3 rounded-lg bg-white/[.035] px-3 py-2"><MessageSquareText className="h-4 w-4 text-sky-400"/><div className="min-w-0"><p className="truncate text-xs">{x.title}</p><p className="truncate text-[10px] text-white/40">{x.course}</p></div></div>):<p className="pt-6 text-center text-xs text-white/35">No synced context available.</p>}</div></Glass>
      <Glass title="TOOLS"><div className="grid h-[calc(100%-2.15rem)] min-h-0 grid-cols-3 grid-rows-2 gap-2 pb-1">{aiTools.map(({icon:Icon,label})=><div key={label} className="flex min-h-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[.035] px-2 py-1"><Icon className="h-[clamp(1rem,1.25vw,1.25rem)] w-[clamp(1rem,1.25vw,1.25rem)] shrink-0 text-sky-400"/><span className="mt-1 text-center text-[10px] leading-tight">{label}</span></div>)}</div></Glass>
    </div>
    <Glass title="QUICK PROMPTS"><div className="space-y-1.5">{quick.length?quick.map(q=><div key={q} className="flex items-center rounded-lg border border-white/8 bg-white/[.03] px-3 py-2 text-[11px]"><Sparkles className="mr-2 h-4 w-4 text-violet-400"/><span className="min-w-0 flex-1 truncate">{q}</span><ChevronRight className="h-4 w-4 text-white/45"/></div>):<p className="pt-8 text-center text-xs text-white/35">Prompts will appear from your Cosmos context.</p>}</div></Glass>
   </div>
  </div>
 </section>
}
function Glass({title,children,className=""}:{title?:string;children:React.ReactNode;className?:string}){return <article className={"min-h-0 overflow-hidden rounded-[1.35vw] border border-white/20 bg-[linear-gradient(135deg,rgba(10,22,42,.78),rgba(12,15,31,.66))] p-[clamp(.7rem,1.2vw,1.2rem)] shadow-[inset_0_1px_0_rgba(255,255,255,.14),inset_0_-1px_0_rgba(99,102,241,.08),0_18px_45px_rgba(0,0,0,.34),0_0_28px_rgba(59,130,246,.05)] backdrop-blur-2xl "+className}>{title?<div className="mb-2 border-b border-white/10 pb-2 text-[clamp(.65rem,.9vw,.9rem)] tracking-[.28em]">{title}</div>:null}{children}</article>}
