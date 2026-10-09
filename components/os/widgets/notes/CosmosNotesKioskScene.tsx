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
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(168,85,247,.55),transparent_23%),radial-gradient(circle_at_25%_62%,rgba(126,34,206,.30),transparent_31%),linear-gradient(145deg,#03010a_0%,#100326_48%,#26074d_75%,#05010c_100%)]"/>
    <div className="absolute inset-x-0 top-[-9vh] h-[39vh] opacity-90 blur-[1px] [background-image:radial-gradient(ellipse_at_48%_45%,rgba(255,160,255,.80)_0%,rgba(168,85,247,.48)_8%,rgba(91,33,182,.25)_22%,transparent_50%),radial-gradient(ellipse_at_30%_55%,rgba(96,165,250,.35),transparent_34%),radial-gradient(ellipse_at_68%_28%,rgba(217,70,239,.48),transparent_32%)]"/>
    <div className="absolute -right-[7vw] top-[9vh] h-[42vw] w-[72vw] rounded-[50%] border-t border-violet-100/90 bg-[radial-gradient(ellipse_at_52%_5%,rgba(224,195,255,.92),rgba(117,72,211,.56)_12%,rgba(35,15,78,.96)_42%,rgba(5,2,15,.99)_72%)] shadow-[0_-13px_48px_rgba(216,180,254,.75),0_-3px_12px_rgba(255,255,255,.95)]"/>
    <div className="absolute right-[14vw] top-[4.5vh] h-[9vw] w-[9vw] rounded-full border border-violet-200/30 bg-[radial-gradient(circle_at_42%_34%,rgba(118,80,177,.75),rgba(28,12,62,.96)_55%,#090313_78%)] shadow-[0_0_28px_rgba(192,132,252,.28)]"/>
    <div className="absolute right-[-1vw] top-[13vh] h-[3px] w-[12vw] rotate-[-7deg] bg-white/85 shadow-[0_0_8px_white,0_0_18px_rgba(232,121,249,.95),0_0_42px_rgba(168,85,247,.9)]"/>
    <div className="absolute right-[4vw] top-[10.5vh] h-[4.5vw] w-[4.5vw] rounded-full bg-white/90 blur-[6px] shadow-[0_0_20px_white,0_0_55px_rgba(232,121,249,.95),0_0_95px_rgba(168,85,247,.85)]"/>
    <div className="absolute inset-0 opacity-90 [background-image:radial-gradient(circle,rgba(255,255,255,.95)_0_1px,transparent_1.7px),radial-gradient(circle,rgba(216,180,254,.9)_0_1.2px,transparent_1.8px),radial-gradient(circle,rgba(147,197,253,.78)_0_.8px,transparent_1.5px)] [background-position:0_0,21px_31px,63px_11px] [background-size:83px_67px,127px_103px,173px_139px]"/>
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,1,10,.02),rgba(3,1,10,.22)_58%,rgba(3,1,10,.38))]"/>

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
