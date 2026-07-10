export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHex(value: string): boolean {
  return HEX_RE.test(value.trim());
}

/** Accepts `#abc`, `abc`, `#aabbcc`, `aabbcc`. Returns null when unparseable. */
export function parseHex(value: string): Rgb | null {
  const match = HEX_RE.exec(value.trim());
  if (!match) return null;

  let body = match[1];
  if (body.length === 3) {
    body = body
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const int = parseInt(body, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

/** Normalizes any accepted hex spelling to lowercase `#rrggbb`. */
export function normalizeHex(value: string): string | null {
  const rgb = parseHex(value);
  return rgb ? toHex(rgb) : null;
}

export function toHex({ r, g, b }: Rgb): string {
  const part = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;

  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = l - c / 2;

  let base: [number, number, number];
  if (hp < 1) base = [c, x, 0];
  else if (hp < 2) base = [x, c, 0];
  else if (hp < 3) base = [0, c, x];
  else if (hp < 4) base = [0, x, c];
  else if (hp < 5) base = [x, 0, c];
  else base = [c, 0, x];

  return {
    r: (base[0] + m) * 255,
    g: (base[1] + m) * 255,
    b: (base[2] + m) * 255,
  };
}

/** Shortest distance between two hues on the 360° wheel. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function withLightness(hex: string, l: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb);
  return toHex(hslToRgb({ ...hsl, l: Math.max(0, Math.min(1, l)) }));
}

/** Nudges lightness toward 1 (positive amount) or 0 (negative). */
export function lighten(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb);
  return withLightness(hex, hsl.l + amount);
}
