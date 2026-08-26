"use client";
import Link from "next/link";
import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty, WidgetError, WidgetLoading } from "@/components/os/ui/widget";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import { useMusic } from "@/hooks/os/useMusic";
export default function MusicWidget(){const {size,presentation}=useWidgetContext();const m=useMusic();const track=m.playback?.track;return <Widget accent="music"><WidgetHeader title="Music" subtitle="Now Playing"/><WidgetBody>{m.loading?<WidgetLoading compact label="Loading music"/>:m.error?<WidgetError compact title={presentation==="kiosk"?"Music temporarily unavailable":"Music unavailable"} message={presentation==="kiosk"?"Cosmic will retry automatically.":m.error}/>:!m.connected?<WidgetEmpty compact title="No music connected" description="Configure an official provider in Music."/>:!track?<WidgetEmpty compact title="Nothing playing" description="Cosmic Music is idle."/>:<div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="font-medium">{track.title}</p><p className="text-sm text-white/55">{track.artists.join(", ")}</p>{size!=="small"&&<p className="mt-2 text-xs text-white/45">{m.playback?.playing?"Playing":"Paused"}{m.playback?.deviceName?` · ${m.playback.deviceName}`:""}</p>}</div>}</WidgetBody><WidgetFooter><Link className="text-xs text-cyan-100" href="/music">Open Music</Link></WidgetFooter></Widget>}
