import Link from "next/link";

export default function SportsFooter({ partial, updatedAt }: { partial: boolean; updatedAt?: Date }) {
  return (
    <div className="flex items-center justify-between text-xs text-white/50">
      <Link href="/sports" className="text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">Open Sports</Link>
      <span>{partial ? "Partial data" : updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Ready"}</span>
    </div>
  );
}
