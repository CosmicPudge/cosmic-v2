"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { useSystem } from "@/components/os/system/SystemProvider";
import { formatBytes } from "@/services/system/browser";
import { Widget, WidgetBody, WidgetHeader, useWidgetContext } from "@/components/os/ui/widget";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";

export default function SystemWidget() {
  const { size, presentation } = useWidgetContext();
  const { snapshot } = useSystem();
  const priority = !snapshot.network.online
    ? "Offline"
    : snapshot.power.effective === "reduced"
      ? "Reduced profile"
      : snapshot.install.installable
        ? "Install available"
        : "Ready";

  if (presentation === "kiosk") return <KioskSceneFrame scene="system" eyebrow="COSMIC • SYSTEM" title={snapshot.network.online ? "ONLINE" : "OFFLINE"} subtitle={`${snapshot.device.deviceClass} · ${snapshot.display.profile}`}><div className="kiosk-native-scene-details"><span>{priority}</span><span>{snapshot.install.mode}</span></div></KioskSceneFrame>;
  return <Widget accent="system">
    <WidgetHeader title="System" subtitle={size === "small" ? undefined : `${snapshot.device.deviceClass} · ${snapshot.display.profile}`} action={<Link href="/system" aria-label="Open System" className="rounded-xl p-2 text-white/45 transition hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-200"><ArrowUpRight size={17} /></Link>} />
    <WidgetBody className={size === "small" ? "gap-2" : "gap-3"}>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/15 px-3 py-2.5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/34">Connection</p><p className={`mt-1 text-sm font-semibold ${snapshot.network.online ? "text-emerald-100/80" : "text-amber-100"}`}>{snapshot.network.online ? "Online" : "Offline"}</p></div><span className="rounded-full border border-white/9 bg-white/[0.045] px-2.5 py-1 text-[11px] text-white/55">{priority}</span></div>
      {size !== "small" ? <div className="grid grid-cols-2 gap-2"><Metric label="Performance" value={snapshot.power.effective} /><Metric label="Mode" value={snapshot.install.mode} />{size === "large" ? <><Metric label="Storage" value={snapshot.storage.estimateAvailable ? formatBytes(snapshot.storage.usageBytes) : "Unavailable"} /><Metric label="Battery" value={snapshot.power.battery.supported ? `${Math.round((snapshot.power.battery.level ?? 0) * 100)}%` : "Unavailable"} /></> : null}</div> : null}
    </WidgetBody>
  </Widget>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">{label}</p><p className="mt-1 truncate text-xs capitalize text-white/66">{value}</p></div>;
}
