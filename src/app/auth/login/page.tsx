"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, Mail, ArrowRight, Loader2 } from "lucide-react";

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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const supabase = createClient();
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

  async function handleOAuth(provider: "google" | "twitch") {
    setLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl },
    });
    if (error) setError(error.message);
    setLoading(null);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    } else {
      setSent(true);
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Cyber grid bg */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#22d3ee04_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee04_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,#22d3ee10,transparent)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-cyan-500/30 bg-cyan-500/10 mb-4">
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            CREATORS <span className="text-cyan-400">S-HUB</span>
          </h1>
          <p className="text-xs text-white/40 font-mono mt-1 uppercase tracking-widest">
            &gt;_ acceso al sistema
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-6 flex flex-col gap-3">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-sm text-cyan-400 font-mono">{"// Magic link enviado"}</p>
              <p className="text-xs text-white/40 mt-2">Revisá tu email: <span className="text-white/70">{email}</span></p>
            </div>
          ) : emailMode ? (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-black/20 text-sm text-white placeholder:text-white/25 font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              />
              <button
                type="submit"
                disabled={loading === "email"}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-sm font-mono transition-all disabled:opacity-50"
              >
                {loading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Enviar magic link</>}
              </button>
              <button type="button" onClick={() => setEmailMode(false)} className="text-xs text-white/30 hover:text-white/50 transition-colors">
                ← Volver
              </button>
            </form>
          ) : (
            <>
              {/* YouTube via Google OAuth */}
              <button
                onClick={() => handleOAuth("google")}
                disabled={!!loading}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:border-red-500/40 hover:bg-red-500/8 text-white/60 hover:text-white/90 text-sm font-mono transition-all disabled:opacity-50"
              >
                {loading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconYouTube className="h-4 w-4 text-red-400" />}
                <span>Continuar con YouTube</span>
                <ArrowRight className="h-3 w-3 ml-auto opacity-40" />
              </button>

              {/* Twitch */}
              <button
                onClick={() => handleOAuth("twitch")}
                disabled={!!loading}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:border-violet-500/40 hover:bg-violet-500/8 text-white/60 hover:text-white/90 text-sm font-mono transition-all disabled:opacity-50"
              >
                {loading === "twitch" ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconTwitch className="h-4 w-4 text-violet-400" />}
                <span>Continuar con Twitch</span>
                <ArrowRight className="h-3 w-3 ml-auto opacity-40" />
              </button>

              <div className="flex items-center gap-2 my-1">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest">o</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              {/* Magic link */}
              <button
                onClick={() => setEmailMode(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/20 text-white/40 hover:text-white/70 text-sm font-mono transition-all"
              >
                <Mail className="h-4 w-4" />
                <span>Magic link por email</span>
                <ArrowRight className="h-3 w-3 ml-auto opacity-40" />
              </button>
            </>
          )}

          {error && (
            <p className="text-xs text-red-400 font-mono text-center mt-1">{error}</p>
          )}
        </div>

        <p className="text-[10px] text-white/20 text-center mt-4 font-mono">
          Al ingresar aceptás los términos de uso de Creators S-HUB
        </p>
      </div>
    </div>
  );
}
