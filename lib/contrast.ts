import { parseHex, type Rgb } from "./color";

/** WCAG 2.1 relative luminance. */
function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1..21. Returns 1 for unparseable input. */
export function contrastRatio(a: string, b: string): number {
  const rgbA = parseHex(a);
  const rgbB = parseHex(b);
  if (!rgbA || !rgbB) return 1;

  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastWarning = {
  key: string;
  label: string;
  ratio: number;
  required: number;
};

/** Body text needs 4.5:1 under WCAG AA. */
const TEXT_MIN = 4.5;
/** Colored output is decorative-adjacent; 3:1 keeps it legible without noise. */
const ACCENT_MIN = 3;

/**
 * ANSI slots checked against the background. 0/8 (black), 7/15 (white) and the
 * dim greys are excluded — they sit near the background or foreground by
 * definition, so flagging them would fire on every well-formed theme.
 */
const CHECKED_SLOTS = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14];

const SLOT_NAMES: Record<number, string> = {
  1: "빨강",
  2: "초록",
  3: "노랑",
  4: "파랑",
  5: "자홍",
  6: "청록",
  9: "밝은 빨강",
  10: "밝은 초록",
  11: "밝은 노랑",
  12: "밝은 파랑",
  13: "밝은 자홍",
  14: "밝은 청록",
};

export function findContrastWarnings(theme: {
  background: string;
  foreground: string;
  cursorColor: string;
  palette: string[];
}): ContrastWarning[] {
  const warnings: ContrastWarning[] = [];
  const bg = theme.background;

  const fgRatio = contrastRatio(theme.foreground, bg);
  if (fgRatio < TEXT_MIN) {
    warnings.push({
      key: "foreground",
      label: "글자색과 배경",
      ratio: fgRatio,
      required: TEXT_MIN,
    });
  }

  const cursorRatio = contrastRatio(theme.cursorColor, bg);
  if (cursorRatio < ACCENT_MIN) {
    warnings.push({
      key: "cursor",
      label: "커서와 배경",
      ratio: cursorRatio,
      required: ACCENT_MIN,
    });
  }

  for (const slot of CHECKED_SLOTS) {
    const color = theme.palette[slot];
    if (!color) continue;
    const ratio = contrastRatio(color, bg);
    if (ratio < ACCENT_MIN) {
      warnings.push({
        key: `palette-${slot}`,
        label: `팔레트 ${slot}번(${SLOT_NAMES[slot]})과 배경`,
        ratio,
        required: ACCENT_MIN,
      });
    }
  }

  return warnings;
}
