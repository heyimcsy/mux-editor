"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExtractModal } from "@/components/ExtractModal";
import {
  SCENARIOS,
  TerminalPreview,
  type Scenario,
} from "@/components/TerminalPreview";
import { ThemePanel } from "@/components/ThemePanel";
import { FloatingBar } from "@/components/TopBar";
import { useStore } from "@/lib/store";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const INITIAL = { x: 48, y: 96, z: 1 };
const PREVIEW_WIDTH = 520;

type Transform = { x: number; y: number; z: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Elements that own their own click; dragging from them would swallow it. */
function isInteractive(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest("button, a, input, select, textarea") !== null
  );
}

/**
 * Surfaces that scroll themselves. They sit inside the canvas, so their wheel
 * events bubble up to it — canceling those would trap the scroll and zoom the
 * stage instead.
 */
function ownsScroll(target: EventTarget | null) {
  return target instanceof Element && target.closest(".panel, .overlay") !== null;
}

export default function EditorPage() {
  const { theme, config, patchTheme, setPaletteColor } = useStore();
  const [scenario, setScenario] = useState<Scenario>("shell");
  const [extractOpen, setExtractOpen] = useState(false);
  const [transform, setTransform] = useState<Transform>(INITIAL);

  const canvasRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef(transform);
  const dragRef = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Wheel must be a non-passive listener to cancel the page's own scroll.
  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    function onWheel(event: WheelEvent) {
      if (ownsScroll(event.target)) return;

      event.preventDefault();
      const { x, y, z } = transformRef.current;

      const next = clamp(z * Math.exp(-event.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM);
      if (next === z) return;

      // Anchor the zoom on the pointer so the point under it stays put.
      const rect = element!.getBoundingClientRect();
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;
      const ratio = next / z;

      setTransform({
        x: cx - (cx - x) * ratio,
        y: cy - (cy - y) * ratio,
        z: next,
      });
    }

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (event.button !== 0 || isInteractive(event.target)) return;

    const { x, y } = transformRef.current;
    dragRef.current = { px: event.clientX, py: event.clientY, x, y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    setTransform((current) => ({
      ...current,
      x: drag.x + (event.clientX - drag.px),
      y: drag.y + (event.clientY - drag.py),
    }));
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return (
    <main className="canvas" ref={canvasRef}>
      <FloatingBar current="editor" />

      <div
        className="stage"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.z})`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="stage__tabs" role="tablist" aria-label="미리보기 시나리오">
          <div className="segmented">
            {SCENARIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                className="segmented__option"
                aria-selected={scenario === item.id}
                onClick={() => setScenario(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <TerminalPreview
          theme={theme}
          config={config}
          scenario={scenario}
          width={PREVIEW_WIDTH}
        />

        <div className="stage__grip">
          <span>드래그로 이동 · 스크롤로 확대</span>
          <span className="stage__zoom">{Math.round(transform.z * 100)}%</span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setTransform(INITIAL)}
          >
            보기 초기화
          </button>
        </div>
      </div>

      <ThemePanel onOpenExtract={() => setExtractOpen(true)} />

      {extractOpen && (
        <ExtractModal
          onClose={() => setExtractOpen(false)}
          onApplyTheme={patchTheme}
          onApplyPaletteColor={setPaletteColor}
        />
      )}
    </main>
  );
}
