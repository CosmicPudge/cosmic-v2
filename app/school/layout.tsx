import type { ReactNode } from "react";
import { SchoolLayout } from "@/components/school/layout/SchoolLayout";
import { SchoolDataProvider } from "@/components/school/context/SchoolDataContext";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { getSchoolAccess } from "@/services/school/access";

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("cookie", (await cookies()).toString());
  const account = await getCurrentCosmicAccount(new Request("http://cosmic.local/school", { headers: requestHeaders }));
  if (!getSchoolAccess(account).enabled) notFound();
  return <SchoolDataProvider><SchoolLayout>{children}</SchoolLayout></SchoolDataProvider>;
}
