import Link from "next/link";
import { Game } from "@/types";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameCardBanner } from "./GameCardBanner";

const gameThemes: Record<string, { gradient: string; border: string; glow: string }> = {
  "mtg-arena": {
    gradient: "from-amber-950/60 via-orange-950/40 to-red-950/50",
    border: "border-amber-600/30 hover:border-amber-500/60",
    glow: "group-hover:shadow-amber-900/30",
  },
  "wild-rift": {
    gradient: "from-blue-950/60 via-cyan-950/40 to-indigo-950/50",
    border: "border-blue-600/30 hover:border-blue-500/60",
    glow: "group-hover:shadow-blue-900/30",
  },
  "raid-shadow-legends": {
    gradient: "from-violet-950/60 via-purple-950/40 to-fuchsia-950/50",
    border: "border-violet-600/30 hover:border-violet-500/60",
    glow: "group-hover:shadow-violet-900/30",
  },
  "dark-and-darker": {
    gradient: "from-stone-950/80 via-zinc-900/60 to-neutral-950/70",
    border: "border-stone-600/30 hover:border-stone-400/50",
    glow: "group-hover:shadow-stone-900/40",
  },
  "beyond-all-reason": {
    gradient: "from-emerald-950/60 via-teal-950/40 to-cyan-950/50",
    border: "border-emerald-600/30 hover:border-emerald-500/60",
    glow: "group-hover:shadow-emerald-900/30",
  },
  "albion-online": {
    gradient: "from-yellow-950/60 via-amber-950/40 to-orange-950/50",
    border: "border-yellow-600/30 hover:border-yellow-500/60",
    glow: "group-hover:shadow-yellow-900/30",
  },
  "diablo-immortal": {
    gradient: "from-red-950/60 via-rose-950/40 to-purple-950/50",
    border: "border-red-800/30 hover:border-red-700/60",
    glow: "group-hover:shadow-red-900/30",
  },
  "league-of-legends": {
    gradient: "from-sky-950/60 via-blue-950/40 to-indigo-950/50",
    border: "border-sky-600/30 hover:border-sky-500/60",
    glow: "group-hover:shadow-sky-900/30",
  },
  "diablo-iv": {
    gradient: "from-red-950/70 via-orange-950/50 to-zinc-950/60",
    border: "border-red-700/30 hover:border-red-600/60",
    glow: "group-hover:shadow-red-900/30",
  },
};

const accentColors: Record<string, string> = {
  "mtg-arena": "text-amber-400",
  "wild-rift": "text-blue-400",
  "raid-shadow-legends": "text-violet-400",
  "dark-and-darker": "text-stone-300",
  "beyond-all-reason": "text-emerald-400",
  "albion-online": "text-yellow-400",
  "diablo-immortal": "text-red-400",
  "league-of-legends": "text-sky-400",
  "diablo-iv": "text-orange-400",
};

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const theme = gameThemes[game.id] ?? {
    gradient: "from-zinc-800/40 to-zinc-900/40",
    border: "border-white/10",
    glow: "",
  };
  const accentColor = accentColors[game.id] ?? "text-white";
  const emoji = game.emoji ?? "🎮";

  const content = (
    <div
      className={cn(
        "group relative flex flex-col h-full rounded-2xl border transition-all duration-300 bg-gradient-to-br overflow-hidden",
        theme.gradient,
        theme.border,
        game.active
          ? `cursor-pointer hover:scale-[1.02] hover:shadow-xl ${theme.glow}`
          : "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Hover shimmer */}
      {game.active && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Banner */}
      <GameCardBanner
        logoUrl={game.logoUrl}
        name={game.name}
        emoji={emoji}
        active={game.active}
        comingSoon={game.comingSoon}
      />

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        {/* Info */}
        <div className="flex-1">
          <h3 className="text-xl font-black text-white mb-2 tracking-tight">{game.name}</h3>
          <p className="text-sm text-white/50 leading-relaxed">{game.description}</p>
        </div>

        {/* Footer */}
        {game.active ? (
          <div className={cn("mt-5 flex items-center gap-2 text-sm font-semibold transition-colors", accentColor)}>
            <span>Explorar creadores</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2 text-sm text-white/20">
            <Clock className="h-4 w-4" />
            <span>En desarrollo</span>
          </div>
        )}
      </div>
    </div>
  );

  if (game.active) {
    return <Link href={`/${game.slug}`} className="block h-full">{content}</Link>;
  }

  return <div className="h-full">{content}</div>;
}
