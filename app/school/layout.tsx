import type { ReactNode } from "react";
import { SchoolLayout } from "@/components/school/layout/SchoolLayout";
import { SchoolDataProvider } from "@/components/school/context/SchoolDataContext";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireSchoolAccessContext } from "@/services/school/access";

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("cookie", (await cookies()).toString());
  const host = requestHeaders.get("host");
  if (!host) notFound();
  try {
    await requireSchoolAccessContext(new Request(`${process.env.NODE_ENV === "development" ? "http" : "https"}://${host}/school`, { headers: requestHeaders }));
  } catch {
    notFound();
  }
  return <SchoolDataProvider><SchoolLayout>{children}</SchoolLayout></SchoolDataProvider>;
}
