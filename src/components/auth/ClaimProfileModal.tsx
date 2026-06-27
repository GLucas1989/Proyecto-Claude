"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, X, Copy, Check, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateVerificationCode, verifyChannelOwnership } from "@/app/actions/verification";

interface ClaimProfileModalProps {
  creatorSlug: string;
  gameSlug: string;
  creatorName: string;
  defaultChannelUrl?: string;
}

type Step = "url" | "code" | "done";

export function ClaimProfileModal({ creatorSlug, gameSlug, creatorName, defaultChannelUrl }: ClaimProfileModalProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [step, setStep] = useState<Step>("url");
  const [channelUrl, setChannelUrl] = useState(defaultChannelUrl ?? "");
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function openClaim() {
    setError(null);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      window.location.href = `/auth/login?redirectTo=/${gameSlug}/${creatorSlug}`;
      return;
    }
    setStep("url");
    setOpenModal(true);
  }

  function genCode() {
    if (!/youtube\.com\/(@|channel\/)/i.test(channelUrl) && !/^@/.test(channelUrl) && !/^UC/.test(channelUrl)) {
      setError("Pegá la URL de tu canal de YouTube (ej: youtube.com/@tucanal).");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await generateVerificationCode({ creatorSlug, gameSlug, channelUrl });
      if (res.code) { setCode(res.code); setStep("code"); }
      else setError(res.error ?? "No se pudo generar el código.");
    });
  }

  function verify() {
    setError(null);
    startTransition(async () => {
      const res = await verifyChannelOwnership({ creatorSlug, channelUrl });
      if (res.ok) {
        setStep("done");
        setTimeout(() => router.push("/dashboard?claimed=1"), 1400);
      } else {
        setError(res.error ?? "No se pudo verificar.");
      }
    });
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <button
        onClick={openClaim}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-cyan-400/5 text-cyan-200 text-xs font-mono font-bold hover:from-cyan-500/25 hover:shadow-[0_0_18px_rgba(0,240,255,0.2)] transition-all active:scale-95"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Reclamar este perfil
      </button>

      {openModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpenModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F19] p-6 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest mb-0.5">
                  {"// verificación de propiedad"}
                </p>
                <h2 className="text-base font-black text-white">{creatorName}</h2>
              </div>
              <button onClick={() => setOpenModal(false)} className="p-1 text-white/30 hover:text-white/70">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Paso 1: URL */}
            {step === "url" && (
              <div className="space-y-4">
                <p className="text-sm text-white/55 leading-relaxed">
                  Para reclamar este perfil tenés que demostrar que sos el dueño del canal de YouTube.
                </p>
                <input
                  type="url"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://youtube.com/@tucanal"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/25 font-mono focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                {error && <p className="text-xs font-mono text-red-400/80 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />{error}</p>}
                <button
                  onClick={genCode}
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 text-cyan-200 font-mono text-sm font-semibold hover:bg-cyan-500/25 transition-all disabled:opacity-50 active:scale-95"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Generar código</>}
                </button>
              </div>
            )}

            {/* Paso 2: código + verificar */}
            {step === "code" && code && (
              <div className="space-y-4">
                <p className="text-sm text-white/55 leading-relaxed">
                  Copiá este código y pegalo en la <strong className="text-white/80">descripción</strong> (sección
                  &quot;Más información&quot;) de tu canal de YouTube:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 rounded-lg bg-black/40 border border-cyan-500/30 text-cyan-300 text-lg font-mono font-bold tracking-wider text-center">
                    {code}
                  </code>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 px-3 py-3 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 transition-colors shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <a
                  href="https://studio.youtube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-white/35 hover:text-white/60"
                >
                  <ExternalLink className="h-3 w-3" /> Abrir YouTube Studio para editar la descripción
                </a>
                <p className="text-[11px] text-white/30 font-mono">
                  {"// guardá los cambios en YouTube, luego tocá Verificar (puede tardar unos minutos)"}
                </p>
                {error && <p className="text-xs font-mono text-red-400/80 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />{error}</p>}
                <button
                  onClick={verify}
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-100 font-mono text-sm font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all disabled:opacity-50 active:scale-95"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /> Verificar ahora</>}
                </button>
              </div>
            )}

            {/* Paso 3: éxito */}
            {step === "done" && (
              <div className="py-6 text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border border-green-500/40 bg-green-500/10">
                  <Check className="h-7 w-7 text-green-400" />
                </div>
                <p className="text-sm font-bold text-white">¡Perfil verificado y reclamado!</p>
                <p className="text-xs font-mono text-white/40">Redirigiendo a tu dashboard…</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
