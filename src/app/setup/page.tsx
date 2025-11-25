"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppData, createId } from "@/lib/app-data-context";
import { AppShell } from "@/components/layout/AppShell";
import { Session } from "@/types";

export default function SetupPage() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenarioId");
  const investigatorId = searchParams.get("investigatorId");
  const router = useRouter();
  const { data, upsertSession } = useAppData();

  const scenario = data.scenarios.find((s) => s.id === scenarioId) || data.scenarios[0];
  const investigator = data.investigators.find((i) => i.id === investigatorId) || data.investigators[0];

  const ready = useMemo(() => Boolean(scenario && investigator), [scenario, investigator]);

  const startSession = () => {
    if (!scenario || !investigator) return;
    const now = new Date().toISOString();
    const session: Session = {
      id: createId(),
      title: scenario.name,
      scenarioId: scenario.id,
      investigatorId: investigator.id,
      language: investigator.language,
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      stateSummary: "Investigation begins.",
      chat: [],
      log: [
        {
          id: createId(),
          sessionId: "",
          type: "session_start",
          title: "Session started",
          createdAt: now,
        },
      ],
    };
    session.log = session.log.map((log) => ({ ...log, sessionId: session.id }));
    upsertSession(session);
    router.push(`/play/${session.id}`);
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-100">Scenario</h2>
            <Button variant="ghost" onClick={() => router.push(`/scenario?scenarioId=${scenario?.id}`)}>
              Edit Scenario
            </Button>
          </div>
          <p className="text-subtle text-sm">{scenario?.shortDescription}</p>
          <div className="mt-4 space-y-2 text-sm text-gray-200">
            <p className="text-subtle">Premise</p>
            <p className="leading-relaxed">{scenario?.premise}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-100">Investigator</h2>
            <Button
              variant="ghost"
              onClick={() => router.push(`/investigator?scenarioId=${scenario?.id}&investigatorId=${investigator?.id}`)}
            >
              Edit Investigator
            </Button>
          </div>
          <div className="space-y-2 text-sm text-gray-200">
            <div className="text-base font-semibold text-gray-100">{investigator?.name}</div>
            <p className="text-subtle">{investigator?.occupation}</p>
            <p className="leading-relaxed">{investigator?.background}</p>
            <div>
              <p className="text-subtle">Traits</p>
              <div className="flex flex-wrap gap-2">
                {investigator?.personalityTraits.map((trait) => (
                  <span key={trait} className="rounded-full bg-[#1f2937] px-3 py-1 text-xs text-gray-200">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-subtle">Skills</p>
              <p>{investigator?.skillsSummary}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button disabled={!ready} onClick={startSession}>
          Start scenario
        </Button>
      </div>
    </AppShell>
  );
}
