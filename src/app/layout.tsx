import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppDataProvider } from "@/lib/app-data-context";
import { SettingsApplier } from "@/components/SettingsApplier";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Call of Cthulhu Keeper",
  description: "Local-first AI Keeper for Call of Cthulhu sessions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} bg-[var(--bg)] text-[color:var(--text-primary)]`}>
        <AppDataProvider>
          <SettingsApplier />
          {children}
        </AppDataProvider>
      </body>
    </html>
  );
}
