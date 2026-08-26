"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { authReturnUrl } from "@/services/auth/returnUrl";
import { useCosmicAccount } from "./AccountProvider";

export default function AuthenticatedGate({ children }: { children: React.ReactNode }) {
  const { account, loading } = useCosmicAccount();
  const pathname = usePathname() ?? "/os";
  const router = useRouter();
  useEffect(() => { if (pathname !== "/os/kiosk" && !loading && !account) router.replace(`/account?returnTo=${encodeURIComponent(authReturnUrl(pathname))}`); }, [account, loading, pathname, router]);
  if (pathname === "/os/kiosk") return children;
  if (loading || !account) return <main className="grid min-h-screen place-items-center bg-transparent px-6 text-center text-sm text-white/55" aria-busy="true">Resolving Cosmic account session…</main>;
  return children;
}
