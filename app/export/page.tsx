"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { Brand } from "@/components/TopBar";
import { TerminalPreview } from "@/components/TerminalPreview";
import { buildExportPlan } from "@/lib/export";
import { useStore } from "@/lib/store";

function download(body: string, filename: string) {
  const blob = new Blob([body], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const { theme, config } = useStore();

  const plan = useMemo(
    () => buildExportPlan(theme, config),
    [theme, config]
  );

  return (
    <main className="export">
      <header className="export__bar">
        <Brand />
        <span style={{ marginLeft: "auto" }} />
        <Link href="/editor" className="btn btn--sm">
          ← 편집으로
        </Link>
      </header>

      <div className="export__inner">
        <h1 className="export__title">{theme.name}</h1>
        <p className="export__lede">
          아래 단계를 그대로 따라 하면 cmux에 이 테마와 설정이 적용됩니다.
        </p>

        <div style={{ marginBottom: "var(--space-24)", maxWidth: 480 }}>
          <TerminalPreview theme={theme} config={config} scenario="shell" />
        </div>

        {plan.steps.map((step) => (
          <section className="export-step" key={step.id}>
            <div className="export-step__head">
              <h2 className="export-step__title">{step.title}</h2>
            </div>
            <p className="export-step__desc">{step.description}</p>

            <CodeBlock code={step.code} path={step.path} />
          </section>
        ))}

        <div className="export__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => download(plan.themeFileBody, plan.themeFileName)}
          >
            테마 파일 내려받기
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => download(plan.configFileBody, "config")}
          >
            설정 파일 내려받기
          </button>
          <Link href="/editor" className="btn">
            더 다듬기
          </Link>
        </div>
      </div>
    </main>
  );
}
