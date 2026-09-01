import type { ReactNode } from "react";

export type SchoolEnvironmentTheme = "usu-campus" | "usu-stadium" | "usu-night" | "minimal" | "custom";

export function SchoolEnvironment({ children, theme = "usu-campus" }: { children: ReactNode; theme?: SchoolEnvironmentTheme }) {
  return <div className={`school-environment school-environment-${theme}`}><div className="school-environment-media" aria-hidden="true" /><div className="school-environment-overlay" aria-hidden="true" /><div className="school-environment-atmosphere" aria-hidden="true" /><div className="school-environment-content">{children}</div></div>;
}

export function SchoolGlassPanel({ children, className = "", dense = false, glow = false }: { children: ReactNode; className?: string; dense?: boolean; glow?: boolean }) {
  return <section className={`school-glass-panel ${dense ? "school-glass-panel-dense" : ""} ${glow ? "school-glass-panel-glow" : ""} ${className}`}>{children}</section>;
}
