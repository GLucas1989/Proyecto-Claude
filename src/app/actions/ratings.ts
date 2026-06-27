"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import DOMPurify from "isomorphic-dompurify";

export interface PublicationRatingSummary {
  average: number;
  count: number;
  userScore: number | null;
}

/** Resumen de calificaciones de una publicación + la del usuario actual. */
export async function getPublicationRating(
  publicationId: string
): Promise<PublicationRatingSummary> {
  try {
    const supabase = await createClient();
    const { data: pub } = await supabase
      .from("user_publications")
      .select("average_rating, ratings_count")
      .eq("id", publicationId)
      .single();

    const { data: { user } } = await supabase.auth.getUser();
    let userScore: number | null = null;
    if (user) {
      const { data: mine } = await supabase
        .from("ratings")
        .select("score")
        .eq("publication_id", publicationId)
        .eq("user_id", user.id)
        .maybeSingle();
      userScore = mine?.score ?? null;
    }

    return {
      average: Number(pub?.average_rating ?? 0),
      count: pub?.ratings_count ?? 0,
      userScore,
    };
  } catch {
    return { average: 0, count: 0, userScore: null };
  }
}

/**
 * Califica una publicación (1-5) con comentario opcional sanitizado.
 * Upsert por (user_id, publication_id) y recalcula el promedio vía RPC.
 */
export async function ratePublication(
  publicationId: string,
  score: number,
  comment?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (score < 1 || score > 5) return { ok: false, error: "Puntaje inválido." };
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Iniciá sesión para calificar." };

    // No calificar la propia publicación
    const { data: pub } = await supabase
      .from("user_publications")
      .select("user_id")
      .eq("id", publicationId)
      .single();
    if (!pub) return { ok: false, error: "Publicación no encontrada." };
    if (pub.user_id === user.id) return { ok: false, error: "No podés calificar tu propia guía." };

    // Sanitizar comentario (sin HTML)
    const clean = comment
      ? DOMPurify.sanitize(comment, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).slice(0, 600).trim()
      : null;

    const { error } = await supabase
      .from("ratings")
      .upsert(
        { user_id: user.id, publication_id: publicationId, score, comment: clean },
        { onConflict: "user_id,publication_id" }
      );
    if (error) return { ok: false, error: "No se pudo guardar la calificación." };

    // Recalcular promedio de forma atómica
    await supabase.rpc("update_publication_rating", { p_publication_id: publicationId });

    revalidatePath(`/ugc/${publicationId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Error interno." };
  }
}

export interface ReviewRow {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  display_name: string | null;
}

/** Lista las reseñas con comentario de una publicación. */
export async function listReviews(publicationId: string): Promise<ReviewRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ratings")
      .select("id, score, comment, created_at, profiles(display_name)")
      .eq("publication_id", publicationId)
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(30);

    return (data ?? []).map((r) => {
      const p = r.profiles as unknown as { display_name: string | null } | null;
      return { id: r.id, score: r.score, comment: r.comment, created_at: r.created_at, display_name: p?.display_name ?? null };
    });
  } catch {
    return [];
  }
}
