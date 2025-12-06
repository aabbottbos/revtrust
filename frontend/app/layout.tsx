import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineDetector } from "@/components/offline-detector";
import "./globals.css";

// Inter for headings (page titles, section headers, navigation)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Switzer for body text (paragraphs, form labels, table content)
const switzer = localFont({
  src: [
    {
      path: "./fonts/Switzer-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Switzer-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Switzer-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-switzer",
  display: "swap",
});

// Inter Tight for metrics, buttons, badges, tags
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RevTrust - Sales Pipeline Hygiene",
  description: "Turn messy pipeline data into accurate forecasts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${switzer.variable} ${interTight.variable}`}>
          <OfflineDetector />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
