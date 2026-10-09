"use client";

import type { ReactNode } from "react";
import { Lightbulb, Pin, StickyNote, Tags } from "lucide-react";
import { useClockTick } from "@/hooks/os/useClock";
import { useNotes } from "@/hooks/os/useNotes";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";

type DisplayNote = { id:string; title:string; body:string; tags:string[]; folder?:string; pinned:boolean; updatedAt:string };

export default function CosmosNotesKioskScene() {
  const now = useClockTick(1_000);
  const local = useNotes();
  const kiosk = useDeveloperKioskData();
  const localNotes: DisplayNote[] = local.notes.filter(n=>!n.archived).slice(0,4);
  const synced = kiosk.data?.notes?.items ?? [];
  const notes: DisplayNote[] = localNotes.length ? localNotes : synced;
  const date = now ? new Date(now) : null;

  return <section data-kiosk-rebuild="notes" className="relative h-full w-full select-none overflow-hidden bg-[#090317] text-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(168,85,247,.58),transparent_23%),radial-gradient(circle_at_62%_50%,rgba(74,35,170,.44),transparent_34%),radial-gradient(circle_at_18%_88%,rgba(103,30,170,.28),transparent_30%),linear-gradient(145deg,#05020d_0%,#11052b_46%,#250751_72%,#07020f_100%)]"/>
    <div className="absolute -right-[5vw] top-[11vh] h-[40vw] w-[70vw] rounded-[50%] border-t border-violet-200/70 bg-[radial-gradient(ellipse_at_55%_8%,rgba(190,130,255,.8),rgba(87,42,176,.38)_16%,rgba(20,7,55,.92)_49%,rgba(7,2,19,.98)_72%)] shadow-[0_-8px_35px_rgba(210,150,255,.58),0_-2px_8px_rgba(255,255,255,.8)]"/>
    <div className="absolute inset-0 opacity-75 [background-image:radial-gradient(circle_at_18%_20%,rgba(255,255,255,.95)_0_1px,transparent_1.6px),radial-gradient(circle_at_70%_42%,rgba(216,180,254,.9)_0_1px,transparent_1.5px),radial-gradient(circle_at_40%_80%,rgba(147,197,253,.8)_0_1px,transparent_1.5px)] [background-size:71px_59px,97px_83px,131px_109px]"/>
    <div className="absolute left-[24vw] top-[-9vh] h-[28vh] w-[50vw] rotate-[-8deg] rounded-[50%] bg-fuchsia-500/18 blur-[55px]"/>
    <div className="absolute right-[4vw] top-[1vh] h-[19vh] w-[32vw] rounded-[50%] bg-violet-400/20 blur-[45px]"/>
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,2,14,.06),rgba(5,2,14,.28))]"/>

    <div className="relative z-10 flex h-full flex-col px-[3.8vw] py-[4.2vh]">
      <header>
        <p className="text-[clamp(.65rem,1vw,.95rem)] font-semibold tracking-[.34em]"><span>COSMOS</span><span className="mx-3 text-fuchsia-500">•</span><span className="font-normal text-white/48">NOTES</span></p>
        <h1 className="mt-[2.1vh] text-[clamp(3rem,7.2vw,7rem)] font-semibold leading-[.78] tracking-[-.045em] text-white drop-shadow-[0_0_20px_rgba(216,180,254,.42)]">Notes</h1>
        <p className="mt-[2.1vh] text-[clamp(.9rem,1.7vw,1.6rem)] font-light text-white/92">{date ? new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(date) : "Opening notes"} <span className="mx-3 text-white/55">|</span> {date ? new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(date) : "--:--"}</p>
      </header>

      <div className="mt-[3.2vh] grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-[1.6vw]">
        {notes.map((note,index)=><NoteCard key={note.id} note={note} index={index} now={now}/>)}
        {Array.from({length:Math.max(0,4-notes.length)}).map((_,index)=><EmptyCard key={"empty-"+index} index={notes.length+index} loading={local.loading || kiosk.loading}/>)}
      </div>
    </div>
  </section>;
}

function NoteCard({note,index,now}:{note:DisplayNote;index:number;now:number|null}) {
  const category = note.pinned ? "Pinned" : note.folder || note.tags[0] || (index===0 ? "Note" : "Recent");
  const Icon = note.pinned ? Pin : note.tags.some(t=>/idea/i.test(t)) ? Lightbulb : note.tags.length ? Tags : StickyNote;
  const tone = note.pinned ? "pink" : index%3===0 ? "purple" : index%3===1 ? "blue" : "teal";
  const body = note.body.replace(/\s+/g," ").trim();
  return <Glass tone={tone}>
    <div className="flex items-center justify-between gap-4">
      <div className={"flex items-center gap-2 rounded-full border px-3 py-1 text-[clamp(.6rem,.9vw,.85rem)] "+pill(tone)}><Icon className="h-4 w-4"/><span>{category}</span></div>
      <span className="shrink-0 text-[clamp(.58rem,.8vw,.78rem)] text-white/62">{relative(note.updatedAt,now)}</span>
    </div>
    <h2 className="mt-[1.5vh] truncate text-[clamp(1.15rem,2vw,2rem)] font-semibold leading-tight">{note.title || "Untitled Note"}</h2>
    <p className="mt-[.9vh] line-clamp-4 whitespace-pre-wrap text-[clamp(.78rem,1.22vw,1.18rem)] leading-[1.35] text-white/76">{body || "Empty note"}</p>
  </Glass>;
}
function EmptyCard({index,loading}:{index:number;loading:boolean}) {
  const tone=index%3===0?"purple":index%3===1?"blue":"teal";
  return <Glass tone={tone}><div className="flex h-full flex-col items-center justify-center text-center"><StickyNote className="h-7 w-7 text-white/25"/><p className="mt-3 text-sm font-medium text-white/45">{loading?"Loading notes…":"Space for your next note"}</p><p className="mt-1 text-xs text-white/25">Synced notes will appear here.</p></div></Glass>;
}
function Glass({children,tone}:{children:ReactNode;tone:string}) {
  const border=tone==="pink"?"border-fuchsia-400/70 shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_0_28px_rgba(217,70,239,.16)]":tone==="blue"?"border-blue-400/65 shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_0_28px_rgba(59,130,246,.12)]":tone==="teal"?"border-teal-300/55 shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_0_28px_rgba(45,212,191,.1)]":"border-violet-400/75 shadow-[inset_0_1px_0_rgba(255,255,255,.17),0_0_30px_rgba(139,92,246,.18)]";
  return <article className={"min-h-0 overflow-hidden rounded-[1.45vw] border bg-[linear-gradient(135deg,rgba(20,10,47,.73),rgba(8,8,26,.62))] p-[1.7vw] backdrop-blur-2xl "+border}>{children}</article>;
}
function pill(tone:string){return tone==="pink"?"border-fuchsia-400/25 bg-fuchsia-500/20 text-fuchsia-200":tone==="blue"?"border-blue-400/25 bg-blue-500/20 text-blue-200":tone==="teal"?"border-teal-300/20 bg-teal-400/15 text-teal-100":"border-violet-400/25 bg-violet-500/25 text-violet-100"}
function relative(value:string,now:number|null){const t=Date.parse(value);if(!Number.isFinite(t)||!now)return "Recent";const d=Math.max(0,now-t);const m=Math.floor(d/60000);if(m<1)return "Just now";if(m<60)return m+" min ago";const h=Math.floor(m/60);if(h<24)return h+" hour"+(h===1?"":"s")+" ago";const days=Math.floor(h/24);if(days===1)return "Yesterday";return days+" days ago"}
