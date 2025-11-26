"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppData, createId } from "@/lib/app-data-context";
import { Scenario } from "@/types";
import { callLLM } from "@/lib/llm";
import { AppShell } from "@/components/layout/AppShell";
import { LANGUAGE_ENGLISH_NAMES, useTranslation } from "@/lib/i18n";

const eraOptions = ["era1920s", "eraModernDay", "eraGaslight"] as const;
type EraOption = (typeof eraOptions)[number];
const toneOptions = [
  "toneInvestigationHeavy",
  "tonePsychologicalHorror",
  "toneSurvival",
  "tonePulp",
] as const;
type ToneOption = (typeof toneOptions)[number];
const settingOptions = [
  "settingSmallCoastalTown",
  "settingAbandonedFarmhouse",
  "settingUniversityCampus",
  "settingIndustrialDistrict",
] as const;
type SettingOption = (typeof settingOptions)[number];

type Step = 0 | 1 | 2;

export default function ScenarioWizardPage() {
  const { data, upsertScenario } = useAppData();
  const router = useRouter();
  const { t, language } = useTranslation();
  const [step, setStep] = useState<Step>(0);
  const [era, setEra] = useState<EraOption>(eraOptions[0]);
  const [tone, setTone] = useState<ToneOption>(toneOptions[0]);
  const [setting, setSetting] = useState<SettingOption | "settingCustom">(settingOptions[0]);
  const [customSetting, setCustomSetting] = useState("");
  const [premise, setPremise] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const goNext = () => setStep((s) => Math.min(2, (s + 1) as Step));
  const goBack = () => setStep((s) => Math.max(0, (s - 1) as Step));

  const previewSetting = setting === "settingCustom" ? customSetting || t("settingCustom") : t(setting);

  const handleFinish = async () => {
    setIsLoading(true);
    const selectedSetting = setting === "settingCustom" ? customSetting || t("settingCustom") : t(setting);
    const prompt = `Generate a 2–4 sentence Call of Cthulhu scenario premise based on:\n- Era: ${t(
      era
    )}\n- Tone: ${t(tone)}\n- Setting: ${selectedSetting}\n\nMake the text atmospheric, investigation-friendly, and suitable for a one-shot.\nDo NOT include rules.\nRespond in ${LANGUAGE_ENGLISH_NAMES[language]}.`;

    let generatedPremise = premise || t("scenarioPremiseFallback");
    try {
      if (data.settings.llm.apiKey) {
        const stream = await callLLM({
          baseUrl: data.settings.llm.baseUrl,
          apiKey: data.settings.llm.apiKey,
          model: data.settings.llm.model,
          messages: [
            { role: "system", content: "You write concise scenario seeds." },
            { role: "user", content: prompt },
          ],
        });
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }
        generatedPremise = fullText || generatedPremise;
      }
    } catch (error) {
      console.error("Premise generation failed", error);
    }

    const now = new Date().toISOString();
    const scenario: Scenario = {
      id: createId(),
      name: t("scenarioNameTemplate", { tone: t(tone), era: t(era) }),
      premise: generatedPremise,
      shortDescription: t("scenarioShortDescription", { setting: previewSetting }),
      source: "custom",
      tags: [t(era), t(tone), selectedSetting],
      meta: {
        era: t(era),
        tone: t(tone),
        settingDescription: selectedSetting,
      },
      createdAt: now,
      updatedAt: now,
    };

    upsertScenario(scenario);
    router.push(`/investigator?scenarioId=${scenario.id}`);
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-subtle">{t("scenarioWizardBadge")}</p>
              <h2 className="text-xl font-semibold text-gray-100">{t("scenarioWizardTitle")}</h2>
            </div>
            <div className="text-sm text-subtle">{t("scenarioWizardStep", { current: step + 1, total: 3 })}</div>
          </div>

          {step === 0 && (
            <div className="grid gap-4">
              <p className="text-subtle">{t("chooseEra")}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {eraOptions.map((item) => (
                  <Card
                    key={item}
                    className={`cursor-pointer p-4 ${era === item ? "border-slate-400/60" : ""}`}
                    onClick={() => setEra(item)}
                  >
                    <p className="font-semibold">{t(item)}</p>
                    <p className="text-subtle text-sm">{t("eraDescription")}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4">
              <p className="text-subtle">{t("chooseTone")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {toneOptions.map((item) => (
                  <Card
                    key={item}
                    className={`cursor-pointer p-4 ${tone === item ? "border-slate-400/60" : ""}`}
                    onClick={() => setTone(item)}
                  >
                    <p className="font-semibold">{t(item)}</p>
                    <p className="text-subtle text-sm">{t("toneDescription")}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <p className="text-subtle">{t("chooseSetting")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[...settingOptions, "settingCustom"].map((item) => (
                  <Card
                    key={item}
                    className={`cursor-pointer p-4 ${setting === item ? "border-slate-400/60" : ""}`}
                    onClick={() => setSetting(item as SettingOption | "settingCustom")}
                  >
                    <p className="font-semibold">{t(item as SettingOption | "settingCustom")}</p>
                    <p className="text-subtle text-sm">
                      {item === "settingCustom" ? t("settingProvideYourOwn") : t("settingQuickStart")}
                    </p>
                  </Card>
                ))}
              </div>
              {setting === "settingCustom" && (
                <input
                  value={customSetting}
                  onChange={(e) => setCustomSetting(e.target.value)}
                  placeholder={t("settingCustomPlaceholder")}
                  className="rounded-lg border border-outline bg-[var(--bg)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                />
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={goBack}>
              {t("navBack")}
            </Button>
            {step < 2 ? (
              <Button onClick={goNext}>{t("navNext")}</Button>
            ) : (
              <Button onClick={handleFinish} disabled={isLoading}>
                {isLoading ? t("generating") : t("finishSetup")}
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-subtle">{t("previewBadge")}</p>
          <h3 className="mb-4 text-lg font-semibold text-gray-100">
            {t("scenarioNameTemplate", { tone: t(tone), era: t(era) })}
          </h3>
          <div className="mb-4 flex flex-wrap gap-2 text-xs text-subtle">
            <span className="rounded-full bg-[#1f2937] px-3 py-1">{t(era)}</span>
            <span className="rounded-full bg-[#1f2937] px-3 py-1">{t(tone)}</span>
            <span className="rounded-full bg-[#1f2937] px-3 py-1">{previewSetting}</span>
          </div>
          <div className="space-y-3 text-sm text-gray-200">
            <p className="text-subtle">{t("premisePreviewLabel")}</p>
            <p className="leading-relaxed">{premise || t("premisePreviewFallback")}</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
