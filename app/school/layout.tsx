import type { ReactNode } from "react";
import { SchoolLayout } from "@/components/school/layout/SchoolLayout";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <SchoolLayout>{children}</SchoolLayout>;
}