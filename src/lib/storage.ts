import { AppData } from "@/types";
import { predefinedScenarios } from "@/data/predefinedScenarios";
import { DEFAULT_KEEPER_SYSTEM_PROMPT } from "@/data/defaultKeeperSystemPrompt";

export const STORAGE_KEY = "coc_keeper_app_data_v1";
export const CURRENT_VERSION = 2;

const defaultData: AppData = {
  version: CURRENT_VERSION,
  settings: {
    language: "en",
    theme: "dark",
    keeperSystemPrompt: DEFAULT_KEEPER_SYSTEM_PROMPT,
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
  let migrated = { ...data };

  if (!migrated.settings.keeperSystemPrompt) {
    migrated = {
      ...migrated,
      settings: {
        ...migrated.settings,
        keeperSystemPrompt: DEFAULT_KEEPER_SYSTEM_PROMPT,
      },
    };
  }

  migrated.version = CURRENT_VERSION;
  return migrated;
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
