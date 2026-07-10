"use client";

import type { CSSProperties } from "react";
import { parseHex } from "@/lib/color";
import type { AppearanceConfig } from "@/lib/config";
import { DEFAULT_CONFIG } from "@/lib/config";
import type { TargetOs, Theme } from "@/lib/theme";

export type Scenario = "shell" | "split" | "agent";

export const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "shell", label: "일반" },
  { id: "split", label: "분할" },
  { id: "agent", label: "에이전트" },
];

function rgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const round = (n: number) => Math.round(n);
  return `rgba(${round(rgb.r)}, ${round(rgb.g)}, ${round(rgb.b)}, ${alpha})`;
}

/**
 * Feeds theme + config into CSS custom properties the terminal classes read.
 *
 * Two settings cannot be previewed honestly and are deliberately not mapped:
 * `alpha-blending` (a GPU blend space) and `font-thicken-strength` (a native
 * rasterizer knob). `font-thicken` is approximated with font-smoothing, and
 * `font-variation = wght` with plain font-weight, since the web font ships as
 * discrete weights rather than a variable axis.
 */
export function previewVars(theme: Theme, config: AppearanceConfig): CSSProperties {
  const vars: Record<string, string> = {
    "--t-bg": theme.background,
    "--t-bg-alpha": rgba(theme.background, config.backgroundOpacity),
    "--t-fg": theme.foreground,
    "--t-cursor": theme.cursorColor,
    "--t-cursor-text": theme.cursorText,
    "--t-sel": theme.selectionBackground,
    "--t-sel-fg": theme.selectionForeground,

    "--t-font": `"${config.fontFamily}", ui-monospace, Menlo, monospace`,
    "--t-font-size": `${config.fontSize}px`,
    "--t-font-weight": String(config.fontWeight),
    "--t-smoothing": config.fontThicken ? "auto" : "antialiased",

    "--t-blur": `${config.backgroundBlur}px`,
    "--t-pad-x": `${config.windowPaddingX}px`,
    "--t-pad-y": `${config.windowPaddingY}px`,

    "--t-divider": config.splitDividerColor,
    "--t-unfocused-fill": rgba(config.unfocusedSplitFill, config.backgroundOpacity),
    "--t-unfocused-opacity": String(config.unfocusedSplitOpacity),
  };

  theme.palette.forEach((color, index) => {
    vars[`--t-${index}`] = color;
  });

  return vars as CSSProperties;
}

function Cursor() {
  return <span className="cursor"> </span>;
}

function Prompt() {
  return (
    <>
      <span className="c6">~/dev/project</span> <span className="dim">$</span>{" "}
    </>
  );
}

function ShellSession() {
  return (
    <>
      <div className="ln">
        <Prompt />
        git status
      </div>
      <div className="ln">On branch main</div>
      <div className="ln dim">Changes not staged for commit:</div>
      <div className="ln ln--indent">
        <span className="c3">modified:</span>{" "}
        <span className="selection">src/app.ts</span>
      </div>
      <div className="ln ln--indent">
        <span className="c1">deleted:</span> old.js
      </div>
      <div className="ln dim">Untracked files:</div>
      <div className="ln ln--indent">
        <span className="c1">?? notes.md</span>
      </div>
      <div className="ln"> </div>
      <div className="ln">
        <Prompt />
        npm test
      </div>
      <div className="ln ln--indent">
        <span className="c2">✓</span> 24 passing
      </div>
      <div className="ln ln--indent">
        <span className="c1">✗</span> 1 failing
      </div>
      <div className="ln">
        <Prompt />
        <Cursor />
      </div>
    </>
  );
}

/** The right pane renders unfocused so the split settings have something to show. */
function SplitSession() {
  return (
    <div className="terminal__split">
      <div className="terminal__pane">
        <div className="ln">
          <span className="c4">▍</span> <span className="c15">server</span>
        </div>
        <div className="ln dim">─────────────</div>
        <div className="ln">
          <span className="c2">ready</span> on :3000
        </div>
        <div className="ln dim">compiled 412ms</div>
        <div className="ln">
          <span className="c3">warn</span> slow query
        </div>
        <div className="ln"> </div>
        <div className="ln">
          <span className="c6">GET</span> /api <span className="c2">200</span>
        </div>
        <div className="ln">
          <span className="c6">GET</span> /favicon <span className="c1">404</span>
        </div>
        <div className="ln">
          <span className="dim">▸</span> <Cursor />
        </div>
      </div>
      <div className="terminal__divider" />
      <div className="terminal__pane terminal__pane--unfocused">
        <div className="ln">
          <span className="c13">▍</span> <span className="c15">watch</span>
        </div>
        <div className="ln dim">─────────────</div>
        <div className="ln">
          <span className="c14">tsc</span> --watch
        </div>
        <div className="ln">
          <span className="c2">✓</span> no errors
        </div>
        <div className="ln"> </div>
        <div className="ln">
          <span className="c11">●</span> lib/export.ts
        </div>
        <div className="ln">
          <span className="c11">●</span> lib/config.ts
        </div>
        <div className="ln dim">2 files changed</div>
        <div className="ln">
          <span className="dim">▸</span> <span className="dim">비활성 분할</span>
        </div>
      </div>
    </div>
  );
}

function AgentSession() {
  return (
    <>
      <div className="ln">
        <Prompt />
        cmux agent run
      </div>
      <div className="ln"> </div>
      <div className="ln">
        <span className="c12">●</span> <span className="c15">claude-opus-4-8</span>{" "}
        <span className="dim">·</span> <span className="c5">feat/theme-editor</span>
      </div>
      <div className="ln dim">──────────────────────────────</div>
      <div className="ln ln--indent">
        <span className="c2">✓</span> read <span className="c6">lib/export.ts</span>
      </div>
      <div className="ln ln--indent">
        <span className="c2">✓</span> read <span className="c6">lib/config.ts</span>
      </div>
      <div className="ln ln--indent">
        <span className="c3">⠋</span> editing{" "}
        <span className="selection">components/FontTab.tsx</span>
      </div>
      <div className="ln"> </div>
      <div className="ln ln--indent">
        <span className="c10">+ 42</span> <span className="c9">- 7</span>{" "}
        <span className="dim">across 3 files</span>
      </div>
      <div className="ln"> </div>
      <div className="ln">
        <span className="c11">⏵</span> waiting for approval{" "}
        <span className="dim">(a to accept)</span> <Cursor />
      </div>
    </>
  );
}

const SESSIONS: Record<Scenario, () => React.ReactElement> = {
  shell: ShellSession,
  split: SplitSession,
  agent: AgentSession,
};

export function TerminalPreview({
  theme,
  config = DEFAULT_CONFIG,
  scenario = "shell",
  os = "macos",
  width,
}: {
  theme: Theme;
  config?: AppearanceConfig;
  scenario?: Scenario;
  os?: TargetOs;
  width?: number;
}) {
  const Session = SESSIONS[scenario];
  const app = os === "macos" ? "cmux" : "wmux";

  return (
    <div className="terminal" style={{ ...previewVars(theme, config), width }}>
      <div className="terminal__chrome">
        <span className="terminal__dot" style={{ background: "#ff5f57" }} />
        <span className="terminal__dot" style={{ background: "#febc2e" }} />
        <span className="terminal__dot" style={{ background: "#28c840" }} />
        <span className="terminal__title">~/dev/project — {app}</span>
      </div>
      {scenario === "split" ? (
        <Session />
      ) : (
        <div className="terminal__body">
          <Session />
        </div>
      )}
    </div>
  );
}
