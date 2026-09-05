"use client";

export default function DashboardEnvironment({ reducedMotion = false }: { weather?: unknown; reducedMotion?: boolean }) {
  return <div className="dashboard-environment" data-reduced-motion={reducedMotion || undefined} aria-hidden="true"><div className="dashboard-environment-nebula" /><div className="dashboard-environment-stars" /><div className="dashboard-environment-veil" /></div>;
}
