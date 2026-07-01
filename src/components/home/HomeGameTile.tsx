import Link from "next/link";
import Image from "next/image";
import { Game } from "@/types";
import { ArrowRight } from "lucide-react";

interface HomeGameTileProps {
  game: Game;
  creatorsCount: number;
}

/**
 * Tarjeta compacta de juego para el grid agrupado por categoría de la Home
 * (reemplaza el acordeón GameShowcase que se auto-expandía). Es un Link
 * directo a la página del juego — los creadores destacados se ven ahí.
 */
export function HomeGameTile({ game, creatorsCount }: HomeGameTileProps) {
  return (
    <Link
      href={`/${game.slug}`}
      className="group flex flex-col p-4 rounded-2xl border border-white/8 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-cyan-500/[0.03] transition-all"
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="relative shrink-0 w-9 h-9 rounded-lg bg-cyan-500/8 border border-cyan-500/15 flex items-center justify-center overflow-hidden">
          {game.logoUrl ? (
            <Image src={game.logoUrl} alt={game.name} fill className="object-contain p-1" sizes="36px" />
          ) : (
            <span className="text-base leading-none">{game.emoji ?? "🎮"}</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{game.name}</h3>
          <p className="text-[10px] font-mono text-white/35">{creatorsCount} creadores</p>
        </div>
      </div>
      <p className="text-xs text-white/50 leading-relaxed mb-3 min-h-[2.5rem] line-clamp-2">
        {game.description}
      </p>
      <div className="mt-auto flex items-center gap-1 text-xs font-mono text-cyan-400/80 group-hover:text-cyan-300 transition-colors">
        Ver creadores <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
