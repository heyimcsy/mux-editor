"use client";

import { useEffect, useState } from "react";
import { isHex, normalizeHex } from "@/lib/color";

/** A color well that opens the OS picker. The native input is stretched over
 *  the swatch and made invisible so the swatch itself is the hit target. */
export function Swatch({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (hex: string) => void;
  label: string;
}) {
  return (
    <span className="swatch" style={{ background: value }}>
      <input
        type="color"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  // Re-sync when the theme changes underneath (preset switch, image extract).
  useEffect(() => setDraft(value), [value]);

  const valid = isHex(draft);

  function handleText(next: string) {
    setDraft(next);
    const normalized = normalizeHex(next);
    if (normalized) onChange(normalized);
  }

  return (
    <div className="color-field">
      <Swatch value={value} onChange={onChange} label={label} />
      <span className="color-field__label">{label}</span>
      <input
        className="color-field__hex"
        value={draft}
        aria-label={`${label} 색상 코드`}
        aria-invalid={valid ? undefined : "true"}
        spellCheck={false}
        onChange={(event) => handleText(event.target.value)}
        onBlur={() => setDraft(value)}
      />
    </div>
  );
}
