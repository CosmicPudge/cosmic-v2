"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { authReturnUrl } from "@/services/auth/returnUrl";
import { useCosmicAccount } from "./AccountProvider";

export default function AuthenticatedGate({ children }: { children: React.ReactNode }) {
  const { account, loading, sessionUnavailable, refresh } = useCosmicAccount();
  const pathname = usePathname() ?? "/os";
  const router = useRouter();
  useEffect(() => { if (pathname !== "/os/kiosk" && !loading && !account) router.replace(`/account?returnTo=${encodeURIComponent(authReturnUrl(pathname))}`); }, [account, loading, pathname, router]);
  if (pathname === "/os/kiosk") return children;
  if (loading) return <main className="grid min-h-screen place-items-center bg-transparent px-6 text-center text-sm text-white/55" aria-busy="true">Resolving Cosmic account session…</main>;
  if (sessionUnavailable) return <main className="grid min-h-screen place-items-center bg-transparent px-6 text-center text-sm text-white/55"><div><p>Cosmic couldn’t verify your session right now.</p><button type="button" onClick={() => void refresh()} className="mt-4 rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-cyan-50">Try again</button></div></main>;
  if (!account) return <main className="grid min-h-screen place-items-center bg-transparent px-6 text-center text-sm text-white/55" aria-busy="true">Resolving Cosmic account session…</main>;
  return children;
}
