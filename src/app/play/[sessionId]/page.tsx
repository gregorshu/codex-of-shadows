"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { useAppData } from "@/lib/app-data-context";
import { callKeeper, readLLMStream } from "@/lib/llm";
import { AppShell } from "@/components/layout/AppShell";
import { ChatMessage, Session } from "@/types";
import { createId } from "@/lib/app-data-context";
import { useTranslation } from "@/lib/i18n";
import { parseKeeperReply } from "@/lib/keeperParser";

const sanitizeKeeperContent = (text: string) =>
  text.replace(/openrouter\s*proc\w*[^\n]*\n?/gi, "");

const buildFallbackKeeperReply = (narration: string, silentFallback: string) => {
  const safeNarration = narration.trim() || silentFallback;
  const baseChoices = [
    "Survey the immediate area for threats or hidden clues.",
    "Call out cautiously to test who might answer.",
    "Advance toward the most striking feature nearby.",
    "Pause to steady yourself and recall what you know.",
  ];

  const choiceLines = [...baseChoices, "Propose your own action. Describe what you do in your own words."]
    .map((choice, idx) => `${idx + 1}. ${choice}`)
    .join("\n");

  return `NARRATION:\n${safeNarration}\n\nCHOICES:\n${choiceLines}`;
};

export default function PlayPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { data, upsertSession } = useAppData();
  const { t } = useTranslation();
  const session = data.sessions.find((s) => s.id === params.sessionId);
  const scenario = data.scenarios.find((s) => s.id === session?.scenarioId);
  const investigator = data.investigators.find((i) => i.id === session?.investigatorId);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const keeperIntroStartedRef = useRef(false);
  const roleLabels: Record<ChatMessage["role"], string> = {
    player: t("rolePlayer"),
    keeper: t("roleKeeper"),
    system: t("roleSystem"),
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.chat.length]);

  useEffect(() => {
    keeperIntroStartedRef.current = false;
  }, [session?.id]);

  useEffect(() => {
    if (!session || !scenario || !investigator) return;
    if (session.chat.length > 0) return;
    if (isStreaming || keeperIntroStartedRef.current) return;

    keeperIntroStartedRef.current = true;
    void startKeeperIntro();
  }, [investigator, isStreaming, scenario, session, startKeeperIntro]);

  const streamKeeperTurn = useCallback(
    async ({
      userMessage,
      baseMessages,
      sessionForContext,
      fallbackNarration,
    }: {
      userMessage: string;
      baseMessages: ChatMessage[];
      sessionForContext: Session;
      fallbackNarration: string;
    }) => {
      if (!session || !scenario || !investigator) return;
      const keeperMessage: ChatMessage = {
        id: createId(),
        sessionId: session.id,
        role: "keeper",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setIsStreaming(true);
      let fullTextRaw = "";

      try {
        if (data.settings.llm.apiKey) {
          const stream = await callKeeper({
            session: sessionForContext,
            scenario,
            investigator,
            newUserMessage: userMessage,
            llmConfig: data.settings.llm,
            keeperSystemPrompt: data.settings.keeperSystemPrompt,
            keeperCycleRules: data.settings.keeperCycleRules,
            keeperReplyFormat: data.settings.keeperReplyFormat,
            messages: baseMessages,
          });
          await readLLMStream(stream, (token) => {
            fullTextRaw += token;
            const fullText = sanitizeKeeperContent(fullTextRaw);
            upsertSession({
              ...sessionForContext,
              chat: [...baseMessages, { ...keeperMessage, content: fullText }],
            });
          });
          const fullText = sanitizeKeeperContent(fullTextRaw);
          const parsedKeeperTurn = parseKeeperReply(fullText);
          upsertSession({
            ...sessionForContext,
            chat: [
              ...baseMessages,
              { ...keeperMessage, content: fullText, meta: { parsedKeeperTurn } },
            ],
            lastOpenedAt: new Date().toISOString(),
          });
        } else {
          const fallbackContent = buildFallbackKeeperReply(
            fallbackNarration,
            t("keeperSilentFallback"),
          );
          upsertSession({
            ...sessionForContext,
            chat: [
              ...baseMessages,
              {
                ...keeperMessage,
                content: fallbackContent,
                meta: { parsedKeeperTurn: parseKeeperReply(fallbackContent) },
              },
            ],
            lastOpenedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Keeper turn failed", error);
        const fallbackContent = buildFallbackKeeperReply(
          sanitizeKeeperContent(fullTextRaw),
          t("keeperSilentFallback"),
        );
        upsertSession({
          ...sessionForContext,
          chat: [
            ...baseMessages,
            {
              ...keeperMessage,
              content: fallbackContent,
              meta: { parsedKeeperTurn: parseKeeperReply(fallbackContent) },
            },
          ],
          lastOpenedAt: new Date().toISOString(),
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [
      data.settings.keeperSystemPrompt,
      data.settings.llm,
      investigator,
      scenario,
      session,
      t,
      data.settings.keeperCycleRules,
      data.settings.keeperReplyFormat,
      upsertSession,
    ],
  );

  const startKeeperIntro = useCallback(async () => {
    if (!session || !scenario || !investigator) return;
    const now = new Date().toISOString();
    const baseMessages = [...session.chat];

    const updatedSession = {
      ...session,
      chat: baseMessages,
      updatedAt: now,
    };

    const introPrompt = t("keeperIntroPrompt", {
      investigator: investigator.name,
      scenario: scenario.name,
    });

    await streamKeeperTurn({
      userMessage: introPrompt,
      baseMessages,
      sessionForContext: updatedSession,
      fallbackNarration: t("keeperIntroFallback"),
    });
  }, [investigator, scenario, session, streamKeeperTurn, t]);

  const sendMessage = async (overrideInput?: string) => {
    if (!session || !scenario || !investigator || isStreaming) return;
    const trimmedInput = (overrideInput ?? input).trim();
    if (!trimmedInput) return;
    const now = new Date().toISOString();
    const baseMessages = [...session.chat];
    if (editMessageId) {
      baseMessages.push({
        id: createId(),
        sessionId: session.id,
        role: "system",
        content: t("playerRewroteAction"),
        createdAt: now,
        meta: { isSystemNote: true },
      });
    }
    const newPlayerMessage: ChatMessage = {
      id: createId(),
      sessionId: session.id,
      role: "player",
      content: trimmedInput,
      createdAt: now,
      editedFromMessageId: editMessageId || undefined,
    };

    const updatedSession = {
      ...session,
      chat: [...baseMessages, newPlayerMessage],
      updatedAt: now,
    };
    upsertSession(updatedSession);
    setInput("");
    setEditMessageId(null);

    await streamKeeperTurn({
      userMessage: trimmedInput,
      baseMessages: updatedSession.chat,
      sessionForContext: updatedSession,
      fallbackNarration: t("keeperMessageFallback"),
    });
  };

  const editLastMessage = () => {
    if (!session) return;
    const lastPlayer = [...session.chat].reverse().find((m) => m.role === "player");
    if (lastPlayer) {
      setInput(lastPlayer.content);
      setEditMessageId(lastPlayer.id);
    }
  };

  const cancelStreaming = () => {
    setIsStreaming(false);
  };

  const goHome = () => router.push("/");

  const handleChoiceClick = (index: number, text: string) => {
    void sendMessage(`I choose option ${index}: ${text}`);
  };

  if (!session || !scenario || !investigator) {
    return (
      <AppShell>
        <Card className="p-6">
          <p className="text-subtle">{t("sessionNotFound")}</p>
          <Button onClick={goHome} className="mt-4">
            {t("returnHome")}
          </Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="flex h-[70vh] flex-col p-4">
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {session.chat.map((message) => (
              <div key={message.id} className="flex flex-col gap-1">
                <div className="text-xs uppercase tracking-[0.2em] text-subtle">{roleLabels[message.role]}</div>
                <div className="rounded-xl bg-[#1d2026] px-4 py-3 text-sm leading-relaxed text-gray-100">
                  {message.role === "keeper" && message.meta?.parsedKeeperTurn ? (
                    <div className="space-y-2">
                      <div className="whitespace-pre-line">{message.meta.parsedKeeperTurn.narration}</div>
                      {message.meta.parsedKeeperTurn.choices.length > 0 && (
                        <div className="mt-3 border-t border-gray-700 pt-2 text-sm">
                          <div className="font-semibold mb-1">Choices:</div>
                          <ol className="space-y-1 list-decimal list-inside">
                            {message.meta.parsedKeeperTurn.choices.map((choice, idx) => (
                              <li key={idx}>
                                <button
                                  className="hover:underline text-gray-200 text-left"
                                  onClick={() => handleChoiceClick(idx + 1, choice)}
                                >
                                  {choice}
                                </button>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
          <div className="mt-4 space-y-3">
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("describeNextMove")}
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={editLastMessage}>
                  {t("editLast")}
                </Button>
                <Button variant="ghost" disabled={!isStreaming} onClick={cancelStreaming}>
                  {t("cancelLabel")}
                </Button>
              </div>
              <Button onClick={sendMessage} disabled={isStreaming || !input.trim()}>
                {t("sendLabel")}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-subtle">{t("investigatorHeader")}</p>
          <h3 className="text-lg font-semibold text-gray-100">{investigator.name}</h3>
          <p className="text-subtle">{investigator.occupation}</p>
          <p className="mt-2 text-sm text-gray-200">{investigator.background}</p>
          <div className="mt-4 space-y-2">
            <p className="text-subtle text-sm">{t("personalityTraitsLabel")}</p>
            <div className="flex flex-wrap gap-2">
              {investigator.personalityTraits.map((trait) => (
                <span key={trait} className="rounded-full bg-[#1f2937] px-3 py-1 text-xs text-gray-200">
                  {trait}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-subtle text-sm">{t("skillsSummaryLabel")}</p>
            <p className="text-sm text-gray-200">{investigator.skillsSummary}</p>
          </div>
          <div className="mt-6 space-y-2 text-sm text-gray-200">
            <p className="text-subtle">{t("sessionStateLabel")}</p>
            <p>{session.stateSummary}</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
