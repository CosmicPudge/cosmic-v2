import type { CosmicIconName } from "@/components/cosmic-icons";
import type { WidgetAccent } from "./types";

export type WidgetMotif = "orbital" | "arena" | "calendar" | "telemetry" | "audio" | "document" | "progress" | "clock" | "atmosphere" | "ai" | "alert" | "communication" | "academic" | "signal" | "system" | "briefing" | "neutral";

export interface ModuleVisualIdentity {
  accent: string;
  secondaryAccent: string;
  panelGradient: string;
  borderGlow: string;
  statusColor: string;
  icon: CosmicIconName;
  motif: WidgetMotif;
  typography: "numeric" | "technical" | "editorial" | "standard";
}

const identity = (values: ModuleVisualIdentity) => values;

export const MODULE_VISUAL_IDENTITY: Record<WidgetAccent, ModuleVisualIdentity> = {
  default: identity({ accent: "#a78bfa", secondaryAccent: "#67e8f9", panelGradient: "linear-gradient(145deg, rgba(10,17,39,.96), rgba(3,7,21,.92))", borderGlow: "rgba(167,139,250,.28)", statusColor: "#a78bfa", icon: "dashboard", motif: "neutral", typography: "standard" }),
  weather: identity({ accent: "#67e8f9", secondaryAccent: "#60a5fa", panelGradient: "linear-gradient(145deg, rgba(5,24,49,.96), rgba(3,10,28,.92))", borderGlow: "rgba(103,232,249,.32)", statusColor: "#67e8f9", icon: "weather", motif: "atmosphere", typography: "numeric" }),
  calendar: identity({ accent: "#c084fc", secondaryAccent: "#818cf8", panelGradient: "linear-gradient(145deg, rgba(26,13,55,.96), rgba(7,8,28,.92))", borderGlow: "rgba(192,132,252,.32)", statusColor: "#c084fc", icon: "calendar", motif: "calendar", typography: "technical" }),
  sports: identity({ accent: "#34d399", secondaryAccent: "#facc15", panelGradient: "linear-gradient(145deg, rgba(5,29,28,.96), rgba(3,10,22,.92))", borderGlow: "rgba(52,211,153,.3)", statusColor: "#34d399", icon: "sports", motif: "arena", typography: "technical" }),
  garage: identity({ accent: "#60a5fa", secondaryAccent: "#a78bfa", panelGradient: "linear-gradient(145deg, rgba(7,21,48,.96), rgba(4,8,25,.92))", borderGlow: "rgba(96,165,250,.3)", statusColor: "#60a5fa", icon: "garage", motif: "telemetry", typography: "technical" }),
  school: identity({ accent: "#93c5fd", secondaryAccent: "#a78bfa", panelGradient: "linear-gradient(145deg, rgba(7,24,48,.96), rgba(3,9,25,.92))", borderGlow: "rgba(147,197,253,.28)", statusColor: "#93c5fd", icon: "school", motif: "academic", typography: "standard" }),
  cosmic: identity({ accent: "#67e8f9", secondaryAccent: "#a78bfa", panelGradient: "linear-gradient(145deg, rgba(8,20,49,.96), rgba(8,5,31,.92))", borderGlow: "rgba(103,232,249,.3)", statusColor: "#67e8f9", icon: "cosmic-ai", motif: "ai", typography: "editorial" }),
  projects: identity({ accent: "#a78bfa", secondaryAccent: "#22d3ee", panelGradient: "linear-gradient(145deg, rgba(21,12,48,.96), rgba(5,7,24,.92))", borderGlow: "rgba(167,139,250,.31)", statusColor: "#a78bfa", icon: "projects", motif: "progress", typography: "technical" }),
  notifications: identity({ accent: "#fb7185", secondaryAccent: "#f59e0b", panelGradient: "linear-gradient(145deg, rgba(40,10,29,.96), rgba(9,7,24,.92))", borderGlow: "rgba(251,113,133,.3)", statusColor: "#fb7185", icon: "notifications", motif: "alert", typography: "standard" }),
  notes: identity({ accent: "#c4b5fd", secondaryAccent: "#f0abfc", panelGradient: "linear-gradient(145deg, rgba(28,14,47,.96), rgba(8,7,25,.92))", borderGlow: "rgba(196,181,253,.3)", statusColor: "#c4b5fd", icon: "notes", motif: "document", typography: "editorial" }),
  outlook: identity({ accent: "#818cf8", secondaryAccent: "#60a5fa", panelGradient: "linear-gradient(145deg, rgba(9,19,52,.96), rgba(4,8,25,.92))", borderGlow: "rgba(129,140,248,.3)", statusColor: "#818cf8", icon: "outlook", motif: "communication", typography: "standard" }),
  system: identity({ accent: "#94a3b8", secondaryAccent: "#67e8f9", panelGradient: "linear-gradient(145deg, rgba(15,24,42,.96), rgba(4,8,22,.92))", borderGlow: "rgba(148,163,184,.24)", statusColor: "#94a3b8", icon: "system", motif: "system", typography: "technical" }),
  music: identity({ accent: "#f0abfc", secondaryAccent: "#c084fc", panelGradient: "linear-gradient(145deg, rgba(39,10,48,.96), rgba(12,6,28,.92))", borderGlow: "rgba(240,171,252,.32)", statusColor: "#f0abfc", icon: "music", motif: "audio", typography: "editorial" }),
  search: identity({ accent: "#67e8f9", secondaryAccent: "#2dd4bf", panelGradient: "linear-gradient(145deg, rgba(5,30,39,.96), rgba(3,9,25,.92))", borderGlow: "rgba(103,232,249,.3)", statusColor: "#67e8f9", icon: "search", motif: "signal", typography: "technical" }),
  briefing: identity({ accent: "#e879f9", secondaryAccent: "#a78bfa", panelGradient: "linear-gradient(145deg, rgba(36,10,47,.96), rgba(8,7,27,.92))", borderGlow: "rgba(232,121,249,.3)", statusColor: "#e879f9", icon: "dashboard", motif: "briefing", typography: "editorial" }),
  clock: identity({ accent: "#c4b5fd", secondaryAccent: "#67e8f9", panelGradient: "linear-gradient(145deg, rgba(15,15,43,.96), rgba(3,7,23,.92))", borderGlow: "rgba(196,181,253,.3)", statusColor: "#c4b5fd", icon: "clock", motif: "clock", typography: "numeric" }),
  finance: identity({ accent: "#8b5cf6", secondaryAccent: "#22d3ee", panelGradient: "linear-gradient(145deg, rgba(18,11,47,.96), rgba(3,8,27,.92))", borderGlow: "rgba(139,92,246,.34)", statusColor: "#22d3ee", icon: "finance", motif: "orbital", typography: "numeric" }),
};

export function getModuleVisualIdentity(accent: WidgetAccent) {
  return MODULE_VISUAL_IDENTITY[accent] ?? MODULE_VISUAL_IDENTITY.default;
}

