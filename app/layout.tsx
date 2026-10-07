import type { Metadata, Viewport } from "next";

import "./globals.css";
import "@/styles/cosmos-foundation.css";
import "leaflet/dist/leaflet.css";

import { PerformanceProvider } from "@/components/os/performance";
import { OSProvider } from "@/components/os/core/OSProvider";
import { DisplayProvider } from "@/components/os/display";
import GlobalCosmicBackground from "@/components/os/background/GlobalCosmicBackground";
import { ClockProvider } from "@/components/apps/clock/ClockProvider";
import { SearchProvider } from "@/components/apps/search/SearchProvider";
import { SettingsProvider } from "@/components/apps/settings/SettingsProvider";
import { SystemProvider } from "@/components/os/system/SystemProvider";
import { AccountProvider } from "@/components/account/AccountProvider";
import { AdProvider } from "@/components/ads/AdProvider";
import { EntitlementsProvider } from "@/hooks/os/useEntitlements";
import { CosmicTransitionProvider } from "@/components/os/transition";
import { PersonalCosmicProvider } from "@/components/os/core/CosmicApplicationProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://cosmicpudge.shop"),
  title: {
    default: "Cosmos",
    template: "%s • Cosmos",
  },
  description: "Your personal workspace for school, life, projects, media, devices, and Cosmic AI.",
  alternates: { canonical: "/" },
  openGraph: { title: "Cosmos", description: "Your personal workspace for school, life, projects, media, devices, and Cosmic AI.", url: "https://cosmicpudge.shop", siteName: "Cosmos", type: "website" },
  robots: { index: true, follow: true },
  applicationName: "Cosmos",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Cosmic",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030511",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
       <head>
    <script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1471533859879343"
      crossOrigin="anonymous"
    />
  </head>
      <body className="isolate min-h-full overflow-x-hidden bg-[#030511] text-white">
        <PersonalCosmicProvider>
          <SettingsProvider>
            <AccountProvider>
              <EntitlementsProvider>
              <AdProvider>
                <SystemProvider>
                  <GlobalCosmicBackground />

                  <div className="relative z-10 min-h-screen">
                    <PerformanceProvider>
                      <OSProvider>
                        <DisplayProvider>
                          <ClockProvider>
                            <SearchProvider>
                              <CosmicTransitionProvider>
                                {children}
                              </CosmicTransitionProvider>
                            </SearchProvider>
                          </ClockProvider>
                        </DisplayProvider>
                      </OSProvider>
                    </PerformanceProvider>
                  </div>
                </SystemProvider>
              </AdProvider>
              </EntitlementsProvider>
            </AccountProvider>
          </SettingsProvider>
        </PersonalCosmicProvider>
      </body>
    </html>
  );
}
