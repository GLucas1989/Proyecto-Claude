"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Game, Creator } from "@/types";
import { GameShowcase } from "@/components/game/GameShowcase";
import { SponsoredCard } from "@/components/home/SponsoredCard";

interface GameWithCreators {
  game: Game;
  creators: Creator[];
}

interface HomeGamesFilterProps {
  items: GameWithCreators[];
}

const LANG_CHIPS = [
  { value: "es", label: "ES", flag: "🇪🇸" },
  { value: "en", label: "EN", flag: "🇺🇸" },
] as const;

const TYPE_CHIPS = [
  { value: "competitive", label: "Competitivo", icon: "⚔️" },
  { value: "casual",      label: "Casual",      icon: "🎮" },
  { value: "educational", label: "Educativo",   icon: "📚" },
  { value: "draft",       label: "Draft",       icon: "🃏" },
  { value: "lore",        label: "Lore",        icon: "📖" },
] as const;

type Lang = (typeof LANG_CHIPS)[number]["value"];
type ContentChip = (typeof TYPE_CHIPS)[number]["value"];

export function HomeGamesFilter({ items }: HomeGamesFilterProps) {
  const [search, setSearch]       = useState("");
  const [langs, setLangs]         = useState<Lang[]>([]);
  const [types, setTypes]         = useState<ContentChip[]>([]);

  const hasFilters = search.trim() !== "" || langs.length > 0 || types.length > 0;

  function toggleLang(v: Lang) {
    setLangs((prev) => prev.includes(v) ? prev.filter((l) => l !== v) : [...prev, v]);
  }
  function toggleType(v: ContentChip) {
    setTypes((prev) => prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v]);
  }
  function clearAll() {
    setSearch(""); setLangs([]); setTypes([]);
  }

  const filtered = useMemo(() => {
    return items.filter(({ game, creators }) => {
      if (search.trim() && !game.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (langs.length > 0 && !langs.some((l) => creators.some((c) => c.languages.includes(l)))) return false;
      if (types.length > 0 && !types.some((t) => creators.some((c) => c.contentType.includes(t as never)))) return false;
      return true;
    });
  }, [items, search, langs, types]);

  return (
    <div className="space-y-6">
      {/* ── Buscador ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar juego..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 font-mono focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors font-mono shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Chips ── */}
      <div className="flex flex-wrap gap-2">
        {/* Idioma */}
        {LANG_CHIPS.map(({ value, label, flag }) => {
          const active = langs.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggleLang(value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                active
                  ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"
              }`}
            >
              <span>{flag}</span>
              {label}
            </button>
          );
        })}

        {/* Separador visual */}
        <div className="w-px h-6 bg-white/10 self-center mx-1" />

        {/* Tipo de contenido */}
        {TYPE_CHIPS.map(({ value, label, icon }) => {
          const active = types.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggleType(value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                active
                  ? "bg-violet-500/20 border-violet-500/60 text-violet-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Resultados ── */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map(({ game, creators }, i) => (
            <>
              <GameShowcase key={game.id} game={game} creators={creators} defaultOpen={i === 0 && !hasFilters} />
              {/* Sponsored slot after 3rd game, only when no filters active */}
              {i === 2 && !hasFilters && <SponsoredCard key="sponsored" />}
            </>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-white/30 font-mono text-sm">&gt;_ sin resultados para esa búsqueda</p>
          <button onClick={clearAll} className="mt-4 text-xs text-cyan-500/60 hover:text-cyan-400 transition-colors font-mono underline underline-offset-4">
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
