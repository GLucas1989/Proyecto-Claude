import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { UserPublication, UserReputation, WalletTransaction } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirectTo=/dashboard");

  const [
    { data: profile },
    { data: claimedProfile },
    { data: pendingClaim },
    { data: publicationsRaw },
    { data: reputationRaw },
    { data: walletRaw },
    { data: transactionsRaw },
    { data: creditsRaw },
    { data: subscriptionsRaw },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("claim_requests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle(),
    supabase
      .from("user_publications")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase.from("user_reputation").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("author_wallets").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("user_subscriptions")
      .select("id, academy_id, is_global_pass, status, expires_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const publications = (publicationsRaw ?? []) as UserPublication[];
  const reputation   = (reputationRaw ?? null) as UserReputation | null;
  const transactions = (transactionsRaw ?? []) as WalletTransaction[];

  // Promedio de calificaciones del creador, ponderado por cantidad de votos
  const totalVotes = publications.reduce((a, p) => a + (p.ratings_count ?? 0), 0);
  const weightedSum = publications.reduce((a, p) => a + (p.average_rating ?? 0) * (p.ratings_count ?? 0), 0);
  const creatorRating = totalVotes > 0 ? weightedSum / totalVotes : 0;

  return (
    <DashboardShell
      displayName={profile?.display_name ?? user.email ?? "creador"}
      email={user.email ?? ""}
      role={profile?.role ?? "USER"}
      userId={user.id}
      publications={publications}
      reputation={reputation}
      creatorRating={creatorRating}
      creatorRatingCount={totalVotes}
      walletBalance={Number(walletRaw?.available_balance ?? 0)}
      withdrawnBalance={Number(walletRaw?.withdrawn_balance ?? 0)}
      transactions={transactions}
      creditBalance={Number(creditsRaw?.balance ?? 0)}
      subscriptions={subscriptionsRaw ?? []}
      claimedProfile={
        claimedProfile
          ? { slug: claimedProfile.slug, game_slug: claimedProfile.game_slug, verified: claimedProfile.verified }
          : null
      }
      pendingClaim={
        pendingClaim
          ? { creator_slug: pendingClaim.creator_slug, game_slug: pendingClaim.game_slug }
          : null
      }
    />
  );
}
