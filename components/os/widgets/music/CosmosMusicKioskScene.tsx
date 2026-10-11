"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useClockTick } from "@/hooks/os/useClock";
import useWeather from "@/hooks/os/useWeather";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";
import { useMusic } from "@/hooks/os/useMusic";

import type { MusicTrack } from "@/core/contracts/Music";

export default function CosmosMusicKioskScene() {
  const music=useMusic({enabled:false});
  const now=useClockTick(1_000);
  const developer=useDeveloperKioskData();
  const directWeather=useWeather({enabled:true});
  const weather=developer.data?.weather ?? directWeather.weather;
  const location=developer.data?.location?.label ?? (weather?.city && weather.city!=="Current location"?weather.city:"Location unavailable");
  const track=music.playback?.track;
  const queue=music.snapshot?.queue ?? [];
  const progress=useProgress(music.playback?.positionMs??0,music.playback?.durationMs??track?.durationMs,music.playback?.playing??false,track?.id??"none");

  const art=track?.artworkUrl;
  return <section data-kiosk-rebuild="music" className="relative h-full w-full select-none overflow-hidden bg-[#08060b] text-white">
    {art?<img src={art} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-[28px]"/>:<div className="absolute inset-0 bg-[url('/dashboard/music/concert-stage.webp')] bg-cover bg-center"/>}
    <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,5,9,.72),rgba(6,8,16,.36)_50%,rgba(5,5,12,.74)),radial-gradient(circle_at_65%_48%,rgba(71,120,255,.24),transparent_34%)]"/>
    <div className="relative z-10 flex h-full min-h-0 flex-col px-[2.5vw] py-[2vh]">
      <header className="flex items-start justify-between">
        <div><div className="text-[clamp(1.7rem,3vw,3.2rem)] font-light tracking-[.28em]">COSMOS</div><div className="mt-1 pl-[6vw] text-[clamp(.7rem,1.1vw,1rem)] tracking-[.48em] text-white/65">MUSIC</div></div>
        <div className="hidden"><div><p className="text-[clamp(.7rem,1.05vw,1rem)] tracking-[.08em]">{now?new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(now):"Synchronizing"}</p><p className="mt-1 text-[clamp(1.8rem,3.4vw,3.5rem)] font-light tabular-nums">{now?new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(now):"--:--"}</p></div><div className="h-[4.8rem] w-px bg-white/20"/><div><p className="text-[clamp(1.4rem,2.2vw,2.2rem)] font-semibold">{weather?Math.round(weather.temp):"--"}°</p><p className="text-sm">{weather?.condition??"Weather unavailable"}</p><p className="mt-1 text-xs text-white/60">{location}</p></div></div>
      </header>
      <div className="mt-[2vh] grid min-h-0 flex-1 grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_82px] gap-[1vw] pb-[2.4vh]">
        <NowPlaying track={track} music={music} progress={progress}/>
        <Queue queue={queue} music={music}/>
        <Controls music={music}/>
        <RecentFallback track={track} queue={queue}/>
      </div>
      {music.actionError?<div role="alert" className="absolute bottom-3 left-3 right-3 z-50 rounded-lg border border-rose-300/70 bg-rose-950/95 px-3 py-2 text-center text-sm font-medium text-white shadow-xl">Spotify control error: {music.actionError}</div>:null}
    </div>
  </section>;
}
function Glass({children,className=""}:{children:React.ReactNode;className?:string}){return <div className={`overflow-hidden rounded-[1.5vw] border border-white/25 bg-[linear-gradient(135deg,rgba(28,29,39,.68),rgba(8,12,24,.58))] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_18px_50px_rgba(0,0,0,.28)] backdrop-blur-2xl ${className}`}>{children}</div>}
function NowPlaying({track,music,progress}:{track?:MusicTrack;music:ReturnType<typeof useMusic>;progress:number}){
 const duration=music.playback?.durationMs??track?.durationMs??0; const ratio=duration?Math.min(100,progress/duration*100):0;
 return <Glass className="min-h-0 p-[1.5vw]"><div className="flex h-full min-h-0 gap-[1.5vw]">{track?.artworkUrl?<img src={track.artworkUrl} alt="" key={track?.id ?? "art"} className="aspect-square h-full max-h-full w-auto max-w-[30%] rounded-[.7vw] object-cover shadow-2xl motion-safe:animate-[kiosk-rebuild-slide-in_420ms_ease-out]"/>:<div className="aspect-square h-full max-h-full max-w-[30%] rounded-[.7vw] bg-white/10"/>}<div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center"><p className="text-xs uppercase tracking-[.3em] text-white/65">Now Playing</p><h1 key={track?.id ?? "idle"} className="mt-1 line-clamp-2 text-[clamp(1rem,2.4vw,2rem)] font-medium leading-tight motion-safe:animate-[kiosk-rebuild-slide-in_420ms_ease-out]">{track?.title??(music.loading?"Loading…":"Nothing playing")}</h1><p className="mt-1 truncate text-[clamp(.8rem,1.5vw,1.3rem)] text-white/65">{track?.artists.join(", ")??"Start playback on Spotify"}</p>{track?.album?<p className="mt-1 truncate text-[clamp(.7rem,1vw,.85rem)] text-white/48">{track.album}</p>:null}<div className="mt-auto"><div className="h-[5px] overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[linear-gradient(90deg,#a5dcff,#7dd3fc)] shadow-[0_0_14px_rgba(125,211,252,.8)]" style={{width:`${ratio}%`}}/></div><div className="mt-2 flex justify-between text-sm tabular-nums text-white/55"><span>{fmt(progress)}</span><span>{fmt(duration)}</span></div></div></div></div></Glass>
}
function Queue({queue,music}:{queue:MusicTrack[];music:ReturnType<typeof useMusic>}){
 return <Glass className="flex min-h-0 flex-col p-[1.2vw]"><div className="flex items-center justify-between"><p className="text-[clamp(.65rem,1vw,.85rem)] uppercase tracking-[.25em] text-white/65">Up Next</p><span className="text-xs text-white/45">{queue.length ? queue.length+" tracks" : ""}</span></div>
 <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1" style={{touchAction:"pan-y"}}>{queue.slice(0,12).map((t,i)=><button type="button" key={t.id+"-"+i} disabled={music.actionLoading||!music.connected} onClick={()=>music.playTrack(t.id)} aria-label={"Play "+t.title} className="flex min-h-[44px] w-full items-center gap-2 rounded-lg bg-white/[.05] px-2 py-1 text-left transition-colors active:bg-sky-300/25 disabled:opacity-40"><span className="w-4 text-xs text-white/45">{i+1}</span>{t.artworkUrl?<img src={t.artworkUrl} alt="" className="h-9 w-9 shrink-0 rounded object-cover"/>:<div className="h-9 w-9 shrink-0 rounded bg-white/10"/>}<div className="min-w-0 flex-1"><p className="truncate text-[clamp(.72rem,1vw,.9rem)] font-medium">{t.title}</p><p className="truncate text-xs text-white/50">{t.artists.join(", ")}</p></div><Play size={15} className="shrink-0 text-white/50"/></button>)}{!queue.length?<p className="pt-6 text-center text-xs text-white/50">Spotify has not returned an upcoming queue for this session.</p>:null}</div>
 </Glass>
}
function Controls({music}:{music:ReturnType<typeof useMusic>}){const vol=music.playback?.volume??0;return <Glass className="flex min-h-0 items-center justify-between gap-2 px-[1.4vw]"><div className="flex items-center gap-[1vw]"><button aria-label="Previous track" className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/20 disabled:opacity-40" onClick={()=>music.previous()} disabled={music.actionLoading||!music.capabilities?.canSkipPrevious}><SkipBack size={25}/></button><button aria-label={music.playback?.playing?"Pause":"Play"} onClick={()=>music.playback?.playing?music.pause():music.play()} disabled={music.actionLoading||!music.connected} className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-200/80 bg-white/10 shadow-[0_0_14px_rgba(125,211,252,.4)] active:bg-sky-300/25 disabled:opacity-40">{music.playback?.playing?<Pause/>:<Play/>}</button><button aria-label="Next track" className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/20 disabled:opacity-40" onClick={()=>music.next()} disabled={music.actionLoading||!music.capabilities?.canSkipNext}><SkipForward size={25}/></button></div><div className="flex min-w-0 items-center gap-2 text-xs text-white/65"><Volume2 size={17}/><span>{vol}%</span></div></Glass>}
function RecentFallback({track,queue}:{track?:MusicTrack;queue:MusicTrack[]}){const items=useMemo(()=>[track,...queue].filter((x):x is MusicTrack=>Boolean(x)).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).slice(0,5),[track,queue]);return <Glass className="min-h-0 p-[1vw]"><p className="text-xs uppercase tracking-[.3em] text-white/65">Current Session</p><div className="mt-1 flex h-[45px] gap-[.7vw] overflow-hidden">{items.map(t=>t.artworkUrl?<img key={t.id} src={t.artworkUrl} alt={t.album??t.title} className="h-full w-auto min-w-0 rounded-[.45vw] object-cover"/>:<div key={t.id} className="aspect-square min-w-0 flex-1 rounded bg-white/10"/>)}{!items.length?<p className="text-sm text-white/45">Playback artwork will appear here.</p>:null}</div></Glass>}
function useProgress(position:number,duration:number|undefined,playing:boolean,id:string){const[v,setV]=useState(position);useEffect(()=>{setV(position);if(!playing||!duration)return;const base=Date.now();const timer=window.setInterval(()=>setV(Math.min(duration,position+Date.now()-base)),1000);return()=>clearInterval(timer)},[position,duration,playing,id]);return v}
function fmt(ms:number){const s=Math.max(0,Math.floor(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`}
