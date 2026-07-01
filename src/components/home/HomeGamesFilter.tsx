"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Game, Creator } from "@/types";
import { HomeGameTile } from "@/components/home/HomeGameTile";
import { NativeAdSlot } from "@/components/ads/NativeAdSlot";
import { GAME_CATEGORIES } from "@/lib/gameCategories";
import { Reveal } from "@/components/motion/Reveal";

interface GameWithCreators {
  game: Game;
  creators: Creator[];
}

interface HomeGamesFilterProps {
  items: GameWithCreators[];
}

/** Cuántos juegos se muestran por categoría antes de "+N juegos más". */
const GAMES_PER_CATEGORY_VISIBLE = 3;

// Persiste la búsqueda entre navegaciones (el componente se remonta al
// volver a la Home) — se hidrata después del primer render para no romper el SSR.
const STORAGE_KEY = "creatorshub:home-filter-v2";

function loadStoredSearch(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Explorá por juego — grid agrupado por categoría (reemplaza el patrón de
 * acordeones GameShowcase que saturaba la Home). Cada tarjeta linkea
 * directo a la página del juego; los creadores destacados viven ahí.
 */
export function HomeGamesFilter({ items }: HomeGamesFilterProps) {
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSearch(loadStoredSearch());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, search);
    } catch {
      // localStorage no disponible — no bloquea el filtro en memoria.
    }
  }, [search, hydrated]);

  const searchActive = search.trim() !== "";
  const term = search.trim().toLowerCase();

  function toggleCategory(catId: string) {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  // Modo búsqueda: grid plano de resultados, sin agrupar por categoría.
  const flatResults = useMemo(() => {
    if (!searchActive) return [];
    return items.filter(({ game }) => game.name.toLowerCase().includes(term));
  }, [items, searchActive, term]);

  // Modo default: agrupado por categoría, N visibles + "mostrar más".
  // Incluye un bucket "Otros" de seguridad para juegos sin categoría
  // reconocida (no deben desaparecer en silencio del grid).
  const groups = useMemo(() => {
    if (searchActive) return [];
    const known = new Set(GAME_CATEGORIES.map((c) => c.id));
    const allCats = [...GAME_CATEGORIES, ...(items.some(({ game }) => !known.has(game.category ?? "")) ? [{ id: "otros", label: "Otros" }] : [])];

    return allCats.map((cat) => {
      const gamesInCat = items.filter(({ game }) =>
        cat.id === "otros" ? !known.has(game.category ?? "") : game.category === cat.id
      );
      const expanded = !!expandedCats[cat.id];
      const visible = expanded ? gamesInCat : gamesInCat.slice(0, GAMES_PER_CATEGORY_VISIBLE);
      const hiddenCount = gamesInCat.length - GAMES_PER_CATEGORY_VISIBLE;
      return {
        ...cat,
        games: gamesInCat,
        visible,
        hasMore: gamesInCat.length > GAMES_PER_CATEGORY_VISIBLE,
        expanded,
        hiddenCount,
      };
    }).filter((g) => g.games.length > 0);
  }, [items, searchActive, expandedCats]);

  return (
    <div className="space-y-6">
      {/* ── Buscador ── */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar juego..."
            className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 font-mono focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
          {searchActive && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Modo búsqueda: grid plano ── */}
      {searchActive ? (
        flatResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {flatResults.map(({ game, creators }) => (
              <HomeGameTile key={game.id} game={game} creatorsCount={creators.length} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-white/30 font-mono text-sm">&gt;_ sin resultados para esa búsqueda</p>
          </div>
        )
      ) : (
        /* ── Modo default: agrupado por categoría ── */
        <div className="space-y-8">
          {groups.map((group, i) => (
            <Reveal key={group.id} delay={Math.min(i, 6) * 60}>
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">{group.label}</p>
                  <p className="text-[10px] font-mono text-white/20">
                    {group.games.length} {group.games.length === 1 ? "juego" : "juegos"}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.visible.map(({ game, creators }) => (
                    <HomeGameTile key={game.id} game={game} creatorsCount={creators.length} />
                  ))}
                </div>
                {group.hasMore && (
                  <button
                    onClick={() => toggleCategory(group.id)}
                    className="mt-3 w-full py-2.5 rounded-lg border border-dashed border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 text-xs font-mono transition-colors"
                  >
                    {group.expanded ? "Mostrar menos ⌃" : `+${group.hiddenCount} juego${group.hiddenCount === 1 ? "" : "s"} más ⌄`}
                  </button>
                )}
              </div>
            </Reveal>
          ))}

          {/* Franja publicitaria — una sola vez, después del grid completo */}
          <NativeAdSlot
            brand="Creators S-HUB"
            message="Espacio publicitario nativo — Alcanzá a miles de gamers hispanohablantes"
            tagline="Contenido integrado con la estética de la plataforma"
            link="mailto:hola@creatorsshub.com?subject=Publicidad nativa en Creators S-HUB"
            ctaLabel="Contactar"
            variant="between-games"
          />
        </div>
      )}
    </div>
  );
}
