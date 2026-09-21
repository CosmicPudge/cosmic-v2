import type { ReactNode } from "react";
import { SchoolLayout } from "@/components/school/layout/SchoolLayout";
import { SchoolDataProvider } from "@/components/school/context/SchoolDataContext";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireSchoolPagePresentation } from "@/services/school/pagePresentation";

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const requestHeaders = new Headers(await headers());
  const requestCookies = await cookies();
  requestHeaders.set("cookie", requestCookies.toString());
  const host = requestHeaders.get("host");
  if (!host) notFound();
  try {
    await requireSchoolPagePresentation(
      new Request(`${process.env.NODE_ENV === "development" ? "http" : "https"}://${host}/school`, { headers: requestHeaders }),
      Boolean(requestCookies.get("cosmic_session")?.value),
    );
  } catch {
    notFound();
  }
  return <SchoolDataProvider><SchoolLayout>{children}</SchoolLayout></SchoolDataProvider>;
}
