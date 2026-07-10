"use client";

import { useEffect, useState } from "react";
import { FieldNote, NumberField, SelectField, SliderField, ToggleField } from "../Field";
import {
  ALPHA_BLENDING_OPTIONS,
  FONT_WEIGHT_LABELS,
  SYNTHETIC_STYLE_OPTIONS,
  type AlphaBlending,
  type SyntheticStyle,
} from "@/lib/config";
import { availableCommonFonts, loadSystemMonoFonts, supportsLocalFonts } from "@/lib/fonts";
import { useStore } from "@/lib/store";

type LoadState = "idle" | "loading" | "denied" | "unsupported";

function FontFamilyPicker() {
  const { config, patchConfig } = useStore();
  const [fonts, setFonts] = useState<string[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [canEnumerate, setCanEnumerate] = useState(false);

  // Font availability can only be probed in the browser, so this runs after
  // mount rather than during render.
  useEffect(() => {
    setFonts(availableCommonFonts());
    setCanEnumerate(supportsLocalFonts());
  }, []);

  async function loadSystem() {
    setState("loading");
    try {
      const system = await loadSystemMonoFonts();
      setFonts(system);
      setState("idle");
    } catch (error) {
      setState(
        error instanceof Error && error.message === "unsupported" ? "unsupported" : "denied"
      );
    }
  }

  // The saved family may not be installed here; keep it selectable regardless.
  const options = fonts.includes(config.fontFamily)
    ? fonts
    : [config.fontFamily, ...fonts];

  return (
    <>
      <h3 className="panel__heading">폰트 패밀리</h3>
      <select
        className="select"
        value={config.fontFamily}
        aria-label="폰트 패밀리"
        onChange={(event) => patchConfig({ fontFamily: event.target.value })}
      >
        {options.map((family) => (
          <option key={family} value={family}>
            {family}
          </option>
        ))}
      </select>

      <input
        className="name-input"
        value={config.fontFamily}
        aria-label="폰트 이름 직접 입력"
        spellCheck={false}
        onChange={(event) => patchConfig({ fontFamily: event.target.value })}
      />

      {canEnumerate && (
        <button
          type="button"
          className="btn btn--block btn--sm"
          disabled={state === "loading"}
          onClick={loadSystem}
        >
          {state === "loading" ? "불러오는 중…" : "설치된 고정폭 폰트 불러오기"}
        </button>
      )}

      {state === "denied" && (
        <FieldNote>
          폰트 목록 접근이 거부됐습니다. 위 칸에 폰트 이름을 직접 적어도 됩니다.
        </FieldNote>
      )}
      {!canEnumerate && (
        <FieldNote>
          이 브라우저는 설치된 폰트 목록을 읽을 수 없습니다. 목록에는 이 기기에서
          실제로 렌더되는 폰트만 보이고, 없는 폰트는 직접 적으면 됩니다.
        </FieldNote>
      )}
    </>
  );
}

export function FontTab() {
  const { config, patchConfig } = useStore();

  return (
    <>
      <FontFamilyPicker />

      <hr className="panel__rule" />

      <h3 className="panel__heading">크기와 굵기</h3>
      <NumberField
        label="글자 크기"
        value={config.fontSize}
        min={6}
        max={48}
        step={0.5}
        suffix="pt"
        onChange={(fontSize) => patchConfig({ fontSize })}
      />

      <SliderField
        label="글자 굵기"
        value={config.fontWeight}
        min={200}
        max={800}
        step={100}
        onChange={(fontWeight) => patchConfig({ fontWeight })}
        format={(value) => FONT_WEIGHT_LABELS[value] ?? String(value)}
      />
      <FieldNote>
        <code>font-weight</code> 라는 키는 없습니다. <code>font-variation = wght</code>{" "}
        으로 내보내며, <strong>가변 폰트에서만</strong> 동작합니다. 고정 폰트라면
        폰트가 광고하는 스타일 이름을 <code>font-style</code> 에 적어야 합니다.
      </FieldNote>

      <SelectField<SyntheticStyle>
        label="합성 스타일"
        value={config.fontSyntheticStyle}
        options={SYNTHETIC_STYLE_OPTIONS}
        onChange={(fontSyntheticStyle) => patchConfig({ fontSyntheticStyle })}
      />
      <FieldNote>폰트에 없는 굵기·기울임을 브라우저가 아닌 터미널이 만들어 냅니다.</FieldNote>

      <hr className="panel__rule" />

      <h3 className="panel__heading">안티앨리어싱</h3>
      <ToggleField
        label="글자 두껍게 (font-thicken)"
        checked={config.fontThicken}
        onChange={(fontThicken) => patchConfig({ fontThicken })}
      />
      <FieldNote>macOS 에서만 동작합니다.</FieldNote>

      {config.fontThicken && (
        <>
          <SliderField
            label="두께 강도"
            value={config.fontThickenStrength}
            min={0}
            max={255}
            step={1}
            onChange={(fontThickenStrength) => patchConfig({ fontThickenStrength })}
            format={(value) => String(value)}
          />
          <FieldNote>미리보기에는 반영되지 않습니다 — 네이티브 래스터라이저 설정입니다.</FieldNote>
        </>
      )}

      <SelectField<AlphaBlending>
        label="블렌딩 색공간"
        value={config.alphaBlending}
        options={ALPHA_BLENDING_OPTIONS}
        onChange={(alphaBlending) => patchConfig({ alphaBlending })}
      />
      <FieldNote>
        글자가 얇거나 두껍게 보이는 정도를 바꿉니다. GPU 블렌딩 설정이라 미리보기에는
        반영되지 않습니다.
      </FieldNote>
    </>
  );
}
