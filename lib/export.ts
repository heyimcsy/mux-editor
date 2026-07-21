import type { AppearanceConfig } from "./config";
import { DEFAULT_CONFIG } from "./config";
import type { Theme } from "./theme";
import { themeSlug } from "./theme";

export type ExportStep = {
  id: string;
  title: string;
  description: string;
  /**
   * A shell command that carries out the whole step. Preferred over `code`,
   * because saving a file by hand is where this goes wrong most often — macOS
   * text editors silently append `.txt`, and Ghostty then never finds the file.
   */
  command?: string;
  /** The file body, for anyone who would rather write the file themselves. */
  code?: string;
  /** Shown above the code block when the snippet belongs in a file. */
  path?: string;
  /** The trap this step has, spelled out where the user will hit it. */
  warning?: string;
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
 * Wraps a file body in a heredoc. The delimiter is quoted so the shell expands
 * nothing inside — a color like `#fff` or a `$` in a font name stays literal.
 */
function writeFileCommand(path: string, body: string): string {
  return `cat > ${path} << 'MUX_EOF'\n${body.trimEnd()}\nMUX_EOF\n`;
}

export function buildExportPlan(
  theme: Theme,
  config: AppearanceConfig
): ExportPlan {
  const slug = themeSlug(theme.name);
  const themeBody = toGhosttyTheme(theme);
  const configBody = toGhosttyConfig(config, { themeName: theme.name });

  const themePath = `~/.config/ghostty/themes/${slug}`;

  return {
    themeFileName: slug,
    themeFileBody: themeBody,
    configFileBody: configBody,
    steps: [
      {
        id: "write-theme",
        title: "1단계 — 테마 파일 만들기",
        description: "색상만 담긴 파일입니다.",
        path: themePath,
        command:
          `mkdir -p ~/.config/ghostty/themes\n` +
          writeFileCommand(themePath, themeBody),
        code: themeBody,
        warning:
          `파일 이름은 확장자 없이 정확히 ${slug} 여야 합니다. ` +
          "텍스트 편집기로 저장하면 .txt 가 자동으로 붙는데, 그러면 Ghostty가 " +
          "테마를 찾지 못하고 아무 일도 일어나지 않습니다. Finder는 확장자를 " +
          "숨기기 때문에 눈으로는 알아채기 어렵습니다. 위 명령을 쓰면 이 문제가 " +
          "생기지 않습니다.",
      },
      {
        id: "write-config",
        title: "2단계 — 설정 파일 쓰기",
        description: "폰트·창·분할 설정과 테마 지정입니다.",
        path: "~/.config/ghostty/config",
        // Backs the old config up first: this file is one people hand-edit over
        // time, and overwriting it silently would cost them that work.
        command:
          `mkdir -p ~/.config/ghostty\n` +
          `[ -f ~/.config/ghostty/config ] && cp ~/.config/ghostty/config ~/.config/ghostty/config.bak.$(date +%Y%m%d-%H%M%S)\n` +
          writeFileCommand("~/.config/ghostty/config", configBody),
        code: configBody,
        warning:
          "이미 쓰던 설정 파일이 있다면 이 내용이 통째로 덮어씁니다. 위 명령은 " +
          "덮어쓰기 전에 config.bak.날짜 로 백업을 남기고, 직접 저장하실 " +
          "때는 기존 파일에서 같은 키만 바꿔 넣으세요.",
      },
      {
        id: "reload",
        title: "3단계 — 적용하기",
        description: "터미널에서 실행하거나, cmux 안에서 ⌘⇧, 를 누르세요.",
        command: "cmux reload-config\n",
      },
    ],
  };
}
