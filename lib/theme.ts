export type TargetOs = "macos" | "windows";

export type Theme = {
  name: string;
  background: string;
  foreground: string;
  cursorColor: string;
  cursorText: string;
  selectionBackground: string;
  selectionForeground: string;
  /** Exactly 16 entries: ANSI 0–15. */
  palette: string[];
};

/** Keys the editor exposes, mirroring what cmux/wmux actually read. */
export const BASE_COLOR_KEYS = [
  "background",
  "foreground",
  "cursorColor",
  "cursorText",
  "selectionBackground",
  "selectionForeground",
] as const;

export type BaseColorKey = (typeof BASE_COLOR_KEYS)[number];

export const BASE_COLOR_LABELS: Record<BaseColorKey, string> = {
  background: "배경",
  foreground: "글자",
  cursorColor: "커서",
  cursorText: "커서 위 글자",
  selectionBackground: "선택 영역",
  selectionForeground: "선택 영역 글자",
};

export const ANSI_NAMES = [
  "검정",
  "빨강",
  "초록",
  "노랑",
  "파랑",
  "자홍",
  "청록",
  "흰색",
  "밝은 검정",
  "밝은 빨강",
  "밝은 초록",
  "밝은 노랑",
  "밝은 파랑",
  "밝은 자홍",
  "밝은 청록",
  "밝은 흰색",
];

export const PRESETS: Theme[] = [
  {
    name: "Ocean Night",
    background: "#1d262a",
    foreground: "#e7ebed",
    cursorColor: "#eaeaea",
    cursorText: "#1d262a",
    selectionBackground: "#435b67",
    selectionForeground: "#e7ebed",
    palette: [
      "#435b67", "#fc3841", "#6bc46d", "#e6c62f",
      "#61afef", "#c678dd", "#56b6c2", "#b7c0c4",
      "#5c7581", "#ff5a63", "#8ad98c", "#f2d94e",
      "#82c0ff", "#d99ae8", "#7fd3dd", "#e7ebed",
    ],
  },
  {
    name: "Dracula",
    background: "#282a36",
    foreground: "#f8f8f2",
    cursorColor: "#f8f8f2",
    cursorText: "#282a36",
    selectionBackground: "#44475a",
    selectionForeground: "#f8f8f2",
    palette: [
      "#21222c", "#ff5555", "#50fa7b", "#f1fa8c",
      "#bd93f9", "#ff79c6", "#8be9fd", "#f8f8f2",
      "#6272a4", "#ff6e6e", "#69ff94", "#ffffa5",
      "#d6acff", "#ff92df", "#a4ffff", "#ffffff",
    ],
  },
  {
    name: "Catppuccin Mocha",
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    cursorColor: "#f5e0dc",
    cursorText: "#1e1e2e",
    selectionBackground: "#585b70",
    selectionForeground: "#cdd6f4",
    palette: [
      "#45475a", "#f38ba8", "#a6e3a1", "#f9e2af",
      "#89b4fa", "#f5c2e7", "#94e2d5", "#bac2de",
      "#585b70", "#f37799", "#89d88b", "#ebd391",
      "#74a8fc", "#f2aede", "#6bd7ca", "#a6adc8",
    ],
  },
  {
    name: "Catppuccin Latte",
    background: "#eff1f5",
    foreground: "#4c4f69",
    cursorColor: "#dc8a78",
    cursorText: "#eff1f5",
    selectionBackground: "#ccd0da",
    selectionForeground: "#4c4f69",
    palette: [
      "#5c5f77", "#d20f39", "#40a02b", "#df8e1d",
      "#1e66f5", "#ea76cb", "#179299", "#acb0be",
      "#6c6f85", "#de293e", "#49af3d", "#eea92a",
      "#456eff", "#fe85d8", "#2d9fa8", "#bcc0cc",
    ],
  },
  {
    name: "Solarized Dark",
    background: "#002b36",
    foreground: "#839496",
    cursorColor: "#93a1a1",
    cursorText: "#002b36",
    selectionBackground: "#073642",
    selectionForeground: "#93a1a1",
    palette: [
      "#073642", "#dc322f", "#859900", "#b58900",
      "#268bd2", "#d33682", "#2aa198", "#eee8d5",
      "#586e75", "#cb4b16", "#93a1a1", "#657b83",
      "#839496", "#6c71c4", "#94a3a5", "#fdf6e3",
    ],
  },
];

export const DEFAULT_THEME: Theme = PRESETS[0];

/** Filesystem-safe slug used as the theme's filename and `theme =` value. */
export function themeSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "my-theme";
}

export function cloneTheme(theme: Theme): Theme {
  return { ...theme, palette: [...theme.palette] };
}
