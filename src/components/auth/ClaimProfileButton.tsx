"use client";

import { useRef, useState } from "react";
import { ShieldCheck, Loader2, X, CheckCircle, AlertCircle } from "lucide-react";

function IconYouTube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z" />
    </svg>
  );
}

function IconTwitch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  );
}
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "./AuthProvider";

interface ClaimProfileButtonProps {
  creatorSlug: string;
  gameSlug: string;
  creatorName: string;
  channelId?: string;
}

type Step = "idle" | "dialog" | "method" | "verification" | "submitted" | "already_claimed";

export function ClaimProfileButton({
  creatorSlug,
  gameSlug,
  creatorName,
  channelId,
}: ClaimProfileButtonProps) {
  const { user, profile } = useAuth();
  const supabaseRef = useRef<SupabaseClient | null>(null);
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }
  const [step, setStep] = useState<Step>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);

  // Generar código de verificación determinístico
  function generateCode(): string {
    return `CREATORS-HUB-${creatorSlug.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  async function handleOpen() {
    if (!user) {
      window.location.href = `/auth/login?redirectTo=/${gameSlug}/${creatorSlug}`;
      return;
    }
    setLoading(true);
    setError(null);

    // Verificar si ya está reclamado
    const { data: existing } = await getSupabase()
      .from("creator_profiles")
      .select("user_id, verified")
      .eq("slug", creatorSlug)
      .maybeSingle();

    if (existing?.user_id) {
      setStep("already_claimed");
      setLoading(false);
      return;
    }

    // Verificar si hay solicitud pendiente de este usuario
    const { data: pending } = await getSupabase()
      .from("claim_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("creator_slug", creatorSlug)
      .eq("status", "pending")
      .maybeSingle();

    if (pending) {
      setStep("already_claimed");
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("dialog");
  }

  async function handleOAuthClaim(provider: "google" | "twitch") {
    setLoading(true);
    const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=/${gameSlug}/${creatorSlug}?claim=true`;
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleManualClaim() {
    const code = generateCode();
    setVerificationCode(code);
    setStep("verification");
  }

  async function submitManualClaim() {
    if (!user || !verificationCode) return;
    setLoading(true);
    setError(null);

    const { error } = await getSupabase().from("claim_requests").insert({
      user_id: user.id,
      creator_slug: creatorSlug,
      game_slug: gameSlug,
      status: "pending",
      verification_code: verificationCode,
      oauth_token: null,
      admin_notes: null,
      resolved_at: null,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setStep("submitted");
    }
  }

  // Si el usuario ya es dueño de este perfil, no mostrar el botón
  if (profile?.role === "CREATOR") return null;

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400/70 hover:text-cyan-300 text-xs font-mono transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
        Reclamar perfil
      </button>

      {/* Modal overlay */}
      {step !== "idle" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setStep("idle"); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#030712] shadow-[0_0_40px_rgba(34,211,238,0.08)] p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest mb-0.5">
                  {"// reclamar perfil"}
                </p>
                <h2 className="text-base font-black text-white">{creatorName}</h2>
              </div>
              <button
                onClick={() => setStep("idle")}
                className="p-1 text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ALREADY CLAIMED */}
            {step === "already_claimed" && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <AlertCircle className="h-8 w-8 text-amber-400" />
                <p className="text-sm text-white/70">
                  Este perfil ya fue reclamado o tenés una solicitud pendiente.
                </p>
                <p className="text-xs text-white/30 font-mono">
                  Si creés que hay un error, contactanos en hola@creatorsshub.com
                </p>
              </div>
            )}

            {/* METHOD SELECTION */}
            {step === "dialog" && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-white/50 mb-2">
                  Verificá que sos el dueño de este canal para tomar control del perfil.
                </p>

                <button
                  onClick={() => handleOAuthClaim("google")}
                  disabled={loading}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 hover:border-red-500/40 hover:bg-red-500/8 text-white/60 hover:text-white/90 text-sm font-mono transition-all"
                >
                  <IconYouTube className="h-4 w-4 text-red-400" />
                  <div className="text-left">
                    <p className="text-sm">Verificar con YouTube</p>
                    <p className="text-[10px] text-white/30">Automático — vinculás tu cuenta Google</p>
                  </div>
                </button>

                <button
                  onClick={() => handleOAuthClaim("twitch")}
                  disabled={loading}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/8 text-white/60 hover:text-white/90 text-sm font-mono transition-all"
                >
                  <IconTwitch className="h-4 w-4 text-violet-400" />
                  <div className="text-left">
                    <p className="text-sm">Verificar con Twitch</p>
                    <p className="text-[10px] text-white/30">Automático — vinculás tu cuenta Twitch</p>
                  </div>
                </button>

                <div className="flex items-center gap-2 my-1">
                  <div className="h-px flex-1 bg-white/8" />
                  <span className="text-[10px] text-white/20 font-mono uppercase">o</span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>

                <button
                  onClick={handleManualClaim}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 hover:border-white/20 text-white/40 hover:text-white/70 text-sm font-mono transition-all"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <div className="text-left">
                    <p className="text-sm">Verificación manual</p>
                    <p className="text-[10px] text-white/30">Agregás un código a la descripción de tu canal</p>
                  </div>
                </button>
              </div>
            )}

            {/* MANUAL VERIFICATION */}
            {step === "verification" && verificationCode && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-white/50">
                  {"Agregá este código en la descripción de tu canal de YouTube o Twitch y luego hacé clic en \"Ya lo agregué\"."}
                </p>
                <div className="px-4 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                  <p className="text-xs text-white/30 font-mono mb-1">{"// código de verificación"}</p>
                  <code className="text-sm text-cyan-300 font-mono break-all">{verificationCode}</code>
                </div>
                <p className="text-[10px] text-white/30 font-mono">
                  Canales con más de 1.000 suscriptores se verifican en menos de 24 hs.
                </p>
                <button
                  onClick={submitManualClaim}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-sm font-mono transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya lo agregué → enviar solicitud"}
                </button>
              </div>
            )}

            {/* SUBMITTED */}
            {step === "submitted" && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="h-8 w-8 text-cyan-400" />
                <p className="text-sm text-white/70">
                  Solicitud enviada. Revisaremos tu canal en las próximas 24-48 hs.
                </p>
                <p className="text-xs text-white/30 font-mono">
                  Te notificaremos por email cuando esté aprobado.
                </p>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 font-mono text-center mt-3">{error}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
