import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Servicio de ranking de creadores.
 *
 * reputation = round(total_views*0.1 + followers*0.5 + community_votes*2)
 *
 * - recomputeCreatorReputation: se llama cuando un creador recibe un like/voto/follow.
 * - recomputeAllReputation: pensado para un job diario (cron / route handler protegido).
 * - getLeaderboard: Top N por juego para la UI.
 */

export interface LeaderboardEntry {
  id: string;
  slug: string;
  game_slug: string;
  verified: boolean;
  reputation_points: number;
  rank_tier: string;
}

/** Recalcula la reputación de un creador por su creator_profile.id. */
export async function recomputeCreatorReputation(creatorProfileId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("recompute_creator_reputation", {
      p_creator_id: creatorProfileId,
    });
    if (error) return 0;
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}

/**
 * Recalcula la reputación del creador asociado a un usuario (autor de UGC).
 * Útil tras un voto/like sobre una publicación: resolvemos el creator_profile
 * del autor y recomputamos. No bloquea el flujo si falla.
 */
export async function recomputeReputationForUser(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: cp } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (cp?.id) {
      await supabase.rpc("recompute_creator_reputation", { p_creator_id: cp.id });
    }
  } catch {
    /* no-op: la reputación se recalcula igual en el job diario */
  }
}

/** Recalcula la reputación del creator_profile con ese slug (tras un nuevo follow). */
export async function recomputeReputationForSlug(slug: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: cp } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (cp?.id) {
      await supabase.rpc("recompute_creator_reputation", { p_creator_id: cp.id });
    }
  } catch {
    /* no-op */
  }
}

/** Recalcula TODOS los creadores (job diario). Devuelve la cantidad procesada. */
export async function recomputeAllReputation(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("recompute_all_creator_reputation");
    if (error) return 0;
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}

/** Top N del leaderboard, filtrable por juego. */
export async function getLeaderboard(gameSlug?: string, limit = 10): Promise<LeaderboardEntry[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("creator_profiles")
      .select("id, slug, game_slug, verified, reputation_points, rank_tier")
      .order("reputation_points", { ascending: false })
      .limit(limit);

    if (gameSlug) query = query.eq("game_slug", gameSlug);

    const { data } = await query;
    return (data ?? []) as unknown as LeaderboardEntry[];
  } catch {
    return [];
  }
}
