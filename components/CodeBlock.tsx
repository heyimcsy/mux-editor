"use client";

import { useEffect, useState } from "react";

export function CodeBlock({ code, path }: { code: string; path?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard is blocked without a secure context; the text stays selectable.
    }
  }

  return (
    <div className="code-block">
      <div className="code-block__head">
        <code className="code-block__path">{path ?? "터미널에서 실행"}</code>
        <button type="button" className="btn btn--sm" onClick={copy}>
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
      <pre className="code-block__body">{code.trimEnd()}</pre>
    </div>
  );
}
