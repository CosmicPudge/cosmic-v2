import Link from "next/link";
import AppHeader from "@/components/os/app/AppHeader";
import CosmicCard from "@/design-system/components/CosmicCard";
import SchoolTabs from "@/components/school/SchoolTabs";

export default function SchoolAnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <AppHeader
        eyebrow="School"
        title="Analytics"
        subtitle="Academic trends and deeper performance insights will be built during the School milestone."
      />
      <SchoolTabs />
      <CosmicCard className="p-6">
        <p className="text-sm text-white/55">The Analytics route is connected and ready for the Milestone 2 analytics pass.</p>
        <Link href="/school" className="mt-4 inline-flex rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05]">
          Back to School overview
        </Link>
      </CosmicCard>
    </div>
  );
}
