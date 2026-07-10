"use client";

import { ColorField, Swatch } from "../ColorField";
import { useStore } from "@/lib/store";
import { ANSI_NAMES, BASE_COLOR_KEYS, BASE_COLOR_LABELS, PRESETS } from "@/lib/theme";

export function ColorsTab({ onOpenExtract }: { onOpenExtract: () => void }) {
  const { theme, setTheme, patchTheme, setPaletteColor } = useStore();

  const activePreset = PRESETS.some((preset) => preset.name === theme.name)
    ? theme.name
    : "";

  return (
    <>
      <h3 className="panel__heading">프리셋</h3>
      <select
        className="select"
        value={activePreset}
        aria-label="프리셋 고르기"
        onChange={(event) => {
          const preset = PRESETS.find((item) => item.name === event.target.value);
          if (preset) setTheme(preset);
        }}
      >
        {activePreset === "" && <option value="">사용자 지정</option>}
        {PRESETS.map((preset) => (
          <option key={preset.name} value={preset.name}>
            {preset.name}
          </option>
        ))}
      </select>

      <h3 className="panel__heading">테마 이름</h3>
      <input
        className="name-input"
        value={theme.name}
        aria-label="테마 이름"
        onChange={(event) => patchTheme({ name: event.target.value })}
      />

      <hr className="panel__rule" />

      <h3 className="panel__heading">기본 색</h3>
      {BASE_COLOR_KEYS.map((key) => (
        <ColorField
          key={key}
          label={BASE_COLOR_LABELS[key]}
          value={theme[key]}
          onChange={(hex) => patchTheme({ [key]: hex })}
        />
      ))}

      <hr className="panel__rule" />

      <h3 className="panel__heading">ANSI 팔레트 (0–15)</h3>
      <div className="ansi-grid">
        {theme.palette.map((color, index) => (
          <Swatch
            key={index}
            value={color}
            label={`팔레트 ${index}번 ${ANSI_NAMES[index]}`}
            onChange={(hex) => setPaletteColor(index, hex)}
          />
        ))}
      </div>

      <button type="button" className="btn btn--block" onClick={onOpenExtract}>
        이미지에서 색 추출
      </button>
    </>
  );
}
