import { ChatMessage, Investigator, Scenario, Session } from "@/types";
import { LANGUAGE_ENGLISH_NAMES } from "@/lib/i18n";
import { DEFAULT_KEEPER_SYSTEM_PROMPT } from "@/data/defaultKeeperSystemPrompt";

export function buildKeeperPrompt({
  scenario,
  investigator,
  session,
  messages,
  keeperSystemPrompt,
}: {
  scenario: Scenario;
  investigator: Investigator;
  session: Session;
  messages: ChatMessage[];
  keeperSystemPrompt?: string;
}) {
  const intro = `You are the Keeper (GM) for Call of Cthulhu. Maintain a grounded investigative horror tone. Scenario premise: ${scenario.premise}. Investigator: ${investigator.name}, ${investigator.occupation}. Background: ${investigator.background}. Skills: ${investigator.skillsSummary}. Personality: ${investigator.personalityTraits.join(", ")}.`;
  const summary = session.stateSummary || "";
  const languageInstruction = LANGUAGE_ENGLISH_NAMES[session.language]
    ? `Respond in ${LANGUAGE_ENGLISH_NAMES[session.language]}.`
    : "Respond in the player's language.";

  const formattedMessages = messages
    .slice(-8)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `${intro}\n${languageInstruction}\nSession summary: ${summary}\nRecent conversation:\n${formattedMessages}\nContinue as the Keeper, offering vivid sensory details and concise choices when needed.`;

  return {
    basePrompt: (keeperSystemPrompt || DEFAULT_KEEPER_SYSTEM_PROMPT).trim(),
    contextPrompt: prompt,
  };
}
