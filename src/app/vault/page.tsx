import Link from "next/link";
import { Lock, Star, Eye, Sparkles } from "lucide-react";
import { getAllPublishedPublications } from "@/app/actions/ugc";
import { getGame } from "@/lib/data";

export const metadata = {
  title: "The Vault — Creators S-HUB",
  description: "Catálogo global de guías y material premium de todos los juegos.",
};

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  GUIDE: "Guía",
  BUILD: "Build",
  TIER_LIST: "Tier List",
};

/** The Vault: catálogo global de guías/material publicado, cruzando todos los juegos. */
export default async function VaultPage() {
  const publications = await getAllPublishedPublications();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="h-4 w-4 text-cyan-300" />
        <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-[0.3em]">
          {"// the vault"}
        </p>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Catálogo global</h1>
      <p className="text-sm text-white/45 max-w-lg mb-8">
        Guías, builds y tier lists publicados por creadores de todos los juegos. El contenido
        premium (⚡) requiere membresía o compra individual.
      </p>

      {publications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/8 rounded-2xl bg-white/[0.02]">
          <p className="text-white/30 font-mono text-sm">&gt;_ todavía no hay contenido publicado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {publications.map((pub) => {
            const game = getGame(pub.game_slug);
            return (
              <Link
                key={pub.id}
                href={`/ugc/${pub.id}`}
                className="group flex flex-col gap-2 px-5 py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 hover:bg-cyan-500/[0.06] transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest">
                    {typeLabel[pub.type] ?? pub.type}
                  </span>
                  {pub.is_premium && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-pink-300">
                      <Sparkles className="h-3 w-3" /> Premium
                    </span>
                  )}
                  <span className="ml-auto text-[10px] font-mono text-white/25">{game?.name ?? pub.game_slug}</span>
                </div>
                <h2 className="text-sm font-bold text-white/85 group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {pub.title}
                </h2>
                <div className="flex items-center gap-4 mt-1 text-[11px] font-mono text-white/30">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {pub.views_count}</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {pub.average_rating.toFixed(1)} ({pub.ratings_count})</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
