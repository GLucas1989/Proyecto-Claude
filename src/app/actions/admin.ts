"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FoundingPartner, AuthorWallet, WalletTransaction } from "@/types/database";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") {
    throw new Error("Forbidden: ADMIN role required");
  }
  return { supabase, user };
}

// ── Founding Partners ─────────────────────────────────────────────────────────

export async function listFoundingPartners(): Promise<FoundingPartner[]> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("founding_partners")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function upsertFoundingPartner(input: {
  user_id: string;
  creator_id?: string | null;
  brand_name?: string | null;
  revenue_share_percentage?: number;
  notes?: string | null;
}): Promise<{ error?: string }> {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase.from("founding_partners").upsert(
    {
      user_id: input.user_id,
      creator_id: input.creator_id ?? null,
      brand_name: input.brand_name ?? null,
      revenue_share_percentage: input.revenue_share_percentage ?? 50,
      notes: input.notes ?? null,
      activated_by: user.id,
      is_active: true,
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };

  // Mark user as founding partner on their profile
  await supabase
    .from("profiles")
    .update({ is_founding_partner: true })
    .eq("id", input.user_id);

  revalidatePath("/dashboard/admin/founding-partners");
  return {};
}

export async function toggleFoundingPartner(
  userId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("founding_partners")
    .update({ is_active: isActive })
    .eq("user_id", userId);

  if (error) return { error: error.message };

  if (!isActive) {
    await supabase
      .from("profiles")
      .update({ is_founding_partner: false })
      .eq("id", userId);
  }

  revalidatePath("/dashboard/admin/founding-partners");
  return {};
}

// ── Author Wallets (read-only — writes go through credit_author_wallet RPC) ───

export async function getAuthorWallet(userId: string): Promise<AuthorWallet | null> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("author_wallets")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data ?? null;
}

export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

// ── Creadores de confianza (auto-publicación sin moderación) ──────────────────

export interface CreatorRow {
  id: string;
  email: string;
  display_name: string | null;
  is_trusted_creator: boolean;
  role: string;
}

/** Lista perfiles para gestión de confianza (búsqueda opcional por nombre/email). */
export async function listCreators(search = ""): Promise<CreatorRow[]> {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("profiles")
    .select("id, email, display_name, is_trusted_creator, role")
    .order("is_trusted_creator", { ascending: false })
    .limit(50);

  if (search.trim()) {
    query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
  }

  const { data } = await query;
  return (data ?? []) as CreatorRow[];
}

// ── Reclamos de perfil (claims) ───────────────────────────────────────────────

export interface ClaimRow {
  id: string;
  user_id: string;
  creator_slug: string;
  game_slug: string;
  verification_code: string | null;
  created_at: string;
  display_name: string | null;
  email: string;
}

/** Lista los reclamos de perfil pendientes (admin). */
export async function listPendingClaims(): Promise<ClaimRow[]> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("claim_requests")
    .select("id, user_id, creator_slug, game_slug, verification_code, created_at, profiles(display_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (data ?? []).map((r) => {
    const p = r.profiles as unknown as { display_name: string | null; email: string } | null;
    return {
      id: r.id, user_id: r.user_id, creator_slug: r.creator_slug, game_slug: r.game_slug,
      verification_code: r.verification_code, created_at: r.created_at,
      display_name: p?.display_name ?? null, email: p?.email ?? "",
    };
  });
}

/**
 * Aprueba un reclamo: vincula el creator_profile al usuario, lo marca verificado
 * y designa al usuario como CREADOR OFICIAL (is_official_creator) — habilitando
 * la vía de autorización gratuita de monetización.
 */
export async function resolveClaim(
  claimId: string,
  approve: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdmin();

  const { data: claim } = await supabase
    .from("claim_requests")
    .select("user_id, creator_slug, game_slug")
    .eq("id", claimId)
    .single();
  if (!claim) return { ok: false, error: "Reclamo no encontrado." };

  await supabase
    .from("claim_requests")
    .update({ status: approve ? "approved" : "rejected", resolved_at: new Date().toISOString() })
    .eq("id", claimId);

  if (approve) {
    // Vincular y verificar el perfil de creador
    await supabase
      .from("creator_profiles")
      .update({ user_id: claim.user_id, verified: true, verified_at: new Date().toISOString(), verified_method: "admin_claim" })
      .eq("slug", claim.creator_slug);

    // Marcar al usuario como creador oficial
    await supabase
      .from("profiles")
      .update({ is_official_creator: true })
      .eq("id", claim.user_id);
  }

  revalidatePath("/dashboard/admin/moderation");
  return { ok: true };
}

/**
 * Designa o revoca un "creador de confianza".
 * Si está activo, sus publicaciones se auto-publican sin pasar por moderación.
 */
export async function setCreatorTrusted(
  targetUserId: string,
  trusted: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ is_trusted_creator: trusted })
    .eq("id", targetUserId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/admin/moderation");
  return { ok: true };
}
