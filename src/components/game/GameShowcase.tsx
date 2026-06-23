import Link from "next/link";
import Image from "next/image";
import { Creator, Game } from "@/types";
import { ArrowRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface GameShowcaseProps {
  game: Game;
  creators: Creator[];
}

export function GameShowcase({ game, creators }: GameShowcaseProps) {
  const accent = accentColors[game.id] ?? "text-white";
  const emoji = game.emoji ?? "🎮";

  return (
    <section className="scroll-mt-24" id={game.slug}>
      {/* Header del juego */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
          {game.logoUrl ? (
            <Image src={game.logoUrl} alt={game.name} fill className="object-cover" sizes="48px" />
          ) : (
            <span className="text-2xl leading-none">{emoji}</span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-white tracking-tight leading-none">{game.name}</h2>
          <p className="text-xs text-white/40 mt-1">{creators.length} creadores destacados</p>
        </div>
        <Link
          href={`/${game.slug}`}
          className={cn(
            "ml-auto shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:underline underline-offset-4",
            accent
          )}
        >
          Ver juego
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Grid de creadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {creators.map((creator) => (
          <CreatorBlock key={creator.id} creator={creator} gameSlug={game.slug} />
        ))}
      </div>
    </section>
  );
}

function CreatorBlock({ creator, gameSlug }: { creator: Creator; gameSlug: string }) {
  const videos = creator.latestVideos.slice(0, 3);

  return (
    <div className="flex flex-col rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 hover:border-white/20 transition-colors duration-300">
      {/* Cabecera del creador */}
      <Link href={`/${gameSlug}/${creator.id}`} className="group flex items-center gap-3 mb-3">
        <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-white/15 group-hover:border-white/30 transition-colors">
          <Image src={creator.avatar} alt={creator.name} fill className="object-cover" sizes="40px" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-white/90">
              {creator.name}
            </h3>
            {creator.languages.map((lang) => (
              <span key={lang} className="text-[10px] leading-none">{lang === "es" ? "🇪🇸" : "🇺🇸"}</span>
            ))}
          </div>
          <p className="text-[11px] text-white/40 truncate">{creator.bioShort}</p>
        </div>
      </Link>

      {/* 3 últimos videos */}
      <div className="grid grid-cols-3 gap-1.5 mt-auto">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-video rounded-md overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
            title={video.title}
          >
            <Image src={video.thumbnail} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="120px" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-red-600 rounded-full p-1.5">
                <Play className="w-3 h-3 text-white fill-current" />
              </div>
            </div>
          </a>
        ))}
        {videos.length === 0 && (
          <p className="col-span-3 text-[11px] text-white/30 py-4 text-center">Sin videos todavía</p>
        )}
      </div>
    </div>
  );
}
