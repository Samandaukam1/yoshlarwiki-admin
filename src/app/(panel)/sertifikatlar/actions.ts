"use server";

import { revalidatePath } from "next/cache";

import {
  CERTIFICATE_LABELS,
  CERTIFICATE_TYPES,
  type CandidateOption,
  type CertificateType,
  type CreateCertificateResult,
} from "./types";
import type { SettingsResult } from "../seo/types";
import { canWrite, requireAdmin } from "@/lib/auth";
import { todayTashkentDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Jadval hali yaratilmagan (migratsiya qo'llanmagan) holatini aniqlaydi. */
function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (/certificates/.test(message) && /does not exist|schema cache/.test(message))
  );
}

const MISSING_TABLE_MESSAGE =
  "Sertifikatlar jadvali maʼlumotlar bazasida hali yaratilmagan. Migratsiyani qoʻllash kerak.";

/** Nomzodlarni ismi bo'yicha qidirish (sertifikat berish formasi uchun). */
export async function findCandidates(term: string): Promise<CandidateOption[]> {
  await requireAdmin();
  const safe = term.replace(/[%,()_\\]/g, " ").trim().slice(0, 80);
  if (safe.length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("candidates")
    .select("id, full_name, title, portrait_url, status")
    .ilike("full_name", `%${safe}%`)
    .order("status", { ascending: true })
    .order("full_name")
    .limit(8);

  return (data ?? []) as CandidateOption[];
}

export async function createCertificate(
  _previous: CreateCertificateResult,
  formData: FormData,
): Promise<CreateCertificateResult> {
  const admin = await requireAdmin();
  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda sertifikat berish uchun ruxsat yoʻq." };
  }

  const type = value(formData, "type") as CertificateType;
  if (!CERTIFICATE_TYPES.includes(type)) {
    return { status: "error", message: "Sertifikat turini tanlang." };
  }

  const candidateId = value(formData, "candidate_id");
  if (candidateId && !UUID_RE.test(candidateId)) {
    return { status: "error", message: "Nomzod notoʻgʻri tanlangan. Qaytadan tanlang." };
  }

  const name = value(formData, "recipient_name").replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) {
    return {
      status: "error",
      message: "Sertifikatdagi ism 2–120 belgidan iborat boʻlishi kerak.",
    };
  }

  const issuedOn = value(formData, "issued_on") || todayTashkentDate();
  const parsed = new Date(`${issuedOn}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issuedOn) || Number.isNaN(parsed.getTime())) {
    return { status: "error", message: "Berilgan sana notoʻgʻri." };
  }
  if (parsed.getUTCFullYear() < 2020 || issuedOn > todayTashkentDate()) {
    return { status: "error", message: "Berilgan sana kelajakda yoki juda eski boʻlmasligi kerak." };
  }

  const supabase = await createClient();

  if (candidateId) {
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("id", candidateId)
      .maybeSingle();
    if (!candidate) {
      return { status: "error", message: "Tanlangan nomzod topilmadi. Qaytadan tanlang." };
    }

    // Bir nomzodga bir turdagi faol sertifikat — ikki marta berilmasin.
    const { data: existing, error: existingError } = await supabase
      .from("certificates")
      .select("code")
      .eq("candidate_id", candidateId)
      .eq("type", type)
      .eq("is_revoked", false)
      .limit(1)
      .maybeSingle();

    if (isMissingTable(existingError)) return { status: "error", message: MISSING_TABLE_MESSAGE };
    if (existing && formData.get("allow_duplicate") !== "1") {
      return {
        status: "error",
        message: `Bu nomzodga ${CERTIFICATE_LABELS[type].toLowerCase()} allaqachon berilgan.`,
        existingCode: existing.code,
      };
    }
  }

  const { data, error } = await supabase
    .from("certificates")
    .insert({
      type,
      candidate_id: candidateId || null,
      recipient_name: name,
      issued_on: issuedOn,
      created_by: admin.id,
    })
    .select("code")
    .single();

  if (isMissingTable(error)) return { status: "error", message: MISSING_TABLE_MESSAGE };
  if (error || !data) {
    return { status: "error", message: "Sertifikatni saqlab boʻlmadi. Qaytadan urinib koʻring." };
  }

  revalidatePath("/sertifikatlar");
  return {
    status: "success",
    message: `${CERTIFICATE_LABELS[type]} yaratildi.`,
    code: data.code,
  };
}

/** Bekor qilish / qayta faollashtirish. */
export async function toggleCertificateRevoked(formData: FormData) {
  const admin = await requireAdmin();
  if (!canWrite(admin)) return;

  const id = value(formData, "id");
  if (!UUID_RE.test(id)) return;
  const revoked = value(formData, "revoked") === "true";

  const supabase = await createClient();
  await supabase.from("certificates").update({ is_revoked: !revoked }).eq("id", id);
  revalidatePath("/sertifikatlar");
}

export async function deleteCertificate(formData: FormData) {
  const admin = await requireAdmin();
  if (!canWrite(admin)) return;

  const id = value(formData, "id");
  if (!UUID_RE.test(id)) return;

  const supabase = await createClient();
  await supabase.from("certificates").delete().eq("id", id);
  revalidatePath("/sertifikatlar");
}

/** Imzo qo'yuvchi ma'lumotlari — barcha sertifikatlarda ishlatiladi. */
export async function saveCertificateSettings(
  _previous: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  const admin = await requireAdmin();
  if (!canWrite(admin)) {
    return { status: "error", message: "Sizda oʻzgartirish uchun ruxsat yoʻq." };
  }

  const signatureUrl = value(formData, "signature_url");
  if (signatureUrl && !/^https:\/\/\S+$/i.test(signatureUrl)) {
    return { status: "error", message: "Imzo rasmi havolasi https:// bilan boshlanishi kerak." };
  }

  const signerName = value(formData, "signer_name");
  if (signerName.length > 60) {
    return { status: "error", message: "Ism juda uzun (60 belgigacha)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "certificate",
      value: {
        signer_name: signerName,
        signer_title: value(formData, "signer_title") || "Loyiha rahbari",
        signature_url: signatureUrl,
      },
      is_public: true,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) return { status: "error", message: "Saqlashda xatolik yuz berdi." };

  revalidatePath("/sertifikatlar");
  return {
    status: "success",
    message: "Saqlandi. Yangi imzo sertifikatlarda 10 daqiqa ichida koʻrinadi.",
  };
}
