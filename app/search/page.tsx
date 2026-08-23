import type { Metadata } from "next";

import SearchPageView from "@/components/apps/search/SearchPageView";
import AdSlot from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "Search",
  description: "Find apps and data across Cosmic OS.",
};

export default function SearchPage() {
  return <><SearchPageView /><div className="mx-auto max-w-5xl px-3 sm:px-7 lg:px-10"><AdSlot placementId="search.results.inline" /></div></>;
}
