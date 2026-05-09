import type { Metadata } from "next";
import { Suspense } from "react";
import { Outfit, Amiri_Quran, Scheherazade_New, Playfair_Display, Crimson_Text, Noto_Sans_Arabic, Noto_Naskh_Arabic, Lateef, Gulzar } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import MountedGuard from "@/components/MountedGuard";
import BottomNav from "@/components/BottomNav";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const amiriQuran = Amiri_Quran({
  weight: "400",
  subsets: ["arabic"],
  variable: "--font-amiri-quran",
  display: "swap",
});

const scheherazade = Scheherazade_New({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-scheherazade",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const crimson = Crimson_Text({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-crimson",
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
});

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-naskh",
  display: "swap",
});

const lateef = Lateef({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-lateef",
  display: "swap",
});

const gulzar = Gulzar({
  weight: "400",
  subsets: ["arabic"],
  variable: "--font-gulzar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HIDAYAH | Reflections & Community",
  description: "A premium scholarly sanctuary for Islamic reflections.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hidayah",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F2EBE1",
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-strategy"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('hidayah-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className={`${outfit.variable} ${amiriQuran.variable} ${scheherazade.variable} ${playfair.variable} ${crimson.variable} ${notoArabic.variable} ${notoNaskh.variable} ${lateef.variable} ${gulzar.variable} font-sans antialiased`}>
        <MountedGuard>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </MountedGuard>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
