import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/services/admin/auth";
import { DonutAdmin } from "@/components/donuts/DonutAdmin";

export default async function DonutAdminPage() {
  const source = await headers(); const host = source.get("host") ?? "localhost"; const protocol = source.get("x-forwarded-proto") ?? "http";
  try { await requireAdmin(new Request(`${protocol}://${host}/donuts/admin`, { headers: new Headers(source) })); } catch { redirect("/account"); }
  return <DonutAdmin />;
}
