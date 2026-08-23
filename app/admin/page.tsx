import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/os/app/AppShell";
import AdminConsole from "@/components/admin/AdminConsole";
import { requireAdmin } from "@/services/admin/auth";

export default async function AdminPage() { const source = await headers(); const host = source.get("host") ?? "localhost"; const protocol = source.get("x-forwarded-proto") ?? "http"; try { await requireAdmin(new Request(`${protocol}://${host}/admin`, { headers: new Headers(source) })); } catch { redirect("/account"); } return <AppShell><div className="mx-auto flex max-w-6xl justify-end gap-3 px-6 pt-5"><Link href="/admin/reports" className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-sm text-cyan-50">Bug Reports</Link><Link href="/admin/audit" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70">Audit Log</Link></div><AdminConsole /></AppShell>; }
