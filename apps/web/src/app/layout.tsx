import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WealthLens — Private Portfolio Intelligence",
  description:
    "WealthLens links your Sharekhan account to advisor-grade Buy/Sell/Hold intelligence — read-only, encrypted, and always in your control.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-ink bg-noise font-sans text-parchment antialiased">
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
