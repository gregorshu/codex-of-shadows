"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/lib/app-data-context";
import { AppShell } from "@/components/layout/AppShell";
import { useTranslation } from "@/lib/i18n";

export default function HomePage() {
  const { data } = useAppData();
  const router = useRouter();
  const { t } = useTranslation();
  const [showAllSessions, setShowAllSessions] = useState(false);

  const ongoingSessions = useMemo(
    () =>
      data.sessions
        .filter((session) => session.status !== "completed" && session.status !== "abandoned")
        .map((session) => {
          const lastMessage = session.chat.at(-1);
          const lastMessageAt = lastMessage?.createdAt ?? session.updatedAt ?? session.createdAt;

          return { session, lastMessageAt };
        })
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
    [data.sessions]
  );

  const visibleSessions = showAllSessions ? ongoingSessions : ongoingSessions.slice(0, 3);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <section className="grid gap-3">
          <h3 className="text-lg font-semibold">{t("homeOngoingHeading")}</h3>
          {ongoingSessions.length === 0 ? (
            <Card className="p-4">
              <p className="text-subtle text-sm">{t("homeOngoingEmpty")}</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {visibleSessions.map(({ session, lastMessageAt }) => {
                const scenario = data.scenarios.find((s) => s.id === session.scenarioId);
                const investigator = data.investigators.find((i) => i.id === session.investigatorId);
                const formattedTime = new Date(lastMessageAt).toLocaleString();

                return (
                  <Card
                    key={session.id}
                    onClick={() => router.push(`/play/${session.id}`)}
                    className="p-4 transition hover:border-primary cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-base font-semibold text-gray-100">
                          {scenario?.name ?? t("homeOngoingUnknownScenario")}
                        </div>
                        <p className="text-subtle text-sm">
                          {t("homeOngoingInvestigatorLabel", {
                            name: investigator?.name ?? t("homeOngoingUnknownInvestigator"),
                          })}
                        </p>
                      </div>
                      <div className="text-right text-xs text-subtle">
                        <p>{t("homeOngoingLastMessage", { time: formattedTime })}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {ongoingSessions.length > 3 && (
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => setShowAllSessions((prev) => !prev)}>
                    {showAllSessions ? t("homeOngoingShowLess") : t("homeOngoingShowAll")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-100">{t("homeWelcomeTitle")}</h2>
          <p className="text-subtle">{t("homeWelcomeDescription")}</p>
        </section>
        <section className="grid gap-4">
          <h3 className="text-lg font-semibold">{t("homePredefinedHeading")}</h3>
          <div className="grid gap-3">
            {data.scenarios
              .filter((s) => s.source === "predefined")
              .map((scenario) => (
                <Card key={scenario.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-base font-semibold text-gray-100">{scenario.name}</div>
                    <p className="text-subtle text-sm">{scenario.shortDescription}</p>
                  </div>
                  <Button onClick={() => router.push(`/investigator?scenarioId=${scenario.id}`)}>
                    {t("homeUseScenarioButton")}
                  </Button>
                </Card>
              ))}
          </div>
        </section>
        <section className="grid gap-3">
          <h3 className="text-lg font-semibold">{t("homeCreateHeading")}</h3>
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-gray-100">{t("homeCreateTitle")}</p>
                <p className="text-subtle text-sm">{t("homeCreateDescription")}</p>
              </div>
              <Link href="/scenario" className="w-full sm:w-auto">
                <Button fullWidth>{t("homeCreateButton")}</Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
