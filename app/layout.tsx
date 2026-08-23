import { Geist, Geist_Mono } from "next/font/google";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="isolate min-h-full overflow-x-hidden bg-[#030511] text-white">
        <SettingsProvider>
          <AccountProvider>
          <SystemProvider>
            <GlobalCosmicBackground />
            <div className="relative z-10 min-h-screen">
              <PerformanceProvider>
                <OSProvider>
                  <DisplayProvider>
                    <ClockProvider>
                      <SearchProvider>
                        {children}
                      </SearchProvider>
                    </ClockProvider>
                  </DisplayProvider>
                </OSProvider>
              </PerformanceProvider>
            </div>
          </SystemProvider>
          </AccountProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
