import { Scenario } from "@/types";
import { createId } from "@/lib/app-data-context";

const now = new Date().toISOString();

export const predefinedScenarios: Scenario[] = [
  {
    id: createId(),
    name: "The Haunting",
    premise:
      "Investigate a haunted house in Boston where strange whispers and scratching behind the walls hint at something older than the city itself.",
    shortDescription: "Investigate a haunted house in Boston.",
    source: "predefined",
    tags: ["1920s", "Investigation", "Urban"],
    meta: {
      era: "1920s",
      tone: "Investigation-heavy",
      settingDescription: "Boston townhouse",
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: createId(),
    name: "Edge of Darkness",
    premise:
      "Deal with an old cult at a secluded farmhouse, where leftover rituals still stain the boards and something hungry lingers in the fields.",
    shortDescription: "Deal with an old cult at a secluded farmhouse.",
    source: "predefined",
    tags: ["1920s", "Cult", "Rural"],
    meta: {
      era: "1920s",
      tone: "Psychological Horror",
      settingDescription: "Remote farmhouse",
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: createId(),
    name: "Dead Light",
    premise:
      "Survive encounters with a terrifying presence on rural roads during a storm, where headlights catch more than rain.",
    shortDescription: "Survive encounters with a terrifying presence on rural roads.",
    source: "predefined",
    tags: ["Modern", "Road", "Survival"],
    meta: {
      era: "Modern Day",
      tone: "Survival",
      settingDescription: "Rain-soaked highways",
    },
    createdAt: now,
    updatedAt: now,
  },
];
