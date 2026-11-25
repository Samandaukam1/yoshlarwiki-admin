"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { btn } from "@/components/ui";

export function CopyButton({
  text,
  html,
  label = "Nusxalash",
  full = false,
}: {
  text: string;
  /** Boy matn: Telegram'ga qo'yilganda havolalar yozuv ichida qoladi. */
  html?: string;
  label?: string;
  full?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          if (html && typeof ClipboardItem !== "undefined") {
            await navigator.clipboard.write([
              new ClipboardItem({
                "text/html": new Blob([html], { type: "text/html" }),
                "text/plain": new Blob([text], { type: "text/plain" }),
              }),
            ]);
          } else {
            await navigator.clipboard.writeText(text);
          }
        } catch {
          try {
            await navigator.clipboard.writeText(text);
          } catch {
            return;
          }
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
