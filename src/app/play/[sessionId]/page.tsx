"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { useAppData } from "@/lib/app-data-context";
import { buildKeeperPrompt } from "@/lib/prompt";
import { callLLM } from "@/lib/llm";
import { AppShell } from "@/components/layout/AppShell";
import { ChatMessage } from "@/types";
import { createId } from "@/lib/app-data-context";
import { useTranslation } from "@/lib/i18n";

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
  const roleLabels: Record<ChatMessage["role"], string> = {
    player: t("rolePlayer"),
    keeper: t("roleKeeper"),
    system: t("roleSystem"),
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.chat.length]);

  const sendMessage = async () => {
    if (!session || !scenario || !investigator || !input.trim()) return;
    const now = new Date().toISOString();
    const newPlayerMessage: ChatMessage = {
      id: createId(),
      sessionId: session.id,
      role: "player",
      content: input,
      createdAt: now,
      editedFromMessageId: editMessageId || undefined,
    };

    const updatedSession = {
      ...session,
      chat: [...session.chat, newPlayerMessage],
      updatedAt: now,
    };
    upsertSession(updatedSession);
    setInput("");
    setEditMessageId(null);

    setIsStreaming(true);
    const keeperMessage: ChatMessage = {
      id: createId(),
      sessionId: session.id,
      role: "keeper",
      content: "",
      createdAt: new Date().toISOString(),
    };

    try {
      if (data.settings.llm.apiKey) {
        const prompt = buildKeeperPrompt({
          scenario,
          investigator,
          session: updatedSession,
          messages: updatedSession.chat,
        });
        const stream = await callLLM({
          baseUrl: data.settings.llm.baseUrl,
          apiKey: data.settings.llm.apiKey,
          model: data.settings.llm.model,
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: input },
          ],
        });
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          upsertSession({
            ...updatedSession,
            chat: [...updatedSession.chat, { ...keeperMessage, content: fullText }],
          });
        }
      } else {
        upsertSession({
          ...updatedSession,
          chat: [...updatedSession.chat, { ...keeperMessage, content: t("keeperMessageFallback") }],
        });
      }
    } catch (error) {
      console.error("LLM chat failed", error);
      upsertSession({
        ...updatedSession,
        chat: [...updatedSession.chat, { ...keeperMessage, content: t("keeperSilentFallback") }],
      });
    } finally {
      setIsStreaming(false);
    }
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
                  {message.content}
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
