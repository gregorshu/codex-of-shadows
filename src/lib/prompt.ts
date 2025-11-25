import { ChatMessage, Investigator, Scenario, Session } from "@/types";

export function buildKeeperPrompt({
  scenario,
  investigator,
  session,
  messages,
}: {
  scenario: Scenario;
  investigator: Investigator;
  session: Session;
  messages: ChatMessage[];
}) {
  const intro = `You are the Keeper (GM) for Call of Cthulhu. Maintain a grounded investigative horror tone. Scenario premise: ${scenario.premise}. Investigator: ${investigator.name}, ${investigator.occupation}. Background: ${investigator.background}. Skills: ${investigator.skillsSummary}. Personality: ${investigator.personalityTraits.join(", ")}.`;
  const summary = session.stateSummary || "";

  const formattedMessages = messages
    .slice(-8)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `${intro}\nSession summary: ${summary}\nRecent conversation:\n${formattedMessages}\nContinue as the Keeper, offering vivid sensory details and concise choices when needed.`;

  return prompt;
}
