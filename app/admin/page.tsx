import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/os/app/AppShell";
import AdminConsole from "@/components/admin/AdminConsole";
import { requireAdmin } from "@/services/admin/auth";

export default async function AdminPage() { const source = await headers(); const host = source.get("host") ?? "localhost"; const protocol = source.get("x-forwarded-proto") ?? "http"; try { await requireAdmin(new Request(`${protocol}://${host}/admin`, { headers: new Headers(source) })); } catch { redirect("/account"); } return <AppShell><AdminConsole /></AppShell>; }
