import { createClient } from "@/lib/supabase/server";

export interface UserFollows {
  games: Set<string>;    // game slugs seguidos
  authors: Set<string>;  // creator/author ids seguidos
}

/**
 * Devuelve los follows del usuario autenticado (o sets vacíos si es anónimo).
 * Pensado para Server Components: una sola query, tolerante a errores.
 */
export async function getUserFollows(): Promise<UserFollows> {
  const empty: UserFollows = { games: new Set(), authors: new Set() };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const { data } = await supabase
      .from("user_follows")
      .select("target_id, type")
      .eq("user_id", user.id);

    if (!data) return empty;

    const games = new Set<string>();
    const authors = new Set<string>();
    for (const row of data) {
      if (row.type === "game") games.add(row.target_id);
      else if (row.type === "author") authors.add(row.target_id);
    }
    return { games, authors };
  } catch {
    return empty;
  }
}

/** Indica si el usuario tiene al menos un follow. */
export function hasAnyFollow(follows: UserFollows): boolean {
  return follows.games.size > 0 || follows.authors.size > 0;
}
