"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { FollowTargetType } from "@/types/database";

/**
 * Alterna el seguimiento de un juego o autor para el usuario autenticado.
 * Devuelve el nuevo estado (following = true/false) o un error.
 */
export async function toggleFollow(
  targetId: string,
  type: FollowTargetType
): Promise<{ following?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Necesitás iniciar sesión para seguir." };

    const { data: existing } = await supabase
      .from("user_follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_id", targetId)
      .eq("type", type)
      .maybeSingle();

    if (existing) {
      await supabase.from("user_follows").delete().eq("id", existing.id);
      revalidatePath("/");
      return { following: false };
    }

    const { error } = await supabase
      .from("user_follows")
      .insert({ user_id: user.id, target_id: targetId, type });
    if (error) return { error: "No se pudo guardar el seguimiento." };

    // Recalcular la reputación del creador seguido
    if (type === "author") {
      const { recomputeReputationForSlug } = await import("@/services/rankingService");
      await recomputeReputationForSlug(targetId);
    }

    revalidatePath("/");
    return { following: true };
  } catch {
    return { error: "Error interno." };
  }
}
