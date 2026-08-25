import type { ReactNode } from "react";
import AuthenticatedGate from "@/components/account/AuthenticatedGate";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-transparent text-white">
      <AuthenticatedGate>{children}</AuthenticatedGate>
    </div>
  );
}
