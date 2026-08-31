import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentCosmicAccount } from "@/services/auth/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const source = await headers();
  const host = source.get("host") ?? "localhost";
  const protocol = source.get("x-forwarded-proto") ?? "http";
  const account = await getCurrentCosmicAccount(new Request(`${protocol}://${host}/`, { headers: new Headers(source) }));
  redirect(account ? "/os" : "/account");
}
