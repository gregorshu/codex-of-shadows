import { ChatMessage, Investigator, Scenario, Session } from "@/types";
import { DEFAULT_KEEPER_SYSTEM_PROMPT } from "@/data/defaultKeeperSystemPrompt";
import { LANGUAGE_ENGLISH_NAMES } from "@/lib/i18n";
import { KEEPER_CYCLE_INSTRUCTIONS } from "@/lib/keeperPrompt";

type LLMMessage = { role: "system" | "user" | "assistant"; content: string };

const ENV_FALLBACK_BASE_URL = process.env.NEXT_PUBLIC_LLM_BASE_URL;

function resolveBaseUrl(baseUrl?: string) {
  const configured = baseUrl || ENV_FALLBACK_BASE_URL;
  if (!configured) {
    throw new Error("LLM base URL is not configured. Set it in Settings.");
  }
  const trimmed = configured.replace(/\/+$/, "");
  if (trimmed.endsWith("/v1")) return trimmed.slice(0, -3);
  return trimmed;
}

export async function callLLM({
  messages,
  model,
  apiKey,
  baseUrl,
}: {
  messages: LLMMessage[];
  model: string;
  apiKey?: string;
  baseUrl?: string;
}): Promise<ReadableStream<Uint8Array>> {
  const url = `${resolveBaseUrl(baseUrl)}/v1/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey ? `Bearer ${apiKey}` : "",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  return response.body;
}

function parseLLMStreamLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return trimmed;

  const payload = trimmed.replace(/^data:\s*/, "");
  if (!payload || payload === "[DONE]") return "";

  try {
    const parsed = JSON.parse(payload);
    return (
      parsed.choices?.[0]?.delta?.content ||
      parsed.choices?.[0]?.message?.content ||
      ""
    );
  } catch (error) {
    console.warn("Failed to parse LLM stream line", error);
    return "";
  }
}

export async function readLLMStream(
  stream: ReadableStream<Uint8Array>,
  onToken?: (token: string) => void,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const token = parseLLMStreamLine(line);
      if (token) {
        fullText += token;
        onToken?.(token);
      }
    }
  }

  if (buffer) {
    const token = parseLLMStreamLine(buffer);
    if (token) {
      fullText += token;
      onToken?.(token);
    }
  }

  return fullText;
}

function mapChatRoleToLLMRole(role: ChatMessage["role"]): LLMMessage["role"] {
  if (role === "keeper") return "assistant";
  if (role === "player") return "user";
  return "system";
}

export function buildKeeperMessages({
  session,
  scenario,
  investigator,
  newUserMessage,
  messages,
  keeperSystemPrompt,
  historyLimit = Number.POSITIVE_INFINITY,
}: {
  session: Session;
  scenario: Scenario;
  investigator: Investigator;
  newUserMessage: string;
  messages?: ChatMessage[];
  keeperSystemPrompt?: string;
  historyLimit?: number;
}): LLMMessage[] {
  const systemPrompt = `${(keeperSystemPrompt || DEFAULT_KEEPER_SYSTEM_PROMPT).trim()}\n${KEEPER_CYCLE_INSTRUCTIONS}`.trim();
  const languageInstruction = LANGUAGE_ENGLISH_NAMES[session.language]
    ? `Respond in ${LANGUAGE_ENGLISH_NAMES[session.language]}.`
    : "Respond in the player's language.";

  const contextParts = [
    `Scenario premise: ${scenario.premise}`,
    `Investigator: ${investigator.name} (${investigator.occupation})`,
    `Background: ${investigator.background}`,
    `Traits: ${investigator.personalityTraits.join(", ")}`,
    `Skills: ${investigator.skillsSummary}`,
    session.stateSummary ? `Session summary: ${session.stateSummary}` : null,
    languageInstruction,
  ].filter(Boolean);

  const historyMessages = (messages || session.chat)
    .slice(-historyLimit)
    .map<LLMMessage>((m) => ({ role: mapChatRoleToLLMRole(m.role), content: m.content }));

  return [
    { role: "system", content: systemPrompt },
    { role: "system", content: contextParts.join("\n") },
    ...historyMessages,
    { role: "user", content: newUserMessage },
  ];
}

export async function callKeeper({
  session,
  scenario,
  investigator,
  newUserMessage,
  llmConfig,
  keeperSystemPrompt,
  messages,
}: {
  session: Session;
  scenario: Scenario;
  investigator: Investigator;
  newUserMessage: string;
  llmConfig: { model: string; apiKey?: string; baseUrl?: string; temperature?: number; topP?: number };
  keeperSystemPrompt?: string;
  messages?: ChatMessage[];
}): Promise<ReadableStream<Uint8Array>> {
  const builtMessages = buildKeeperMessages({
    session,
    scenario,
    investigator,
    newUserMessage,
    keeperSystemPrompt,
    messages,
  });

  return callLLM({
    baseUrl: llmConfig.baseUrl,
    apiKey: llmConfig.apiKey,
    model: llmConfig.model,
    messages: builtMessages,
  });
}
