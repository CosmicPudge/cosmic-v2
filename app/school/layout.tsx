import type { ReactNode } from "react";
import { SchoolLayout } from "@/components/school/layout/SchoolLayout";
import { SchoolDataProvider } from "@/components/school/context/SchoolDataContext";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <SchoolDataProvider><SchoolLayout>{children}</SchoolLayout></SchoolDataProvider>;
}
