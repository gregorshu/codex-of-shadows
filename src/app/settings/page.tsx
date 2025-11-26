"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/lib/app-data-context";
import { KeeperLanguage, KeeperTheme } from "@/types";
import { LANGUAGE_NATIVE_NAMES, useTranslation } from "@/lib/i18n";
import { TextArea } from "@/components/ui/TextArea";
import { DEFAULT_KEEPER_SYSTEM_PROMPT } from "@/data/defaultKeeperSystemPrompt";

export default function SettingsPage() {
  const { data, updateData } = useAppData();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"general" | "keeperPrompt">("general");
  const [language, setLanguage] = useState<KeeperLanguage>(data.settings.language);
  const [theme, setTheme] = useState<KeeperTheme>(data.settings.theme);
  const [model, setModel] = useState(data.settings.llm.model);
  const [baseUrl, setBaseUrl] = useState(data.settings.llm.baseUrl ?? "");
  const [apiKey, setApiKey] = useState(data.settings.llm.apiKey ?? "");
  const [temperature, setTemperature] = useState(
    data.settings.llm.temperature?.toString() ?? "0.7"
  );
  const [topP, setTopP] = useState(data.settings.llm.topP?.toString() ?? "0.9");
  const [keeperSystemPrompt, setKeeperSystemPrompt] = useState(
    data.settings.keeperSystemPrompt || DEFAULT_KEEPER_SYSTEM_PROMPT
  );
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
          keeperSystemPrompt,
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
          <h1 className="text-2xl font-semibold text-gray-100">{t("settingsTitle")}</h1>
          <p className="text-subtle text-sm">{t("settingsSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                activeTab === "general"
                  ? "border-accent bg-accent/10 text-gray-100"
                  : "border-outline text-subtle hover:border-accent/50 hover:text-gray-100"
              }`}
              onClick={() => setActiveTab("general")}
            >
              {t("settingsTabGeneral")}
            </button>
            <button
              type="button"
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                activeTab === "keeperPrompt"
                  ? "border-accent bg-accent/10 text-gray-100"
                  : "border-outline text-subtle hover:border-accent/50 hover:text-gray-100"
              }`}
              onClick={() => setActiveTab("keeperPrompt")}
            >
              {t("settingsTabKeeperPrompt")}
            </button>
          </div>

          {activeTab === "general" && (
            <>
              <Card className="space-y-4 p-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-gray-100">{t("settingsGeneralHeading")}</h2>
                  <p className="text-subtle text-sm">{t("settingsGeneralDescription")}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-gray-200">
                    <span className="text-subtle">{t("settingsLanguageLabel")}</span>
                    <select
                      value={language}
                      onChange={(event) => setLanguage(event.target.value as KeeperLanguage)}
                      className="rounded-lg border border-outline bg-[var(--bg)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                    >
                      {Object.entries(LANGUAGE_NATIVE_NAMES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-200">
                    <span className="text-subtle">{t("settingsThemeLabel")}</span>
                    <select
                      value={theme}
                      onChange={(event) => setTheme(event.target.value as KeeperTheme)}
                      className="rounded-lg border border-outline bg-[var(--bg)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                    >
                      <option value="dark">{t("themeOptionDark")}</option>
                      <option value="light">{t("themeOptionLight")}</option>
                      <option value="system">{t("themeOptionSystem")}</option>
                      <option value="green">{t("themeOptionGreen")}</option>
                      <option value="blue">{t("themeOptionBlue")}</option>
                      <option value="red">{t("themeOptionRed")}</option>
                    </select>
                  </label>
                </div>
              </Card>

              <Card className="space-y-4 p-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-gray-100">{t("settingsLLMHeading")}</h2>
                  <p className="text-subtle text-sm">{t("settingsLLMDescription")}</p>
                </div>
                <div className="grid gap-4">
                  <Input
                    label={t("settingsModelLabel")}
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    placeholder="gpt-4o-mini"
                  />
                  <Input
                    label={t("settingsBaseUrlLabel")}
                    value={baseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                    placeholder="https://your-llm-endpoint.example.com"
                  />
                  <Input
                    label={t("settingsApiKeyLabel")}
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="sk-..."
                    autoComplete="off"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label={t("settingsTemperatureLabel")}
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={temperature}
                      onChange={(event) => setTemperature(event.target.value)}
                    />
                    <Input
                      label={t("settingsTopPLabel")}
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={topP}
                      onChange={(event) => setTopP(event.target.value)}
                    />
                  </div>
                  <p className="text-subtle text-xs">{t("settingsStorageNote")}</p>
                </div>
              </Card>
            </>
          )}

          {activeTab === "keeperPrompt" && (
            <Card className="space-y-4 p-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-100">{t("settingsKeeperPromptHeading")}</h2>
                <p className="text-subtle text-sm">{t("settingsKeeperPromptDescription")}</p>
              </div>
              <TextArea
                label={t("settingsKeeperPromptLabel")}
                value={keeperSystemPrompt}
                onChange={(event) => setKeeperSystemPrompt(event.target.value)}
              />
              <p className="text-subtle text-xs">{t("settingsKeeperPromptNote")}</p>
            </Card>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit">{t("settingsSaveButton")}</Button>
            {status === "saved" && <span className="text-sm text-green-400">{t("settingsSavedStatus")}</span>}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
