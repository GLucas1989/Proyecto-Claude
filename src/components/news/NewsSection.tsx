"use client";

import { useMemo, useState } from "react";
import { Newspaper, ExternalLink } from "lucide-react";
import { NEWS_CATEGORY_CONFIG, type NewsCategory, type NewsItem } from "@/lib/newsTypes";

type FilterKey = "all" | "main_events" | "patch_notes";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Ver todos" },
  { key: "main_events", label: "Torneos" },
  { key: "patch_notes", label: "Parches" },
];

interface NewsSectionProps {
  news: NewsItem[];
  /** Texto de estado vacío (por defecto "Sin eventos activos por el momento"). */
  emptyLabel?: string;
}

/**
 * Sección de noticias reutilizable — recibe la lista ya filtrada por
 * game_slug (la resuelve quien la use, vía getGameNews()) y agrega su
 * propio filtro visual por categoría encima.
 */
export function NewsSection({ news, emptyLabel }: NewsSectionProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return news;
    return news.filter((n) => n.category === filter);
  }, [news, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Newspaper className="h-4 w-4 text-cyan-300" />
        <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-[0.3em]">
          {"// noticias"}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold border transition-all ${
              filter === key
                ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-200"
                : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center">
          <p className="text-sm text-white/30 font-mono">
            {emptyLabel ?? "Sin eventos activos por el momento"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const cat = NEWS_CATEGORY_CONFIG[item.category as NewsCategory];
  const content = (
    <div className="h-full rounded-xl border border-cyan-500/15 bg-[#0B0F19]/60 backdrop-blur-sm p-4 hover:border-cyan-500/35 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${cat.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
          {cat.label}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-white/25">
          {new Date(item.published_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
          {item.url && <ExternalLink className="h-3 w-3" />}
        </span>
      </div>
      <p className="text-sm font-bold text-white/85 leading-snug line-clamp-2">{item.title}</p>
      {item.summary && (
        <p className="text-xs text-white/40 mt-1 line-clamp-2">{item.summary}</p>
      )}
    </div>
  );

  if (!item.url) return content;

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="group block">
      {content}
    </a>
  );
}
