import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MacroTrack – Smart Nutrition Tracker",
  description:
    "Track your daily macros — saturated fat, protein, carbs, and calories — powered by USDA FoodData Central.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={outfit.variable}
      style={{ colorScheme: "dark", backgroundColor: "#080f1a" }}
    >
      <body style={{ margin: 0 }}>
        {/* Wrapper div ensures the dark background is applied even if
            browser extensions inject classes on <body> causing hydration
            mismatches that would strip server-rendered body classes. */}
        <div
          style={{
            minHeight: "100dvh",
            backgroundColor: "#080f1a",
            color: "#e2e8f0",
            fontFamily: "var(--font-sans)",
          }}
        >
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </div>
      </body>
    </html>
  );
}
