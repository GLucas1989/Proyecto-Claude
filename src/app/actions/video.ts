"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMuxClient, isMuxConfigured } from "@/lib/mux/client";
import { validateHashtags } from "@/lib/validation/hashtags";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/dashboard");
  return { supabase, user };
}

/** Normaliza formato ("#tag", sin duplicados) — NO agrega nada por su cuenta. */
function cleanTags(rawTags: string[]): string[] {
  const cleaned = rawTags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));
  return Array.from(new Set(cleaned));
}

export interface CreateVideoUploadResult {
  ok: boolean;
  uploadUrl?: string;
  assetId?: string;
  error?: string;
}

/**
 * Crea la fila en content_assets (status "processing") + un Direct Upload de
 * Mux ("signed upload URL" del lado del navegador — el cliente hace un PUT
 * directo a esa URL, sin pasar el archivo por nuestro servidor).
 */
export async function createVideoUploadUrl(params: {
  title: string;
  description?: string;
  gameSlug?: string;
  tags: string[];
  isExclusive: boolean;
}): Promise<CreateVideoUploadResult> {
  if (!isMuxConfigured()) {
    return { ok: false, error: "El hosting de video no está configurado todavía (faltan MUX_TOKEN_ID/SECRET)." };
  }
  if (!params.title.trim()) {
    return { ok: false, error: "El título es obligatorio." };
  }

  const tags = cleanTags(params.tags);
  const hashtagCheck = validateHashtags(tags);
  if (!hashtagCheck.ok) {
    return { ok: false, error: hashtagCheck.error };
  }

  try {
    const { supabase, user } = await requireAuth();

    const mux = getMuxClient();
    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXT_PUBLIC_SITE_URL ?? "*",
      new_asset_settings: {
        playback_policies: [params.isExclusive ? "signed" : "public"],
      },
    });

    const { data: row, error } = await supabase
      .from("content_assets")
      .insert({
        user_id: user.id,
        game_slug: params.gameSlug ?? null,
        title: params.title.trim(),
        description: params.description?.trim() || null,
        mux_upload_id: upload.id,
        is_exclusive: params.isExclusive,
        tags,
        status: "processing",
      })
      .select("id")
      .single();

    if (error || !row) {
      return { ok: false, error: "No se pudo registrar el video." };
    }

    return { ok: true, uploadUrl: upload.url ?? undefined, assetId: row.id };
  } catch {
    return { ok: false, error: "Error al iniciar la carga con el proveedor de video." };
  }
}

/** Estado actual de un content_asset (para polling desde el form tras el upload). */
export async function getVideoAssetStatus(assetId: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("content_assets")
      .select("status, playback_id, thumbnail_url, duration_seconds")
      .eq("id", assetId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}
