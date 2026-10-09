"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Shuffle, Repeat2, Volume2 } from "lucide-react";
import { useClockTick } from "@/hooks/os/useClock";
import useWeather from "@/hooks/os/useWeather";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";
import { useMusic } from "@/hooks/os/useMusic";
import { useKioskSlideshowControl } from "@/components/os/kiosk/KioskSlideshowContext";
import { TEMPORARY_KIOSK_LOCATION } from "@/services/kioskLocation";
import type { MusicTrack } from "@/core/contracts/Music";

export default function CosmosMusicKioskScene() {
  const music=useMusic({refreshMs:(snapshot)=>snapshot?.playback.playing?5_000:15_000});
  const now=useClockTick(1_000);
  const developer=useDeveloperKioskData();
  const directWeather=useWeather({enabled:true});
  const weather=developer.data?.weather ?? directWeather.weather;
  const location=developer.data?.location?.label ?? (weather?.city && weather.city!=="Current location"?weather.city:TEMPORARY_KIOSK_LOCATION.label);
  const track=music.playback?.track;
  const queue=music.snapshot?.queue ?? [];
  const progress=useProgress(music.playback?.positionMs??0,music.playback?.durationMs??track?.durationMs,music.playback?.playing??false,track?.id??"none");
  const {setMusicPlaying}=useKioskSlideshowControl();
  useEffect(()=>{setMusicPlaying("cosmos-music-scene",Boolean(music.playback?.playing));return()=>setMusicPlaying("cosmos-music-scene",false);},[music.playback?.playing,setMusicPlaying]);
  const art=track?.artworkUrl;
  return <section data-kiosk-rebuild="music" className="relative h-full w-full touch-none select-none overflow-hidden bg-[#08060b] text-white">
    {art?<img src={art} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-[28px]"/>:<div className="absolute inset-0 bg-[url('/dashboard/music/concert-stage.webp')] bg-cover bg-center"/>}
    <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,5,9,.72),rgba(6,8,16,.36)_50%,rgba(5,5,12,.74)),radial-gradient(circle_at_65%_48%,rgba(71,120,255,.24),transparent_34%)]"/>
    <div className="relative z-10 flex h-full flex-col px-[3.4vw] py-[3.8vh]">
      <header className="flex items-start justify-between">
        <div><div className="text-[clamp(1.7rem,3vw,3.2rem)] font-light tracking-[.28em]">COSMOS</div><div className="mt-1 pl-[6vw] text-[clamp(.7rem,1.1vw,1rem)] tracking-[.48em] text-white/65">MUSIC</div></div>
        <div className="flex items-start gap-[2vw] text-right"><div><p className="text-[clamp(.7rem,1.05vw,1rem)] tracking-[.08em]">{now?new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(now):"Synchronizing"}</p><p className="mt-1 text-[clamp(1.8rem,3.4vw,3.5rem)] font-light tabular-nums">{now?new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(now):"--:--"}</p></div><div className="h-[4.8rem] w-px bg-white/20"/><div><p className="text-[clamp(1.4rem,2.2vw,2.2rem)] font-semibold">{weather?Math.round(weather.temp):"--"}°</p><p className="text-sm">{weather?.condition??"Weather unavailable"}</p><p className="mt-1 text-xs text-white/60">{location}</p></div></div>
      </header>
      <div className="mt-[5vh] grid min-h-0 flex-1 grid-cols-[1.8fr_1fr] grid-rows-[1.7fr_.72fr] gap-[1.3vw]">
        <NowPlaying track={track} music={music} progress={progress}/>
        <Queue queue={queue}/>
        <Controls music={music}/>
        <RecentFallback track={track} queue={queue}/>
      </div>
    </div>
  </section>;
}
function Glass({children,className=""}:{children:React.ReactNode;className?:string}){return <div className={`overflow-hidden rounded-[1.5vw] border border-white/25 bg-[linear-gradient(135deg,rgba(28,29,39,.68),rgba(8,12,24,.58))] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_18px_50px_rgba(0,0,0,.28)] backdrop-blur-2xl ${className}`}>{children}</div>}
function NowPlaying({track,music,progress}:{track?:MusicTrack;music:ReturnType<typeof useMusic>;progress:number}){
 const duration=music.playback?.durationMs??track?.durationMs??0; const ratio=duration?Math.min(100,progress/duration*100):0;
 return <Glass className="p-[2vw]"><div className="flex h-full gap-[2vw]">{track?.artworkUrl?<img src={track.artworkUrl} alt="" className="aspect-square h-full max-h-[29vh] rounded-[.7vw] object-cover shadow-2xl"/>:<div className="aspect-square h-full max-h-[29vh] rounded-[.7vw] bg-white/10"/>}<div className="flex min-w-0 flex-1 flex-col justify-center"><p className="text-xs uppercase tracking-[.3em] text-white/65">Now Playing</p><h1 className="mt-3 line-clamp-2 text-[clamp(1.8rem,3vw,3.3rem)] font-medium leading-none">{track?.title??(music.loading?"Loading…":"Nothing playing")}</h1><p className="mt-3 truncate text-[clamp(1rem,1.7vw,1.7rem)] text-white/65">{track?.artists.join(", ")??"Start playback on Spotify"}</p>{track?.album?<p className="mt-2 truncate text-[clamp(.75rem,1vw,1rem)] text-white/48">{track.album}</p>:null}<div className="mt-auto"><div className="h-[5px] overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[linear-gradient(90deg,#a5dcff,#7dd3fc)] shadow-[0_0_14px_rgba(125,211,252,.8)]" style={{width:`${ratio}%`}}/></div><div className="mt-2 flex justify-between text-sm tabular-nums text-white/55"><span>{fmt(progress)}</span><span>{fmt(duration)}</span></div></div></div></div></Glass>
}
function Queue({queue}:{queue:MusicTrack[]}){return <Glass className="p-[1.6vw]"><p className="text-xs uppercase tracking-[.32em] text-white/65">Up Next</p><div className="mt-3 flex flex-col gap-[.7vh]">{queue.slice(0,5).map((t,i)=><div key={t.id+`-${i}`} className="flex min-w-0 items-center gap-3 rounded-lg bg-white/[.035] p-2">{t.artworkUrl?<img src={t.artworkUrl} alt="" className="h-10 w-10 rounded object-cover"/>:<div className="h-10 w-10 rounded bg-white/10"/>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t.title}</p><p className="truncate text-xs text-white/45">{t.artists.join(", ")}</p></div><span className="text-xs text-white/45">{fmt(t.durationMs??0)}</span></div>) }{!queue.length?<p className="mt-8 text-center text-sm text-white/45">Queue unavailable from current playback session.</p>:null}</div></Glass>}
function Controls({music}:{music:ReturnType<typeof useMusic>}){const vol=music.playback?.volume??0;return <Glass className="flex items-center justify-between px-[2vw]"><div className="flex items-center gap-[1.5vw]"><Shuffle className="text-white/70"/><button onClick={()=>music.previous()} disabled={!music.capabilities?.canSkipPrevious}><SkipBack/></button><button onClick={()=>music.playback?.playing?music.pause():music.play()} className="flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full border border-sky-200/80 bg-white/10 shadow-[0_0_22px_rgba(125,211,252,.7)]">{music.playback?.playing?<Pause/>:<Play/>}</button><button onClick={()=>music.next()} disabled={!music.capabilities?.canSkipNext}><SkipForward/></button><Repeat2 className="text-white/70"/></div><div className="flex w-[28%] items-center gap-3"><Volume2/><div className="h-1 flex-1 rounded-full bg-white/15"><div className="h-full rounded-full bg-sky-200" style={{width:`${vol}%`}}/></div><span className="text-sm text-white/55">{vol}%</span></div></Glass>}
function RecentFallback({track,queue}:{track?:MusicTrack;queue:MusicTrack[]}){const items=useMemo(()=>[track,...queue].filter((x):x is MusicTrack=>Boolean(x)).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).slice(0,5),[track,queue]);return <Glass className="p-[1.3vw]"><p className="text-xs uppercase tracking-[.3em] text-white/65">Current Session</p><div className="mt-4 flex gap-[.7vw]">{items.map(t=>t.artworkUrl?<img key={t.id} src={t.artworkUrl} alt={t.album??t.title} className="aspect-square min-w-0 flex-1 rounded-[.45vw] object-cover"/>:<div key={t.id} className="aspect-square min-w-0 flex-1 rounded bg-white/10"/>)}{!items.length?<p className="text-sm text-white/45">Playback artwork will appear here.</p>:null}</div></Glass>}
function useProgress(position:number,duration:number|undefined,playing:boolean,id:string){const[v,setV]=useState(position);useEffect(()=>{setV(position);if(!playing||!duration)return;const base=Date.now();const timer=window.setInterval(()=>setV(Math.min(duration,position+Date.now()-base)),1000);return()=>clearInterval(timer)},[position,duration,playing,id]);return v}
function fmt(ms:number){const s=Math.max(0,Math.floor(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`}
