"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppData, Investigator, Scenario, Session } from "@/types";
import { loadAppData, saveAppData } from "@/lib/storage";

interface AppDataContextValue {
  data: AppData;
  isReady: boolean;
  updateData: (updater: (prev: AppData) => AppData) => void;
  upsertScenario: (scenario: Scenario) => void;
  upsertInvestigator: (investigator: Investigator) => void;
  upsertSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    const initial = loadAppData();
    setData(initial);
  }, []);

  useEffect(() => {
    if (data) {
      saveAppData(data);
    }
  }, [data]);

  const value = useMemo<AppDataContextValue | undefined>(() => {
    if (!data) return undefined;
    return {
      data,
      isReady: true,
      updateData: (updater) => setData((prev) => (prev ? updater(prev) : prev)),
      upsertScenario: (scenario) =>
        setData((prev) =>
          prev
            ? {
                ...prev,
                scenarios: [
                  ...prev.scenarios.filter((s) => s.id !== scenario.id),
                  { ...scenario, updatedAt: new Date().toISOString() },
                ],
              }
            : prev
        ),
      upsertInvestigator: (investigator) =>
        setData((prev) =>
          prev
            ? {
                ...prev,
                investigators: [
                  ...prev.investigators.filter((i) => i.id !== investigator.id),
                  { ...investigator, updatedAt: new Date().toISOString() },
                ],
              }
            : prev
        ),
      upsertSession: (session) =>
        setData((prev) =>
          prev
            ? {
                ...prev,
                sessions: [
                  ...prev.sessions.filter((s) => s.id !== session.id),
                  { ...session, updatedAt: new Date().toISOString() },
                ],
              }
            : prev
        ),
      removeSession: (sessionId) =>
        setData((prev) =>
          prev
            ? {
                ...prev,
                sessions: prev.sessions.filter((session) => session.id !== sessionId),
              }
            : prev
        ),
    };
  }, [data]);

  if (!value) return null;

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return ctx;
}

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
}
