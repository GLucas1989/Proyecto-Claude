"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Lock, Zap, CheckCircle, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { startCreatorCheckout } from "@/app/actions/creatorSubscription";

interface Plan {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  features: string[];
}

interface PremiumContentGuardProps {
  creatorSlug: string;
  creatorName: string;
  /** Pre-fetched plans (pass from Server Component to avoid extra client fetch) */
  plans?: Plan[];
  /** Academia/juego asociado: habilita acceso vía suscripción individual o All-Access Pass */
  academyId?: string;
  children: React.ReactNode;
}

export function PremiumContentGuard({
  creatorSlug,
  creatorName,
  plans = [],
  academyId,
  children,
}: PremiumContentGuardProps) {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(plans[0] ?? null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  useEffect(() => {
    async function checkSubscription() {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setIsSubscribed(false); return; }

      // 1. All-Access Pass global o suscripción de academia individual vigente
      const nowIso = new Date().toISOString();
      const { data: passes } = await sb
        .from("user_subscriptions")
        .select("id, is_global_pass, academy_id, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active");

      const hasValidPass = (passes ?? []).some((p) => {
        const notExpired = !p.expires_at || p.expires_at > nowIso;
        if (!notExpired) return false;
        if (p.is_global_pass) return true;               // All-Access Pass
        if (academyId && p.academy_id === academyId) return true; // academia individual
        return false;
      });

      if (hasValidPass) { setIsSubscribed(true); return; }

      // 2. Suscripción directa al creador
      const { data: creatorProfile } = await sb
        .from("creator_profiles")
        .select("id")
        .eq("slug", creatorSlug)
        .maybeSingle();

      if (!creatorProfile) { setIsSubscribed(false); return; }

      const { data: sub } = await sb
        .from("subscriptions")
        .select("id")
        .eq("subscriber_id", user.id)
        .eq("creator_id", creatorProfile.id)
        .eq("status", "active")
        .maybeSingle();

      setIsSubscribed(!!sub);
    }
    checkSubscription();
  }, [creatorSlug, academyId]);

  async function handleSubscribe() {
    if (!selectedPlan) return;
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      window.location.href = `/auth/login?redirectTo=/dashboard`;
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await startCreatorCheckout(creatorSlug, selectedPlan.id);
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error ?? "Error al iniciar el pago");
      }
    });
  }

  // Loading state
  if (isSubscribed === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
      </div>
    );
  }

  // Subscribed: render content
  if (isSubscribed) return <>{children}</>;

  // Not subscribed: show paywall
  return (
    <>
      <div className="relative rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.03] to-violet-500/[0.02] overflow-hidden">
        {/* Blurred content preview */}
        <div className="select-none pointer-events-none blur-sm opacity-30 p-6" aria-hidden>
          {children}
        </div>

        {/* Paywall overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-[#030712]/40 via-[#030712]/70 to-[#030712]/95 px-6 py-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl border border-cyan-500/20 bg-cyan-500/8">
            <Lock className="h-6 w-6 text-cyan-400/70" />
          </div>

          <div className="text-center max-w-sm">
            <h3 className="text-lg font-black text-white mb-1">Contenido exclusivo</h3>
            <p className="text-sm text-white/40">
              Este contenido es exclusivo para suscriptores de{" "}
              <span className="text-white/70">{creatorName}</span>.
            </p>
          </div>

          {plans.length > 0 ? (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-violet-500/10 hover:from-cyan-500/25 hover:to-violet-500/18 text-cyan-200 font-mono text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
            >
              <Zap className="h-4 w-4" />
              Suscribirse a {creatorName}
            </button>
          ) : (
            <p className="text-xs text-white/25 font-mono">
              {"// Suscripciones próximamente"}
            </p>
          )}
        </div>
      </div>

      {/* Subscription modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#030712] p-6 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest mb-0.5">
                  {"// suscripción"}
                </p>
                <h2 className="text-base font-black text-white">{creatorName}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-white/30 hover:text-white/70">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Plan selector */}
            <div className="flex flex-col gap-2 mb-5">
              {plans.map((plan) => {
                const price = (plan.price_cents / 100).toFixed(2);
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                        : "border-white/8 bg-white/[0.02] text-white/50 hover:border-white/15"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${isSelected ? "border-cyan-400 bg-cyan-400" : "border-white/20"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{plan.name}</p>
                      <p className="text-xs text-white/40 font-mono">${price}/mes</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Features of selected plan */}
            {selectedPlan && (
              <ul className="flex flex-col gap-1.5 mb-5">
                {selectedPlan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/45">
                    <CheckCircle className="h-3 w-3 text-cyan-400/60 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {error && (
              <p className="text-xs text-red-400 font-mono mb-3">{error}</p>
            )}

            <button
              onClick={handleSubscribe}
              disabled={isPending || !selectedPlan}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 font-mono text-sm font-semibold transition-all disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Zap className="h-4 w-4" /> Continuar al pago</>
              )}
            </button>

            <p className="text-[10px] text-white/20 text-center font-mono mt-3">
              <Lock className="h-2.5 w-2.5 inline mr-1" />
              Pago seguro procesado por Stripe · Cancelá cuando quieras
            </p>
          </div>
        </div>
      )}
    </>
  );
}
