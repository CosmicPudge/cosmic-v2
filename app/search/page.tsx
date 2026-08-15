import type { Metadata } from "next";

import SearchPageView from "@/components/apps/search/SearchPageView";

export const metadata: Metadata = {
  title: "Search",
  description: "Find apps and data across Cosmic OS.",
};

export default function SearchPage() {
  return <SearchPageView />;
}
