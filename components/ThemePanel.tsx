"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColorsTab } from "./panels/ColorsTab";
import { FontTab } from "./panels/FontTab";
import { WindowTab } from "./panels/WindowTab";
import { findContrastWarnings } from "@/lib/contrast";
import { useStore } from "@/lib/store";

const MAX_VISIBLE_WARNINGS = 3;

type Tab = "colors" | "font" | "window";

const TABS: { id: Tab; label: string }[] = [
  { id: "colors", label: "색" },
  { id: "font", label: "폰트" },
  { id: "window", label: "창" },
];

export function ThemePanel({ onOpenExtract }: { onOpenExtract: () => void }) {
  const router = useRouter();
  const { theme } = useStore();
  const [tab, setTab] = useState<Tab>("colors");

  const warnings = useMemo(() => findContrastWarnings(theme), [theme]);

  return (
    <aside className="panel" aria-label="테마 편집">
      <div className="segmented segmented--full" role="tablist" aria-label="편집 영역">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className="segmented__option"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "colors" && <ColorsTab onOpenExtract={onOpenExtract} />}
      {tab === "font" && <FontTab />}
      {tab === "window" && <WindowTab />}

      <div className="panel__footer">
        {warnings.length > 0 ? (
          <div className="warning" role="status">
            {warnings.slice(0, MAX_VISIBLE_WARNINGS).map((warning) => (
              <div key={warning.key}>
                {warning.label}의 대비가 낮습니다{" "}
                <span className="warning__ratio">
                  {warning.ratio.toFixed(1)}:1 · 권장 {warning.required}:1
                </span>
              </div>
            ))}
            {warnings.length > MAX_VISIBLE_WARNINGS && (
              <div className="warning__ratio">
                외 {warnings.length - MAX_VISIBLE_WARNINGS}건
              </div>
            )}
          </div>
        ) : (
          <div className="warning warning--muted" role="status">
            대비 문제 없음
          </div>
        )}

        <button
          type="button"
          className="btn btn--accent btn--block"
          onClick={() => router.push("/export")}
        >
          설정 추출하기 →
        </button>
      </div>
    </aside>
  );
}
