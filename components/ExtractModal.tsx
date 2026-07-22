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
import { ANSI_NAMES } from "@/lib/theme";

/** Longest edge of the canvas we sample from. Small enough to keep the pixel
 *  loop instant, large enough to preserve minority colors. */
const SAMPLE_SIZE = 160;
const DISPLAY_MAX = 440;

type Target =
  | "auto"
  | "background"
  | "foreground"
  | "cursorColor"
  | "selectionBackground"
  | "palette";

const TARGETS: { id: Target; label: string; hint: string }[] = [
  {
    id: "auto",
    label: "팔레트 전체 자동 배치",
    hint: "배경·글자·ANSI 16색을 한 번에 만듭니다",
  },
  { id: "background", label: "배경으로", hint: "고른 색 하나를 배경에 넣습니다" },
  { id: "foreground", label: "글자색으로", hint: "고른 색 하나를 글자에 넣습니다" },
  { id: "cursorColor", label: "커서 색으로", hint: "고른 색 하나를 커서에 넣습니다" },
  {
    id: "selectionBackground",
    label: "선택 영역으로",
    hint: "고른 색 하나를 선택 영역 배경에 넣습니다",
  },
  { id: "palette", label: "팔레트 슬롯에", hint: "고른 색을 ANSI 번호 하나에 넣습니다" },
];

/**
 * Stays mounted while the editor is open and hides itself when closed, so the
 * decoded image, its swatches and the chosen slot survive. Unmounting meant
 * re-dropping the same file for every single color you wanted to take from it.
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
  const [picked, setPicked] = useState<string | null>(null);
  const [target, setTarget] = useState<Target>("auto");
  const [slot, setSlot] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  useEffect(() => {
    if (!applied) return;
    const timer = window.setTimeout(() => setApplied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [applied]);

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
      setPicked(found[0]?.hex ?? null);
      setHasImage(true);
      setError(null);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("이미지를 읽지 못했습니다.");
    };

    image.src = url;
  }, []);

  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    const hex = pickPixel(canvas, x, y);
    if (hex) setPicked(hex);
  }

  const canApply =
    target === "auto" ? extracted !== null : picked !== null && hasImage;

  /**
   * Applies without closing. Taking several colors out of one image is the
   * normal case, and the palette row below reflects each change immediately, so
   * there is nothing to close the dialog for.
   */
  function apply() {
    if (target === "auto") {
      if (!extracted) return;
      onApplyTheme(extracted);
      setApplied("팔레트 전체를 적용했습니다");
      return;
    }

    if (!picked) return;

    if (target === "palette") {
      onApplyPaletteColor(slot, picked);
      setApplied(`${slot}번(${ANSI_NAMES[slot]})에 ${picked} 적용`);
    } else {
      onApplyTheme({ [target]: picked } as Partial<Theme>);
      const label = TARGETS.find((option) => option.id === target)?.label ?? "";
      setApplied(`${label.replace(/으?로$/, "")}에 ${picked} 적용`);
    }
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
                  <p className="hint">이미지를 클릭하면 그 지점의 색을 뽑습니다.</p>
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
                      style={{
                        background: swatch.hex,
                        boxShadow:
                          picked === swatch.hex
                            ? "0 0 0 2px var(--focus-ring)"
                            : undefined,
                      }}
                      aria-label={`색 ${swatch.hex} 고르기`}
                      onClick={() => setPicked(swatch.hex)}
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
            <h3 className="panel__heading">어디에 넣을까요?</h3>
            <div className="radio-list">
              {TARGETS.map((option) => (
                <label className="radio" key={option.id}>
                  <input
                    type="radio"
                    name="extract-target"
                    checked={target === option.id}
                    onChange={() => setTarget(option.id)}
                  />
                  <span>
                    {option.label}
                    <span className="radio__hint">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            {target === "palette" && (
              <>
                <p className="hint" style={{ margin: "var(--space-6) 0 var(--space-3)" }}>
                  넣을 자리를 고르세요. 지금 팔레트 색이 그대로 보입니다.
                </p>
                <div className="swatch-row" role="radiogroup" aria-label="ANSI 팔레트 번호">
                  {theme.palette.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      role="radio"
                      aria-checked={slot === index}
                      className="swatch-row__chip"
                      style={{
                        background: color,
                        boxShadow:
                          slot === index
                            ? "0 0 0 2px var(--focus-ring)"
                            : undefined,
                      }}
                      aria-label={`${index}번 ${ANSI_NAMES[index]}`}
                      title={`${index} — ${ANSI_NAMES[index]}`}
                      onClick={() => setSlot(index)}
                    />
                  ))}
                </div>
                <p className="hint" style={{ marginTop: "var(--space-3)" }}>
                  {slot}번 — {ANSI_NAMES[slot]}
                </p>
              </>
            )}

            {target !== "auto" && (
              <div
                className="color-field"
                style={{ marginTop: "var(--space-8)" }}
              >
                <span
                  className="swatch"
                  style={{ background: picked ?? "transparent" }}
                />
                <span className="color-field__label">
                  {picked ? "고른 색" : "아직 고르지 않음"}
                </span>
                <code className="color-field__hex" style={{ border: "none" }}>
                  {picked ?? "—"}
                </code>
              </div>
            )}

            <button
              type="button"
              className="btn btn--accent btn--block"
              style={{ marginTop: "var(--space-10)" }}
              disabled={!canApply}
              onClick={apply}
            >
              미리보기에 적용
            </button>

            <p
              className="hint"
              role="status"
              style={{ marginTop: "var(--space-4)", minHeight: "1.2em" }}
            >
              {applied ?? "적용해도 창은 닫히지 않습니다. 계속 골라 넣으세요."}
            </p>

            {target === "auto" && hasImage && !extracted && (
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
