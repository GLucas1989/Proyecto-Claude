"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { PublicationType, PublicationStatus, UserPublication, UserReputation, PromotedContent } from "@/types/database";
import { sendTransactionalEmail } from "@/lib/email/client";
import { ugcApprovedEmail, ugcRejectedEmail } from "@/lib/email/templates";
import { autoModerate } from "@/lib/moderation/filters";

/**
 * Envía la notificación transaccional al autor tras una decisión de moderación.
 * No bloquea el flujo: cualquier fallo de email se loguea pero no revierte la acción.
 */
async function notifyAuthorOfModeration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  publicationId: string,
  decision: "approved" | "rejected",
  reason?: string
): Promise<void> {
  try {
    const { data: pub } = await supabase
      .from("user_publications")
      .select("title, user_id")
      .eq("id", publicationId)
      .single();
    if (!pub) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", pub.user_id)
      .single();
    if (!profile?.email) return;

    const authorName = profile.display_name ?? "creador";
    const email =
      decision === "approved"
        ? ugcApprovedEmail({ authorName, publicationTitle: pub.title, publicationId })
        : ugcRejectedEmail({ authorName, publicationTitle: pub.title, reason: reason ?? "Revisá el contenido y volvé a enviar.", publicationId });

    await sendTransactionalEmail({ to: profile.email, subject: email.subject, html: email.html });
  } catch (err) {
    console.error("[ugc] moderation email failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/ugc/new");
  return { supabase, user };
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3A — Guardar borrador
// ─────────────────────────────────────────────────────────────────────────────

export async function saveDraft(params: {
  publicationId?: string;
  gameSlug: string;
  title: string;
  type: PublicationType;
  content: string;
  attachments: string[];
  isPremium: boolean;
  marketplaceDomain?: string;
  esportsRole?: string;
}): Promise<{ id: string } | null> {
  try {
    const { supabase, user } = await requireAuth();
    const { publicationId, gameSlug, title, type, content, attachments, isPremium, marketplaceDomain, esportsRole } = params;

    if (publicationId) {
      await supabase
        .from("user_publications")
        .update({
          title,
          type,
          content_markdown: content,
          attachments_urls: attachments,
          is_premium: isPremium,
          marketplace_domain: marketplaceDomain || null,
          esports_role: esportsRole || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", publicationId)
        .eq("user_id", user.id)
        .in("status", ["DRAFT", "PENDING_REVIEW"]);

      return { id: publicationId };
    }

    const { data, error } = await supabase
      .from("user_publications")
      .insert({
        user_id: user.id,
        game_slug: gameSlug,
        title,
        type,
        content_markdown: content,
        attachments_urls: attachments,
        is_premium: isPremium,
        marketplace_domain: marketplaceDomain || null,
        esports_role: esportsRole || null,
        status: "DRAFT",
      })
      .select("id")
      .single();

    if (error || !data) return null;
    return { id: data.id };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3B — Enviar a revisión (DRAFT → PENDING_REVIEW)
// ─────────────────────────────────────────────────────────────────────────────

export async function submitForReview(params: {
  publicationId?: string;
  gameSlug: string;
  title: string;
  type: PublicationType;
  content: string;
  attachments: string[];
  isPremium: boolean;
  marketplaceDomain?: string;
  esportsRole?: string;
}): Promise<{ id?: string; error?: string } | null> {
  try {
    const { supabase, user } = await requireAuth();
    const { gameSlug, title, type, content, attachments, isPremium } = params;

    // Guardar o crear primero (preserva el trabajo aunque luego se bloquee)
    let pubId = params.publicationId;
    if (!pubId) {
      const draft = await saveDraft({ ...params });
      if (!draft) return null;
      pubId = draft.id;
    } else {
      await saveDraft(params);
    }

    // ── Auto-moderación: frena spam/abuso antes de publicar o encolar ────
    const mod = autoModerate({ title, content, attachments });
    if (mod.blocked) {
      await supabase
        .from("user_publications")
        .update({ rejected_reason: `Auto-rechazo: ${mod.reason}`, updated_at: new Date().toISOString() })
        .eq("id", pubId)
        .eq("user_id", user.id);
      return { error: mod.reason };
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("can_monetize, creator_tier")
      .eq("id", user.id)
      .single();

    // ── Reglas de publicación ───────────────────────────────────────────
    // GRATUITO    → se publica sin revisión (auto-publish).
    // MONETIZABLE → requiere habilitar monetización (can_monetize).
    //   • Creador verified/official → auto-aprobado (omite la cola, menos fricción).
    //   • Usuario normal            → pasa por revisión (cola de moderación).
    if (isPremium && prof?.can_monetize !== true) {
      return null; // bloqueado: ver canMonetize() para mostrar el aviso/CTA en la UI
    }

    const trustedTier = prof?.creator_tier === "official" || prof?.creator_tier === "verified";
    const autoPublish = !isPremium || (isPremium && trustedTier);
    const nextStatus: PublicationStatus = autoPublish ? "PUBLISHED" : "PENDING_REVIEW";
    const patch: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };
    if (autoPublish) patch.published_at = new Date().toISOString();

    // Analítica: publicación premium auto-aprobada (medible)
    if (isPremium && autoPublish) {
      const { track } = await import("@/lib/analytics");
      track("premium_auto_approved", { publicationId: pubId, tier: prof?.creator_tier });
    }

    const { error } = await supabase
      .from("user_publications")
      .update(patch)
      .eq("id", pubId)
      .eq("user_id", user.id)
      .eq("status", "DRAFT");

    if (error) return null;
    return { id: pubId };

    // suppress "declared but never read" warnings on unused destructures
    void gameSlug; void title; void type; void content; void attachments; void isPremium;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3C — Moderación: aprobar publicación (solo ADMIN)
// ─────────────────────────────────────────────────────────────────────────────

export async function approvePublication(publicationId: string): Promise<boolean> {
  try {
    const { supabase, user } = await requireAuth();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") return false;

    const { error } = await supabase
      .from("user_publications")
      .update({ status: "PUBLISHED", updated_at: new Date().toISOString() })
      .eq("id", publicationId)
      .eq("status", "PENDING_REVIEW");

    if (error) return false;

    // Brecha-09: notificar al autor que su guía fue aprobada
    await notifyAuthorOfModeration(supabase, publicationId, "approved");
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3D — Moderación: rechazar publicación (solo ADMIN)
// ─────────────────────────────────────────────────────────────────────────────

export async function rejectPublication(publicationId: string, reason: string): Promise<boolean> {
  try {
    const { supabase, user } = await requireAuth();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") return false;

    const { error } = await supabase
      .from("user_publications")
      .update({
        status: "DRAFT",
        rejected_reason: reason.trim() || "Revisá el contenido y volvé a enviar.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", publicationId)
      .eq("status", "PENDING_REVIEW");

    if (error) return false;

    // Brecha-09: notificar al autor que su guía requiere ajustes
    await notifyAuthorOfModeration(
      supabase,
      publicationId,
      "rejected",
      reason.trim() || "Revisá el contenido y volvé a enviar."
    );
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3E — Votar una publicación (+10 UPVOTE / -2 DOWNVOTE via trigger)
// ─────────────────────────────────────────────────────────────────────────────

export async function votePublication(
  publicationId: string,
  voteType: "UPVOTE" | "DOWNVOTE",
): Promise<{ ok: boolean; newVote?: string }> {
  try {
    const { supabase, user } = await requireAuth();

    // Si ya votó, eliminar voto anterior (toggle)
    const { data: existing } = await supabase
      .from("publication_votes")
      .select("id, vote_type")
      .eq("user_id", user.id)
      .eq("publication_id", publicationId)
      .maybeSingle();

    if (existing) {
      if (existing.vote_type === voteType) {
        // Quitar el voto
        await supabase.from("publication_votes").delete().eq("id", existing.id);
        return { ok: true, newVote: "none" };
      }
      // Cambiar tipo de voto
      await supabase
        .from("publication_votes")
        .update({ vote_type: voteType })
        .eq("id", existing.id);
      return { ok: true, newVote: voteType };
    }

    // Insertar nuevo voto (el trigger handle_vote_reputation actualiza user_reputation)
    const { error } = await supabase.from("publication_votes").insert({
      user_id: user.id,
      publication_id: publicationId,
      vote_type: voteType,
    });

    // Recalcular la reputación del creador (autor) tras el nuevo voto
    if (!error) {
      const { data: pub } = await supabase
        .from("user_publications").select("user_id").eq("id", publicationId).single();
      if (pub?.user_id) {
        const { recomputeReputationForUser } = await import("@/services/rankingService");
        await recomputeReputationForUser(pub.user_id);
      }
    }

    return { ok: !error, newVote: error ? undefined : voteType };
  } catch {
    return { ok: false };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 4A — Subir adjunto a Supabase Storage
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadAttachment(
  gameSlug: string,
  fileName: string,
  buffer: ArrayBuffer,
): Promise<string | null> {
  try {
    const { supabase, user } = await requireAuth();

    const ext  = (fileName.split(".").pop() ?? "bin").toLowerCase();
    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `ugc/${user.id}/${gameSlug}/${Date.now()}-${safe}`;

    const CONTENT_TYPES: Record<string, string> = {
      pdf:  "application/pdf",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ppt:  "application/vnd.ms-powerpoint",
      mp3:  "audio/mpeg",
      m4a:  "audio/mp4",
      wav:  "audio/wav",
      ogg:  "audio/ogg",
      weba: "audio/webm",
    };

    const { error } = await supabase.storage
      .from("attachments")
      .upload(path, buffer, {
        contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
        upsert: false,
      });

    if (error) return null;

    const { data } = supabase.storage.from("attachments").getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 4B — Activar promoción (crea checkout LS → redirige al usuario)
// ─────────────────────────────────────────────────────────────────────────────

export async function createPromotionIntent(publicationId: string): Promise<{
  url: string | null;
  promotionId: string | null;
  error?: string;
}> {
  try {
    const { supabase, user } = await requireAuth();

    // Verificar que la publicación existe y está PUBLISHED
    const { data: pub } = await supabase
      .from("user_publications")
      .select("id, game_slug, title, user_id")
      .eq("id", publicationId)
      .eq("user_id", user.id)
      .eq("status", "PUBLISHED")
      .single();

    if (!pub) return { url: null, promotionId: null, error: "Publicación no encontrada o no publicada." };

    // Verificar que no hay una promoción activa
    const { data: existing } = await supabase
      .from("promoted_content")
      .select("id, expires_at")
      .eq("publication_id", publicationId)
      .eq("payment_status", "PAID")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existing) {
      return { url: null, promotionId: null, error: "Esta publicación ya tiene una promoción activa." };
    }

    // Precio fijo: $9.99 = 999 centavos por 7 días
    const PROMOTION_PRICE_CENTS = 999;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Crear registro de promoción en estado PENDING
    const { data: promo, error: promoErr } = await supabase
      .from("promoted_content")
      .insert({
        publication_id: publicationId,
        user_id: user.id,
        game_slug: pub.game_slug,
        expires_at: expiresAt,
        payment_status: "PENDING",
        price_cents: PROMOTION_PRICE_CENTS,
      })
      .select("id")
      .single();

    if (promoErr || !promo) return { url: null, promotionId: null, error: "Error creando la promoción." };

    // Crear checkout de Lemon Squeezy via API route
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/lemonsqueezy/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ugc_promotion",
        publicationId,
        authorId: user.id,
      }),
    });

    const json = await res.json() as { url?: string; error?: string };
    if (!json.url) return { url: null, promotionId: promo.id, error: json.error ?? "Error al crear checkout." };

    return { url: json.url, promotionId: promo.id };
  } catch {
    return { url: null, promotionId: null, error: "Error interno." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries públicas
// ─────────────────────────────────────────────────────────────────────────────

export async function getPublicationsForGame(gameSlug: string): Promise<UserPublication[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_publications")
      .select("*")
      .eq("game_slug", gameSlug)
      .eq("status", "PUBLISHED")
      .order("published_at", { ascending: false })
      .limit(20);
    return (data ?? []) as UserPublication[];
  } catch {
    return [];
  }
}

export async function getPromotedForGame(gameSlug: string): Promise<PromotedContent[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("promoted_content")
      .select("*")
      .eq("game_slug", gameSlug)
      .eq("payment_status", "PAID")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(3);
    return (data ?? []) as PromotedContent[];
  } catch {
    return [];
  }
}

export async function getUserPublications(): Promise<UserPublication[]> {
  try {
    const { supabase, user } = await requireAuth();
    const { data } = await supabase
      .from("user_publications")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    return (data ?? []) as UserPublication[];
  } catch {
    return [];
  }
}

export async function getUserReputation(): Promise<UserReputation | null> {
  try {
    const { supabase, user } = await requireAuth();
    const { data } = await supabase
      .from("user_reputation")
      .select("*")
      .eq("user_id", user.id)
      .single();
    return data as UserReputation | null;
  } catch {
    return null;
  }
}

export async function getPendingPublications(): Promise<UserPublication[]> {
  try {
    const { supabase, user } = await requireAuth();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") return [];

    const { data } = await supabase
      .from("user_publications")
      .select("*")
      .eq("status", "PENDING_REVIEW")
      .order("updated_at", { ascending: true });

    return (data ?? []) as UserPublication[];
  } catch {
    return [];
  }
}

// Incrementar views_count (best-effort, no auth required)
export async function incrementViews(publicationId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_publication_views", { pub_id: publicationId });
  } catch {
    // non-critical
  }
}
