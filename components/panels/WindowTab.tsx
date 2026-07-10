"use client";

import { ColorField } from "../ColorField";
import { FieldNote, NumberField, SliderField, ToggleField } from "../Field";
import { UNFOCUSED_SPLIT_MIN_OPACITY, UNSUPPORTED } from "@/lib/config";
import { useStore } from "@/lib/store";

export function WindowTab() {
  const { config, patchConfig, resetConfig } = useStore();

  return (
    <>
      <h3 className="panel__heading">투명도와 블러</h3>
      <SliderField
        label="창 투명도"
        value={config.backgroundOpacity}
        min={0.2}
        max={1}
        step={0.01}
        onChange={(backgroundOpacity) => patchConfig({ backgroundOpacity })}
        format={(value) => `${Math.round(value * 100)}%`}
      />
      <SliderField
        label="배경 블러"
        value={config.backgroundBlur}
        min={0}
        max={50}
        step={1}
        onChange={(backgroundBlur) => patchConfig({ backgroundBlur })}
        format={(value) => (value === 0 ? "끔" : `${value}px`)}
      />
      <FieldNote>
        블러는 창이 투명할 때만 눈에 띕니다. 0 이면 <code>background-blur = false</code> 로
        내보냅니다.
      </FieldNote>

      <hr className="panel__rule" />

      <h3 className="panel__heading">창 간격</h3>
      <NumberField
        label="좌우 여백"
        value={config.windowPaddingX}
        min={0}
        max={64}
        suffix="pt"
        onChange={(windowPaddingX) => patchConfig({ windowPaddingX })}
      />
      <NumberField
        label="상하 여백"
        value={config.windowPaddingY}
        min={0}
        max={64}
        suffix="pt"
        onChange={(windowPaddingY) => patchConfig({ windowPaddingY })}
      />
      <ToggleField
        label="남는 공간을 여백에 고르게 분배"
        checked={config.windowPaddingBalance}
        onChange={(windowPaddingBalance) => patchConfig({ windowPaddingBalance })}
      />

      <hr className="panel__rule" />

      <h3 className="panel__heading">분할 패널</h3>
      <ColorField
        label="구분선 색"
        value={config.splitDividerColor}
        onChange={(splitDividerColor) => patchConfig({ splitDividerColor })}
      />
      <ColorField
        label="비활성 패널 채움색"
        value={config.unfocusedSplitFill}
        onChange={(unfocusedSplitFill) => patchConfig({ unfocusedSplitFill })}
      />
      <SliderField
        label="비활성 패널 불투명도"
        value={config.unfocusedSplitOpacity}
        min={UNFOCUSED_SPLIT_MIN_OPACITY}
        max={1}
        step={0.01}
        onChange={(unfocusedSplitOpacity) => patchConfig({ unfocusedSplitOpacity })}
        format={(value) => `${Math.round(value * 100)}%`}
      />
      <FieldNote>‘분할’ 시나리오 탭에서 오른쪽 패널이 비활성 상태입니다.</FieldNote>

      <hr className="panel__rule" />

      <h3 className="panel__heading">지원되지 않는 항목</h3>
      <ul className="unsupported">
        {UNSUPPORTED.map((item) => (
          <li key={item.label}>
            <strong>{item.label}</strong>
            <span>{item.reason}</span>
          </li>
        ))}
      </ul>

      <button type="button" className="btn btn--block btn--sm" onClick={resetConfig}>
        폰트·창 설정 초기화
      </button>
    </>
  );
}
