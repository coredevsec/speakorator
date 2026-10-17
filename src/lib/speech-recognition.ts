export const SPEECH_LANGUAGE_STORAGE_KEY = "orator.speech-language";

export const SPEECH_LANGUAGES = [
  { code: "en-US", label: "English (United States)" },
  { code: "en-GB", label: "English (United Kingdom)" },
  { code: "en-AU", label: "English (Australia)" },
  { code: "en-CA", label: "English (Canada)" },
  { code: "en-IN", label: "English (India)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "es-MX", label: "Spanish (Mexico)" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
] as const;

export type SpeechLanguage = (typeof SPEECH_LANGUAGES)[number]["code"];

export function getBrowserSpeechLanguage(): SpeechLanguage {
  if (typeof navigator === "undefined") return "en-US";
  const browserLanguage = navigator.language.toLowerCase();
  return (
    SPEECH_LANGUAGES.find((language) => language.code.toLowerCase() === browserLanguage)?.code ??
    SPEECH_LANGUAGES.find(
      (language) => language.code.split("-")[0] === browserLanguage.split("-")[0],
    )?.code ??
    "en-US"
  );
}

export function getSavedSpeechLanguage(): SpeechLanguage {
  if (typeof window === "undefined") return "en-US";
  try {
    const savedLanguage = window.localStorage.getItem(SPEECH_LANGUAGE_STORAGE_KEY);
    return (
      SPEECH_LANGUAGES.find((language) => language.code === savedLanguage)?.code ??
      getBrowserSpeechLanguage()
    );
  } catch {
    return getBrowserSpeechLanguage();
  }
}

export function saveSpeechLanguage(language: SpeechLanguage): void {
  try {
    window.localStorage.setItem(SPEECH_LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Keep the selected language active for the current page if storage is unavailable.
  }
}

export function normalizeSpeechToken(token: string): string {
  return token
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}']/gu, "");
}

export function alignSpeechTokens(expected: string[], heard: string[], cursor: number): number {
  const heardTokens = heard.filter(Boolean);
  if (heardTokens.length === 0 || cursor >= expected.length) return cursor;

  const lookaheadLimit = Math.min(heardTokens.length + 2, 10);
  const expectedWindow = expected.slice(cursor, cursor + lookaheadLimit);
  const skippedExpectedCost = 0.65;
  const extraHeardCost = 0.9;
  let previousRow = Array.from(
    { length: expectedWindow.length + 1 },
    (_, index) => index * skippedExpectedCost,
  );

  for (let heardIndex = 0; heardIndex < heardTokens.length; heardIndex += 1) {
    const currentRow = [(heardIndex + 1) * extraHeardCost];
    for (let expectedIndex = 0; expectedIndex < expectedWindow.length; expectedIndex += 1) {
      const matchCost = speechTokenDistance(heardTokens[heardIndex], expectedWindow[expectedIndex]);
      currentRow.push(
        Math.min(
          previousRow[expectedIndex] + matchCost,
          currentRow[expectedIndex] + skippedExpectedCost,
          previousRow[expectedIndex + 1] + extraHeardCost,
        ),
      );
    }
    previousRow = currentRow;
  }

  let bestEnd = 0;
  let bestCost = previousRow[0];
  for (let expectedIndex = 1; expectedIndex < previousRow.length; expectedIndex += 1) {
    if (previousRow[expectedIndex] < bestCost) {
      bestCost = previousRow[expectedIndex];
      bestEnd = expectedIndex;
    }
  }

  if (bestEnd <= 0 || bestCost / heardTokens.length > 0.45) return cursor;
  return Math.max(cursor, cursor + bestEnd);
}

function speechTokenDistance(first: string, second: string): number {
  if (first === second) return 0;
  if (Math.min(first.length, second.length) < 4) return 1;

  let previousRow = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const currentRow = [firstIndex];
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      currentRow.push(
        Math.min(
          previousRow[secondIndex] + 1,
          currentRow[secondIndex - 1] + 1,
          previousRow[secondIndex - 1] +
            (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1),
        ),
      );
    }
    previousRow = currentRow;
  }

  const distance = previousRow[second.length];
  return distance === 1 && distance / Math.max(first.length, second.length) <= 0.25 ? 0.25 : 1;
}

export function stableSpeechPrefix(previous: string[], current: string[]): string[] {
  let stableLength = 0;
  while (
    stableLength < previous.length &&
    stableLength < current.length &&
    previous[stableLength] === current[stableLength]
  ) {
    stableLength += 1;
  }
  return current.slice(0, stableLength);
}
