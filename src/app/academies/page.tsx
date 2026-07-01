import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";
import { getActiveGames } from "@/lib/data";

export const metadata = {
  title: "Academias — Creators S-HUB",
  description: "Academias por juego: guías, clases y contenido premium de tus creadores favoritos.",
};

/**
 * Índice de academias (una por juego activo). Cada academia vive dentro de
 * la página del juego (`/[gameSlug]`, componente LearningCenter).
 */
export default function AcademiesPage() {
  const games = getActiveGames();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <div className="flex items-center gap-2 mb-2">
        <Compass className="h-4 w-4 text-cyan-300" />
        <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-[0.3em]">
          {"// academias"}
        </p>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Elegí tu academia</h1>
      <p className="text-sm text-white/45 max-w-lg mb-8">
        Cada juego tiene su propia academia: guías, clases y contenido premium armado
        por creadores verificados. Suscribite a la que te interese.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/${game.slug}`}
            className="group flex items-center justify-between gap-3 px-5 py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 hover:bg-cyan-500/[0.06] transition-all"
          >
            <span className="text-sm font-bold text-white/80 group-hover:text-cyan-300 transition-colors">
              {game.name}
            </span>
            <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}
