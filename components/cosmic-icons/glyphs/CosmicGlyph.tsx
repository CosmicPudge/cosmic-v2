"use client";

import { useId, type ReactNode } from "react";
import type { CosmicIconName, CosmicWeatherCondition } from "../types";

interface Props {
  name: CosmicIconName;
  condition?: CosmicWeatherCondition;
  className?: string;
  active?: boolean;
}

function Frame({ children, id, active }: { children: ReactNode; id: string; active?: boolean }) {
  return <><defs><linearGradient id={`${id}-violet`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={active ? "#e9d5ff" : "#c084fc"} /><stop offset=".48" stopColor="#8b5cf6" /><stop offset="1" stopColor="#2563eb" /></linearGradient><linearGradient id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a5f3fc" /><stop offset="1" stopColor="#2563eb" /></linearGradient><filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>{children}</>;
}

function WeatherGlyph({ id, condition }: { id: string; condition?: CosmicWeatherCondition }) {
  const rainy = condition === "rain" || condition === "heavy-rain" || condition === "thunderstorm";
  const snowy = condition === "snow";
  const sunny = condition === "clear-day" || condition === "sunrise" || condition === "sunset";
  return <g filter={`url(#${id}-shadow)`}>{(sunny || condition === "partly-cloudy") && <circle cx="22" cy="22" r="8" fill="#fbbf24" opacity=".95" />}<path d="M15 47h27c6 0 10-4 10-9 0-5-4-9-9-9a14 14 0 0 0-25-2 10 10 0 0 0-3 20Z" fill={`url(#${id}-blue)`} stroke="#dbeafe" strokeWidth="2" />{rainy && <g stroke="#67e8f9" strokeWidth="3" strokeLinecap="round"><path d="m22 53-3 6" /><path d="m34 53-3 6" /><path d="m46 53-3 6" /></g>}{snowy && <g fill="#e0f2fe"><circle cx="23" cy="57" r="2" /><circle cx="35" cy="59" r="2" /><circle cx="47" cy="56" r="2" /></g>}{condition === "thunderstorm" && <path d="m36 46-6 11h6l-3 8 10-14h-6l5-5Z" fill="#facc15" />}</g>;
}

export default function CosmicGlyph({ name, condition, className, active }: Props) {
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const common = { className, viewBox: "0 0 72 72", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true } as const;
  const violet = `url(#${id}-violet)`;
  const blue = `url(#${id}-blue)`;
  const frame = (children: ReactNode) => <svg {...common}><Frame id={id} active={active}>{children}</Frame></svg>;

  switch (name) {
    case "dashboard": return frame(<g filter={`url(#${id}-shadow)`}><rect x="10" y="12" width="23" height="21" rx="5" fill={violet} /><rect x="39" y="12" width="23" height="21" rx="5" fill={blue} /><rect x="10" y="39" width="23" height="21" rx="5" fill={blue} /><rect x="39" y="39" width="23" height="21" rx="5" fill={violet} /><path d="M36 25v22M25 36h22" stroke="#f5f3ff" strokeOpacity=".8" strokeWidth="2" /></g>);
    case "search": return frame(<g filter={`url(#${id}-shadow)`}><circle cx="31" cy="30" r="17" fill="url(#${id}-blue)" stroke="#e0e7ff" strokeWidth="2" /><circle cx="27" cy="26" r="8" fill="#0b1737" opacity=".72" /><path d="m44 44 14 14" stroke={violet} strokeWidth="8" strokeLinecap="round" /><path d="m44 44 14 14" stroke="#f5f3ff" strokeOpacity=".65" strokeWidth="2" strokeLinecap="round" /></g>);
    case "calendar": return frame(<g filter={`url(#${id}-shadow)`}><rect x="11" y="16" width="50" height="45" rx="8" fill="#0b1737" stroke={violet} strokeWidth="3" /><path d="M11 29h50" stroke="#c4b5fd" strokeWidth="3" /><path d="M22 11v10M50 11v10" stroke="#e9d5ff" strokeWidth="5" strokeLinecap="round" /><g fill="#67e8f9"><circle cx="23" cy="39" r="2" /><circle cx="35" cy="39" r="2" /><circle cx="47" cy="39" r="2" /></g><circle cx="35" cy="51" r="5" fill={violet} /></g>);
    case "gmail": case "outlook": return frame(<g filter={`url(#${id}-shadow)`}><rect x="9" y="18" width="54" height="38" rx="8" fill="#0b1737" stroke={violet} strokeWidth="3" /><path d="m12 23 24 20 24-20" stroke="#f5f3ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 51 29 36M60 51 43 36" stroke={blue} strokeWidth="5" strokeLinecap="round" /></g>);
    case "projects": return frame(<g filter={`url(#${id}-shadow)`}><path d="M12 24a6 6 0 0 1 6-6h13l6 6h17a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6Z" fill="#0b1737" stroke={violet} strokeWidth="3" /><path d="M13 29h46" stroke="#c4b5fd" strokeWidth="3" /><circle cx="51" cy="39" r="4" fill="#22d3ee" /><path d="m25 43 6 6 14-14" stroke={blue} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>);
    case "school": return frame(<g filter={`url(#${id}-shadow)`}><path d="m8 29 28-15 28 15-28 15Z" fill={blue} stroke="#dbeafe" strokeWidth="2" /><path d="M19 35v12c10 8 24 8 34 0V35" fill={violet} stroke="#c4b5fd" strokeWidth="2" /><path d="M63 29v16" stroke="#e0e7ff" strokeWidth="3" /><path d="M63 46c-5 2-5 7 0 9 5-2 5-7 0-9Z" fill="#f0abfc" /></g>);
    case "sports": return frame(<g filter={`url(#${id}-shadow)`}><path d="M18 20h11v19c0 7 4 11 7 13 3-2 7-6 7-13V20h11v20c0 10-7 17-18 22-11-5-18-12-18-22Z" fill={violet} stroke="#f5f3ff" strokeWidth="2" /><path d="M18 24H9v8c0 8 6 12 14 12M54 24h9v8c0 8-6 12-14 12" stroke={blue} strokeWidth="5" strokeLinecap="round" /><path d="M29 61h14" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" /></g>);
    case "garage": return frame(<g filter={`url(#${id}-shadow)`}><path d="m10 42 6-16a7 7 0 0 1 7-5h26a7 7 0 0 1 7 5l6 16v12H10Z" fill={violet} stroke="#e0e7ff" strokeWidth="2" /><path d="m20 28 5-5h22l5 5" stroke={blue} strokeWidth="4" /><path d="M18 40h36" stroke="#0b1737" strokeWidth="5" /><circle cx="21" cy="54" r="6" fill="#07102b" stroke="#67e8f9" strokeWidth="3" /><circle cx="51" cy="54" r="6" fill="#07102b" stroke="#67e8f9" strokeWidth="3" /></g>);
    case "notes": return frame(<g filter={`url(#${id}-shadow)`}><rect x="15" y="10" width="42" height="52" rx="5" fill="#0b1737" stroke={violet} strokeWidth="3" /><path d="M23 24h26M23 34h26M23 44h17" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" /><path d="m48 47 11-11 5 5-11 11-7 2Z" fill={blue} stroke="#e0e7ff" strokeWidth="2" /></g>);
    case "music": return frame(<g filter={`url(#${id}-shadow)`}><path d="M39 15v34a10 10 0 1 1-7-9V23l27-7v26a10 10 0 1 1-7-9V15Z" fill={violet} stroke="#f5f3ff" strokeWidth="2" /><path d="M17 33v12M23 29v17M29 34v9" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" /></g>);
    case "files": return frame(<g filter={`url(#${id}-shadow)`}><path d="M9 22a7 7 0 0 1 7-7h16l6 7h18a7 7 0 0 1 7 7v25a7 7 0 0 1-7 7H16a7 7 0 0 1-7-7Z" fill={blue} stroke="#dbeafe" strokeWidth="2" /><path d="M9 29h54" stroke={violet} strokeWidth="4" /><circle cx="23" cy="44" r="5" fill="#c4b5fd" /></g>);
    case "clock": return frame(<g filter={`url(#${id}-shadow)`}><circle cx="36" cy="36" r="24" fill="#0b1737" stroke={violet} strokeWidth="4" /><circle cx="36" cy="36" r="4" fill="#67e8f9" /><path d="M36 36V21M36 36l11 7" stroke="#f5f3ff" strokeWidth="4" strokeLinecap="round" /><path d="M36 7v5M65 36h-5M36 65v-5M7 36h5" stroke={blue} strokeWidth="3" strokeLinecap="round" /></g>);
    case "finance": case "data": return frame(<g filter={`url(#${id}-shadow)`}><path d="M13 57V36h10v21ZM31 57V23h10v34ZM49 57V13h10v44Z" fill={violet} /><path d="M12 20c10 8 17-3 25 3 8 5 13-6 24-10" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" /><circle cx="59" cy="13" r="4" fill="#f5f3ff" /></g>);
    case "weather": return frame(<WeatherGlyph id={id} condition={condition} />);
    case "cosmic-ai": return frame(<g filter={`url(#${id}-shadow)`}><circle cx="36" cy="36" r="16" fill={violet} /><path d="m36 12 4 17 17 7-17 4-4 18-4-18-17-4 17-7Z" fill="#f5f3ff" opacity=".9" /><ellipse cx="36" cy="36" rx="29" ry="12" stroke="#67e8f9" strokeWidth="2" opacity=".65" transform="rotate(-24 36 36)" /><circle cx="58" cy="21" r="3" fill="#fbbf24" /></g>);
    case "settings": return frame(<g filter={`url(#${id}-shadow)`}><rect x="12" y="17" width="48" height="9" rx="4" fill={violet} /><rect x="12" y="32" width="48" height="9" rx="4" fill={blue} /><rect x="12" y="47" width="48" height="9" rx="4" fill={violet} /><circle cx="28" cy="21.5" r="6" fill="#f5f3ff" /><circle cx="48" cy="36.5" r="6" fill="#f5f3ff" /><circle cx="36" cy="51.5" r="6" fill="#f5f3ff" /></g>);
    case "notifications": return frame(<g filter={`url(#${id}-shadow)`}><path d="M19 49h34l-4-7V30a13 13 0 0 0-26 0v12Z" fill={violet} stroke="#f5f3ff" strokeWidth="2" /><path d="M30 55c2 5 10 5 12 0" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" /><circle cx="53" cy="17" r="7" fill="#fb7185" stroke="#f5f3ff" strokeWidth="2" /></g>);
    default: return frame(<g filter={`url(#${id}-shadow)`}><circle cx="36" cy="36" r="23" fill={violet} stroke="#e0e7ff" strokeWidth="2" /><circle cx="36" cy="36" r="7" fill="#0b1737" stroke="#67e8f9" strokeWidth="3" /><path d="M36 11v8M36 53v8M11 36h8M53 36h8" stroke="#f5f3ff" strokeWidth="3" strokeLinecap="round" /></g>);
  }
}
