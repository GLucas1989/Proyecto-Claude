"use server";

import { createClient } from "@/lib/supabase/server";
import type { GameSubscriptionStatus, PlatformContentType } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameSubscriptionPlan {
  id: string;
  game_slug: string;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  features: string[];
}

export interface GameSubscription {
  id: string;
  user_id: string;
  game_slug: string;
  status: GameSubscriptionStatus;
  current_period_end: string | null;
}

export interface PlatformContentItem {
  id: string;
  game_slug: string;
  type: PlatformContentType;
  title: string;
  description: string | null;
  file_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  sort_order: number;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getGameSubscriptionPlan(
  gameSlug: string
): Promise<GameSubscriptionPlan | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("game_subscription_plans")
      .select("*")
      .eq("game_slug", gameSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (!data) return null;
    return {
      ...data,
      features: Array.isArray(data.features)
        ? (data.features as string[])
        : JSON.parse(data.features as string),
    };
  } catch {
    return null;
  }
}

export async function getUserGameSubscription(
  gameSlug: string
): Promise<GameSubscription | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("game_subscriptions")
      .select("id, user_id, game_slug, status, current_period_end")
      .eq("user_id", user.id)
      .eq("game_slug", gameSlug)
      .maybeSingle();

    return data ?? null;
  } catch {
    return null;
  }
}

export async function getPlatformContent(
  gameSlug: string
): Promise<PlatformContentItem[]> {
  try {
    const supabase = await createClient();

    // RLS applies automatically: only subscribers see published content
    const { data } = await supabase
      .from("platform_content")
      .select(
        "id, game_slug, type, title, description, file_url, thumbnail_url, duration_seconds, file_size_bytes, sort_order"
      )
      .eq("game_slug", gameSlug)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    return data ?? [];
  } catch {
    return [];
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Creates a game subscription record with 'trialing' status.
 * In production this is called after Stripe checkout succeeds via webhook.
 * For dev/demo purposes it can be called directly.
 */
export async function createGameSubscription(gameSlug: string): Promise<{
  success: boolean;
  error?: string;
  subscription?: GameSubscription;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  // Check plan exists
  const plan = await getGameSubscriptionPlan(gameSlug);
  if (!plan) {
    return { success: false, error: "Plan no encontrado para este juego" };
  }

  // Check for existing active subscription
  const existing = await getUserGameSubscription(gameSlug);
  if (existing && existing.status === "active") {
    return { success: false, error: "Ya tenés una suscripción activa" };
  }

  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data, error } = await supabase
    .from("game_subscriptions")
    .upsert(
      {
        user_id: user.id,
        game_slug: gameSlug,
        status: "active" as GameSubscriptionStatus,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
      },
      { onConflict: "user_id,game_slug" }
    )
    .select("id, user_id, game_slug, status, current_period_end")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, subscription: data };
}

export async function cancelGameSubscription(gameSlug: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("game_subscriptions")
    .update({
      status: "canceled" as GameSubscriptionStatus,
      canceled_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("game_slug", gameSlug);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Revenue routing note ─────────────────────────────────────────────────────
// Game subscriptions: 100% → plataforma (OWNER wallet)
// This is enforced at the Stripe level:
//   - Payment Intent destination = platform Stripe account (no Connect transfer)
//   - NO application_fee_amount or transfer_data set → funds land in platform account
// Creator subscriptions (Module 2): split applied via Stripe Connect transfer_data
