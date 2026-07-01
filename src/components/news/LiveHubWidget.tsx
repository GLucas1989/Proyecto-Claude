import { Radio } from "lucide-react";
import { NEWS_CATEGORY_CONFIG, type NewsCategory, type NewsItem } from "@/lib/newsTypes";

interface LiveHubWidgetProps {
  news: NewsItem[];
}

/**
 * Widget compacto para la vista de cada juego — últimas 3 noticias.
 * Server component puro (sin filtros, eso vive en NewsSection).
 */
export function LiveHubWidget({ news }: LiveHubWidgetProps) {
  const items = news.slice(0, 3);

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-[#0B0F19]/60 backdrop-blur-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
        </span>
        <Radio className="h-3.5 w-3.5 text-cyan-300" />
        <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-[0.3em]">Live Hub</p>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-white/25 font-mono py-4 text-center">
          Sin eventos activos por el momento
        </p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const cat = NEWS_CATEGORY_CONFIG[item.category as NewsCategory];
            const Item = (
              <div className="rounded-lg border border-cyan-500/15 bg-black/20 px-3 py-2.5 hover:border-cyan-500/35 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                  <span className="text-[9px] font-mono text-white/35 uppercase tracking-wider">{cat.label}</span>
                </div>
                <p className="text-xs font-semibold text-white/80 leading-snug line-clamp-2">{item.title}</p>
              </div>
            );
            return (
              <li key={item.id}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                    {Item}
                  </a>
                ) : (
                  Item
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
