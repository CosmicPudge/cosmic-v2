import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SchoolCard, SchoolEmptyState } from "@/components/school/SchoolCard";
import type { SchoolRecommendation } from "@/lib/school/types";

export function AIRecommendationsCard({ recommendations }: { recommendations: SchoolRecommendation[] }) {
  return (
    <SchoolCard title="Suggested next moves" eyebrow="Cosmic intelligence">
      <ul className="space-y-3">
        {recommendations.slice(0, 3).map((recommendation) => (
          <li key={recommendation.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <div className="flex gap-3"><Sparkles className="mt-0.5 size-4 shrink-0 text-sky-100/80" aria-hidden="true" /><div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-white">{recommendation.title}</h3><p className="mt-1.5 text-xs leading-5 text-white/55">{recommendation.explanation}</p><Link href={recommendation.href} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-100 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">{recommendation.actionLabel}<ArrowRight className="size-3.5" aria-hidden="true" /></Link></div></div>
          </li>
        ))}
        {recommendations.length === 0 && <li><SchoolEmptyState>Recommendations will appear once Cosmic has enough connected academic context.</SchoolEmptyState></li>}
      </ul>
    </SchoolCard>
  );
}
