import type { Metadata, Viewport } from "next";

import "./globals.css";
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

export const metadata: Metadata = {
  title: {
    default: "Cosmic OS",
    template: "%s • Cosmic OS",
  },
  description: "The Cosmic desktop experience.",
  applicationName: "Cosmic OS",
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
      </body>
    </html>
  );
}