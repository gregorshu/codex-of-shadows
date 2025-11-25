export type KeeperLanguage = "en" | "ru";

export type ScenarioSource = "predefined" | "custom";

export type SessionStatus = "setup" | "active" | "completed" | "abandoned";

export type ChatRole = "player" | "keeper" | "system";

export interface AppSettings {
  language: KeeperLanguage;
  theme: "light" | "dark" | "system";
  llm: {
    model: string;
    baseUrl?: string;
    apiKey?: string;
    temperature?: number;
    topP?: number;
  };
}

export interface Scenario {
  id: string;
  name: string;
  premise: string;
  shortDescription: string;
  source: ScenarioSource;
  tags?: string[];
  meta?: {
    era?: string;
    settingDescription?: string;
    tone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Investigator {
  id: string;
  name: string;
  occupation: string;
  background: string;
  personalityTraits: string[];
  skillsSummary: string;
  playerNotes: string;
  language: KeeperLanguage;
  avatarUrl?: string;
  scenarioId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  editedFromMessageId?: string;
  meta?: {
    isSetupPhase?: boolean;
    isSystemNote?: boolean;
    wasCancelled?: boolean;
  };
}

export interface LogEntry {
  id: string;
  sessionId: string;
  type:
    | "session_start"
    | "note"
    | "keeper_summary"
    | "clue_found"
    | "important_choice"
    | "roll";
  title: string;
  details?: string;
  relatedMessageId?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  scenarioId: string;
  investigatorId: string;
  language: KeeperLanguage;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  stateSummary: string;
  stateFlags?: Record<string, unknown>;
  chat: ChatMessage[];
  log: LogEntry[];
}

export interface AppData {
  version: number;
  settings: AppSettings;
  scenarios: Scenario[];
  investigators: Investigator[];
  sessions: Session[];
}
