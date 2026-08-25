export default function CosmicIconBadge({ count, live = false }: { count?: number; live?: boolean }) {
  if (live) return <span className="cosmic-icon-live-dot" aria-label="Live" />;
  if (count === undefined) return null;
  return <span className="cosmic-icon-badge">{count > 99 ? "99+" : count}</span>;
}

