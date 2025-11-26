export interface KeeperTurnParsed {
  narration: string;
  choices: string[];
}

function parseJsonReply(raw: string): KeeperTurnParsed | null {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : cleaned;

  try {
    const parsed = JSON.parse(candidate);
    const narration = typeof parsed.narration === "string" ? parsed.narration.trim() : "";
    const choices = Array.isArray(parsed.choices)
      ? parsed.choices.filter((choice) => typeof choice === "string" && choice.trim().length > 0)
      : [];

    if (!narration) return null;

    return {
      narration,
      choices,
    };
  } catch (error) {
    console.warn("Failed to parse Keeper JSON reply", error);
    return null;
  }
}

function parseLegacyReply(raw: string): KeeperTurnParsed {
  const narrationMatch = raw.match(/NARRATION:\s*([\s\S]*?)\n\s*CHOICES:/i);
  const choicesSectionMatch = raw.match(/CHOICES:\s*([\s\S]*)$/i);

  const narration = narrationMatch ? narrationMatch[1].trim() : raw.trim();
  const choicesRaw = choicesSectionMatch ? choicesSectionMatch[1].trim() : "";

  const choices: string[] = [];
  for (const line of choicesRaw.split("\n")) {
    const m = line.match(/^\s*\d+\.\s*(.+)$/);
    if (m) choices.push(m[1].trim());
  }

  return { narration, choices };
}

/**
 * Parses a Keeper reply into narration and choices.
 */
export function parseKeeperReply(raw: string): KeeperTurnParsed {
  return parseJsonReply(raw) ?? parseLegacyReply(raw);
}
