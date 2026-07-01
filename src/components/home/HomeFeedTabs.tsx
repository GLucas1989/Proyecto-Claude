"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap, Users } from "lucide-react";
import { Game, Creator } from "@/types";
import { HomeGamesFilter } from "@/components/home/HomeGamesFilter";

interface GameWithCreators {
  game: Game;
  creators: Creator[];
}

interface HomeFeedTabsProps {
  items: GameWithCreators[];
  followedGameSlugs: string[];
  followedAuthorIds: string[];
}

type Tab = "following" | "all";

const STORAGE_KEY = "creatorshub:home-tab-v1";

/**
 * Cruza la lista completa de juegos/creadores con los follows reales del
 * usuario (tabla user_follows, leída server-side en page.tsx) para armar la
 * pestaña "Siguiendo". Si el juego entero está seguido se muestran todos sus
 * creadores; si no, solo los creadores individualmente seguidos.
 */
export function HomeFeedTabs({ items, followedGameSlugs, followedAuthorIds }: HomeFeedTabsProps) {
  const followedGames = useMemo(() => new Set(followedGameSlugs), [followedGameSlugs]);
  const followedAuthors = useMemo(() => new Set(followedAuthorIds), [followedAuthorIds]);
  const hasAnyFollow = followedGames.size > 0 || followedAuthors.size > 0;

  const followingItems = useMemo(() => {
    if (!hasAnyFollow) return [];
    return items
      .map(({ game, creators }) => {
        const gameFollowed = followedGames.has(game.slug);
        const relevantCreators = gameFollowed
          ? creators
          : creators.filter((c) => followedAuthors.has(c.id));
        return { game, creators: relevantCreators };
      })
      .filter(({ game, creators }) => followedGames.has(game.slug) || creators.length > 0);
  }, [items, followedGames, followedAuthors, hasAnyFollow]);

  const [tab, setTab] = useState<Tab>(hasAnyFollow ? "following" : "all");
  const [hydrated, setHydrated] = useState(false);

  // Restaurar la última pestaña elegida (si sigue teniendo sentido con los follows actuales).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Tab | null;
      if (stored === "following" || stored === "all") {
        setTab(stored === "following" && !hasAnyFollow ? "all" : stored);
      }
    } catch {
      // localStorage no disponible — se queda con el default calculado arriba.
    }
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, tab);
    } catch {
      // no-op
    }
  }, [tab, hydrated]);

  const activeItems = tab === "following" ? followingItems : items;

  return (
    <div>
      {hasAnyFollow && (
        <div className="mb-6 inline-flex items-center gap-1 p-1 rounded-xl border border-white/8 bg-white/[0.02]">
          <button
            onClick={() => setTab("following")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all ${
              tab === "following"
                ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300"
                : "text-white/40 hover:text-white/70 border border-transparent"
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> Siguiendo
          </button>
          <button
            onClick={() => setTab("all")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all ${
              tab === "all"
                ? "bg-white/10 border border-white/20 text-white/90"
                : "text-white/40 hover:text-white/70 border border-transparent"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Todos
          </button>
        </div>
      )}

      {tab === "following" && followingItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/8 rounded-2xl bg-white/[0.02]">
          <p className="text-white/30 font-mono text-sm">&gt;_ todavía no seguís ningún juego o creador</p>
          <button
            onClick={() => setTab("all")}
            className="mt-4 text-xs text-cyan-500/60 hover:text-cyan-400 transition-colors font-mono underline underline-offset-4"
          >
            Ver todos los juegos
          </button>
        </div>
      ) : (
        <HomeGamesFilter key={tab} items={activeItems} />
      )}
    </div>
  );
}
