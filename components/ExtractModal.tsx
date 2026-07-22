"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildThemeFromSwatches,
  extractSwatches,
  pickPixel,
  type ExtractedTheme,
  type Swatch as SwatchColor,
} from "@/lib/extract";
import { useStore } from "@/lib/store";
import type { Theme } from "@/lib/theme";
import { ANSI_NAMES, BASE_COLOR_KEYS, BASE_COLOR_LABELS } from "@/lib/theme";

/** Longest edge of the canvas we sample from. Small enough to keep the pixel
 *  loop instant, large enough to preserve minority colors. */
const SAMPLE_SIZE = 160;
const DISPLAY_MAX = 440;

/** The slot a picked color goes into. */
type Target =
  | { kind: "base"; key: (typeof BASE_COLOR_KEYS)[number] }
  | { kind: "palette"; index: number };

function sameTarget(a: Target, b: Target): boolean {
  return a.kind === "base" && b.kind === "base"
    ? a.key === b.key
    : a.kind === "palette" && b.kind === "palette" && a.index === b.index;
}

function targetLabel(target: Target): string {
  return target.kind === "base"
    ? BASE_COLOR_LABELS[target.key]
    : `${target.index}번 ${ANSI_NAMES[target.index]}`;
}

/**
 * Stays mounted while the editor is open and hides itself when closed, so the
 * decoded image and its swatches survive. Unmounting meant re-dropping the same
 * file for every single color you wanted to take from it.
 */
export function ExtractModal({
  open,
  onClose,
  onApplyTheme,
  onApplyPaletteColor,
}: {
  open: boolean;
  onClose: () => void;
  onApplyTheme: (patch: Partial<Theme>) => void;
  onApplyPaletteColor: (index: number, hex: string) => void;
}) {
  const { theme } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasImage, setHasImage] = useState(false);
  const [swatches, setSwatches] = useState<SwatchColor[]>([]);
  const [extracted, setExtracted] = useState<ExtractedTheme | null>(null);
  const [target, setTarget] = useState<Target>({ kind: "palette", index: 1 });
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  useEffect(() => {
    if (!applied) return;
    const timer = window.setTimeout(() => setApplied(null), 2200);
    return () => window.clearTimeout(timer);
  }, [applied]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 올릴 수 있습니다.");
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const scale = Math.min(1, DISPLAY_MAX / image.width);
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Sample from a separate, smaller canvas so quantization is fast and
      // independent of how big the preview happens to be.
      const sampleScale = Math.min(1, SAMPLE_SIZE / Math.max(image.width, image.height));
      const sample = document.createElement("canvas");
      sample.width = Math.max(1, Math.round(image.width * sampleScale));
      sample.height = Math.max(1, Math.round(image.height * sampleScale));

      const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
      if (!sampleCtx) return;
      sampleCtx.drawImage(image, 0, 0, sample.width, sample.height);

      const found = extractSwatches(
        sampleCtx.getImageData(0, 0, sample.width, sample.height)
      );
      setSwatches(found);
      setExtracted(buildThemeFromSwatches(found));
      setHasImage(true);
      setError(null);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("이미지를 읽지 못했습니다.");
    };

    image.src = url;
  }, []);

  /** Writes straight into the active slot — no confirm step, no dialog close. */
  const applyColor = useCallback(
    (hex: string) => {
      if (target.kind === "palette") onApplyPaletteColor(target.index, hex);
      else onApplyTheme({ [target.key]: hex } as Partial<Theme>);
      setApplied(`${targetLabel(target)} → ${hex}`);
    },
    [target, onApplyPaletteColor, onApplyTheme]
  );

  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    const hex = pickPixel(canvas, x, y);
    if (hex) applyColor(hex);
  }

  function applyWholePalette() {
    if (!extracted) return;
    onApplyTheme(extracted);
    setApplied("팔레트 전체를 한 번에 적용했습니다");
  }

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="extract-title"
      hidden={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal__head">
          <h2 className="modal__title" id="extract-title">
            이미지에서 색 뽑기
          </h2>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="modal__grid">
          <div>
            <canvas
              ref={canvasRef}
              className="picker-canvas"
              hidden={!hasImage}
              onClick={handleCanvasClick}
            />

            {!hasImage && (
              <label
                className="dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files[0];
                  if (file) loadFile(file);
                }}
              >
                <span>
                  이미지를 끌어다 놓거나 클릭해서 고르세요
                  <br />
                  <span className="hint">
                    이미지는 브라우저 안에서만 처리되고 서버로 보내지 않습니다
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) loadFile(file);
                  }}
                />
              </label>
            )}

            {hasImage && (
              <>
                <div className="picker-toolbar">
                  <p className="hint">
                    <strong>{targetLabel(target)}</strong> 자리에 넣습니다. 이미지를
                    클릭하세요.
                  </p>
                  <label className="btn btn--ghost btn--sm">
                    다른 이미지
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) loadFile(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>

                <div className="swatch-row">
                  {swatches.slice(0, 16).map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      className="swatch-row__chip"
                      style={{ background: swatch.hex }}
                      aria-label={`${swatch.hex} 를 ${targetLabel(target)} 에 넣기`}
                      title={swatch.hex}
                      onClick={() => applyColor(swatch.hex)}
                    />
                  ))}
                </div>
              </>
            )}

            {error && (
              <p className="warning" style={{ marginTop: "var(--space-6)" }}>
                {error}
              </p>
            )}
          </div>

          <div>
            <h3 className="panel__heading">바꿀 자리를 고르세요</h3>
            <p className="hint" style={{ marginBottom: "var(--space-5)" }}>
              칸을 한 번 누르면 켜지고, 그다음 이미지나 아래 추출된 색을 누르면
              그 자리에 바로 들어갑니다.
            </p>

            <h4 className="panel__subheading">기본 색</h4>
            <div className="target-grid">
              {BASE_COLOR_KEYS.map((key) => {
                const item: Target = { kind: "base", key };
                const active = sameTarget(target, item);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`target-chip${active ? " target-chip--active" : ""}`}
                    aria-pressed={active}
                    onClick={() => setTarget(item)}
                  >
                    <span
                      className="target-chip__dot"
                      style={{ background: theme[key] }}
                    />
                    {BASE_COLOR_LABELS[key]}
                  </button>
                );
              })}
            </div>

            <h4 className="panel__subheading">ANSI 팔레트</h4>
            <div className="swatch-row">
              {theme.palette.map((color, index) => {
                const item: Target = { kind: "palette", index };
                const active = sameTarget(target, item);
                return (
                  <button
                    key={index}
                    type="button"
                    className="swatch-row__chip"
                    aria-pressed={active}
                    style={{
                      background: color,
                      boxShadow: active ? "0 0 0 2px var(--focus-ring)" : undefined,
                    }}
                    aria-label={`${index}번 ${ANSI_NAMES[index]} 자리 고르기`}
                    title={`${index} — ${ANSI_NAMES[index]}`}
                    onClick={() => setTarget(item)}
                  />
                );
              })}
            </div>

            <p
              className="hint"
              role="status"
              style={{ marginTop: "var(--space-6)", minHeight: "1.2em" }}
            >
              {applied ?? " "}
            </p>

            <hr className="panel__rule" />

            <button
              type="button"
              className="btn btn--block"
              disabled={!extracted}
              onClick={applyWholePalette}
            >
              팔레트 전체 자동 배치
            </button>
            <p className="hint" style={{ marginTop: "var(--space-3)" }}>
              배경·글자·ANSI 16색을 한 번에 만듭니다. 하나씩 고르기 전 출발점으로
              쓰세요.
            </p>

            {hasImage && !extracted && (
              <p className="hint" style={{ marginTop: "var(--space-6)" }}>
                이 이미지에서는 색을 충분히 뽑지 못했습니다. 색이 더 다양한
                이미지를 써보세요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
