"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { Brand } from "@/components/TopBar";
import { TerminalPreview } from "@/components/TerminalPreview";
import { buildExportPlan, type ExportStep } from "@/lib/export";
import { useStore } from "@/lib/store";

function download(body: string, filename: string) {
  // Deliberately not text/plain: some browsers append `.txt` to a text blob,
  // and these files must keep the exact name Ghostty looks for.
  const blob = new Blob([body], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

/**
 * A step is shown as a runnable command by default. Writing the file by hand is
 * still offered, but it is the path where the `.txt` trap lives, so it is the
 * one the user has to choose.
 */
function StepView({ step }: { step: ExportStep }) {
  const [manual, setManual] = useState(false);
  const hasBoth = Boolean(step.command && step.code);
  const showManual = hasBoth ? manual : !step.command;

  return (
    <section className="export-step">
      <div className="export-step__head">
        <h2 className="export-step__title">{step.title}</h2>

        {hasBoth && (
          <div className="segmented" role="tablist" aria-label="적용 방법">
            <button
              type="button"
              role="tab"
              className="segmented__option"
              aria-selected={!manual}
              onClick={() => setManual(false)}
            >
              명령어로
            </button>
            <button
              type="button"
              role="tab"
              className="segmented__option"
              aria-selected={manual}
              onClick={() => setManual(true)}
            >
              직접 저장
            </button>
          </div>
        )}
      </div>

      <p className="export-step__desc">
        {step.description}
        {hasBoth &&
          (showManual
            ? " 아래 내용을 이 경로에 저장하세요."
            : " 아래를 복사해 터미널에 붙여넣으면 끝입니다.")}
      </p>

      {showManual ? (
        <CodeBlock code={step.code ?? ""} path={step.path} />
      ) : (
        <CodeBlock code={step.command ?? ""} />
      )}

      {step.warning && (
        <div className="warning export-step__warning" role="note">
          {step.warning}
        </div>
      )}
    </section>
  );
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
          <StepView step={step} key={step.id} />
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
