"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { Brand, OsToggle } from "@/components/TopBar";
import { TerminalPreview } from "@/components/TerminalPreview";
import { buildExportPlan } from "@/lib/export";
import { guessOs, useStore } from "@/lib/store";

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
  const { os, setOs, hydrated, theme, config } = useStore();

  useEffect(() => {
    if (hydrated && !os) setOs(guessOs());
  }, [hydrated, os, setOs]);

  const targetOs = os ?? "macos";
  const plan = useMemo(
    () => buildExportPlan(theme, config, targetOs),
    [theme, config, targetOs]
  );

  const app = targetOs === "macos" ? "cmux" : "wmux";
  const configFilename = targetOs === "macos" ? "config" : "config.toml";

  return (
    <main className="export">
      <header className="export__bar">
        <Brand />
        <span style={{ marginLeft: "auto" }} />
        <OsToggle verbose />
        <Link href="/editor" className="btn btn--sm">
          ← 편집으로
        </Link>
      </header>

      <div className="export__inner">
        <h1 className="export__title">{theme.name}</h1>
        <p className="export__lede">
          아래 단계를 그대로 따라 하면 {app}에 이 테마와 설정이 적용됩니다.
        </p>

        <div style={{ marginBottom: "var(--space-24)", maxWidth: 480 }}>
          <TerminalPreview theme={theme} config={config} scenario="shell" os={targetOs} />
        </div>

        {plan.steps.map((step) => (
          <section className="export-step" key={step.id}>
            <div className="export-step__head">
              <h2 className="export-step__title">{step.title}</h2>
              {step.unverified && <span className="badge-unverified">확인 필요</span>}
            </div>
            <p className="export-step__desc">{step.description}</p>

            {step.unverified && (
              <div className="warning" style={{ marginBottom: "var(--space-6)" }}>
                이 스니펫의 정확한 형식은 실제 wmux 설치본에서 아직 확인하지
                않았습니다. 같은 이름의 wmux 프로젝트가 여러 개라 설정 파일 구조가
                다를 수 있습니다. 2단계의 <code>import-ghostty</code> 명령을 먼저
                써보세요.
              </div>
            )}

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
            onClick={() => download(plan.configFileBody, configFilename)}
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
