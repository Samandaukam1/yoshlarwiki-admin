"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { btn } from "@/components/ui";

export function CopyButton({ text, label = "Nusxalash", full = false }: { text: string; label?: string; full?: boolean }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          return;
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={btn(copied ? "secondary" : "primary", "sm", full ? "w-full" : "")}
    >
      {copied ? <Check className="size-4" strokeWidth={2.4} /> : <Copy className="size-4" />}
      {copied ? "Nusxalandi" : label}
    </button>
  );
}
