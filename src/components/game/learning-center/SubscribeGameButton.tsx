"use client";

import { useRef, useState, useTransition } from "react";
import { Zap, Loader2, CheckCircle, X, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createGameSubscription,
  cancelGameSubscription,
} from "@/app/actions/gameSubscription";
import type { GameSubscriptionPlan, GameSubscription } from "@/app/actions/gameSubscription";

interface Props {
  gameSlug: string;
  gameName: string;
  plan: GameSubscriptionPlan;
  initialSubscription: GameSubscription | null;
}

export function SubscribeGameButton({
  gameSlug,
  gameName,
  plan,
  initialSubscription,
}: Props) {
  const [subscription, setSubscription] = useState(initialSubscription);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState<"subscribe" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  const isActive = subscription?.status === "active";
  const price = (plan.price_cents / 100).toFixed(2);

  async function handleSubscribe() {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      window.location.href = `/auth/login?redirectTo=/${gameSlug}`;
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createGameSubscription(gameSlug);
      if (result.success && result.subscription) {
        setSubscription(result.subscription);
        setShowConfirm(null);
      } else {
        setError(result.error ?? "Error al suscribirse");
        setShowConfirm(null);
      }
    });
  }

  async function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelGameSubscription(gameSlug);
      if (result.success) {
        setSubscription((prev) => prev ? { ...prev, status: "canceled" } : null);
        setShowConfirm(null);
      } else {
        setError(result.error ?? "Error al cancelar");
        setShowConfirm(null);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {isActive ? (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/8 text-cyan-300 text-xs font-mono">
            <CheckCircle className="h-3.5 w-3.5" />
            Suscripto · Pro activo
          </div>
          <button
            onClick={() => setShowConfirm("cancel")}
            disabled={isPending}
            className="text-[10px] text-white/25 hover:text-red-400/70 font-mono transition-colors"
          >
            cancelar suscripción
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm("subscribe")}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-violet-500/10 hover:from-cyan-500/25 hover:to-violet-500/18 text-cyan-200 font-mono text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Acceder al Pro · ${price}/mes
        </button>
      )}

      {error && (
        <p className="text-xs text-red-400 font-mono">{error}</p>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#030712] p-6 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest mb-0.5">
                  {showConfirm === "subscribe" ? "// confirmar suscripción" : "// cancelar suscripción"}
                </p>
                <h3 className="text-base font-black text-white">{gameName} Pro</h3>
              </div>
              <button onClick={() => setShowConfirm(null)} className="p-1 text-white/30 hover:text-white/70">
                <X className="h-4 w-4" />
              </button>
            </div>

            {showConfirm === "subscribe" ? (
              <>
                <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50 font-mono">Plan mensual</span>
                    <span className="text-lg font-black text-cyan-300">${price} <span className="text-xs text-white/30">/ mes</span></span>
                  </div>
                  <p className="text-[10px] text-white/25 font-mono mt-1">
                    Cancelá cuando quieras. Sin permanencia.
                  </p>
                </div>
                <ul className="flex flex-col gap-1.5 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/50">
                      <CheckCircle className="h-3 w-3 text-cyan-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleSubscribe}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 font-mono text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Confirmar suscripción
                </button>
                <p className="text-[10px] text-white/20 text-center font-mono mt-3">
                  <Lock className="h-2.5 w-2.5 inline mr-1" />
                  Pago seguro procesado por Stripe
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-white/50 mb-5">
                  Al cancelar perdés acceso al Centro Pro al final del período actual.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/40 font-mono text-sm hover:border-white/20 transition-all"
                  >
                    Mantener
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isPending}
                    className="flex-1 py-2.5 rounded-xl border border-red-500/30 bg-red-500/8 text-red-400 font-mono text-sm hover:bg-red-500/15 transition-all disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Cancelar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
