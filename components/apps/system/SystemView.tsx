"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Bell, Clipboard, Cpu, Database, Download, Gauge, Maximize2, Monitor, MousePointer2, Network, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";

import { useSystem } from "@/components/os/system/SystemProvider";
import type { SystemSnapshot } from "@/core/contracts/System";
import { COSMIC_APP_VERSION } from "@/services/settings/dataTransfer";
import { formatBytes } from "@/services/system/browser";

const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 text-sm font-semibold text-white/78 transition hover:border-white/20 hover:bg-white/[0.1] hover:text-white focus:outline-none focus:ring-4 focus:ring-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-40";

function Status({ children, positive, warning = false }: { children: React.ReactNode; positive?: boolean; warning?: boolean }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${positive ? "border-emerald-300/18 bg-emerald-300/10 text-emerald-100" : warning ? "border-amber-300/18 bg-amber-300/10 text-amber-100" : "border-white/10 bg-white/[0.045] text-white/52"}`}>{children}</span>;
}

function Section({ id, icon, title, description, children }: { id: string; icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-6 rounded-[1.6rem] border border-white/10 bg-[#071022]/64 p-5 shadow-[0_24px_80px_rgba(0,0,0,.18)] backdrop-blur-2xl sm:p-7"><header className="flex items-start gap-3 border-b border-white/[0.08] pb-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-100/10 bg-cyan-100/[0.06] text-cyan-100/70">{icon}</span><div><h2 className="text-lg font-bold text-white/90 sm:text-xl">{title}</h2><p className="mt-1 text-sm leading-6 text-white/40">{description}</p></div></header><div className="mt-5">{children}</div></section>;
}

function MetricGrid({ items }: { items: Array<[string, React.ReactNode]> }) {
  return <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(([label, value]) => <div key={label} className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/34">{label}</dt><dd className="mt-2 break-words text-sm font-medium text-white/72">{value}</dd></div>)}</dl>;
}

function capabilityLabel(value: boolean) {
  return value ? <Status positive>Available</Status> : <Status>Unavailable</Status>;
}

export default function SystemView({ compact = false, snapshotOverride }: { compact?: boolean; snapshotOverride?: SystemSnapshot }) {
  const system = useSystem();
  const snapshot = snapshotOverride ?? system.snapshot;
  const [notice, setNotice] = useState<string | null>(null);

  if (compact) {
    return <div className="space-y-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/45">System</p><h1 className="mt-1 text-2xl font-bold">{snapshot.device.deviceClass} · {snapshot.display.profile}</h1><p className="mt-2 text-sm text-white/42">{snapshot.network.online ? "Online" : "Offline"} · {snapshot.power.effective} performance · {snapshot.install.mode}</p></div><MetricGrid items={[["Browser", snapshot.device.browser], ["Viewport", `${snapshot.display.viewportWidth ?? "—"} × ${snapshot.display.viewportHeight ?? "—"}`], ["Storage", snapshot.storage.estimateAvailable ? `${formatBytes(snapshot.storage.usageBytes)} used` : "Estimate unavailable"]]} /><Link href="/system" className={buttonClass}>Open Full System <ArrowUpRight className="h-4 w-4" /></Link></div>;
  }

  const capabilityRows: Array<[string, boolean]> = [
    ["PWA install prompt", snapshot.install.installable],
    ["Service Worker API", snapshot.capabilities.serviceWorker],
    ["Notifications", snapshot.capabilities.notifications],
    ["Geolocation", snapshot.capabilities.geolocation],
    ["Wake Lock", snapshot.capabilities.wakeLock],
    ["Fullscreen", snapshot.capabilities.fullscreen],
    ["Media Session", snapshot.capabilities.mediaSession],
    ["Web Share", snapshot.capabilities.webShare],
    ["Clipboard", snapshot.capabilities.clipboard],
    ["Battery Status", snapshot.capabilities.battery],
    ["Network Information", snapshot.capabilities.networkInformation],
  ];

  return <div className="mx-auto max-w-[1440px] pb-[max(1rem,env(safe-area-inset-bottom))]">
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/45">Local capability profile</p><h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">System</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">What this browser can truthfully expose to Cosmic. Nothing here is transmitted or treated as exact hardware identity.</p></div><Link href="/settings#system" className={buttonClass}>System Settings <ArrowUpRight className="h-4 w-4" /></Link></header>
    {notice ? <div role="status" className="mb-5 rounded-2xl border border-cyan-200/14 bg-cyan-200/[0.07] px-4 py-3 text-sm text-cyan-50/80">{notice}</div> : null}

    <div className="grid gap-5 xl:grid-cols-2">
      <Section id="overview" icon={<Gauge className="h-5 w-5" />} title="Overview" description="Concise current environment and Cosmic adaptation."><MetricGrid items={[["Device profile", `${snapshot.device.deviceClass} · ${snapshot.device.override}`], ["Connection", snapshot.network.online ? <Status positive>Online</Status> : <Status warning>Offline</Status>], ["Display profile", snapshot.display.profile], ["Performance", `${snapshot.power.effective} · ${snapshot.power.preference}`], ["Display mode", snapshot.install.mode === "standalone" ? "Installed / standalone" : "Browser"], ["Reduced motion", snapshot.power.reducedMotion ? "Requested by system" : "Not requested"]]} /></Section>

      <Section id="device" icon={<Cpu className="h-5 w-5" />} title="Device" description="Broad, privacy-conscious hints; never an exact model or CPU identity."><MetricGrid items={[["Class", snapshot.device.deviceClass], ["Platform", snapshot.device.platform], ["Browser", snapshot.device.browser], ["Logical processors", snapshot.device.logicalProcessors ?? "Unavailable"], ["Approx. memory", snapshot.device.deviceMemoryGB ? `${snapshot.device.deviceMemoryGB} GB browser hint` : "Unavailable in this browser"], ["Touch", snapshot.input.touch ? "Available" : "Not detected"]]} /></Section>

      <Section id="display-input" icon={<Monitor className="h-5 w-5" />} title="Display & Input" description="Shared reactive viewport, orientation, pointer, and touch profile."><MetricGrid items={[["Viewport", `${snapshot.display.viewportWidth ?? "—"} × ${snapshot.display.viewportHeight ?? "—"}`], ["Browser screen", snapshot.display.screenWidth && snapshot.display.screenHeight ? `${snapshot.display.screenWidth} × ${snapshot.display.screenHeight}` : "Unavailable"], ["Pixel ratio", snapshot.display.devicePixelRatio?.toFixed(2) ?? "Unavailable"], ["Orientation", snapshot.display.orientation], ["Pointer", snapshot.input.finePointer ? "Fine" : snapshot.input.coarsePointer ? "Coarse" : "Unavailable"], ["Hover", snapshot.input.hover ? "Available" : "Not available"], ["Touch primary", snapshot.input.touchPrimary ? "Yes" : "No"], ["Keyboard likely", snapshot.input.keyboardLikely ? "Yes" : "Not assumed"]]} /></Section>

      <Section id="power" icon={<Gauge className="h-5 w-5" />} title="Power & Performance" description="Conservative adaptation from explicit Settings and optional browser hints."><MetricGrid items={[["Effective profile", snapshot.power.effective], ["Performance setting", snapshot.power.preference], ["Reduced Effects", snapshot.power.reducedEffects ? "Enabled" : "Disabled"], ["Reduced motion", snapshot.power.reducedMotion ? "Enabled" : "Disabled"], ["Data Saver", snapshot.network.saveData === undefined ? "Unavailable in this browser" : snapshot.network.saveData ? "Enabled" : "Disabled"], ["Battery", snapshot.power.battery.supported ? `${Math.round((snapshot.power.battery.level ?? 0) * 100)}% · ${snapshot.power.battery.charging ? "charging" : "on battery"}` : "Battery information unavailable in this browser"]]} /><Link href="/settings#system" className={`${buttonClass} mt-4`}>Adjust performance</Link></Section>

      <Section id="network" icon={<Network className="h-5 w-5" />} title="Network" description="Online state is reactive; connection quality values are optional browser hints."><MetricGrid items={[["State", snapshot.network.online ? <Status positive>Online</Status> : <Status warning>Offline</Status>], ["Information API", snapshot.network.informationSupported ? "Available" : "Unavailable in this browser"], ["Effective type", snapshot.network.effectiveType ?? "Unavailable"], ["Downlink hint", snapshot.network.downlinkMbps !== undefined ? `${snapshot.network.downlinkMbps} Mbps` : "Unavailable"], ["RTT hint", snapshot.network.rttMs !== undefined ? `${snapshot.network.rttMs} ms` : "Unavailable"], ["Save Data", snapshot.network.saveData === undefined ? "Unavailable" : snapshot.network.saveData ? "Enabled" : "Disabled"]]} /></Section>

      <Section id="storage" icon={<Database className="h-5 w-5" />} title="Storage" description="Browser-site storage only—not the device’s total disk capacity."><MetricGrid items={[["Local storage", snapshot.storage.localStorageAvailable ? "Available" : "Unavailable"], ["IndexedDB", snapshot.storage.indexedDBSupported ? "Supported" : "Unsupported"], ["Site usage", formatBytes(snapshot.storage.usageBytes)], ["Site quota", formatBytes(snapshot.storage.quotaBytes)], ["Persistent storage", snapshot.storage.persistent === undefined ? "Unavailable" : snapshot.storage.persistent ? "Persistent" : "Not persistent"], ["Estimate", snapshot.storage.estimateAvailable ? "Available" : "Unavailable in this browser"]]} /><div className="mt-4 flex flex-wrap gap-2"><button type="button" className={buttonClass} onClick={() => void system.refreshStorage().then(() => setNotice("Browser-site storage estimate refreshed."))}><RefreshCw className="h-4 w-4" />Refresh estimate</button>{snapshot.storage.storageManagerSupported && snapshot.storage.persistent === false ? <button type="button" className={buttonClass} onClick={() => void system.requestPersistentStorage().then((value) => setNotice(value ? "Persistent storage granted." : "The browser did not grant persistent storage."))}><ShieldCheck className="h-4 w-4" />Request persistence</button> : null}</div></Section>

      <Section id="capabilities" icon={<MousePointer2 className="h-5 w-5" />} title="Capabilities" description="Feature support, not native operating-system control."><div className="grid gap-2 sm:grid-cols-2">{capabilityRows.map(([name, available]) => <div key={name} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"><span className="text-sm text-white/56">{name}</span>{capabilityLabel(available)}</div>)}</div></Section>

      <Section id="install" icon={<Download className="h-5 w-5" />} title="Install & PWA" description="Installation controls appear only when the browser exposes a real prompt."><MetricGrid items={[["Current mode", snapshot.install.mode === "standalone" ? "Installed / standalone" : "Browser"], ["Install prompt", snapshot.install.installable ? "Available" : "Not currently offered"], ["Service Worker", !snapshot.install.serviceWorkerSupported ? "Unsupported" : snapshot.install.serviceWorkerRegistered ? "Registered" : "Supported · not registered"], ["Offline capability", snapshot.install.offlineCapable ? "Available" : "Not configured"]]} /><div className="mt-4 flex flex-wrap gap-2">{snapshot.install.installable ? <button type="button" className={buttonClass} onClick={() => void system.promptInstall().then((outcome) => setNotice(outcome === "accepted" ? "Cosmic installation accepted." : "Installation was not completed."))}><Download className="h-4 w-4" />Install Cosmic</button> : null}{snapshot.install.iosHomeScreenGuidance ? <p className="rounded-xl border border-white/9 bg-white/[0.035] p-3 text-sm leading-6 text-white/48">This browser may support adding Cosmic to the Home Screen through its Share menu. Cosmic cannot automate that step.</p> : null}</div></Section>

      <Section id="permissions" icon={<ShieldCheck className="h-5 w-5" />} title="Permissions & Actions" description="Every prompt or display-mode change requires an explicit click."><MetricGrid items={[["Notifications", snapshot.permissions.notifications], ["Geolocation", snapshot.permissions.geolocation], ["Wake Lock", snapshot.capabilities.wakeLock ? "Available · never automatic" : "Unavailable"], ["Fullscreen", snapshot.capabilities.fullscreen ? "Available" : "Unavailable"]]} /><div className="mt-4 flex flex-wrap gap-2">{snapshot.capabilities.notifications && snapshot.permissions.notifications === "default" ? <button type="button" className={buttonClass} onClick={() => void system.requestNotifications().then((value) => setNotice(`Notification permission: ${value}.`))}><Bell className="h-4 w-4" />Request notifications</button> : null}{snapshot.capabilities.fullscreen ? <button type="button" className={buttonClass} onClick={() => void system.enterFullscreen().then((entered) => setNotice(entered ? "Fullscreen entered." : "Fullscreen was not entered."))}><Maximize2 className="h-4 w-4" />Enter fullscreen</button> : null}</div></Section>

      <Section id="diagnostics" icon={<Clipboard className="h-5 w-5" />} title="Diagnostics" description="A privacy-safe summary with no user content, credentials, or exact device identity."><MetricGrid items={[["Cosmic build", COSMIC_APP_VERSION], ["Snapshot", snapshot.ready ? "Live" : "Initializing"], ["Celestial renderer", snapshot.ready && typeof document !== "undefined" ? `${document.querySelectorAll("[data-cosmic-global-background] canvas").length} canvas` : "Checking"], ["Profile override", snapshot.device.override]]} /><button type="button" className={`${buttonClass} mt-4`} onClick={() => void system.copyDiagnostics().then((copied) => setNotice(copied ? "Privacy-safe System diagnostics copied." : "Clipboard access is unavailable."))}><Clipboard className="h-4 w-4" />Copy System Diagnostics</button></Section>

      <Section id="readiness" icon={<Smartphone className="h-5 w-5" />} title="Display Readiness" description="Capability-based preparation for touch devices, installed PWAs, and future kiosk hardware."><MetricGrid items={[["Touch-first", snapshot.input.touchPrimary ? "Enabled" : "Not active"], ["Safe-area CSS", "Shared shell ready"], ["Display / kiosk", snapshot.display.profile === "display" ? "Active" : "Available through Settings"], ["Future Pi bridge", "Not installed · no unsafe OS endpoints"]]} /></Section>
    </div>
  </div>;
}
