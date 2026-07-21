<div align="center">

# Mux Editor

**Pick your terminal colors while you watch them.**

A visual theme editor for [cmux](https://github.com/manaflow-ai/cmux) — choose colors against a live terminal, then walk away with the exact config files to paste. No config syntax required.

[**→ Open the editor**](https://heyimcsy.github.io/mux-editor/)

[![Live](https://img.shields.io/badge/demo-live-2ea043?style=flat-square)](https://heyimcsy.github.io/mux-editor/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

**English** · [한국어](README.ko.md)

</div>

---

## The problem

Theming cmux means editing `~/.config/ghostty/config` by hand: guess a hex value, save, reload, squint at the result, guess again. You cannot see `palette = 4=#61afef` until it is already on your screen, and you have to know that the key is called `palette` in the first place.

Mux Editor closes that loop. Every color you touch repaints a simulated terminal instantly, and the last screen hands you a ready-to-paste theme file, config file, and reload command.

## What it does

| | |
|---|---|
| **Live preview** | A simulated cmux window repaints on every change — across three scenarios: a plain shell, a split pane, and an agent session. Pan by dragging, zoom by scrolling. |
| **Every color cmux reads** | Background, foreground, cursor, cursor text, selection background/foreground, and all 16 ANSI slots. Nothing invented — each field maps to a key that actually exists. |
| **Themes from images** | Drop in a photo and it becomes a palette. Dominant colors are bucketed, matched to ANSI hue anchors, and fitted to the background's lightness. Click anywhere on the image to eyedrop a single color. |
| **Contrast warnings** | WCAG 2.1 ratios computed live — 4.5:1 for body text, 3:1 for colored output. You find out that your green is unreadable *before* you commit to it. |
| **Font, window & split settings** | Font family, size, weight, synthetic styles, thickening, alpha blending, background opacity & blur, window padding, split divider color, unfocused split opacity & fill. |
| **Local font detection** | Where the browser allows it (`queryLocalFonts`), your installed monospace fonts are detected by measuring glyph advance widths — no hardcoded list required. |
| **Copy-paste export** | Two files and one command, each with its exact destination path. Download them or copy them inline. |

Five presets ship out of the box: **Ocean Night** (default), Dracula, Catppuccin Mocha, Catppuccin Latte, and Solarized Dark.

## Using it

1. **Design** — open [the editor](https://heyimcsy.github.io/mux-editor/) and pick your colors.
2. **Export** — hit export and you get three steps:

   ```ini
   # ~/.config/ghostty/themes/ocean-night   (no file extension)
   background = #1d262a
   foreground = #e7ebed
   cursor-color = #eaeaea
   ...
   palette = 0=#435b67
   palette = 1=#fc3841
   ```

   ```ini
   # ~/.config/ghostty/config
   font-family = JetBrains Mono
   font-size = 14
   theme = ocean-night
   background-opacity = 1.00
   ...
   ```

3. **Apply** — run `cmux reload-config`, or press <kbd>⌘</kbd><kbd>⇧</kbd><kbd>,</kbd> inside cmux.

Your work persists in `localStorage`, so closing the tab does not lose the theme.

## Privacy

There is no backend. No accounts, no analytics, no uploads. Images you drop in are decoded into a `<canvas>` and read pixel by pixel **in your browser** — they are never transmitted anywhere. The only network requests the page makes are for its own static assets and two web fonts (Pretendard via jsDelivr, JetBrains Mono via Google Fonts).

## Honest limits

Two settings are deliberately **not** simulated in the preview, because faking them would be a lie: `alpha-blending` (a GPU blend space) and `font-thicken-strength` (a native rasterizer knob). `font-thicken` is approximated with font smoothing, and `font-variation = wght` with plain CSS font weight.

Four things people ask for simply have no key in cmux or Ghostty, and the editor says so in place rather than shipping a control that cannot work:

- **Active / inactive tab background** — Ghostty has no tab color key, and cmux's workspace tab accent is not yet customizable ([cmux#1753](https://github.com/manaflow-ai/cmux/issues/1753) is requesting it).
- **Status bar colors** — cmux has no status bar, and Ghostty has no key for one.
- **Search highlight color** — Ghostty exposes selection colors only.

Mux Editor targets **cmux on macOS**. Since cmux renders through Ghostty, the exported files work for plain Ghostty as well.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export → out/
npm run typecheck  # tsc --noEmit
```

Next.js 15 with `output: "export"` — the whole app is client-side, so the build is a folder of static files with no server. `next`, `react`, and `react-dom` are the only runtime dependencies; there is no CSS framework, no state library, and no component kit.

```
app/
  page.tsx           landing, cycling through presets
  editor/page.tsx    pan/zoom canvas + editing panel
  export/page.tsx    generated files and instructions
components/
  TerminalPreview    the simulated terminal (theme + config → CSS variables)
  ThemePanel         colors / font / window tabs, contrast warnings
  ExtractModal       image → palette
lib/
  theme.ts           Theme type, ANSI slots, presets
  config.ts          Ghostty appearance keys and their defaults
  extract.ts         dominant-color bucketing and ANSI hue assignment
  contrast.ts        WCAG 2.1 luminance and contrast ratios
  export.ts          Theme + config → Ghostty file bodies
  store.tsx          React context + localStorage persistence
config/              reference configs, checked in as real examples
```

Deploys automatically to GitHub Pages on every push to `main` via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Production builds set `basePath: "/mux-editor"`, and `.nojekyll` is written into the output so Pages does not strip the `_next/` directory.

## Contributing

Issues and pull requests are welcome — especially:

- Ghostty keys that exist but are not yet exposed in the editor
- Presets worth shipping
- Better ANSI slot assignment from images (`lib/extract.ts` is a greedy hue matcher and could be smarter)
- English localization of the UI, which is currently Korean throughout

## License

[MIT](LICENSE) © seoyoonchoi

Mux Editor is an independent project. It contains no cmux or Ghostty code — it only writes configuration files that those programs read.
