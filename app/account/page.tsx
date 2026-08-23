import type { Metadata } from "next";

import AccountView from "@/components/account/AccountView";
import AppShell from "@/components/os/app/AppShell";
import LegalFooter from "@/components/legal/LegalFooter";

export const metadata: Metadata = { title: "Account", description: "Manage your Cosmic account and private data scope." };

export default function AccountPage() { return <><AppShell><AccountView /></AppShell><LegalFooter /></>; }
