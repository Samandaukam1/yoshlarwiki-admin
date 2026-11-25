"use client";

import { Check, ImageUp, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { confirmAnketaPhoto, createAnketaPhotoUpload } from "../actions";
import { Feedback } from "../../bot/forms";
import type { BotResult } from "../../bot/types";
import { btn } from "@/components/ui";
import { processPortrait, type ProcessedPhoto } from "@/lib/remove-bg";
import { createClient } from "@/lib/supabase/client";

/**
 * Rasmni almashtirish: yangi rasm tanlanadi → foni aniq model bilan avtomatik
 * kesiladi → natija ko'rsatiladi → «Saqlash» bosilsa profil va post yangilanadi.
 */
export function PhotoReplace({ id }: { id: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProcessedPhoto | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<BotResult>({ status: "idle", message: "" });

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const reset = () => {
    setResult(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setFeedback({ status: "idle", message: "" });
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setFeedback({ status: "error", message: "Faqat PNG, JPG yoki WebP rasm yuklang." });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFeedback({ status: "error", message: "Rasm hajmi 15 MB dan oshmasin." });
      return;
    }
    setBusy(true);
    try {
      const processed = await processPortrait(file, { removeBackground: true, quality: "precise", onStatus: setStatus });
      setResult(processed);
      setPreview(URL.createObjectURL(processed.cutout));
      if (!processed.removed) {
        setFeedback({ status: "error", message: "Fonni olib tashlab boʻlmadi — rasm asl holicha. Boshqa rasm tanlang." });
      }
    } catch (e) {
      setFeedback({ status: "error", message: e instanceof Error ? e.message : "Rasm tayyorlanmadi." });
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  const send = async (blob: Blob, variant: "portrait" | "white") => {
    const signed = await createAnketaPhotoUpload(id, blob.type, blob.size, variant);
    if (!signed.ok) throw new Error(signed.message);
    const { error } = await createClient()
      .storage.from("portraits")
      .uploadToSignedUrl(signed.path, signed.uploadToken, blob, { contentType: blob.type });
    if (error) throw new Error("Rasm yuklanmadi. Qayta urinib koʻring.");
    return signed.path;
  };

  const save = async () => {
    if (!result) return;
    setBusy(true);
    setStatus("Yuklanmoqda…");
    try {
      const [portraitPath, whitePath] = await Promise.all([send(result.cutout, "portrait"), send(result.white, "white")]);
      setStatus("Profil va post yangilanmoqda…");
      const saved = await confirmAnketaPhoto(id, portraitPath, whitePath);
      setFeedback({ status: saved.ok ? "success" : "error", message: saved.message });
      if (saved.ok) reset();
    } catch (e) {
      setFeedback({ status: "error", message: e instanceof Error ? e.message : "Saqlanmadi." });
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />

      {preview ? (
        <div className="grid gap-3 rounded-[10px] border border-accent p-3">
          <p className="text-[12.5px] font-semibold text-ink">Yangi rasm (foni kesilgan)</p>
          <div className="yw-checker aspect-[4/5] overflow-hidden rounded-photo border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Yangi rasm" className="size-full object-contain" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className={btn("secondary", "sm")}>
              <RefreshCw className="size-4" /> Boshqa rasm
            </button>
            <button type="button" onClick={() => void save()} disabled={busy} className={btn("primary", "sm")}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={2.4} />} Saqlash
            </button>
          </div>
          <button type="button" onClick={reset} disabled={busy} className={btn("ghost", "sm")}>
            <X className="size-4" /> Bekor qilish
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className={btn("secondary", "sm", "w-full")}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
          Rasmni almashtirish
        </button>
      )}

      {status ? <p className="mt-2 text-[12.5px] text-ink-2">{status}</p> : null}
      <Feedback state={feedback} />
    </div>
  );
}
