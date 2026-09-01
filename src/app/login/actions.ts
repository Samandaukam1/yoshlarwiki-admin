"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { LoginState } from "./types";

export async function signIn(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) {
    return { status: "error", message: "Email va parolni kiriting." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { status: "error", message: "Email yoki parol notoʻgʻri." };
  }

  // Auth muvaffaqiyatli — endi admin ro'yxatida borligini tekshiramiz.
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!admin || !admin.is_active) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Bu hisob uchun admin panelga ruxsat yoʻq.",
    };
  }

  await supabase
    .from("admin_users")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", admin.id);

  redirect(next.startsWith("/") ? next : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
