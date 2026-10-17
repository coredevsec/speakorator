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
  let nextCursor = cursor;
  for (let heardIndex = 0; heardIndex < heard.length; heardIndex += 1) {
    const token = heard[heardIndex];
    if (!token) continue;
    while (nextCursor < expected.length && !expected[nextCursor]) nextCursor += 1;
    if (expected[nextCursor] === token) {
      nextCursor += 1;
      continue;
    }
    const confirmation = heard[heardIndex + 1];
    for (let offset = 1; offset <= 2; offset += 1) {
      const targetIndex = nextCursor + offset;
      if (
        expected[targetIndex] === token &&
        confirmation &&
        expected[targetIndex + 1] === confirmation
      ) {
        nextCursor = targetIndex + 2;
        heardIndex += 1;
        break;
      }
    }
  }
  while (nextCursor < expected.length && !expected[nextCursor]) nextCursor += 1;
  return nextCursor;
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
