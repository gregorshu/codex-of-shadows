import { AppData } from "@/types";
import { predefinedScenarios } from "@/data/predefinedScenarios";

export const STORAGE_KEY = "coc_keeper_app_data_v1";
export const CURRENT_VERSION = 1;

const defaultData: AppData = {
  version: CURRENT_VERSION,
  settings: {
    language: "en",
    theme: "dark",
    llm: {
      model: "gpt-4o-mini",
      temperature: 0.7,
      topP: 0.9,
    },
  },
  scenarios: predefinedScenarios,
  investigators: [],
  sessions: [],
};

export function migrateData(data: AppData): AppData {
  if (!data) return defaultData;
  if (data.version === CURRENT_VERSION) return data;
  // Placeholder for future migrations
  return {
    ...data,
    version: CURRENT_VERSION,
  };
}

export function loadAppData(): AppData {
  if (typeof window === "undefined") return defaultData;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultData;
  try {
    const parsed = JSON.parse(raw) as AppData;
    return migrateData(parsed);
  } catch (error) {
    console.error("Failed to parse app data", error);
    return defaultData;
  }
}

export function saveAppData(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
