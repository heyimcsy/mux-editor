import type { AppearanceConfig } from "./config";
import { DEFAULT_CONFIG } from "./config";
import type { TargetOs, Theme } from "./theme";
import { themeSlug } from "./theme";

export type ExportStep = {
  id: string;
  title: string;
  description: string;
  code: string;
  /** Shown above the code block when the snippet belongs in a file. */
  path?: string;
  /**
   * True when the snippet's exact shape has not been confirmed against a real
   * install. Surfaced in the UI so nobody pastes it assuming it is verified.
   * See PRD assumption A1 — the target wmux project is still undecided.
   */
  unverified?: boolean;
};

export type ExportPlan = {
  themeFileName: string;
  themeFileBody: string;
  configFileBody: string;
  steps: ExportStep[];
};

/** Colors only — this is what a Ghostty theme file conventionally carries. */
export function toGhosttyTheme(theme: Theme): string {
  const lines: string[] = [`# ${theme.name}`];

  lines.push(`background = ${theme.background}`);
  lines.push(`foreground = ${theme.foreground}`);
  lines.push(`cursor-color = ${theme.cursorColor}`);
  lines.push(`cursor-text = ${theme.cursorText}`);
  lines.push(`selection-background = ${theme.selectionBackground}`);
  lines.push(`selection-foreground = ${theme.selectionForeground}`);

  lines.push("");
  theme.palette.forEach((color, index) => {
    lines.push(`palette = ${index}=${color}`);
  });

  return lines.join("\n") + "\n";
}

/**
 * Font, window and split keys. Optional keys are omitted when they match the
 * default so the file stays close to a hand-written one — and so a key that
 * carries a caveat (font-variation, font-thicken) only appears when asked for.
 */
export function toGhosttyConfig(
  config: AppearanceConfig,
  options: { themeName?: string } = {}
): string {
  const lines: string[] = [];

  lines.push("# ── 폰트 ──");
  lines.push(`font-family = ${config.fontFamily}`);
  lines.push(`font-size = ${config.fontSize}`);

  if (config.fontWeight !== DEFAULT_CONFIG.fontWeight) {
    lines.push("");
    lines.push("# 굵기 조절은 가변 폰트에서만 동작합니다. 고정 폰트라면 대신");
    lines.push("# `font-style = <폰트가 광고하는 스타일 이름>` 을 쓰세요.");
    lines.push(`font-variation = wght=${config.fontWeight}`);
    lines.push("");
  }

  if (config.fontSyntheticStyle !== DEFAULT_CONFIG.fontSyntheticStyle) {
    lines.push(`font-synthetic-style = ${config.fontSyntheticStyle}`);
  }

  if (config.fontThicken) {
    lines.push("# font-thicken 은 macOS 에서만 동작합니다.");
    lines.push("font-thicken = true");
    lines.push(`font-thicken-strength = ${config.fontThickenStrength}`);
  }

  if (config.alphaBlending !== DEFAULT_CONFIG.alphaBlending) {
    lines.push(`alpha-blending = ${config.alphaBlending}`);
  }

  if (options.themeName) {
    lines.push("");
    lines.push("# ── 테마 ──");
    lines.push(`theme = ${themeSlug(options.themeName)}`);
  }

  lines.push("");
  lines.push("# ── 창 ──");
  lines.push(`background-opacity = ${config.backgroundOpacity.toFixed(2)}`);
  lines.push(`background-blur = ${config.backgroundBlur > 0 ? config.backgroundBlur : "false"}`);
  lines.push(`window-padding-x = ${config.windowPaddingX}`);
  lines.push(`window-padding-y = ${config.windowPaddingY}`);
  if (config.windowPaddingBalance) {
    lines.push("window-padding-balance = true");
  }

  lines.push("");
  lines.push("# ── 분할 ──");
  lines.push(`split-divider-color = ${config.splitDividerColor}`);
  lines.push(`unfocused-split-opacity = ${config.unfocusedSplitOpacity.toFixed(2)}`);
  lines.push(`unfocused-split-fill = ${config.unfocusedSplitFill}`);

  return lines.join("\n") + "\n";
}

/**
 * One file carrying both colors and settings. wmux imports a Ghostty config by
 * path and would not resolve a `theme = <name>` indirection, so the Windows
 * flow needs the colors inlined.
 */
export function toSelfContainedGhostty(theme: Theme, config: AppearanceConfig): string {
  return `${toGhosttyTheme(theme)}\n${toGhosttyConfig(config)}`;
}

/** Best-effort TOML for wmux. Shape is inferred, not confirmed. */
export function toWmuxToml(theme: Theme, config: AppearanceConfig): string {
  const slug = themeSlug(theme.name);
  const palette = theme.palette.map((color) => `  "${color}",`).join("\n");

  return [
    `[font]`,
    `family = "${config.fontFamily}"`,
    `size = ${config.fontSize}`,
    ``,
    `[appearance]`,
    `theme = "${slug}"`,
    `opacity = ${config.backgroundOpacity.toFixed(2)}`,
    `blur = ${config.backgroundBlur > 0}`,
    `padding-x = ${config.windowPaddingX}`,
    `padding-y = ${config.windowPaddingY}`,
    ``,
    `[themes.${slug}]`,
    `background = "${theme.background}"`,
    `foreground = "${theme.foreground}"`,
    `cursor-color = "${theme.cursorColor}"`,
    `cursor-text = "${theme.cursorText}"`,
    `selection-background = "${theme.selectionBackground}"`,
    `selection-foreground = "${theme.selectionForeground}"`,
    `palette = [`,
    palette,
    `]`,
    ``,
  ].join("\n");
}

function macosPlan(theme: Theme, config: AppearanceConfig): ExportPlan {
  const slug = themeSlug(theme.name);
  const themeBody = toGhosttyTheme(theme);
  const configBody = toGhosttyConfig(config, { themeName: theme.name });

  return {
    themeFileName: slug,
    themeFileBody: themeBody,
    configFileBody: configBody,
    steps: [
      {
        id: "write-theme",
        title: "1단계 — 테마 파일 만들기",
        description: "색상만 담긴 파일입니다. 이 경로에 저장하세요. 확장자는 없습니다.",
        path: `~/.config/ghostty/themes/${slug}`,
        code: themeBody,
      },
      {
        id: "write-config",
        title: "2단계 — 설정 파일 쓰기",
        description:
          "폰트·창·분할 설정과 테마 지정입니다. 기존 파일이 있다면 같은 키만 바꿔 넣으세요.",
        path: "~/.config/ghostty/config",
        code: configBody,
      },
      {
        id: "reload",
        title: "3단계 — 적용하기",
        description: "터미널에서 실행하거나, cmux 안에서 ⌘⇧, 를 누르세요.",
        code: "cmux reload-config\n",
      },
    ],
  };
}

function windowsPlan(theme: Theme, config: AppearanceConfig): ExportPlan {
  const slug = themeSlug(theme.name);
  const selfContained = toSelfContainedGhostty(theme, config);

  return {
    themeFileName: slug,
    themeFileBody: selfContained,
    configFileBody: toWmuxToml(theme, config),
    steps: [
      {
        id: "write-theme",
        title: "1단계 — Ghostty 형식 파일 만들기",
        description:
          "wmux 는 Ghostty 설정을 통째로 가져옵니다. 색과 폰트를 한 파일에 담았습니다.",
        path: `~/.wmux/themes/${slug}`,
        code: selfContained,
      },
      {
        id: "import",
        title: "2단계 — wmux 로 가져오기",
        description: "폰트 패밀리·크기·색상 스킴·팔레트를 읽어 색상 스킴으로 등록합니다.",
        code: `wmux config import-ghostty ~/.wmux/themes/${slug}\n`,
      },
      {
        id: "enable-theme",
        title: "3단계 — 테마 켜기",
        description:
          "Ctrl+, 로 설정을 열어 Appearance → Theme 에서 고르거나, 설정 파일에 직접 적으세요.",
        path: "~/.wmux/config.toml",
        code: toWmuxToml(theme, config),
        unverified: true,
      },
    ],
  };
}

export function buildExportPlan(
  theme: Theme,
  config: AppearanceConfig,
  os: TargetOs
): ExportPlan {
  return os === "macos" ? macosPlan(theme, config) : windowsPlan(theme, config);
}
