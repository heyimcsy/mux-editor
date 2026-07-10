/** Monospace families worth offering when we cannot enumerate the system. */
export const COMMON_MONO_FONTS = [
  "JetBrains Mono",
  "Fira Code",
  "D2Coding",
  "나눔고딕코딩",
  "SF Mono",
  "Menlo",
  "Monaco",
  "Cascadia Code",
  "Cascadia Mono",
  "Consolas",
  "Source Code Pro",
  "IBM Plex Mono",
  "Hack",
  "Iosevka",
  "Ubuntu Mono",
  "DejaVu Sans Mono",
  "Noto Sans Mono",
  "Courier New",
];

type LocalFont = { family: string };
type WindowWithLocalFonts = Window & {
  queryLocalFonts?: () => Promise<LocalFont[]>;
};

export function supportsLocalFonts(): boolean {
  return typeof window !== "undefined" && "queryLocalFonts" in window;
}

let measureContext: CanvasRenderingContext2D | null = null;

function context(): CanvasRenderingContext2D | null {
  if (measureContext) return measureContext;
  const canvas = document.createElement("canvas");
  measureContext = canvas.getContext("2d");
  return measureContext;
}

/**
 * A font is monospaced when every glyph advances the same width. Comparing the
 * narrowest and widest common latin glyphs is enough to tell them apart, and it
 * is the only signal available — the Local Font Access API does not expose a
 * "monospace" flag.
 */
export function isMonospace(family: string): boolean {
  const ctx = context();
  if (!ctx) return false;

  const widthOf = (text: string) => {
    ctx.font = `72px "${family.replace(/"/g, "")}", monospace`;
    return ctx.measureText(text).width;
  };

  const narrow = widthOf("i");
  const wide = widthOf("W");
  if (narrow === 0 || wide === 0) return false;

  return Math.abs(narrow - wide) < 0.5;
}

/** True when the family is actually resolvable in this browser. */
export function isAvailable(family: string): boolean {
  if (typeof document === "undefined" || !document.fonts) return false;
  try {
    return document.fonts.check(`12px "${family.replace(/"/g, "")}"`);
  } catch {
    return false;
  }
}

/**
 * Enumerates installed monospace families via the Local Font Access API.
 * Chromium-only, requires a secure context and an explicit user grant, so the
 * caller must offer the curated list as a fallback.
 */
export async function loadSystemMonoFonts(): Promise<string[]> {
  const target = window as WindowWithLocalFonts;
  if (!target.queryLocalFonts) throw new Error("unsupported");

  const fonts = await target.queryLocalFonts();
  const families = [...new Set(fonts.map((font) => font.family))];

  return families.filter(isMonospace).sort((a, b) => a.localeCompare(b));
}

/** The curated list, narrowed to what this machine can actually render. */
export function availableCommonFonts(): string[] {
  return COMMON_MONO_FONTS.filter(isAvailable);
}
