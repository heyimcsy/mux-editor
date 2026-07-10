"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import type { TargetOs } from "@/lib/theme";

const STEPS = [
  { index: 1, label: "랜딩", href: "/" },
  { index: 2, label: "편집", href: "/editor" },
  { index: 3, label: "추출", href: "/export" },
] as const;

const OS_OPTIONS: { id: TargetOs; label: string }[] = [
  { id: "macos", label: "macOS" },
  { id: "windows", label: "Windows" },
];

export function OsToggle({ verbose = false }: { verbose?: boolean }) {
  const { os, setOs } = useStore();

  return (
    <div className="segmented" role="tablist" aria-label="대상 운영체제">
      {OS_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          className="segmented__option"
          aria-selected={os === option.id}
          onClick={() => setOs(option.id)}
        >
          {verbose
            ? `${option.label} · ${option.id === "macos" ? "cmux" : "wmux"}`
            : option.label}
        </button>
      ))}
    </div>
  );
}

export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand__mark" aria-hidden />
      Mux Editor
    </Link>
  );
}

export function FloatingBar({ current }: { current: "landing" | "editor" | "export" }) {
  const currentHref =
    current === "landing" ? "/" : current === "editor" ? "/editor" : "/export";

  return (
    <nav className="floating-bar">
      <Brand />
      <span className="floating-bar__divider" />
      <div className="steps">
        {STEPS.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className="step"
            aria-current={step.href === currentHref ? "step" : undefined}
          >
            <span className="step__index">{step.index}</span>
            {step.label}
          </Link>
        ))}
      </div>
      <span className="floating-bar__divider" />
      <OsToggle />
    </nav>
  );
}
