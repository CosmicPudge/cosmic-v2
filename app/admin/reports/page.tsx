import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/os/app/AppShell";
import AdminReports from "@/components/admin/AdminReports";
import { requireAdmin } from "@/services/admin/auth";
export default async function AdminReportsPage() { const source = await headers(); const host = source.get("host") ?? "localhost"; const protocol = source.get("x-forwarded-proto") ?? "http"; try { await requireAdmin(new Request(`${protocol}://${host}/admin/reports`, { headers: new Headers(source) })); } catch { redirect("/account"); } return <AppShell><AdminReports /></AppShell>; }
