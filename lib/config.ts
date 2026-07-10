/**
 * Everything that belongs in `~/.config/ghostty/config` rather than in the
 * theme file. Colors live on `Theme`; this is font rendering, window chrome
 * and split behaviour.
 *
 * Every field here maps to a key that exists in Ghostty's config reference.
 * Nothing is invented — see UNSUPPORTED for what was asked for but has no key.
 */

/** `alpha-blending` — the color space used when blending glyphs. */
export type AlphaBlending = "native" | "linear" | "linear-corrected";

/** `font-synthetic-style` — which styles Ghostty may synthesize. */
export type SyntheticStyle = "true" | "false" | "no-bold" | "no-italic" | "no-bold-italic";

export type AppearanceConfig = {
  fontFamily: string;
  /** `font-size`, in points. */
  fontSize: number;
  /** Emitted as `font-variation = wght=N`. Only variable fonts honor it. */
  fontWeight: number;
  fontSyntheticStyle: SyntheticStyle;
  /** `font-thicken` — macOS only. */
  fontThicken: boolean;
  /** `font-thicken-strength`, 0–255. */
  fontThickenStrength: number;
  alphaBlending: AlphaBlending;

  /** `background-opacity`, 0–1. */
  backgroundOpacity: number;
  /** `background-blur`. 0 exports as `false`; anything else is a radius. */
  backgroundBlur: number;
  windowPaddingX: number;
  windowPaddingY: number;
  windowPaddingBalance: boolean;

  splitDividerColor: string;
  /** `unfocused-split-opacity`. Ghostty clamps this to 0.15–1. */
  unfocusedSplitOpacity: number;
  unfocusedSplitFill: string;
};

export const DEFAULT_CONFIG: AppearanceConfig = {
  fontFamily: "JetBrains Mono",
  fontSize: 14,
  fontWeight: 400,
  fontSyntheticStyle: "true",
  fontThicken: false,
  fontThickenStrength: 128,
  alphaBlending: "native",

  backgroundOpacity: 1,
  backgroundBlur: 0,
  windowPaddingX: 12,
  windowPaddingY: 10,
  windowPaddingBalance: false,

  splitDividerColor: "#435b67",
  unfocusedSplitOpacity: 0.7,
  unfocusedSplitFill: "#1d262a",
};

export const UNFOCUSED_SPLIT_MIN_OPACITY = 0.15;

export const SYNTHETIC_STYLE_OPTIONS: { value: SyntheticStyle; label: string }[] = [
  { value: "true", label: "모두 합성" },
  { value: "false", label: "합성 안 함" },
  { value: "no-bold", label: "볼드만 합성 안 함" },
  { value: "no-italic", label: "이탤릭만 합성 안 함" },
  { value: "no-bold-italic", label: "볼드+이탤릭만 합성 안 함" },
];

export const ALPHA_BLENDING_OPTIONS: { value: AlphaBlending; label: string }[] = [
  { value: "native", label: "native (기본)" },
  { value: "linear", label: "linear (얇게)" },
  { value: "linear-corrected", label: "linear-corrected" },
];

export const FONT_WEIGHT_LABELS: Record<number, string> = {
  200: "아주 얇게",
  300: "얇게",
  400: "보통",
  500: "조금 굵게",
  600: "굵게",
  700: "더 굵게",
  800: "아주 굵게",
};

/**
 * Asked for in the spec, but no such key exists in cmux, wmux or Ghostty.
 * Shown in the editor so nobody goes looking for a control that cannot work.
 */
export const UNSUPPORTED: { label: string; reason: string }[] = [
  {
    label: "활성 탭 배경색",
    reason:
      "Ghostty에 탭 색 키가 없고, cmux의 워크스페이스 탭 강조색은 현재 커스텀할 수 없습니다 (manaflow-ai/cmux 이슈 #1753 이 요청 중).",
  },
  {
    label: "비활성 탭 배경색",
    reason:
      "같은 이유로 없습니다. 가장 가까운 실물은 ‘창’ 탭의 비활성 분할 패널 설정입니다.",
  },
  {
    label: "상태 표시줄 배경색 / 텍스트색",
    reason:
      "cmux에는 상태 표시줄이라는 UI 자체가 없습니다. Ghostty에도 관련 키가 없습니다.",
  },
  {
    label: "검색 결과 강조색",
    reason:
      "Ghostty는 검색 하이라이트 색 키를 제공하지 않습니다. 선택 영역 색만 지정할 수 있습니다.",
  },
];

export function cloneConfig(config: AppearanceConfig): AppearanceConfig {
  return { ...config };
}
