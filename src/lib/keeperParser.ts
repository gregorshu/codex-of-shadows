export interface KeeperTurnParsed {
  narration: string;
  choices: string[];
}

/**
 * Parses a Keeper reply into narration and choices.
 * Expects the format:
 *
 * NARRATION:
 * ...
 *
 * CHOICES:
 * 1. ...
 * 2. ...
 * ...
 */
export function parseKeeperReply(raw: string): KeeperTurnParsed {
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
