"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppData, createId } from "@/lib/app-data-context";
import { Scenario } from "@/types";
import { callLLM } from "@/lib/llm";
import { AppShell } from "@/components/layout/AppShell";

const eras = ["1920s", "Modern Day", "Gaslight"];
const tones = ["Investigation-heavy", "Psychological Horror", "Survival", "Pulp"];
const settings = ["Small coastal town", "Abandoned farmhouse", "University campus", "Industrial district"];

type Step = 0 | 1 | 2;

export default function ScenarioWizardPage() {
  const { data, upsertScenario } = useAppData();
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [era, setEra] = useState(eras[0]);
  const [tone, setTone] = useState(tones[0]);
  const [setting, setSetting] = useState(settings[0]);
  const [customSetting, setCustomSetting] = useState("");
  const [premise, setPremise] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const goNext = () => setStep((s) => Math.min(2, (s + 1) as Step));
  const goBack = () => setStep((s) => Math.max(0, (s - 1) as Step));

  const previewSetting = setting === "Custom" ? customSetting || "Custom" : setting;

  const handleFinish = async () => {
    setIsLoading(true);
    const selectedSetting = setting === "Custom" ? customSetting || "Custom" : setting;
    const prompt = `Generate a 2–4 sentence Call of Cthulhu scenario premise based on:\n- Era: ${era}\n- Tone: ${tone}\n- Setting: ${selectedSetting}\n\nMake the text atmospheric, investigation-friendly, and suitable for a one-shot.\nDo NOT include rules.`;

    let generatedPremise = premise || "An eerie mystery unfolds in this setting.";
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
      name: `${tone} in the ${era}`,
      premise: generatedPremise,
      shortDescription: `An adventure set in the ${previewSetting.toLowerCase()}.`,
      source: "custom",
      tags: [era, tone, selectedSetting],
      meta: {
        era,
        tone,
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
              <p className="text-xs uppercase tracking-[0.2em] text-subtle">Scenario wizard</p>
              <h2 className="text-xl font-semibold text-gray-100">Define your setup</h2>
            </div>
            <div className="text-sm text-subtle">Step {step + 1} of 3</div>
          </div>

          {step === 0 && (
            <div className="grid gap-4">
              <p className="text-subtle">Choose era</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {eras.map((item) => (
                  <Card
                    key={item}
                    className={`cursor-pointer p-4 ${era === item ? "border-slate-400/60" : ""}`}
                    onClick={() => setEra(item)}
                  >
                    <p className="font-semibold">{item}</p>
                    <p className="text-subtle text-sm">Classic Call of Cthulhu moods.</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4">
              <p className="text-subtle">Choose tone</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {tones.map((item) => (
                  <Card
                    key={item}
                    className={`cursor-pointer p-4 ${tone === item ? "border-slate-400/60" : ""}`}
                    onClick={() => setTone(item)}
                  >
                    <p className="font-semibold">{item}</p>
                    <p className="text-subtle text-sm">Mood for your one-shot.</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <p className="text-subtle">Choose setting</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[...settings, "Custom"].map((item) => (
                  <Card
                    key={item}
                    className={`cursor-pointer p-4 ${setting === item ? "border-slate-400/60" : ""}`}
                    onClick={() => setSetting(item)}
                  >
                    <p className="font-semibold">{item}</p>
                    <p className="text-subtle text-sm">{item === "Custom" ? "Provide your own" : "Quick start"}</p>
                  </Card>
                ))}
              </div>
              {setting === "Custom" && (
                <input
                  value={customSetting}
                  onChange={(e) => setCustomSetting(e.target.value)}
                  placeholder="Describe the setting"
                  className="rounded-lg border border-outline bg-[var(--bg)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                />
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={goBack}>
              Back
            </Button>
            {step < 2 ? (
              <Button onClick={goNext}>Next</Button>
            ) : (
              <Button onClick={handleFinish} disabled={isLoading}>
                {isLoading ? "Generating..." : "Finish setup"}
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-subtle">Preview</p>
          <h3 className="mb-4 text-lg font-semibold text-gray-100">{tone} in the {era}</h3>
          <div className="mb-4 flex flex-wrap gap-2 text-xs text-subtle">
            <span className="rounded-full bg-[#1f2937] px-3 py-1">{era}</span>
            <span className="rounded-full bg-[#1f2937] px-3 py-1">{tone}</span>
            <span className="rounded-full bg-[#1f2937] px-3 py-1">{previewSetting}</span>
          </div>
          <div className="space-y-3 text-sm text-gray-200">
            <p className="text-subtle">Premise preview</p>
            <p className="leading-relaxed">
              {premise ||
                "A moody investigation ripe with secrets. Finish setup to let the Keeper draft a premise for you."}
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
