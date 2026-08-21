import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import FinanceView from "@/components/apps/finance/FinanceView";

export default function FinancePage() {
  return <AppShell><AppHeader title="Finance" subtitle="Manual records and account registers" /><AppContent><FinanceView /></AppContent></AppShell>;
}
