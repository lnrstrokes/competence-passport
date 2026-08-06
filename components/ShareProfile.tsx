"use client";

import { useState } from "react";

export function ShareProfile({ path, name }: { path: string; name: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.href).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} — Competence Passport`, url });
        return;
      }
    } catch {
      // user cancelled the share sheet — fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button className="btn btnGhost" onClick={share}>
      {copied ? "Link copied ✓" : "Share profile"}
    </button>
  );
}
