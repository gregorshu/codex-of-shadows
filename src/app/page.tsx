"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/lib/app-data-context";
import { AppShell } from "@/components/layout/AppShell";
import { useTranslation } from "@/lib/i18n";

export default function HomePage() {
  const { data } = useAppData();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
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
