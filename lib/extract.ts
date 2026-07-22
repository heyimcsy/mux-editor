import {
  hslToRgb,
  hueDistance,
  lighten,
  parseHex,
  rgbToHsl,
  toHex,
  type Rgb,
} from "./color";
import { contrastRatio } from "./contrast";
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
/**
 * Deliberately generous. The dominant buckets of a painting are its muted
 * mid-tones; the vivid accents that make a palette worth having are a small
 * fraction of the pixels, and a tight cap throws them away before the ANSI
 * slots ever get to compete for them.
 */
export function extractSwatches(data: ImageData, max = 48): Swatch[] {
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

type Candidate = { hex: string; count: number; h: number; s: number; l: number };

function toCandidates(swatches: Swatch[]): Candidate[] {
  return swatches.flatMap((swatch) => {
    const rgb = parseHex(swatch.hex);
    if (!rgb) return [];
    const hsl = rgbToHsl(rgb);
    return [{ hex: swatch.hex, count: swatch.count, ...hsl }];
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

/** What a colored glyph needs against the background to stay readable. */
const ACCENT_CONTRAST = 3;

/** Below this a hue stops reading as a color at all and turns into grey. */
const MIN_USABLE_SATURATION = 0.2;

/**
 * Moves a color toward legibility and stops the moment it gets there.
 *
 * The obvious implementation — clamp every color to a fixed lightness — is what
 * turned vivid source images into washed-out themes: it rewrote colors that
 * were already perfectly readable. This walks lightness in small steps and
 * halts as soon as the color clears the contrast threshold, so a color the
 * image already supports comes through with its own tone intact.
 */
function fitToBackground(
  hex: string,
  background: string,
  isDarkBackground: boolean
): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;

  const { h, l } = rgbToHsl(rgb);
  const s = Math.max(rgbToHsl(rgb).s, MIN_USABLE_SATURATION);

  let lightness = l;
  let candidate = toHex(hslToRgb({ h, s, l: lightness }));

  const step = isDarkBackground ? 0.03 : -0.03;
  for (let i = 0; i < 24; i++) {
    if (contrastRatio(candidate, background) >= ACCENT_CONTRAST) break;

    const next = Math.min(1, Math.max(0, lightness + step));
    if (next === lightness) break;

    lightness = next;
    candidate = toHex(hslToRgb({ h, s, l: lightness }));
  }

  return candidate;
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

  // Decided by how bright the image is overall, weighted by area. Comparing
  // just the two extreme swatches made this flip on a single bright speck.
  const totalCount = candidates.reduce((sum, c) => sum + c.count, 0) || 1;
  const meanLightness =
    candidates.reduce((sum, c) => sum + c.l * c.count, 0) / totalCount;
  const backgroundIsDark = meanLightness < 0.5;

  // The background carries some of the image's hue — a fully neutral one throws
  // away the very thing that made the user pick this image.
  const background = backgroundIsDark
    ? synthesize(darkest.h, Math.min(darkest.s, 0.45), Math.min(darkest.l, 0.17))
    : synthesize(lightest.h, Math.min(lightest.s, 0.18), Math.max(lightest.l, 0.93));

  const foreground = backgroundIsDark
    ? synthesize(lightest.h, Math.min(lightest.s, 0.14), Math.max(lightest.l, 0.9))
    : synthesize(darkest.h, Math.min(darkest.s, 0.32), Math.min(darkest.l, 0.22));

  const averageSaturation =
    candidates.reduce((sum, c) => sum + c.s, 0) / candidates.length;

  const matches = assignHues(candidates);
  const normal = ANSI_HUES.map((hue, slot) => {
    const match = matches[slot];
    return match
      ? fitToBackground(match.hex, background, backgroundIsDark)
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
