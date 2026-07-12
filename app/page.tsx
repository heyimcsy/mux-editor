"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/TopBar";
import { TerminalPreview } from "@/components/TerminalPreview";
import { PRESETS } from "@/lib/theme";

const CYCLE_MS = 3200;

const FEATURES = [
  {
    title: "고르면 바로 보입니다",
    body: "색을 바꿀 때마다 가상 터미널이 즉시 다시 칠해집니다. 저장하고 리로드하는 왕복이 없습니다.",
  },
  {
    title: "이미지에서 색을 뽑습니다",
    body: "좋아하는 사진을 올리면 주요 색을 찾아 ANSI 16색에 배치합니다. 이미지는 브라우저 밖으로 나가지 않습니다.",
  },
  {
    title: "그대로 붙여넣습니다",
    body: "쓰는 터미널에 맞는 설정 파일과 명령어를 만들어 줍니다. 문법을 외울 필요가 없습니다.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [presetIndex, setPresetIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setInterval(
      () => setPresetIndex((index) => (index + 1) % PRESETS.length),
      CYCLE_MS
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="landing">
      <div className="landing__inner">
        <Brand />

        <h1 className="landing__title">터미널 테마를, 보면서 만드세요.</h1>
        <p className="landing__lede">
          cmux(macOS)의 색을 눈으로 확인하며 고르고, 그대로 붙여넣을 수 있는 설정
          파일과 명령어를 받아가세요. 설정 파일 문법은 몰라도 됩니다.
        </p>

        <div className="landing__preview">
          <TerminalPreview theme={PRESETS[presetIndex]} scenario="shell" />
        </div>

        <div className="os-choices">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => router.push("/editor")}
          >
            테마 만들러 가기
          </button>
        </div>

        <div className="feature-list">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <h3 className="feature__title">{feature.title}</h3>
              <p className="feature__body">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
