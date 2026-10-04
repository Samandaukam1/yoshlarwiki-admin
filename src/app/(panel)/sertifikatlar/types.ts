/** Sertifikat turlari — `certificate_type` enumi bilan bir xil. */
export const CERTIFICATE_TYPES = ["mualliflik", "azolik"] as const;
export type CertificateType = (typeof CERTIFICATE_TYPES)[number];

export const CERTIFICATE_LABELS: Record<CertificateType, string> = {
  mualliflik: "Mualliflik sertifikati",
  azolik: "Aʼzolik sertifikati",
};

export const CERTIFICATE_SHORT: Record<CertificateType, string> = {
  mualliflik: "Mualliflik",
  azolik: "Aʼzolik",
};

/** Imzo sozlamalari — saytdagi DEFAULT_CERTIFICATE_SETTINGS bilan bir xil. */
export type CertificateSettings = {
  signer_name: string;
  signer_title: string;
  signature_url: string;
};

export const DEFAULT_CERTIFICATE_SETTINGS: CertificateSettings = {
  signer_name: "Saidaxror Olimov",
  signer_title: "Loyiha rahbari",
  signature_url: "",
};

export type CandidateOption = {
  id: string;
  full_name: string;
  title: string | null;
  portrait_url: string | null;
  status: "draft" | "published" | "archived";
};

/** Sertifikat yaratish natijasi ("use server" fayli obyekt eksport qila olmaydi). */
export type CreateCertificateResult = {
  status: "idle" | "success" | "error";
  message: string;
  code?: string;
  /** Shu nomzodga shu turdagi faol sertifikat allaqachon bor bo'lsa. */
  existingCode?: string;
};

export const idleCreateResult: CreateCertificateResult = { status: "idle", message: "" };
