import { SchoolOverviewView } from "@/components/school/SchoolCrudViews";
import AdSlot from "@/components/ads/AdSlot";

export default function SchoolPage() {
  return <><SchoolOverviewView /><div className="mx-auto max-w-6xl px-6"><AdSlot placementId="school.overview.inline" /></div></>;
}
