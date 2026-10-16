import SchoolSection from "@/components/school/SchoolSection";

// M2 is manual-first. The supported Canvas connection is the personal iCal
// assignment feed inside SchoolSection Settings; no Canvas API token setup.
export default function SchoolSettingsPage() {
  return <SchoolSection section="Settings" />;
}
