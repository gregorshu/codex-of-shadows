import { ChatMessage, Investigator, Scenario, Session } from "@/types";
import { DEFAULT_KEEPER_SYSTEM_PROMPT } from "@/data/defaultKeeperSystemPrompt";
import { LANGUAGE_ENGLISH_NAMES } from "@/lib/i18n";
import { buildKeeperInstructions } from "@/lib/keeperPrompt";

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

function formatLogEntries(log: Session["log"]): string {
  if (!log.length) return "No notable log entries yet.";

  const latest = [...log]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((entry) => `- ${entry.title}: ${entry.details || "(details pending)"}`);

  return `Recent session log entries (newest first):\n${latest.join("\n")}`;
}

function formatChatHistory(messages: ChatMessage[]): string {
  if (!messages.length) return "Chat is starting. Keeper must open.";

  return messages
    .map((message) => {
      const label = message.role === "keeper" ? "Keeper" : message.role === "player" ? "Player" : "System";
      return `${label}: ${message.content}`;
    })
    .join("\n---\n");
}

function buildSessionContext({
  session,
  scenario,
  investigator,
  messages,
}: {
  session: Session;
  scenario: Scenario;
  investigator: Investigator;
  messages: ChatMessage[];
}): string {
  const languageInstruction = LANGUAGE_ENGLISH_NAMES[session.language]
    ? `Respond in ${LANGUAGE_ENGLISH_NAMES[session.language]}.`
    : "Respond in the player's language.";

  const summaryLines = [
    `Scenario: ${scenario.name}`,
    `Premise: ${scenario.premise}`,
    `Investigator: ${investigator.name} (${investigator.occupation})`,
    `Background: ${investigator.background}`,
    `Traits: ${investigator.personalityTraits.join(", ")}`,
    `Skills: ${investigator.skillsSummary}`,
    session.stateSummary ? `Session summary: ${session.stateSummary}` : "Session summary: Investigation begins.",
    languageInstruction,
    formatLogEntries(session.log),
    `Full chat transcript so far:\n${formatChatHistory(messages)}`,
  ];

  return summaryLines.join("\n");
}

export function buildKeeperMessages({
  session,
  scenario,
  investigator,
  newUserMessage,
  messages,
  keeperSystemPrompt,
  keeperCycleRules,
  keeperReplyFormat,
  historyLimit = Number.POSITIVE_INFINITY,
}: {
  session: Session;
  scenario: Scenario;
  investigator: Investigator;
  newUserMessage: string;
  messages?: ChatMessage[];
  keeperSystemPrompt?: string;
  keeperCycleRules?: string;
  keeperReplyFormat?: string;
  historyLimit?: number;
}): LLMMessage[] {
  const systemPrompt = [
    (keeperSystemPrompt || DEFAULT_KEEPER_SYSTEM_PROMPT).trim(),
    buildKeeperInstructions({
      cycleRules: keeperCycleRules,
      replyFormat: keeperReplyFormat,
    }),
  ]
    .filter(Boolean)
    .join("\n");
  const chatHistory = messages || session.chat;

  const historyMessages = chatHistory
    .slice(-historyLimit)
    .map<LLMMessage>((m) => ({ role: mapChatRoleToLLMRole(m.role), content: m.content }));

  const sessionContext = buildSessionContext({
    session,
    scenario,
    investigator,
    messages: chatHistory,
  });

  const lastMessage = chatHistory[chatHistory.length - 1];
  const shouldAppendUserMessage =
    !(lastMessage && lastMessage.role === "player" && lastMessage.content.trim() === newUserMessage.trim());

  return [
    { role: "system", content: systemPrompt },
    { role: "system", content: sessionContext },
    ...historyMessages,
    ...(shouldAppendUserMessage ? [{ role: "user", content: newUserMessage }] : []),
  ];
}

export async function callKeeper({
  session,
  scenario,
  investigator,
  newUserMessage,
  llmConfig,
  keeperSystemPrompt,
  keeperCycleRules,
  keeperReplyFormat,
  messages,
}: {
  session: Session;
  scenario: Scenario;
  investigator: Investigator;
  newUserMessage: string;
  llmConfig: { model: string; apiKey?: string; baseUrl?: string; temperature?: number; topP?: number };
  keeperSystemPrompt?: string;
  keeperCycleRules?: string;
  keeperReplyFormat?: string;
  messages?: ChatMessage[];
}): Promise<ReadableStream<Uint8Array>> {
  const builtMessages = buildKeeperMessages({
    session,
    scenario,
    investigator,
    newUserMessage,
    keeperSystemPrompt,
    keeperCycleRules,
    keeperReplyFormat,
    messages,
  });

  return callLLM({
    baseUrl: llmConfig.baseUrl,
    apiKey: llmConfig.apiKey,
    model: llmConfig.model,
    messages: builtMessages,
  });
}
