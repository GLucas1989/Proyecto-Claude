"use server";

import { createClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/types/database";

export interface CreatorSubscription {
  id: string;
  status: SubscriptionStatus;
  current_period_end: string | null;
}

/** Returns the current user's active subscription to a specific creator, if any. */
export async function getCreatorSubscription(
  creatorSlug: string
): Promise<CreatorSubscription | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("slug", creatorSlug)
      .maybeSingle();

    if (!creatorProfile) return null;

    const { data } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_end")
      .eq("subscriber_id", user.id)
      .eq("creator_id", creatorProfile.id)
      .eq("status", "active")
      .maybeSingle();

    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Kicks off a Stripe Checkout session for a creator subscription.
 * Returns the checkout URL to redirect the user to.
 */
export async function startCreatorCheckout(
  creatorSlug: string,
  planId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/lemonsqueezy/checkout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "creator_sub", creatorId: creatorSlug, planId }),
      }
    );
    const json = await res.json() as { url?: string; error?: string };
    return json;
  } catch {
    return { error: "Error de red al iniciar el pago" };
  }
}

/** Returns active subscription plans for a given creator. */
export async function getCreatorPlans(creatorSlug: string) {
  try {
    const supabase = await createClient();

    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("slug", creatorSlug)
      .maybeSingle();

    if (!creatorProfile) return [];

    const { data } = await supabase
      .from("subscription_plans")
      .select("id, name, price_cents, currency, features")
      .eq("creator_id", creatorProfile.id)
      .eq("is_active", true)
      .order("price_cents");

    return data ?? [];
  } catch {
    return [];
  }
}
