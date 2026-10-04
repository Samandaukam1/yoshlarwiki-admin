"use client";

import { Ban, Download, ExternalLink, RotateCcw, Trash2 } from "lucide-react";

import { deleteCertificate, toggleCertificateRevoked } from "./actions";

const BASE = "grid size-8 place-items-center rounded-md text-ink-3 transition-colors";
const ICON_BTN = `${BASE} hover:bg-surface-hover hover:text-ink`;
const WARN_BTN = `${BASE} hover:bg-warning-soft hover:text-warning`;
const DANGER_BTN = `${BASE} hover:bg-danger-soft hover:text-danger`;

export function CertificateRowActions({
  id,
  code,
  revoked,
  siteUrl,
  writable,
}: {
  id: string;
  code: string;
  revoked: boolean;
  siteUrl: string;
  writable: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <a
        href={`${siteUrl}/sertifikat/${code}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Saytda koʻrish"
        title="Saytda koʻrish"
        className={ICON_BTN}
      >
        <ExternalLink className="size-4" strokeWidth={1.9} />
      </a>
      {revoked ? null : (
        <a
          href={`${siteUrl}/sertifikat/${code}/pdf`}
          aria-label="PDF yuklab olish"
          title="PDF yuklab olish"
          className={ICON_BTN}
        >
          <Download className="size-4" strokeWidth={1.9} />
        </a>
      )}
      {writable ? (
        <>
          <form
            action={toggleCertificateRevoked}
            onSubmit={(event) => {
              if (
                !revoked &&
                !window.confirm(`${code} sertifikatini bekor qilasizmi? Tekshiruv sahifasida “bekor qilingan” deb koʻrinadi.`)
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="revoked" value={String(revoked)} />
            <button
              type="submit"
              aria-label={revoked ? "Qayta faollashtirish" : "Bekor qilish"}
              title={revoked ? "Qayta faollashtirish" : "Bekor qilish"}
              className={revoked ? ICON_BTN : WARN_BTN}
            >
              {revoked ? <RotateCcw className="size-4" strokeWidth={1.9} /> : <Ban className="size-4" strokeWidth={1.9} />}
            </button>
          </form>
          <form
            action={deleteCertificate}
            onSubmit={(event) => {
              if (!window.confirm(`${code} sertifikatini butunlay oʻchirasizmi? Bu amalni qaytarib boʻlmaydi.`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              aria-label="Oʻchirish"
              title="Oʻchirish"
              className={DANGER_BTN}
            >
              <Trash2 className="size-4" strokeWidth={1.9} />
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
