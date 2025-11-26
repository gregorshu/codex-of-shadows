"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/lib/app-data-context";
import { KeeperLanguage } from "@/types";

export default function SettingsPage() {
  const { data, updateData } = useAppData();

  const [language, setLanguage] = useState<KeeperLanguage>(data.settings.language);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(data.settings.theme);
  const [model, setModel] = useState(data.settings.llm.model);
  const [baseUrl, setBaseUrl] = useState(data.settings.llm.baseUrl ?? "");
  const [apiKey, setApiKey] = useState(data.settings.llm.apiKey ?? "");
  const [temperature, setTemperature] = useState(
    data.settings.llm.temperature?.toString() ?? "0.7"
  );
  const [topP, setTopP] = useState(data.settings.llm.topP?.toString() ?? "0.9");
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    updateData((prev) => {
      const parsedTemperature = parseFloat(temperature);
      const parsedTopP = parseFloat(topP);

      return {
        ...prev,
        settings: {
          ...prev.settings,
          language,
          theme,
          llm: {
            ...prev.settings.llm,
            model,
            baseUrl: baseUrl.trim() || undefined,
            apiKey: apiKey.trim() || undefined,
            temperature: Number.isFinite(parsedTemperature)
              ? parsedTemperature
              : prev.settings.llm.temperature,
            topP: Number.isFinite(parsedTopP) ? parsedTopP : prev.settings.llm.topP,
          },
        },
      };
    });

    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-100">Settings</h1>
          <p className="text-subtle text-sm">
            Configure the Keeper language, theme, and LLM connection used across the app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-100">General</h2>
              <p className="text-subtle text-sm">
                Choose defaults for generated content and UI presentation.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-gray-200">
                <span className="text-subtle">Keeper language</span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as KeeperLanguage)}
                  className="rounded-lg border border-outline bg-[var(--bg)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                >
                  <option value="en">English</option>
                  <option value="ru">Russian</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-200">
                <span className="text-subtle">Theme</span>
                <select
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as "light" | "dark" | "system")}
                  className="rounded-lg border border-outline bg-[var(--bg)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </label>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-100">LLM connection</h2>
              <p className="text-subtle text-sm">
                Provide an OpenAI-compatible endpoint to power the Keeper and scenario builders.
              </p>
            </div>
            <div className="grid gap-4">
              <Input
                label="Model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="gpt-4o-mini"
              />
              <Input
                label="Base URL"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://api.openai.com/v1"
              />
              <Input
                label="API key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={temperature}
                  onChange={(event) => setTemperature(event.target.value)}
                />
                <Input
                  label="Top P"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={topP}
                  onChange={(event) => setTopP(event.target.value)}
                />
              </div>
              <p className="text-subtle text-xs">
                Settings are stored locally in your browser and used for all future sessions.
              </p>
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <Button type="submit">Save settings</Button>
            {status === "saved" && (
              <span className="text-sm text-green-400">Saved</span>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
