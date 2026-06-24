'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Creator, Game } from "@/types";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
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

const gameGradients: Record<string, string> = {
  "mtg-arena": "from-amber-900/40 via-amber-950/60",
  "wild-rift": "from-blue-900/40 via-blue-950/60",
  "raid-shadow-legends": "from-violet-900/40 via-violet-950/60",
  "dark-and-darker": "from-stone-800/40 via-stone-900/60",
  "beyond-all-reason": "from-emerald-900/40 via-emerald-950/60",
  "albion-online": "from-yellow-900/40 via-yellow-950/60",
  "diablo-immortal": "from-red-950/50 via-red-950/70",
  "league-of-legends": "from-sky-900/40 via-sky-950/60",
  "diablo-iv": "from-orange-950/50 via-orange-950/70",
};

interface GameShowcaseProps {
  game: Game;
  creators: Creator[];
  defaultOpen?: boolean;
}

export function GameShowcase({ game, creators, defaultOpen = false }: GameShowcaseProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [logoError, setLogoError] = useState(false);
  const accent = accentColors[game.id] ?? "text-white";
  const gradient = gameGradients[game.id] ?? "from-white/10 via-white/5";
  const emoji = game.emoji ?? "🎮";

  return (
    <section
      id={game.slug}
      className="scroll-mt-24 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.02] overflow-hidden transition-colors hover:border-cyan-500/25"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left hover:bg-cyan-500/[0.03] transition-colors"
      >
        {/* ── MOBILE: fila compacta ── */}
        <div className="flex sm:hidden items-center gap-3 px-4 py-3">
          <div className="relative h-9 w-9 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
            {game.logoUrl && !logoError ? (
              <Image
                src={game.logoUrl}
                alt={game.name}
                fill
                className="object-contain p-0.5"
                sizes="36px"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-lg leading-none">{emoji}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-white tracking-tight leading-none truncate">{game.name}</h2>
            <p className="text-[10px] text-white/40 mt-0.5">{creators.length} creadores</p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-white/40 transition-transform duration-300",
              open && "rotate-180",
              accent
            )}
          />
        </div>

        {/* ── TABLET+: banner ancho + fila de título ── */}
        <div className="hidden sm:block">
          <div className="flex justify-center pt-4 px-4">
            {game.logoUrl && !logoError ? (
              <div className="relative w-4/5 aspect-[460/215]">
                <Image
                  src={game.logoUrl}
                  alt={game.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 80vw, 640px"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-4/5 aspect-[460/215]">
                <span className="text-5xl leading-none">{emoji}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 px-5 py-3">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">{game.name}</h2>
              <p className="text-xs text-white/40 mt-1">{creators.length} creadores destacados</p>
            </div>
            <ChevronDown
              className={cn(
                "ml-auto h-5 w-5 shrink-0 text-white/40 transition-transform duration-300",
                open && "rotate-180",
                accent
              )}
            />
          </div>
        </div>
      </button>

      {open && (
        <div className={cn("relative border-t border-white/10 bg-gradient-to-b to-background", gradient)}>
          {game.logoUrl && !logoError && (
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center scale-110 blur-sm opacity-20 pointer-events-none"
              style={{ backgroundImage: `url(${game.logoUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background/90 pointer-events-none" />

          <div className="relative z-10 p-4 sm:p-5">

            {/* ── MOBILE: carrusel horizontal con snap ── */}
            <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {creators.map((creator) => (
                <div key={creator.id} className="snap-start shrink-0 w-[272px]">
                  <CreatorBlock creator={creator} gameSlug={game.slug} />
                </div>
              ))}
            </div>

            {/* ── TABLET+: grid estático ── */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.map((creator) => (
                <CreatorBlock key={creator.id} creator={creator} gameSlug={game.slug} />
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <Link
                href={`/${game.slug}`}
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:underline underline-offset-4",
                  accent
                )}
              >
                Ver juego completo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CreatorBlock({ creator, gameSlug }: { creator: Creator; gameSlug: string }) {
  const videos = creator.latestVideos.slice(0, 3);

  return (
    <div className="flex flex-col rounded-xl border border-cyan-500/10 bg-background/70 backdrop-blur-sm p-4 hover:border-cyan-500/30 transition-colors duration-300 h-full">
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

      {videos.length === 0 ? (
        <p className="text-[11px] text-white/30 py-4 text-center mt-auto">Sin videos todavía</p>
      ) : (
        <>
          {/* Mobile: scroll horizontal con peek del siguiente */}
          <div className="sm:hidden flex gap-2 overflow-x-auto snap-x snap-mandatory mt-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {videos.map((video) => (
              <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" title={video.title}
                className="group relative block shrink-0 w-[130px] aspect-video rounded-md overflow-hidden border border-white/10 hover:border-white/30 transition-colors snap-start">
                <Image src={video.thumbnail} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="130px" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-red-600 rounded-full p-1.5"><Play className="w-3 h-3 text-white fill-current" /></div>
                </div>
              </a>
            ))}
          </div>
          {/* sm+: grid fijo de 3 columnas */}
          <div className="hidden sm:grid grid-cols-3 gap-1.5 mt-auto">
            {videos.map((video) => (
              <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" title={video.title}
                className="group relative block aspect-video rounded-md overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                <Image src={video.thumbnail} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="90px" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-red-600 rounded-full p-1.5"><Play className="w-3 h-3 text-white fill-current" /></div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
