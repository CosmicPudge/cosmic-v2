"use client";

import { useEffect, useState } from "react";
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
  const progress=useProgress(music.playback?.positionMs??0,music.playback?.durationMs??track?.durationMs,music.playback?.playing??false,track?.id??"none");

  const art=track?.artworkUrl;
  return <section data-kiosk-rebuild="music" className="relative h-full w-full select-none overflow-hidden bg-[#08060b] text-white">
    {art?<img src={art} alt="" className="absolute inset-0 h-full w-full object-cover opacity-100"/>:<div className="absolute inset-0 bg-[url('/dashboard/music/concert-stage.webp')] bg-cover bg-center"/>}
    <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,5,9,.76),rgba(6,8,16,.52)_50%,rgba(5,5,12,.78)),radial-gradient(circle_at_65%_48%,rgba(71,120,255,.24),transparent_34%)]"/>
    <div className="relative z-10 flex h-full min-h-0 flex-col px-[2.5vw] py-[2vh]">
      <header className="flex items-start justify-between">
        <div><div className="text-[clamp(1.7rem,3vw,3.2rem)] font-light tracking-[.28em]">COSMOS</div><div className="mt-1 pl-[6vw] text-[clamp(.7rem,1.1vw,1rem)] tracking-[.48em] text-white/65">MUSIC</div></div>
        <div className="hidden"><div><p className="text-[clamp(.7rem,1.05vw,1rem)] tracking-[.08em]">{now?new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(now):"Synchronizing"}</p><p className="mt-1 text-[clamp(1.8rem,3.4vw,3.5rem)] font-light tabular-nums">{now?new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(now):"--:--"}</p></div><div className="h-[4.8rem] w-px bg-white/20"/><div><p className="text-[clamp(1.4rem,2.2vw,2.2rem)] font-semibold">{weather?Math.round(weather.temp):"--"}°</p><p className="text-sm">{weather?.condition??"Weather unavailable"}</p><p className="mt-1 text-xs text-white/60">{location}</p></div></div>
      </header>
      <div className="mt-[2vh] grid min-h-0 flex-1 grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_82px] gap-[1vw] pb-[2.4vh]">
        <NowPlaying track={track} music={music} progress={progress}/>
        <LyricsPanel track={track} progress={progress}/>
        <Controls music={music}/>
        <SessionPanel session={music.snapshot?.session} track={track}/>
      </div>
      {music.actionError?<div role="alert" className="absolute bottom-3 left-3 right-3 z-50 rounded-lg border border-rose-300/70 bg-rose-950/95 px-3 py-2 text-center text-sm font-medium text-white shadow-xl">Spotify control error: {music.actionError}</div>:null}
    </div>
  </section>;
}
function Glass({children,className=""}:{children:React.ReactNode;className?:string}){return <div className={`overflow-hidden rounded-[1.5vw] border border-white/25 bg-[linear-gradient(135deg,rgba(28,29,39,.68),rgba(8,12,24,.58))] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_18px_50px_rgba(0,0,0,.28)] backdrop-blur-2xl ${className}`}>{children}</div>}
function NowPlaying({track,music,progress}:{track?:MusicTrack;music:ReturnType<typeof useMusic>;progress:number}){
 const duration=music.playback?.durationMs??track?.durationMs??0; const ratio=duration?Math.min(100,progress/duration*100):0;
 const artistImage=track?.artistProfiles?.find(artist=>artist.imageUrl)?.imageUrl ?? track?.artworkUrl;
 return <Glass className="min-h-0 p-[1.5vw]"><div className="flex h-full min-h-0 gap-[1.5vw]">{<div className="relative aspect-square h-auto w-[min(20vw,35vh)] max-w-[30%] shrink-0 self-center overflow-hidden rounded-full border-2 border-white/30 bg-white/10 shadow-2xl">{artistImage?<img src={artistImage} alt="" key={track?.id ?? "art"} className="absolute inset-0 h-full w-full object-cover motion-safe:animate-[kiosk-rebuild-slide-in_420ms_ease-out]"/>:null}</div>}<div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center"><p className="text-xs uppercase tracking-[.3em] text-white/65">Now Playing</p><h1 key={track?.id ?? "idle"} className="mt-1 line-clamp-2 text-[clamp(1rem,2.4vw,2rem)] font-medium leading-tight motion-safe:animate-[kiosk-rebuild-slide-in_420ms_ease-out]">{track?.title??(music.loading?"Loading…":"Nothing playing")}</h1><p className="mt-1 truncate text-[clamp(.8rem,1.5vw,1.3rem)] text-white/65">{track?.artists.join(", ")??"Start playback on Spotify"}</p>{track?.album?<p className="mt-1 truncate text-[clamp(.7rem,1vw,.85rem)] text-white/48">{track.album}</p>:null}<div className="mt-auto"><div className="h-[5px] overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[linear-gradient(90deg,#a5dcff,#7dd3fc)] shadow-[0_0_14px_rgba(125,211,252,.8)]" style={{width:`${ratio}%`}}/></div><div className="mt-2 flex justify-between text-sm tabular-nums text-white/55"><span>{fmt(progress)}</span><span>{fmt(duration)}</span></div></div></div></div></Glass>
}
type LyricLine={ms:number;text:string};
type LyricsRecord={trackName?:string;artistName?:string;duration?:number;syncedLyrics?:string|null;plainLyrics?:string|null;instrumental?:boolean};
type LyricsData={lines:LyricLine[];plain:string[];instrumental:boolean};
type LyricsResult={state:"ready"|"not-found"|"error";data?:LyricsData;detail?:string};
const lyricCache=new Map<string,{expiresAt:number;result:LyricsResult}>();
const normalizeTitle=(text:string)=>text.toLowerCase().replace(/\s*[\(\[]?(feat\.?|ft\.?|with)\s+.*$/i,"").replace(/\s*[-–]\s*(remaster(ed)?|radio edit|explicit|clean|live|acoustic).*$/i,"").replace(/[^\p{L}\p{N}]+/gu," ").trim();
function parseLyrics(record:LyricsRecord):LyricsData{
 const lines=(record.syncedLyrics??"").split(/\r?\n/).flatMap(row=>{
  const matches=[...row.matchAll(/\[(\d+):(\d{2})(?:\.(\d{1,3}))?\]/g)];
  const text=row.replace(/\[(\d+):(\d{2})(?:\.(\d{1,3}))?\]/g,"").trim();
  return text?matches.map(m=>({ms:(Number(m[1])*60+Number(m[2]))*1000+Number((m[3]??"0").padEnd(3,"0")),text})):[];
 }).sort((x,y)=>x.ms-y.ms);
 return {lines,plain:(record.plainLyrics??"").split(/\r?\n/).filter(Boolean),instrumental:Boolean(record.instrumental)};
}
async function requestLyrics(url:string,signal:AbortSignal):Promise<{status:number;data:unknown}>{
 const response=await fetch(url,{signal,cache:"no-store",headers:{"Accept":"application/json","Lrclib-Client":"Cosmos Kiosk/1.0 (https://cosmicpudge.shop)"}});
 return {status:response.status,data:response.ok?await response.json():null};
}
function LyricsPanel({track,progress}:{track?:MusicTrack;progress:number}){
 const [revision,setRevision]=useState(0);
 const [loading,setLoading]=useState(false);
 const id=track?.id,artist=track?.artists[0],title=track?.title,album=track?.album,duration=track?.durationMs;
 useEffect(()=>{
  if(!id||!artist||!title)return;
  const cached=lyricCache.get(id);
  if(cached&&cached.expiresAt>Date.now())return;
  const ctrl=new AbortController();let live=true;
  const load=async()=>{
   setLoading(true);
   let result:LyricsResult={state:"not-found"};
   try{
    const base="https://lrclib.net/api/";
    const query=new URLSearchParams({track_name:title,artist_name:artist});
    if(album)query.set("album_name",album);
    if(duration)query.set("duration",String(Math.round(duration/1000)));
    const exact=await requestLyrics(base+"get?"+query,ctrl.signal);
    if(exact.status===429)throw Error("Lyrics service rate limited");
    if(exact.status>=500)throw Error("Lyrics service unavailable");
    let record=exact.status===200?exact.data as LyricsRecord:null;
    if(!record&&exact.status===404){
     // The exact endpoint requires a nearly identical duration and metadata.
     // Search by normalized title+artist, then verify identity before showing lyrics.
     const search=new URLSearchParams({track_name:normalizeTitle(title),artist_name:artist});
     const fallback=await requestLyrics(base+"search?"+search,ctrl.signal);
     if(fallback.status===429)throw Error("Lyrics service rate limited");
     if(fallback.status>=500)throw Error("Lyrics service unavailable");
     if(fallback.status===200&&Array.isArray(fallback.data)){
      const candidates=(fallback.data as LyricsRecord[]).filter(item=>
       normalizeTitle(item.trackName??"")===normalizeTitle(title)&&
       (item.artistName??"").toLowerCase().includes(artist.toLowerCase())&&
       (!duration||!item.duration||Math.abs(item.duration-duration/1000)<=5)
      );
      record=candidates.find(item=>Boolean(item.syncedLyrics))??candidates[0]??null;
     }
    }
    if(record){const data=parseLyrics(record);result=data.instrumental||data.lines.length>0||data.plain.length>0?{state:"ready",data}:{state:"not-found"};}
    else if(exact.status!==404)throw Error("Lyrics request failed ("+exact.status+")");
   }catch(error){
    if(ctrl.signal.aborted)return;
    result={state:"error",detail:error instanceof Error?error.message:"Lyrics lookup failed"};
   }finally{
    if(live&&!ctrl.signal.aborted){
     lyricCache.set(id,{result,expiresAt:Date.now()+(result.state==="ready"?60*60_000:result.state==="not-found"?5*60_000:30_000)});
     if(lyricCache.size>60)lyricCache.clear();
     setRevision(n=>n+1);setLoading(false);
    }
   }
  };
  void load();
  return()=>{live=false;ctrl.abort();};
 },[id,artist,title,album,duration]);
 void revision;
 const entry=id?lyricCache.get(id):undefined;
 const result=entry&&entry.expiresAt>Date.now()?entry.result:undefined;
 const data=result?.data;
 const active=data?.lines.reduce((n,line,i)=>line.ms<=progress?i:n,-1)??-1;
 const shown=data?.lines.length?data.lines.slice(Math.max(0,active-2),Math.max(0,active-2)+5):[];
 return <Glass className="flex min-h-0 flex-col p-[1.2vw]"><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[.25em] text-white/65">Lyrics</p><p className="text-[10px] text-white/40">LRCLIB</p></div>
 <div className="mt-2 flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-y-auto px-3 text-center" style={{touchAction:"pan-y"}}>
 {!track?<p className="text-sm text-white/55">Start playback to view lyrics.</p>:!result||loading&&!result?<p className="text-sm text-white/55">Finding lyrics…</p>:
 result.state==="error"?<div className="text-sm text-amber-200/80">Lyrics temporarily unavailable<p className="mt-2 text-xs text-white/45">{result.detail}</p></div>:
 data?.instrumental?<p className="text-sm text-white/55">Instrumental — no lyrics.</p>:
 shown.length?shown.map((line,i)=><p key={line.ms+"-"+i} className={line.ms===data?.lines[active]?.ms?"text-base font-semibold text-white":"text-sm text-white/45"}>{line.text}</p>):
 data?.plain.length?<div className="space-y-2 text-sm text-white/75">{data.plain.map((line,i)=><p key={i}>{line}</p>)}</div>:
 <p className="text-sm text-white/55">Lyrics not found for this recording.</p>}
 </div></Glass>;
}
function Controls({music}:{music:ReturnType<typeof useMusic>}){const vol=music.playback?.volume??0;return <Glass className="flex min-h-0 items-center justify-between gap-2 px-[1.4vw]"><div className="flex items-center gap-[1vw]"><button aria-label="Previous track" className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/20 disabled:opacity-40" onClick={()=>music.previous()} disabled={music.actionLoading||!music.capabilities?.canSkipPrevious}><SkipBack size={25}/></button><button aria-label={music.playback?.playing?"Pause":"Play"} onClick={()=>music.playback?.playing?music.pause():music.play()} disabled={music.actionLoading||!music.connected} className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-200/80 bg-white/10 shadow-[0_0_14px_rgba(125,211,252,.4)] active:bg-sky-300/25 disabled:opacity-40">{music.playback?.playing?<Pause/>:<Play/>}</button><button aria-label="Next track" className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/20 disabled:opacity-40" onClick={()=>music.next()} disabled={music.actionLoading||!music.capabilities?.canSkipNext}><SkipForward size={25}/></button></div><div className="flex min-w-0 items-center gap-2 text-xs text-white/65"><Volume2 size={17}/><span>{vol}%</span></div></Glass>}
function SessionPanel({session,track}:{session?:import("@/core/contracts/Music").MusicSessionContext;track?:MusicTrack}){
 const title=session?.title || (track ? "Spotify session" : "No active session");
 const image=session?.artworkUrl;
 return <Glass className="flex min-h-0 flex-col p-[1vw]"><p className="text-xs uppercase tracking-[.3em] text-white/65">Playing From</p><div className="mt-1 flex min-h-0 flex-1 items-center gap-3">{image?<img src={image} alt="" className="h-[45px] w-[45px] shrink-0 rounded-md object-cover"/>:<div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-md bg-white/10 text-xs text-white/45">♫</div>}<div className="min-w-0"><p className="truncate text-sm font-medium">{title}</p><p className="text-xs capitalize text-white/50">{session?.type ?? "Session"}</p></div></div></Glass>;
}
function useProgress(position:number,duration:number|undefined,playing:boolean,id:string){const[v,setV]=useState(position);useEffect(()=>{setV(position);if(!playing||!duration)return;const base=Date.now();const timer=window.setInterval(()=>setV(Math.min(duration,position+Date.now()-base)),1000);return()=>clearInterval(timer)},[position,duration,playing,id]);return v}
function fmt(ms:number){const s=Math.max(0,Math.floor(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`}
