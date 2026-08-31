import type { Metadata } from "next";

import AccountView from "@/components/account/AccountView";
import LegalFooter from "@/components/legal/LegalFooter";
import { safeReturnUrl } from "@/services/auth/returnUrl";

export const metadata: Metadata = { title: "Account", description: "Manage your Cosmic account and private data scope." };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const params = await searchParams;
  return <><AccountView returnTo={safeReturnUrl(params.returnTo)} /><LegalFooter /></>;
}
