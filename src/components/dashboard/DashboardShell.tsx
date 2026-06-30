"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap, Wrench, Wallet, Coins, Receipt, PlusCircle,
  ShieldCheck, Clock, Zap, TrendingUp, Eye, Download, Compass, ShieldAlert,
} from "lucide-react";
import { ReputationCard } from "@/components/dashboard/ReputationCard";
import { MyPublicationsList } from "@/components/dashboard/MyPublicationsList";
import { EmptyStatePlaceholder } from "@/components/dashboard/EmptyStatePlaceholder";
import { StatCard } from "@/components/dashboard/StatCard";
import { OBSOverlayCard } from "@/components/dashboard/OBSOverlayCard";
import { RequestMonetizationCard } from "@/components/dashboard/RequestMonetizationCard";
import type { UserPublication, UserReputation, WalletTransaction } from "@/types/database";

type Mode = "student" | "creator";

interface SubscriptionView {
  id: string;
  academy_id: string | null;
  is_global_pass: boolean;
  status: string;
  expires_at: string | null;
}

interface DashboardShellProps {
  displayName: string;
  email: string;
  role: string;
  userId: string;
  publications: UserPublication[];
  reputation: UserReputation | null;
  creatorRating: number;
  creatorRatingCount: number;
  walletBalance: number;
  withdrawnBalance: number;
  transactions: WalletTransaction[];
  creditBalance: number;
  subscriptions: SubscriptionView[];
  claimedProfile: { slug: string; game_slug: string; verified: boolean } | null;
  pendingClaim: { creator_slug: string; game_slug: string } | null;
}

export function DashboardShell(props: DashboardShellProps) {
  const isCreator = props.role === "CREATOR" || props.claimedProfile !== null || props.publications.length > 0;
  const [mode, setMode] = useState<Mode>(isCreator ? "creator" : "student");

  const isAdmin = props.role === "ADMIN";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Acceso admin — solo visible para ADMIN */}
      {isAdmin && (
        <Link
          href="/dashboard/admin/moderation"
          className="flex items-center gap-3 rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-transparent px-5 py-4 hover:from-pink-500/20 hover:shadow-[0_0_24px_rgba(244,63,94,0.18)] transition-all group"
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-xl border border-pink-500/40 bg-pink-500/10">
            <ShieldAlert className="h-5 w-5 text-pink-300" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Panel de moderación</p>
            <p className="text-[11px] font-mono text-white/40">
              {"// revisá y aprobá/rechazá el contenido pendiente de los creadores"}
            </p>
          </div>
          <span className="text-xs font-mono text-pink-300 group-hover:translate-x-0.5 transition-transform">Abrir →</span>
        </Link>
      )}

      {/* Header + toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.3em] mb-1">
            {"// panel de control"}
          </p>
          <h1 className="text-2xl font-black text-white">
            Hola, <span className="text-cyan-400">{props.displayName}</span>
          </h1>
        </div>

        {/* Toggle Alumno / Creador */}
        <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1 self-start sm:self-auto">
          <button
            onClick={() => setMode("student")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
              mode === "student"
                ? "bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" /> Modo Alumno
          </button>
          <button
            onClick={() => setMode("creator")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
              mode === "creator"
                ? "bg-pink-500/15 text-pink-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" /> Modo Creador
          </button>
        </div>
      </div>

      {mode === "student" ? (
        <StudentView
          email={props.email}
          creditBalance={props.creditBalance}
          subscriptions={props.subscriptions}
        />
      ) : (
        <CreatorView {...props} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODO ALUMNO
// ─────────────────────────────────────────────────────────────────────────────
function StudentView({
  email, creditBalance, subscriptions,
}: { email: string; creditBalance: number; subscriptions: SubscriptionView[] }) {
  const activeSubs = subscriptions.filter((s) => s.status === "active");
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Balance de S-Credits */}
        <StatCard
          icon={Coins}
          label="S-Credits"
          value={creditBalance.toLocaleString("es-AR")}
          hint={`≈ $${(creditBalance * 0.01).toFixed(2)} USD en valor de propina`}
          accent="cyan"
        />

        {/* Cuenta */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F19]/50 backdrop-blur-md p-5 flex flex-col justify-center">
          <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-2">{"// cuenta"}</p>
          <p className="text-xs text-white/55 font-mono truncate">{email}</p>
        </div>
      </div>

      {/* Suscripciones activas */}
      <section>
        <h2 className="text-base font-bold text-white mb-3 sm:mb-4">Suscripciones activas</h2>
        {activeSubs.length === 0 ? (
          <EmptyStatePlaceholder
            icon={Compass}
            title="Todavía no tenés suscripciones"
            description="Desbloqueá academias premium de tus creadores favoritos y aprendé de los mejores. Tu próximo nivel arranca acá."
            ctaLabel="Explorar academias"
            ctaHref="/"
            ctaIcon={Compass}
            accent="cyan"
          />
        ) : (
          <ul className="space-y-2">
            {activeSubs.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02]">
                {s.is_global_pass ? (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-pink-300">
                    <Zap className="h-3.5 w-3.5" /> All-Access Pass
                  </span>
                ) : (
                  <span className="text-xs font-mono text-cyan-300">{s.academy_id}</span>
                )}
                <span className="ml-auto text-[10px] text-white/30 font-mono">
                  {s.expires_at ? `Vence ${new Date(s.expires_at).toLocaleDateString("es-AR")}` : "Sin vencimiento"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODO CREADOR
// ─────────────────────────────────────────────────────────────────────────────
function CreatorView(props: DashboardShellProps) {
  const totalViews = props.publications.reduce((a, p) => a + (p.views_count ?? 0), 0);
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top: reputación + perfil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ReputationCard reputation={props.reputation} averageRating={props.creatorRating} ratingsCount={props.creatorRatingCount} />

        {props.claimedProfile ? (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <p className="text-sm font-semibold text-white">Perfil reclamado</p>
            </div>
            <p className="text-xs text-white/50 font-mono">
              /{props.claimedProfile.game_slug}/{props.claimedProfile.slug}
            </p>
            <p className="text-[10px] text-cyan-400/60 mt-1 font-mono">
              {props.claimedProfile.verified ? "✓ Verificado" : "⏳ Pendiente"}
            </p>
          </div>
        ) : props.pendingClaim ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-semibold text-white">Solicitud en revisión</p>
            </div>
            <p className="text-xs text-white/50 font-mono">
              {props.pendingClaim.game_slug}/{props.pendingClaim.creator_slug}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2"><Zap className="h-4 w-4 text-white/30" /><p className="text-sm font-semibold text-white/50">Sin perfil</p></div>
              <p className="text-xs text-white/30">Reclamá tu perfil desde el directorio.</p>
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-white/30" /><span className="text-xs font-mono text-white/40">Vistas totales</span><span className="ml-auto text-sm font-bold text-white">{totalViews.toLocaleString("es-AR")}</span></div>
          <div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-white/30" /><span className="text-xs font-mono text-white/40">Publicaciones</span><span className="ml-auto text-sm font-bold text-white">{props.publications.length}</span></div>
          <Link href="/ugc/new" className="shine-btn mt-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-xs font-mono font-bold text-cyan-200 hover:from-cyan-500/30 hover:to-cyan-400/20 hover:shadow-[0_0_24px_rgba(0,240,255,0.25)] transition-all active:scale-95">
            <PlusCircle className="h-3.5 w-3.5" /> Nueva publicación
          </Link>
        </div>
      </div>

      {/* Panel financiero */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={Wallet}
          label="Saldo disponible"
          value={`$${props.walletBalance.toFixed(2)}`}
          hint={`Retirado histórico: $${props.withdrawnBalance.toFixed(2)}`}
          accent="pink"
        />

        {/* Historial de transacciones */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0B0F19]/50 backdrop-blur-md p-5">
          <div className="flex items-center gap-2 mb-3"><Receipt className="h-4 w-4 text-white/40" /><p className="text-sm font-semibold text-white">Historial de transacciones</p></div>
          {props.transactions.length === 0 ? (
            <p className="text-xs text-white/30 font-mono py-4">{"// sin movimientos todavía"}</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {props.transactions.slice(0, 8).map((tx) => (
                <li key={tx.id} className="flex items-center gap-3 py-2.5">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${txColor(tx.type)}`}>{txLabel(tx.type)}</span>
                  <span className="text-xs text-white/40 truncate flex-1">{tx.description ?? "—"}</span>
                  <span className={`text-sm font-bold shrink-0 ${tx.amount >= 0 ? "text-cyan-300" : "text-white/40"}`}>
                    {tx.amount >= 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Monetización */}
      <RequestMonetizationCard />

      {/* Widget de alertas para OBS */}
      <OBSOverlayCard userId={props.userId} />

      {/* Publicaciones con contadores */}
      <section>
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Download className="h-4 w-4 text-white/30" /> Mis publicaciones</h2>
          {props.publications.length > 0 && <span className="text-xs font-mono text-white/25">{props.publications.length} total</span>}
        </div>
        <MyPublicationsList publications={props.publications} />
      </section>
    </div>
  );
}

function txLabel(type: string): string {
  switch (type) {
    case "EARNING": return "GANANCIA";
    case "WITHDRAWAL": return "RETIRO";
    case "REFUND": return "REEMBOLSO";
    case "STREAM_TIP": return "PROPINA";
    default: return type;
  }
}
function txColor(type: string): string {
  switch (type) {
    case "EARNING": return "bg-cyan-500/10 text-cyan-300";
    case "STREAM_TIP": return "bg-pink-500/10 text-pink-300";
    case "WITHDRAWAL": return "bg-white/5 text-white/40";
    case "REFUND": return "bg-amber-500/10 text-amber-300";
    default: return "bg-white/5 text-white/40";
  }
}
