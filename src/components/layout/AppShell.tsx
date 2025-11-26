"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GearIcon, HomeIcon } from "@radix-ui/react-icons";
import React from "react";
import { clsx } from "clsx";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const showHome = pathname !== "/";
  const isOnSettingsPage = pathname === "/settings";
  return (
    <div className="min-h-screen px-5 py-6 sm:px-10">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showHome && (
            <Link
              href="/"
              className="rounded-full border border-outline bg-[#16181d] p-2 text-gray-200 hover:bg-[#1f2937]"
            >
              <HomeIcon />
            </Link>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-subtle">Call of Cthulhu Keeper</p>
            <h1 className="text-xl font-semibold text-gray-100">AI Keeper Companion</h1>
          </div>
        </div>
        <Link
          href="/settings"
          className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-full border border-outline bg-[#16181d] text-gray-200",
            "hover:bg-[#1f2937]",
            isOnSettingsPage && "bg-[#1f2937]"
          )}
          aria-label="Settings"
          aria-current={isOnSettingsPage ? "page" : undefined}
        >
          <GearIcon />
        </Link>
      </header>
      {children}
    </div>
  );
};
