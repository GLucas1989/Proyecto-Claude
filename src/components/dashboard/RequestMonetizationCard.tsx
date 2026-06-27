"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles, BadgeCheck, Loader2, Crown, ShieldQuestion } from "lucide-react";
import { getMonetizationStatus, requestMonetization } from "@/app/actions/monetization";

/**
 * Tarjeta de monetización del dashboard del creador.
 * - 'user'     → Solicitar revisión manual (paga) o activar Pro $5/mes
 * - 'official' → Solicitar autorización gratuita o activar modo oficial $20/mes
 * Si ya está habilitado, muestra el estado activo.
 */
export function RequestMonetizationCard() {
  const [status, setStatus] = useState<{ can: boolean; official: boolean; pending: boolean; source: string | null } | null>(null);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = await getMonetizationStatus();
      setStatus({ can: s.canMonetize, official: s.isOfficial, pending: s.pendingRequest, source: s.source });
    })();
  }, []);

  async function startFee(type: "fee_standard" | "fee_official") {
    setMsg(null);
    const res = await fetch("/api/lemonsqueezy/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const json = await res.json() as { url?: string; error?: string };
    if (json.url) window.location.href = json.url;
    else setMsg(json.error ?? "Checkout no disponible todavía.");
  }

  function requestAuth() {
    startTransition(async () => {
      const r = await requestMonetization();
      if (r.ok) setStatus((p) => p && { ...p, pending: true });
      else setMsg(r.error ?? "No se pudo solicitar.");
    });
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/50 backdrop-blur-md p-5 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
      </div>
    );
  }

  // Ya monetiza
  if (status.can) {
    const labelSource =
      status.source === "admin" ? "Autorizado por el equipo" :
      status.source === "fee_official" ? "Modo Oficial · $20/mes" :
      status.source === "fee_standard" ? "Pro · $5/mes" : "Habilitado";
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-5">
        <div className="flex items-center gap-2 mb-1">
          <BadgeCheck className="h-4 w-4 text-emerald-300" />
          <p className="text-sm font-bold text-white">Monetización activa</p>
        </div>
        <p className="text-xs font-mono text-white/40">{labelSource}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-[#0B0F19]/50 backdrop-blur-md p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-300" />
        <p className="text-sm font-bold text-white">Activá la monetización</p>
      </div>
      <p className="text-xs text-white/45 leading-relaxed">
        {status.official
          ? "Como creador oficial podés solicitar autorización gratuita o activar el modo oficial (incluye destacados)."
          : "Publicá contenido monetizable. Cada guía pasa por revisión antes de salir."}
      </p>

      <div className="flex flex-wrap gap-2">
        {status.official ? (
          <>
            <button
              onClick={requestAuth}
              disabled={pending || status.pending}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 text-xs font-mono font-semibold hover:bg-cyan-500/20 hover:shadow-[0_0_18px_rgba(0,240,255,0.2)] transition-all disabled:opacity-50 active:scale-95"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldQuestion className="h-3.5 w-3.5" />}
              {status.pending ? "Solicitud enviada" : "Solicitar autorización (gratis)"}
            </button>
            <button
              onClick={() => startFee("fee_official")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-amber-400/5 text-amber-200 text-xs font-mono font-semibold hover:from-amber-500/25 hover:shadow-[0_0_18px_rgba(251,191,36,0.2)] transition-all active:scale-95"
            >
              <Crown className="h-3.5 w-3.5" /> Modo Oficial · $20/mes
            </button>
          </>
        ) : (
          <button
            onClick={() => startFee("fee_standard")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-violet-400/5 text-violet-200 text-xs font-mono font-semibold hover:from-violet-500/25 hover:shadow-[0_0_18px_rgba(167,139,250,0.25)] transition-all active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" /> Activar Pro · $5/mes
          </button>
        )}
      </div>

      {msg && <p className="text-xs font-mono text-cyan-400/80">{msg}</p>}
    </div>
  );
}
