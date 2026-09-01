"use server";

import { revalidatePath } from "next/cache";

import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/constants";
import type { CategoryResult } from "./types";

async function guard() {
  const admin = await requireAdmin();
  if (!canWrite(admin)) throw new Error("forbidden");
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Kategoriya qo'shadi yoki mavjudini yangilaydi. */
export async function saveCategory(
  _previous: CategoryResult,
  formData: FormData,
): Promise<CategoryResult> {
  await guard();

  const id = text(formData, "id");
  const name = text(formData, "name");

  if (name.length < 2) {
    return { status: "error", message: "Kategoriya nomini kiriting." };
  }

  const supabase = await createClient();
  const slug = slugify(text(formData, "slug") || name);

  if (!slug) {
    return { status: "error", message: "Havola (slug) hosil qilinmadi." };
  }

  // Slug band emasligini tekshiramiz.
  let clash = supabase.from("categories").select("id").eq("slug", slug);
  if (id) clash = clash.neq("id", id);
  const { data: existing } = await clash.maybeSingle();
  if (existing) {
    return { status: "error", message: `«${slug}» havolasi allaqachon band.` };
  }

  const payload = {
    name,
    slug,
    icon: text(formData, "icon") || "sparkles",
    description: text(formData, "description") || null,
    seo_title: text(formData, "seo_title") || null,
    seo_description: text(formData, "seo_description") || null,
    sort_order: Number.parseInt(text(formData, "sort_order") || "0", 10) || 0,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = id
    ? await supabase.from("categories").update(payload).eq("id", id)
    : await supabase.from("categories").insert(payload);

  if (error) {
    return { status: "error", message: "Saqlashda xatolik yuz berdi." };
  }

  revalidatePath("/kategoriyalar");
  return {
    status: "success",
    message: id ? "Kategoriya yangilandi." : "Kategoriya qoʻshildi.",
  };
}

/** Kategoriyani o'chiradi. Nomzodlar bog'lanishi kaskad bilan tozalanadi. */
export async function deleteCategory(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/kategoriyalar");
}

/** Tartibni bir pog'ona yuqoriga/pastga suradi. */
export async function moveCategory(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("id", id)
    .maybeSingle();

  if (!current) return;

  const query = supabase
    .from("categories")
    .select("id, sort_order")
    .order("sort_order", { ascending: direction !== "up" })
    .limit(1);

  const { data: neighbour } = await (direction === "up"
    ? query.lt("sort_order", current.sort_order)
    : query.gt("sort_order", current.sort_order)
  ).maybeSingle();

  if (!neighbour) return;

  await supabase
    .from("categories")
    .update({ sort_order: neighbour.sort_order })
    .eq("id", current.id);
  await supabase
    .from("categories")
    .update({ sort_order: current.sort_order })
    .eq("id", neighbour.id);

  revalidatePath("/kategoriyalar");
}
