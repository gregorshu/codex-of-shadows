"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/lib/app-data-context";
import { AppShell } from "@/components/layout/AppShell";

export default function HomePage() {
  const { data } = useAppData();
  const router = useRouter();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-100">Welcome</h2>
          <p className="text-subtle">Choose a scenario to get started.</p>
        </section>
        <section className="grid gap-4">
          <h3 className="text-lg font-semibold">Predefined Scenarios</h3>
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
                    Use this scenario
                  </Button>
                </Card>
              ))}
          </div>
        </section>
        <section className="grid gap-3">
          <h3 className="text-lg font-semibold">Create New Scenario</h3>
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-gray-100">Create a new scenario with the Keeper</p>
                <p className="text-subtle text-sm">
                  Walk through a quick wizard to define era, tone, and setting.
                </p>
              </div>
              <Link href="/scenario" className="w-full sm:w-auto">
                <Button fullWidth>Create a new scenario</Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
