"use client";

import { useDisplay } from "@/components/os/display";
import { useState } from "react";

import type { WidgetAccent } from "./types";
import type { WidgetPresentation } from "./WidgetContext";
import { getModuleVisualIdentity } from "./moduleVisualIdentity";

interface Props {
  accent: WidgetAccent;
  sceneState?: string;
  sceneVariant?: string;
  imageUrl?: string;
  imageFallbackUrls?: string[];
  imagePosition?: string;
  imageOpacity?: number;
  imageBlur?: number;
  presentation?: WidgetPresentation;
}

export default function WidgetBackground({
  accent,
  sceneState,
  sceneVariant,
  imageUrl,
  imageFallbackUrls = [],
  imagePosition = "center",
  imageOpacity = 0.38,
  imageBlur = 5,
  presentation = "dashboard",
}: Props) {
  const { tokens } = useDisplay();
  const visual = getModuleVisualIdentity(accent);
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);
  const isKiosk = presentation === "kiosk";
  const imageSource = [imageUrl, ...imageFallbackUrls].find((source) => source && !failedImageUrls.includes(source));

  return (
    <>
      {/* Main Accent */}
      <div className="cosmic-widget-panel kiosk-scene-surface absolute inset-0" data-cosmic-scene={accent} data-scene-state={sceneState} data-scene-variant={sceneVariant} style={{ background: isKiosk ? "var(--widget-panel, linear-gradient(145deg, rgba(10,17,39,.96), rgba(3,7,21,.92))" : "linear-gradient(145deg, rgba(10,17,39,.74), rgba(3,7,21,.68))" }} />
      {imageSource ? <img key={imageSource} className={`${isKiosk ? "kiosk-scene-image" : "dashboard-widget-image"} absolute inset-0 h-full w-full object-cover`} src={imageSource} alt="" aria-hidden="true" loading={isKiosk ? "eager" : "lazy"} onError={() => setFailedImageUrls((current) => current.includes(imageSource) ? current : [...current, imageSource])} style={{ objectPosition: imagePosition, opacity: isKiosk ? imageOpacity : Math.max(imageOpacity, .62), filter: isKiosk ? `blur(${imageBlur}px)` : undefined, "--kiosk-scene-image-opacity": imageOpacity } as React.CSSProperties} /> : null}
      {isKiosk ? <SceneIllustration accent={accent} sceneState={sceneState} /> : null}
      {isKiosk ? <div className={`cosmic-widget-motif kiosk-scene-motif cosmic-widget-motif-${visual.motif} absolute inset-0`} aria-hidden="true" /> : null}

      {/* Light Bloom */}
      <div
          className="
            kiosk-scene-glow
          absolute
          -left-24
          -top-24
          h-72
          w-72
          rounded-full
          bg-[color:var(--widget-accent)]
        "
        style={{
          filter: `blur(${tokens.blur * 2}px)`,
        }}
      />

      {/* Secondary Glow */}
      <div
          className="
            kiosk-scene-glow
          absolute
          bottom-0
          right-0
          h-56
          w-56
          rounded-full
          bg-[color:var(--widget-secondary)]
        "
        style={{
          filter: `blur(${tokens.blur * 2}px)`,
        }}
      />

      {/* Ambient Highlight */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-b
          from-white/[0.08]
          via-transparent
          to-transparent
        "
      />

      {/* Bottom Shadow */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/10
          via-transparent
          to-transparent
        "
      />
    </>
  );
}

function SceneIllustration({ accent, sceneState }: { accent: WidgetAccent; sceneState?: string }) {
  const stroke = "currentColor";
  const common = { className: "kiosk-scene-illustration absolute inset-0 h-full w-full", viewBox: "0 0 800 480", preserveAspectRatio: "xMidYMid slice", "aria-hidden": true } as const;
  if (accent === "weather") return <svg {...common} data-scene-state={sceneState}><path d="M0 365 Q170 295 340 360 T800 325 V480 H0Z" fill="rgba(5,15,32,.42)"/><path d="M0 405 Q200 350 410 410 T800 375" fill="none" stroke={stroke} strokeOpacity=".2" strokeWidth="2"/>{sceneState?.startsWith("clear-day") ? <><circle cx="650" cy="116" r="52" fill="currentColor" opacity=".2"/><path d="M603 116h94M650 69v94M617 83l66 66M683 83l-66 66" stroke={stroke} strokeOpacity=".25" strokeWidth="3"/></> : sceneState?.startsWith("clear-night") ? <><path d="M657 82a48 48 0 1 0 37 75 45 45 0 0 1-37-75Z" fill="currentColor" opacity=".28"/><g fill="currentColor" opacity=".55"><circle cx="112" cy="100" r="2"/><circle cx="180" cy="67" r="2"/><circle cx="260" cy="125" r="1.5"/><circle cx="540" cy="72" r="1.5"/></g></> : sceneState?.startsWith("rain") ? <><path d="M515 190c-8-38 25-66 59-56 18-42 83-39 96 8 39-7 64 35 43 65H485c-14-5-18-14-18-25Z" fill="currentColor" opacity=".16" stroke={stroke} strokeOpacity=".3" strokeWidth="3"/><g stroke={stroke} strokeOpacity=".35" strokeWidth="3"><path d="M535 235l-20 52M585 235l-20 52M635 235l-20 52M685 235l-20 52"/></g></> : sceneState?.startsWith("snow") ? <><path d="M495 190c0-35 35-59 67-50 25-42 87-27 91 18 37-5 61 39 35 67H508c-8-10-13-22-13-35Z" fill="currentColor" opacity=".15" stroke={stroke} strokeOpacity=".28" strokeWidth="3"/><g fill="currentColor" opacity=".5"><circle cx="540" cy="250" r="4"/><circle cx="590" cy="278" r="4"/><circle cx="645" cy="248" r="4"/><circle cx="695" cy="286" r="4"/></g></> : sceneState?.startsWith("thunder") ? <><path d="M480 188c0-37 37-63 71-50 23-47 91-28 93 22 38-7 65 37 38 70H493c-8-12-13-26-13-42Z" fill="currentColor" opacity=".16" stroke={stroke} strokeOpacity=".3" strokeWidth="3"/><path d="m612 220-29 62h28l-18 48 54-73h-29l25-37Z" fill="currentColor" opacity=".4"/></> : <path d="M500 195c0-37 34-62 69-51 24-44 88-30 93 17 39-5 64 39 40 69H510c-6-10-10-22-10-35Z" fill="currentColor" opacity=".15" stroke={stroke} strokeOpacity=".25" strokeWidth="3"/>}</svg>;
  if (accent === "clock") return <svg {...common}><g fill="currentColor" opacity=".48"><circle cx="116" cy="82" r="2"/><circle cx="188" cy="132" r="1.5"/><circle cx="690" cy="94" r="2"/><circle cx="748" cy="156" r="1.5"/></g><path d="M0 390 Q190 300 380 385 T800 345 V480 H0Z" fill="currentColor" opacity=".07"/><path d="M280 390a110 110 0 0 1 220 0" fill="none" stroke={stroke} strokeOpacity=".2" strokeWidth="2"/><path d="M390 390v-76M390 390l55 30" stroke={stroke} strokeOpacity=".32" strokeWidth="4" strokeLinecap="round"/></svg>;
  if (accent === "calendar") return <svg {...common}><rect x="520" y="90" width="190" height="220" rx="12" fill="currentColor" opacity=".06" stroke={stroke} strokeOpacity=".24" strokeWidth="3"/><path d="M520 145h190M555 70v43M675 70v43" stroke={stroke} strokeOpacity=".32" strokeWidth="5"/><path d="M550 180h130M550 220h130M550 260h130M592 160v128M635 160v128" stroke={stroke} strokeOpacity=".16" strokeWidth="2"/></svg>;
  if (accent === "garage") return <svg {...common}><path d="M190 350h420l-34-120c-8-27-31-44-59-44H283c-28 0-51 17-59 44Z" fill="currentColor" opacity=".1" stroke={stroke} strokeOpacity=".3" strokeWidth="4"/><path d="M230 255h340M275 205l-35 50M525 205l35 50M230 350v26M570 350v26" stroke={stroke} strokeOpacity=".3" strokeWidth="4"/><circle cx="270" cy="350" r="28" fill="#050914" stroke={stroke} strokeOpacity=".35" strokeWidth="4"/><circle cx="530" cy="350" r="28" fill="#050914" stroke={stroke} strokeOpacity=".35" strokeWidth="4"/></svg>;
  if (accent === "finance") return <svg {...common}><path d="M80 360h650" stroke={stroke} strokeOpacity=".15" strokeWidth="2"/><path d="M100 285 230 300 330 275 445 295 570 280 710 300" fill="none" stroke={stroke} strokeOpacity=".23" strokeWidth="4"/><path d="M100 285 230 300 330 275 445 295 570 280 710 300V360H100Z" fill="currentColor" opacity=".06"/><g stroke={stroke} strokeOpacity=".1"><path d="M100 160h610M100 240h610"/><path d="M220 100v260M340 100v260M460 100v260M580 100v260"/></g></svg>;
  if (accent === "music") return <svg {...common}><g fill="currentColor" opacity=".22"><rect x="120" y="300" width="18" height="70" rx="9"/><rect x="155" y="250" width="18" height="120" rx="9"/><rect x="190" y="180" width="18" height="190" rx="9"/><rect x="225" y="235" width="18" height="135" rx="9"/><rect x="260" y="285" width="18" height="85" rx="9"/><rect x="295" y="210" width="18" height="160" rx="9"/></g><path d="M98 385h640" stroke={stroke} strokeOpacity=".16" strokeWidth="2"/></svg>;
  if (accent === "notes") return <svg {...common}><path d="m530 85 150 35 30 220-165 30-35-220Z" fill="currentColor" opacity=".08" stroke={stroke} strokeOpacity=".25" strokeWidth="3"/><path d="m565 145 105 22M572 190l112 23M580 238l74 15" stroke={stroke} strokeOpacity=".25" strokeWidth="4"/></svg>;
  if (accent === "projects") return <svg {...common}><g stroke={stroke} strokeOpacity=".25" strokeWidth="3"><path d="M570 120 680 205 605 320 480 270 570 120Z"/><path d="M570 120 605 320M680 205 480 270"/></g><g fill="currentColor" opacity=".38"><circle cx="570" cy="120" r="9"/><circle cx="680" cy="205" r="9"/><circle cx="605" cy="320" r="9"/><circle cx="480" cy="270" r="9"/></g></svg>;
  if (accent === "school") return <svg {...common}><path d="m490 260 125-90 125 90Z" fill="currentColor" opacity=".1" stroke={stroke} strokeOpacity=".25" strokeWidth="3"/><path d="M530 260v105h170V260M575 365v-70h80v70M470 365h290" fill="none" stroke={stroke} strokeOpacity=".23" strokeWidth="4"/><path d="M615 155v-45" stroke={stroke} strokeOpacity=".3" strokeWidth="4"/></svg>;
  if (accent === "notifications") return <svg {...common}><rect x="535" y="115" width="190" height="70" rx="12" fill="currentColor" opacity=".1" stroke={stroke} strokeOpacity=".25" strokeWidth="3"/><rect x="490" y="205" width="190" height="70" rx="12" fill="currentColor" opacity=".07" stroke={stroke} strokeOpacity=".2" strokeWidth="3"/><path d="M565 145h110M520 235h110" stroke={stroke} strokeOpacity=".3" strokeWidth="4"/></svg>;
  if (accent === "briefing") return <svg {...common}><path d="M0 355 Q180 290 360 350 T800 315V480H0Z" fill="currentColor" opacity=".08"/><path d="M0 390 Q190 335 400 390 T800 360" fill="none" stroke={stroke} strokeOpacity=".22" strokeWidth="3"/><circle cx="650" cy="150" r="42" fill="currentColor" opacity=".12"/></svg>;
  if (accent === "sports") return <svg {...common}><path d="M95 365h610M160 310h480M220 255h360" stroke={stroke} strokeOpacity=".16" strokeWidth="3"/><path d="M400 365V175M210 365l190-190 190 190" fill="none" stroke={stroke} strokeOpacity=".22" strokeWidth="3"/></svg>;
  return null;
}
