"use server";

import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

const CODE_TTL_MS = 60 * 60 * 1000;      // 1 hora
const MAX_ATTEMPTS = 5;                    // intentos de verificación por código/hora

/** Genera un código tipo SHUB-XXXXXX (6 chars base32 sin ambigüedades). */
function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0/I/1
  const raw = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[raw[i] % alphabet.length];
  return `SHUB-${out}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 1 — Generar / reutilizar el código de verificación
// ─────────────────────────────────────────────────────────────────────────────
export async function generateVerificationCode(params: {
  creatorSlug: string;
  gameSlug?: string;
  channelUrl?: string;
}): Promise<{ code?: string; expiresAt?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Iniciá sesión para reclamar un perfil." };

    const now = Date.now();
    const expiresAt = new Date(now + CODE_TTL_MS).toISOString();

    // Reutilizar un código vigente si existe (evita regenerar en cada apertura)
    const { data: existing } = await supabase
      .from("profile_verifications")
      .select("verification_code, expires_at, status")
      .eq("profile_id", user.id)
      .eq("creator_slug", params.creatorSlug)
      .maybeSingle();

    if (existing && existing.status === "pending" && new Date(existing.expires_at).getTime() > now) {
      return { code: existing.verification_code, expiresAt: existing.expires_at };
    }

    const code = makeCode();
    const { error } = await supabase
      .from("profile_verifications")
      .upsert(
        {
          profile_id: user.id,
          creator_slug: params.creatorSlug,
          game_slug: params.gameSlug ?? null,
          channel_url: params.channelUrl ?? null,
          verification_code: code,
          status: "pending",
          attempts: 0,
          expires_at: expiresAt,
          verified_at: null,
        },
        { onConflict: "profile_id,creator_slug" }
      );

    if (error) return { error: "No se pudo generar el código. Intentá de nuevo." };
    return { code, expiresAt };
  } catch {
    return { error: "Error interno al generar el código." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lectura de la descripción del canal (API de YouTube → fallback a scraping)
// ─────────────────────────────────────────────────────────────────────────────
function parseChannelRef(url: string): { handle?: string; channelId?: string } {
  const u = url.trim();
  const handle = u.match(/youtube\.com\/@([A-Za-z0-9._-]+)/i)?.[1] ?? (u.startsWith("@") ? u.slice(1) : undefined);
  const channelId = u.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]+)/i)?.[1]
    ?? (/^UC[A-Za-z0-9_-]{20,}$/.test(u) ? u : undefined);
  return { handle, channelId };
}

async function fetchChannelText(url: string): Promise<{ text: string | null; error?: string }> {
  const { handle, channelId } = parseChannelRef(url);
  const apiKey = process.env.YOUTUBE_API_KEY;

  // 1) API de YouTube (más robusta que el DOM)
  if (apiKey) {
    try {
      let cid = channelId;
      if (!cid && handle) {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`);
        const j = await r.json() as { items?: { id: string }[] };
        cid = j.items?.[0]?.id;
      }
      if (cid) {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${cid}&key=${apiKey}`);
        const j = await r.json() as { items?: { snippet?: { description?: string; title?: string }; brandingSettings?: { channel?: { description?: string } } }[] };
        const it = j.items?.[0];
        if (it) {
          return { text: `${it.snippet?.title ?? ""}\n${it.snippet?.description ?? ""}\n${it.brandingSettings?.channel?.description ?? ""}` };
        }
      }
    } catch {
      // cae a scraping
    }
  }

  // 2) Scraping resiliente: buscamos el código en el HTML crudo (incl. ytInitialData).
  //    No dependemos de selectores del DOM → resistente a cambios de layout.
  try {
    const target = channelId
      ? `https://www.youtube.com/channel/${channelId}/about`
      : handle
        ? `https://www.youtube.com/@${handle}/about`
        : url;
    const res = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CreatorsSHUB-Verify/1.0)",
        "Accept-Language": "es,en;q=0.8",
      },
    });
    if (!res.ok) return { text: null, error: `No se pudo leer el canal (HTTP ${res.status}). Verificá que sea público.` };
    const html = await res.text();
    return { text: html };
  } catch {
    return { text: null, error: "Error de red al leer el canal de YouTube." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 2 — Verificar la propiedad del canal
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyChannelOwnership(params: {
  creatorSlug: string;
  channelUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Iniciá sesión." };

    const { data: verif } = await supabase
      .from("profile_verifications")
      .select("id, verification_code, status, attempts, expires_at")
      .eq("profile_id", user.id)
      .eq("creator_slug", params.creatorSlug)
      .maybeSingle();

    if (!verif) return { ok: false, error: "Generá primero un código de verificación." };
    if (new Date(verif.expires_at).getTime() < Date.now()) {
      await supabase.from("profile_verifications").update({ status: "expired" }).eq("id", verif.id);
      return { ok: false, error: "El código expiró. Generá uno nuevo." };
    }
    // Rate-limiting: máximo de intentos por código/hora
    if (verif.attempts >= MAX_ATTEMPTS) {
      return { ok: false, error: "Demasiados intentos. Esperá una hora e intentá de nuevo." };
    }

    // Registrar el intento (anti fuerza bruta)
    await supabase
      .from("profile_verifications")
      .update({ attempts: verif.attempts + 1, channel_url: params.channelUrl })
      .eq("id", verif.id);

    // Leer el canal y buscar el código
    const { text, error } = await fetchChannelText(params.channelUrl);
    if (error) return { ok: false, error };
    if (!text) return { ok: false, error: "No se pudo leer la información del canal." };

    if (!text.includes(verif.verification_code)) {
      return {
        ok: false,
        error: "No encontramos el código en tu canal. Asegurate de pegarlo en la descripción y que el canal sea público.",
      };
    }

    // ── Éxito: reclamar el perfil con guardas anti race-condition ──
    // Solo reclamamos si el creator_profile no está ya tomado por otro usuario.
    const { data: cp } = await supabase
      .from("creator_profiles")
      .select("id, user_id, verified")
      .eq("slug", params.creatorSlug)
      .maybeSingle();

    if (cp && cp.user_id && cp.user_id !== user.id) {
      return { ok: false, error: "Este perfil ya fue reclamado por otra cuenta." };
    }

    if (cp) {
      await supabase
        .from("creator_profiles")
        .update({
          user_id: user.id,
          verified: true,
          verified_at: new Date().toISOString(),
          verified_method: "channel_challenge",
        })
        .eq("slug", params.creatorSlug)
        .is("user_id", null);  // condición de carrera: solo si seguía libre

      // Re-leer para confirmar que la reclamación quedó a nuestro nombre
      const { data: after } = await supabase
        .from("creator_profiles")
        .select("user_id")
        .eq("slug", params.creatorSlug)
        .single();
      if (after?.user_id && after.user_id !== user.id) {
        return { ok: false, error: "Este perfil ya fue reclamado por otra cuenta." };
      }
    }

    // Marcar perfil como reclamado + creador oficial
    await supabase
      .from("profiles")
      .update({ is_claimed: true, is_official_creator: true, creator_tier: "official" })
      .eq("id", user.id);

    await supabase
      .from("profile_verifications")
      .update({ status: "verified", verified_at: new Date().toISOString() })
      .eq("id", verif.id);

    return { ok: true };
  } catch {
    return { ok: false, error: "Error interno durante la verificación." };
  }
}
