import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const serifFont = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const sansFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#111111",
};

export const metadata: Metadata = {
  title: "PropFlow — AI-Powered Real Estate Operating System & CRM",
  description:
    "A modern real estate operating system combining automated property portal scraping, AI lead-to-property matching, deal pipeline CRM, and team workflows.",
  keywords: [
    "PropFlow",
    "Real Estate Scraper",
    "Real Estate CRM",
    "AI Real Estate Intelligence",
    "Playwright Property Scraper",
    "Property Matching AI",
    "Broker CRM",
  ],
  authors: [{ name: "PropFlow Team" }],
  creator: "PropFlow",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serifFont.variable} ${sansFont.variable} ${interFont.variable} scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#111111] selection:bg-[#F5C238] selection:text-black font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
