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
