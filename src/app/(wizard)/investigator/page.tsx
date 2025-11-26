"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { useAppData, createId } from "@/lib/app-data-context";
import { Investigator } from "@/types";
import { callLLM } from "@/lib/llm";
import { AppShell } from "@/components/layout/AppShell";
import {
  LANGUAGE_ENGLISH_NAMES,
  fallbackInvestigatorByLanguage,
  useTranslation,
} from "@/lib/i18n";

export default function InvestigatorWizardPage() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenarioId");
  const { data, upsertInvestigator } = useAppData();
  const { t, language } = useTranslation();
  const router = useRouter();
  const scenario = data.scenarios.find((s) => s.id === scenarioId) || data.scenarios[0];

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [investigator, setInvestigator] = useState<Investigator>({
    id: createId(),
    name: "",
    occupation: "",
    background: "",
    personalityTraits: [],
    skillsSummary: "",
    playerNotes: "",
    language: data.settings.language,
    scenarioId: scenario?.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  useEffect(() => {
    setInvestigator((prev) => ({ ...prev, scenarioId: scenario?.id }));
  }, [scenario?.id]);

  const autoGenerate = async () => {
    setLoading(true);
    const prompt = `Create an investigator concept for a Call of Cthulhu one-shot.\nReturn:\n- Name\n- Occupation\n- 3–5 sentence background\n- 3 personality traits\n- A short summary of their main skills (not mechanical percentages)\nTone: grounded, slightly noir, not comedic.\nRespond in ${LANGUAGE_ENGLISH_NAMES[language]}.`;
    try {
      if (data.settings.llm.apiKey) {
        const stream = await callLLM({
          baseUrl: data.settings.llm.baseUrl,
          apiKey: data.settings.llm.apiKey,
          model: data.settings.llm.model,
          messages: [
            { role: "system", content: "You return structured text." },
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
        const parts = fullText.split("\n").filter(Boolean);
        setInvestigator((prev) => ({
          ...prev,
          name: parts[0]?.replace(/Name:/i, "").trim() || prev.name,
          occupation: parts[1]?.replace(/Occupation:/i, "").trim() || prev.occupation,
          background: parts.slice(2, 4).join(" ") || prev.background,
          personalityTraits: parts
            .slice(4, 7)
            .map((t) => t.replace(/^-\s?/, "").trim())
            .filter(Boolean)
            .slice(0, 3),
          skillsSummary: parts.slice(7).join(" ") || prev.skillsSummary,
        }));
      } else {
        const fallback = fallbackInvestigatorByLanguage[language];
        setInvestigator((prev) => ({
          ...prev,
          name: fallback.name,
          occupation: fallback.occupation,
          background: fallback.background,
          personalityTraits: fallback.traits,
          skillsSummary: fallback.skills,
        }));
      }
    } catch (error) {
      console.error("Failed to generate investigator", error);
    } finally {
      setLoading(false);
      setStep(2);
    }
  };

  const handleSubmit = () => {
    upsertInvestigator({ ...investigator, updatedAt: new Date().toISOString() });
    router.push(`/setup?scenarioId=${scenario?.id}&investigatorId=${investigator.id}`);
  };

  const updateTrait = (index: number, value: string) => {
    setInvestigator((prev) => {
      const traits = [...prev.personalityTraits];
      traits[index] = value;
      return { ...prev, personalityTraits: traits };
    });
  };

  const addTrait = () => {
    setInvestigator((prev) => ({ ...prev, personalityTraits: [...prev.personalityTraits, ""] }));
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-subtle">{t("investigatorWizardBadge")}</p>
              <h2 className="text-xl font-semibold text-gray-100">{t("investigatorWizardTitle")}</h2>
            </div>
            <div className="text-sm text-subtle">{t("investigatorWizardStep", { current: step, total: 2 })}</div>
          </div>

          {step === 1 && (
            <div className="grid gap-4">
              <Card className="cursor-pointer p-4" onClick={autoGenerate}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{t("autoGenerateTitle")}</p>
                    <p className="text-subtle text-sm">{t("autoGenerateDescription")}</p>
                  </div>
                  <Button disabled={loading}>{loading ? t("autoGenerateWorking") : t("autoGenerateButton")}</Button>
                </div>
              </Card>
              <Card className="cursor-pointer p-4" onClick={() => setStep(2)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{t("manualCreateTitle")}</p>
                    <p className="text-subtle text-sm">{t("manualCreateDescription")}</p>
                  </div>
                  <Button variant="ghost">{t("manualContinue")}</Button>
                </div>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <Input
                label={t("nameLabel")}
                value={investigator.name}
                onChange={(e) => setInvestigator({ ...investigator, name: e.target.value })}
              />
              <Input
                label={t("occupationLabel")}
                value={investigator.occupation}
                onChange={(e) => setInvestigator({ ...investigator, occupation: e.target.value })}
              />
              <TextArea
                label={t("backgroundLabel")}
                value={investigator.background}
                onChange={(e) => setInvestigator({ ...investigator, background: e.target.value })}
              />
              <div className="space-y-2 text-sm text-gray-200">
                <p className="text-subtle">{t("personalityTraitsLabel")}</p>
                <div className="flex flex-wrap gap-2">
                  {investigator.personalityTraits.map((trait, idx) => (
                    <input
                      key={idx}
                      value={trait}
                      onChange={(e) => updateTrait(idx, e.target.value)}
                      className="rounded-full border border-outline bg-[#1d2026] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                    />
                  ))}
                  <Button variant="ghost" onClick={addTrait}>
                    {t("addTrait")}
                  </Button>
                </div>
              </div>
              <TextArea
                label={t("skillsSummaryLabel")}
                value={investigator.skillsSummary}
                onChange={(e) => setInvestigator({ ...investigator, skillsSummary: e.target.value })}
              />
              <TextArea
                label={t("playerNotesLabel")}
                value={investigator.playerNotes}
                onChange={(e) => setInvestigator({ ...investigator, playerNotes: e.target.value })}
              />
              <div className="flex justify-end">
                <Button onClick={handleSubmit}>{t("saveInvestigator")}</Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-subtle">{t("scenarioBadge")}</p>
          <h3 className="text-lg font-semibold text-gray-100">{scenario?.name}</h3>
          <p className="text-subtle text-sm">{scenario?.shortDescription}</p>
          <div className="mt-4 space-y-2 text-sm text-gray-200">
            <p className="text-subtle">{t("premiseLabel")}</p>
            <p className="leading-relaxed">{scenario?.premise}</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
