"use client";

import Link from "next/link";

const STEPS = [
  { index: 1, label: "랜딩", href: "/" },
  { index: 2, label: "편집", href: "/editor" },
  { index: 3, label: "추출", href: "/export" },
] as const;

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
    </nav>
  );
}
