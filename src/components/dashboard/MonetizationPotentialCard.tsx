"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Users, Coins, Compass, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";

// Constantes de simulación (Revenue-Driven Development).
// Estimación conservadora basada en promedios de la plataforma.
const AVG_SUBSCRIBERS = 120;        // suscriptores promedio que un creador convierte
const SUB_PRICE_USD = 5;            // precio de membresía mensual
const CREATOR_SPLIT = 0.6;          // 60% para el creador

/**
 * Bloque persuasivo de "Potencial de Monetización" para el empty state.
 * Muestra cuánto podría ganar el usuario si activara y promocionara una membresía.
 */
export function MonetizationPotentialCard() {
  const monthly = Math.round(AVG_SUBSCRIBERS * SUB_PRICE_USD * CREATOR_SPLIT);
  const yearly = monthly * 12;

  useEffect(() => {
    track("monetization_potential_viewed", { monthly, yearly });
  }, [monthly, yearly]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#0B0F19]/60 backdrop-blur-md p-6 sm:p-8">
      {/* Glow de fondo */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/[0.08] via-transparent to-pink-500/[0.06]" />
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-[0.3em]">
            {"// potencial de monetización"}
          </p>
        </div>

        <h3 className="text-lg sm:text-xl font-black text-white mb-1">
          Podrías estar ganando{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-400">
            ${monthly.toLocaleString("es-AR")}/mes
          </span>
        </h3>
        <p className="text-xs sm:text-sm text-white/45 leading-relaxed mb-5 max-w-md">
          Activá tu membresía y promocionala en tus canales. Con un promedio de{" "}
          <span className="text-white/70">{AVG_SUBSCRIBERS} suscriptores</span> a ${SUB_PRICE_USD}/mes
          (split 60/40 a tu favor), tu potencial anual supera los{" "}
          <span className="text-cyan-300 font-bold">${yearly.toLocaleString("es-AR")}</span>.
        </p>

        {/* Mini-stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { icon: Users, label: "Suscriptores", value: `${AVG_SUBSCRIBERS}+` },
            { icon: Coins, label: "Por mes", value: `$${monthly}` },
            { icon: TrendingUp, label: "Por año", value: `$${(yearly / 1000).toFixed(1)}k` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-center">
              <Icon className="h-3.5 w-3.5 text-cyan-400/60 mx-auto mb-1" />
              <p className="text-sm font-black text-white tabular-nums">{value}</p>
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA protagonista con pulse */}
        <Link
          href="/academies"
          onClick={() => track("explore_academies_clicked", { source: "monetization_potential" })}
          className="shine-btn animate-pulse inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-500/25 to-cyan-400/15 text-cyan-100 font-mono text-sm font-bold shadow-[0_0_18px_rgba(0,240,255,0.3)] hover:scale-[1.02] active:scale-95 transition-transform"
        >
          <Compass className="h-4 w-4" />
          Explorar academias y empezar a ganar
        </Link>
        <p className="text-[10px] font-mono text-white/25 mt-2">
          {"// estimación basada en promedios de la plataforma"}
        </p>
      </div>
    </div>
  );
}
