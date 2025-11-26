"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { useAppData, createId } from "@/lib/app-data-context";
import { Investigator } from "@/types";
import { callLLM, readLLMStream } from "@/lib/llm";
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
    const fallback = fallbackInvestigatorByLanguage[language];
    setLoading(true);
    const prompt = `Create an investigator concept for a Call of Cthulhu one-shot. Keep it concise and grounded.\nRespond with ONLY a minified JSON object using exactly these keys and nothing else (no code fences, no commentary, no extra text):\n{"name":"<name>","occupation":"<occupation>","background":"<3-5 sentence background>","personalityTraits":["<trait 1>","<trait 2>","<trait 3>"],"skillsSummary":"<short summary of their main skills (not mechanical percentages)>"}\nUse ${LANGUAGE_ENGLISH_NAMES[language]} for all fields.`;

    const cleanValue = (value: string) =>
      value
        .replace(/^openrouter processing\s*/i, "")
        .replace(/^[-*•\s]*/, "")
        .replace(/^\*+|\*+$/g, "")
        .replace(/^(Name|Occupation|Background|Traits|Skills)[:\s-]*/i, "")
        .trim();

    const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z]/g, "");

    const stripFormatting = (raw: string) =>
      raw
        .replace(/```[a-z]*\s*/gi, "")
        .replace(/```/g, "")
        .replace(/^json\s*/i, "")
        .trim();

    const parseStructuredResponse = (response: string) => {
      const sanitized = stripFormatting(response);

      const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      try {
        const parsed = JSON.parse(jsonMatch[0]) as {
          name?: string;
          occupation?: string;
          background?: string;
          traits?: string[];
          personalityTraits?: string[];
          skills?: string;
          skillsSummary?: string;
        };

        const parsedTraits = Array.isArray(parsed.personalityTraits)
          ? parsed.personalityTraits
          : Array.isArray(parsed.traits)
            ? parsed.traits
            : [];

        return {
          name: parsed.name ? cleanValue(parsed.name) : "",
          occupation: parsed.occupation ? cleanValue(parsed.occupation) : "",
          background: parsed.background ? cleanValue(parsed.background) : "",
          traits: parsedTraits
            .map((trait) => cleanValue(String(trait)))
            .filter(Boolean)
            .map((trait) => trait.split(/\s+/).slice(0, 2).join(" "))
            .slice(0, 3),
          skills: parsed.skillsSummary
            ? cleanValue(parsed.skillsSummary)
            : parsed.skills
              ? cleanValue(parsed.skills)
              : "",
        };
      } catch {
        return null;
      }
    };

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
        const fullText = stripFormatting(await readLLMStream(stream));
        const lines = fullText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        const structured = parseStructuredResponse(fullText);

        const parsed = lines.reduce<Record<string, string>>((acc, line) => {
          if (line.startsWith("{") || line.endsWith("}")) return acc;

          const [label, ...rest] = line.split(":");
          if (!rest.length) return acc;

          const key = normalizeKey(label);
          acc[key] = cleanValue(rest.join(":"));
          return acc;
        }, {});

        const generatedTraits = structured?.traits?.length
          ? structured.traits
          : (parsed.traits || parsed.personalitytraits || "")
              .split(/[,;\n]/)
              .map((trait) => trait.trim())
              .filter(Boolean)
              .map((trait) => trait.split(/\s+/).slice(0, 2).join(" "))
              .slice(0, 3);

        const background = cleanValue(
          structured?.background || parsed.background || lines.slice(2, 5).join(" "),
        );
        const skillsSummary = cleanValue(
          structured?.skills || parsed.skills || parsed.mainskills || lines.slice(4).join(" "),
        );

        setInvestigator((prev) => ({
          ...prev,
          name: cleanValue(structured?.name || parsed.name || lines[0] || "") || fallback.name,
          occupation: cleanValue(structured?.occupation || parsed.occupation || lines[1] || "") ||
            fallback.occupation,
          background: background || fallback.background,
          personalityTraits: generatedTraits.length ? generatedTraits : fallback.traits,
          skillsSummary: skillsSummary || fallback.skills,
        }));
      } else {
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
      setInvestigator((prev) => ({
        ...prev,
        name: fallback.name,
        occupation: fallback.occupation,
        background: fallback.background,
        personalityTraits: fallback.traits,
        skillsSummary: fallback.skills,
      }));
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
