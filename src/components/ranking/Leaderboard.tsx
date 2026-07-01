import Image from "next/image";
import Link from "next/link";
import { Trophy, BadgeCheck, Crown, Medal } from "lucide-react";
import { getLeaderboard } from "@/services/rankingService";
import { getCreators } from "@/lib/data";

interface LeaderboardProps {
  /** Filtra el ranking por juego (parámetro de búsqueda actual) */
  gameSlug?: string;
  limit?: number;
}

const TIER_COLOR: Record<string, string> = {
  Diamante: "text-cyan-300",
  Platino:  "text-slate-200",
  Oro:      "text-amber-300",
  Plata:    "text-zinc-300",
  Bronce:   "text-orange-400/80",
};

// Estilo del podio (Top 3): bordes brillantes
const PODIUM: Record<number, { ring: string; badge: string; icon: React.ReactNode }> = {
  0: { ring: "border-amber-400/60 shadow-[0_0_22px_rgba(251,191,36,0.35)]", badge: "bg-amber-400/15 text-amber-300 border-amber-400/40", icon: <Crown className="h-4 w-4 text-amber-300" /> },
  1: { ring: "border-slate-300/50 shadow-[0_0_18px_rgba(203,213,225,0.25)]", badge: "bg-slate-300/10 text-slate-200 border-slate-300/30", icon: <Medal className="h-4 w-4 text-slate-200" /> },
  2: { ring: "border-orange-500/50 shadow-[0_0_18px_rgba(249,115,22,0.25)]", badge: "bg-orange-500/10 text-orange-300 border-orange-500/30", icon: <Medal className="h-4 w-4 text-orange-400" /> },
};

/**
 * Leaderboard de creadores (Top N) — dark/gamer.
 * Top 3 con bordes brillantes; resto con estilo elegante. Filtra por juego.
 * Server component: lee reputación de creator_profiles y enriquece con datos del directorio.
 */
export async function Leaderboard({ gameSlug, limit = 10 }: LeaderboardProps) {
  const entries = await getLeaderboard(gameSlug, limit);

  // Enriquecer con nombre/avatar del directorio (JSON) cuando esté disponible
  const creators = gameSlug ? await getCreators(gameSlug).catch(() => []) : [];
  const byId = new Map(creators.map((c) => [c.id, c]));

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-8 text-center">
        <Trophy className="h-8 w-8 text-white/15 mx-auto mb-3" />
        <p className="text-sm text-white/40">Todavía no hay ranking para este juego.</p>
        <p className="text-[11px] font-mono text-white/25 mt-1">{"// los creadores suben al reclamar su perfil y recibir seguidores/votos"}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur-md overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8 bg-cyan-500/[0.04]">
        <Trophy className="h-4 w-4 text-cyan-300" />
        <p className="text-sm font-bold text-white">Ranking de creadores</p>
        <span className="ml-auto text-[10px] font-mono text-white/30 uppercase tracking-widest">Top {entries.length}</span>
      </div>

      <ul className="divide-y divide-white/5">
        {entries.map((e, i) => {
          const c = byId.get(e.slug);
          const podium = PODIUM[i];
          return (
            <li
              key={e.id}
              className={`flex items-center gap-3 px-4 sm:px-5 py-3 transition-colors hover:bg-white/[0.02] ${
                podium ? `border-l-2 ${podium.ring.split(" ")[0]}` : "border-l-2 border-transparent"
              }`}
            >
              {/* Posición */}
              <div className={`flex items-center justify-center w-7 shrink-0 font-mono font-black tabular-nums ${podium ? "text-white" : "text-white/40"}`}>
                {podium ? podium.icon : `#${i + 1}`}
              </div>

              {/* Avatar + nombre */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`relative w-9 h-9 rounded-lg overflow-hidden border shrink-0 ${podium ? podium.ring : "border-white/10"}`}>
                  {c?.avatar ? (
                    <Image src={c.avatar} alt={c.name} width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/30 text-xs font-mono">{e.slug.slice(0, 2).toUpperCase()}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {c ? (
                      <Link href={`/${e.game_slug}/${e.slug}`} className="text-sm font-semibold text-white/85 truncate hover:text-cyan-300 transition-colors">
                        {c.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-white/85 truncate">{e.slug}</span>
                    )}
                    {e.verified && (
                      <span title="Creador verificado" className="inline-flex shrink-0"><BadgeCheck className="h-3.5 w-3.5 text-cyan-400" /></span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${TIER_COLOR[e.rank_tier] ?? "text-white/30"}`}>
                    {e.rank_tier}
                  </span>
                </div>
              </div>

              {/* Puntos */}
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-white tabular-nums">{e.reputation_points.toLocaleString("es-AR")}</p>
                <p className="text-[9px] font-mono text-white/25 uppercase">pts</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
