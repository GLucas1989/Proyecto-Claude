"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface MonetizationStatus {
  canMonetize: boolean;
  source: string | null;
  isOfficial: boolean;
  pendingRequest: boolean;
}

/** Estado de monetización del usuario autenticado (para gatear la UI de carga). */
export async function getMonetizationStatus(): Promise<MonetizationStatus> {
  const fallback: MonetizationStatus = { canMonetize: false, source: null, isOfficial: false, pendingRequest: false };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fallback;

    const { data: profile } = await supabase
      .from("profiles")
      .select("can_monetize, monetization_source, is_official_creator")
      .eq("id", user.id)
      .single();

    const { data: req } = await supabase
      .from("monetization_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    return {
      canMonetize: profile?.can_monetize === true,
      source: profile?.monetization_source ?? null,
      isOfficial: profile?.is_official_creator === true,
      pendingRequest: !!req,
    };
  } catch {
    return fallback;
  }
}

/**
 * Un creador oficial solicita autorización de monetización (gratis, vía admin).
 * Los usuarios normales NO usan esta vía: deben pagar la tarifa mensual (USD 5).
 */
export async function requestMonetization(note?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Iniciá sesión." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_official_creator, can_monetize")
      .eq("id", user.id)
      .single();

    if (profile?.can_monetize) return { ok: false, error: "Ya tenés monetización habilitada." };
    if (!profile?.is_official_creator) {
      return { ok: false, error: "La autorización gratuita es solo para creadores oficiales. Activá la tarifa mensual." };
    }

    const { error } = await supabase
      .from("monetization_requests")
      .insert({ user_id: user.id, note: note ?? null, status: "pending" });

    // unique(user_id, status) evita duplicar pendientes
    if (error && !error.message.includes("duplicate")) {
      return { ok: false, error: "No se pudo enviar la solicitud." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Error interno." };
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, isAdmin: false };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, isAdmin: profile?.role === "ADMIN" };
}

export interface MonetizationRequestRow {
  id: string;
  user_id: string;
  note: string | null;
  created_at: string;
  display_name: string | null;
  email: string;
  is_official_creator: boolean;
}

/** Lista las solicitudes de monetización pendientes (admin). */
export async function listMonetizationRequests(): Promise<MonetizationRequestRow[]> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return [];

  const { data } = await supabase
    .from("monetization_requests")
    .select("id, user_id, note, created_at, profiles(display_name, email, is_official_creator)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (data ?? []).map((r) => {
    const p = r.profiles as unknown as { display_name: string | null; email: string; is_official_creator: boolean } | null;
    return {
      id: r.id,
      user_id: r.user_id,
      note: r.note,
      created_at: r.created_at,
      display_name: p?.display_name ?? null,
      email: p?.email ?? "",
      is_official_creator: p?.is_official_creator ?? false,
    };
  });
}

/** Aprueba/rechaza una solicitud y, si aprueba, habilita la monetización. */
export async function resolveMonetizationRequest(
  requestId: string,
  approve: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, error: "No autorizado." };

  const { data: req } = await supabase
    .from("monetization_requests")
    .select("user_id")
    .eq("id", requestId)
    .single();
  if (!req) return { ok: false, error: "Solicitud no encontrada." };

  await supabase
    .from("monetization_requests")
    .update({ status: approve ? "approved" : "rejected", resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (approve) {
    await supabase
      .from("profiles")
      .update({ can_monetize: true, monetization_source: "admin" })
      .eq("id", req.user_id);
  }

  revalidatePath("/dashboard/admin/moderation");
  return { ok: true };
}

/** Habilita/revoca monetización directamente por id de usuario (admin). */
export async function setUserMonetization(
  targetUserId: string,
  enabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, error: "No autorizado." };

  const { error } = await supabase
    .from("profiles")
    .update({
      can_monetize: enabled,
      monetization_source: enabled ? "admin" : null,
    })
    .eq("id", targetUserId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/admin/moderation");
  return { ok: true };
}
