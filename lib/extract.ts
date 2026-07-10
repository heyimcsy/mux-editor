import {
  hslToRgb,
  hueDistance,
  lighten,
  parseHex,
  rgbToHsl,
  toHex,
  type Rgb,
} from "./color";
import type { Theme } from "./theme";

export type Swatch = { hex: string; count: number };

/** 4 bits per channel — coarse enough to merge JPEG noise, fine enough to
 *  keep distinct hues apart. */
const BUCKET_BITS = 4;
const BUCKET_SHIFT = 8 - BUCKET_BITS;

/**
 * Buckets pixels by quantized RGB, then returns the most common buckets as
 * their true averaged color. Fully transparent pixels are skipped.
 */
export function extractSwatches(data: ImageData, max = 24): Swatch[] {
  const buckets = new Map<number, { r: number; g: number; b: number; count: number }>();
  const pixels = data.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha < 128) continue;

    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const key =
      ((r >> BUCKET_SHIFT) << (BUCKET_BITS * 2)) |
      ((g >> BUCKET_SHIFT) << BUCKET_BITS) |
      (b >> BUCKET_SHIFT);

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, max)
    .map(({ r, g, b, count }) => ({
      hex: toHex({ r: r / count, g: g / count, b: b / count }),
      count,
    }));
}

/** Hue anchors for ANSI slots 1–6: red, green, yellow, blue, magenta, cyan. */
const ANSI_HUES = [0, 120, 55, 215, 300, 185];

type Candidate = { hex: string; h: number; s: number; l: number };

function toCandidates(swatches: Swatch[]): Candidate[] {
  return swatches.flatMap((swatch) => {
    const rgb = parseHex(swatch.hex);
    if (!rgb) return [];
    const hsl = rgbToHsl(rgb);
    return [{ hex: swatch.hex, ...hsl }];
  });
}

/** Beyond this the color no longer reads as the ANSI slot it would fill. */
const MAX_HUE_DRIFT = 50;

/**
 * Greedily matches image colors to ANSI slots 1–6, best pair first. Each color
 * is claimed by at most one slot: without that, a single blue would satisfy
 * both `blue` (215°) and `cyan` (185°) and the terminal would render the two
 * indistinguishably. Slots left unmatched come back undefined and get
 * synthesized at their canonical hue.
 */
function assignHues(candidates: Candidate[]): (Candidate | undefined)[] {
  const usable = candidates.filter((c) => c.s >= 0.18 && c.l >= 0.12 && c.l <= 0.88);

  const pairs: { slot: number; candidate: Candidate; score: number }[] = [];
  ANSI_HUES.forEach((targetHue, slot) => {
    for (const candidate of usable) {
      const distance = hueDistance(candidate.h, targetHue);
      if (distance > MAX_HUE_DRIFT) continue;
      // Saturation is a tiebreaker, not a gate: a vivid near-miss beats a
      // washed-out exact match.
      pairs.push({ slot, candidate, score: distance - candidate.s * 30 });
    }
  });

  pairs.sort((a, b) => a.score - b.score);

  const assigned: (Candidate | undefined)[] = new Array(ANSI_HUES.length);
  const claimed = new Set<string>();

  for (const pair of pairs) {
    if (assigned[pair.slot] || claimed.has(pair.candidate.hex)) continue;
    assigned[pair.slot] = pair.candidate;
    claimed.add(pair.candidate.hex);
  }

  return assigned;
}

function synthesize(hue: number, saturation: number, lightness: number): string {
  return toHex(hslToRgb({ h: hue, s: saturation, l: lightness }));
}

/** Pulls a color to a legible lightness for the given background. */
function fitToBackground(hex: string, isDarkBackground: boolean): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const { h, s, l } = rgbToHsl(rgb);

  const clamped = isDarkBackground
    ? Math.max(l, 0.5)
    : Math.min(l, 0.48);

  return toHex(hslToRgb({ h, s: Math.max(s, 0.35), l: clamped }));
}

export type ExtractedTheme = Pick<
  Theme,
  | "background"
  | "foreground"
  | "cursorColor"
  | "cursorText"
  | "selectionBackground"
  | "selectionForeground"
  | "palette"
>;

/**
 * Maps an image's dominant colors onto a full ANSI theme. The image supplies
 * background, foreground and whatever hues it actually contains; missing ANSI
 * slots are synthesized at the canonical hue so the palette is always complete.
 */
export function buildThemeFromSwatches(swatches: Swatch[]): ExtractedTheme | null {
  const candidates = toCandidates(swatches);
  if (candidates.length < 2) return null;

  const byLightness = [...candidates].sort((a, b) => a.l - b.l);
  const darkest = byLightness[0];
  const lightest = byLightness[byLightness.length - 1];

  // The more common of the two extremes becomes the background — a photo of a
  // bright sky should yield a light theme, not a dark one with a bright bg.
  const darkCount = swatches.find((s) => s.hex === darkest.hex)?.count ?? 0;
  const lightCount = swatches.find((s) => s.hex === lightest.hex)?.count ?? 0;
  const backgroundIsDark = darkCount >= lightCount ? true : lightest.l < 0.5;

  const background = backgroundIsDark
    ? synthesize(darkest.h, Math.min(darkest.s, 0.35), Math.min(darkest.l, 0.16))
    : synthesize(lightest.h, Math.min(lightest.s, 0.12), Math.max(lightest.l, 0.92));

  const foreground = backgroundIsDark
    ? synthesize(lightest.h, Math.min(lightest.s, 0.12), Math.max(lightest.l, 0.9))
    : synthesize(darkest.h, Math.min(darkest.s, 0.3), Math.min(darkest.l, 0.24));

  const averageSaturation =
    candidates.reduce((sum, c) => sum + c.s, 0) / candidates.length;

  const matches = assignHues(candidates);
  const normal = ANSI_HUES.map((hue, slot) => {
    const match = matches[slot];
    return match
      ? fitToBackground(match.hex, backgroundIsDark)
      : synthesize(hue, Math.max(averageSaturation, 0.45), backgroundIsDark ? 0.6 : 0.42);
  });

  const brightDelta = backgroundIsDark ? 0.1 : -0.1;
  const bright = normal.map((hex) => lighten(hex, brightDelta));

  // Slots 0/8 ("black") sit just off the background and 7/15 ("white") just off
  // the foreground — but only on dark themes. On a light theme both greys are
  // derived from the background, otherwise "white" would come out dark.
  const black = backgroundIsDark
    ? lighten(background, 0.12)
    : lighten(background, -0.62);
  const brightBlack = backgroundIsDark
    ? lighten(background, 0.24)
    : lighten(background, -0.5);
  const white = backgroundIsDark
    ? lighten(foreground, -0.1)
    : lighten(background, -0.28);
  const brightWhite = backgroundIsDark ? foreground : lighten(background, -0.18);

  const palette = [black, ...normal, white, brightBlack, ...bright, brightWhite];

  return {
    background,
    foreground,
    cursorColor: foreground,
    cursorText: background,
    selectionBackground: lighten(background, backgroundIsDark ? 0.18 : -0.12),
    selectionForeground: foreground,
    palette,
  };
}

/** Reads one pixel from a canvas in canvas-space coordinates. */
export function pickPixel(
  canvas: HTMLCanvasElement,
  x: number,
  y: number
): string | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const px = ctx.getImageData(
    Math.floor(x),
    Math.floor(y),
    1,
    1
  ).data;
  if (px[3] < 128) return null;

  const rgb: Rgb = { r: px[0], g: px[1], b: px[2] };
  return toHex(rgb);
}
