export type PresentationPreferences = {
  background: string;
  accent: string;
};

const DEFAULT_PREFERENCES: PresentationPreferences = {
  background: "#071322",
  accent: "#6ad8c5",
};

const STORAGE_PREFIX = "orator.presentation-preferences.";

export function getPresentationPreferences(userId: string): PresentationPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!stored) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(stored) as Partial<PresentationPreferences>;
    return {
      background: isHexColor(parsed.background)
        ? parsed.background
        : DEFAULT_PREFERENCES.background,
      accent: isHexColor(parsed.accent) ? parsed.accent : DEFAULT_PREFERENCES.accent,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePresentationPreferences(
  userId: string,
  preferences: PresentationPreferences,
): void {
  window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(preferences));
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function readableTextColor(hex: string): string {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.52 ? "#102139" : "#f3f7fc";
}
