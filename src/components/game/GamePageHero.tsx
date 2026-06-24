"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Game } from "@/types";
import { ChevronRight, Home, Users, Globe, Layers } from "lucide-react";

interface GamePageHeroProps {
  game: Game;
  creatorsCount: number;
  languagesCount: number;
  contentTypesCount: number;
}

export function GamePageHero({ game, creatorsCount, languagesCount, contentTypesCount }: GamePageHeroProps) {
  const [imgError, setImgError] = useState(false);
  const showBg = !!game.logoUrl && !imgError;

  return (
    <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 mb-8">
      {/* Banner image layer */}
      {showBg && (
        <>
          <div className="absolute inset-0">
            <Image
              src={game.logoUrl!}
              alt={game.name}
              fill
              className="object-cover object-center scale-110 blur-sm"
              sizes="100vw"
              priority
              onError={() => setImgError(true)}
            />
          </div>
          {/* Dark overlay to desaturate and darken */}
          <div className="absolute inset-0 bg-black/55" />
        </>
      )}

      {/* North-to-south gradient: image visible at top → solid #030712 at bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(3,7,18,0.2) 0%, rgba(3,7,18,0.55) 45%, rgba(3,7,18,0.88) 72%, #030712 88%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs font-mono text-white/30 mb-8">
          <Link href="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <Home className="h-3 w-3" />
            inicio
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white/60">{game.slug}</span>
        </nav>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {game.emoji && <span className="text-3xl">{game.emoji}</span>}
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{game.name}</h1>
          </div>
          <p className="text-white/50 text-sm max-w-2xl mb-6 drop-shadow">{game.description}</p>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-cyan-500/25 text-sm">
              <Users className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-white/50">Creadores</span>
              <span className="font-bold text-cyan-400">{creatorsCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-cyan-500/25 text-sm">
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-white/50">Idiomas</span>
              <span className="font-bold text-cyan-400">{languagesCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-cyan-500/25 text-sm">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-white/50">Tipos de contenido</span>
              <span className="font-bold text-cyan-400">{contentTypesCount}</span>
            </div>
          </div>
        </div>

        {/* Extra space so the gradient covers the filters + counter below */}
        <div className="h-28" />
      </div>
    </div>
  );
}
