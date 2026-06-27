import { Shield, Star, BookOpen, TrendingUp } from "lucide-react";
import type { UserReputation } from "@/types/database";

const RANK_CONFIG: Record<string, { color: string; glow: string; tier: number }> = {
  "Novato":        { color: "text-white/40",    glow: "shadow-white/5",      tier: 1 },
  "Aprendiz":      { color: "text-green-400",   glow: "shadow-green-500/20", tier: 2 },
  "Teorizador":    { color: "text-cyan-400",    glow: "shadow-cyan-500/25",  tier: 3 },
  "Analista":      { color: "text-violet-400",  glow: "shadow-violet-500/30",tier: 4 },
  "Estratega Pro": { color: "text-fuchsia-400", glow: "shadow-fuchsia-500/35",tier: 5 },
  "Leyenda":       { color: "text-yellow-400",  glow: "shadow-yellow-500/40",tier: 6 },
};

const RANK_ORDER = ["Novato", "Aprendiz", "Teorizador", "Analista", "Estratega Pro", "Leyenda"];
const RANK_THRESHOLDS = [0, 50, 150, 350, 700, 1200];

function getNextRankInfo(points: number, rankTitle: string): { next: string; needed: number; progress: number } {
  const idx = RANK_ORDER.indexOf(rankTitle);
  if (idx === -1 || idx === RANK_ORDER.length - 1) {
    return { next: "MAX", needed: 0, progress: 100 };
  }
  const currentMin = RANK_THRESHOLDS[idx];
  const nextMin    = RANK_THRESHOLDS[idx + 1];
  const progress   = Math.min(100, Math.round(((points - currentMin) / (nextMin - currentMin)) * 100));
  return { next: RANK_ORDER[idx + 1], needed: nextMin - points, progress };
}

interface ReputationCardProps {
  reputation: UserReputation | null;
}

export function ReputationCard({ reputation }: ReputationCardProps) {
  const rankTitle = reputation?.rank_title ?? "Novato";
  const points    = reputation?.points ?? 0;
  const guides    = reputation?.guides_published ?? 0;
  const cfg       = RANK_CONFIG[rankTitle] ?? RANK_CONFIG["Novato"];
  const { next, needed, progress } = getNextRankInfo(points, rankTitle);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/50 backdrop-blur-md p-5 relative overflow-hidden">
      {/* Scanline decoration */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)" }}
      />

      <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.3em] mb-4">
        {"// ficha de reputación"}
      </p>

      <div className="flex items-start justify-between gap-4 mb-5">
        {/* Rank badge */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-black/40 shadow-lg ${cfg.glow}`}>
            <Shield className={`h-5 w-5 ${cfg.color}`} />
          </div>
          <div>
            <p className={`text-lg font-black font-mono leading-none ${cfg.color}`}>
              {rankTitle}
            </p>
            <p className="text-[10px] font-mono text-white/30 mt-0.5">rango actual</p>
          </div>
        </div>

        {/* Points */}
        <div className="text-right">
          <p className="text-2xl font-black font-mono text-white tabular-nums">{points.toLocaleString("es")}</p>
          <p className="text-[10px] font-mono text-white/30">puntos XP</p>
        </div>
      </div>

      {/* Progress bar toward next rank */}
      {next !== "MAX" && (
        <div className="mb-4">
          <div className="flex justify-between text-[9px] font-mono text-white/25 mb-1.5">
            <span>{rankTitle}</span>
            <span>{next} — faltan {needed} pts</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ease-out ${
                cfg.tier >= 5
                  ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.5)]"
                  : cfg.tier >= 4
                    ? "bg-gradient-to-r from-violet-600 to-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.5)]"
                    : cfg.tier >= 3
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                      : "bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
          <BookOpen className="h-3.5 w-3.5 text-cyan-500/60 shrink-0" />
          <div>
            <p className="text-sm font-black font-mono text-white tabular-nums">{guides}</p>
            <p className="text-[9px] font-mono text-white/25">guías publicadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
          <TrendingUp className="h-3.5 w-3.5 text-violet-500/60 shrink-0" />
          <div>
            <p className={`text-sm font-black font-mono tabular-nums ${cfg.color}`}>
              {RANK_ORDER.indexOf(rankTitle) + 1}/{RANK_ORDER.length}
            </p>
            <p className="text-[9px] font-mono text-white/25">nivel de rango</p>
          </div>
        </div>
      </div>

      {next === "MAX" && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-yellow-400/70">
          <Star className="h-3 w-3" /> Rango máximo alcanzado
        </div>
      )}
    </div>
  );
}
