import { notFound } from "next/navigation";
import Link from "next/link";
import { getGame, getCreators } from "@/lib/data";
import { CreatorGrid } from "@/components/creator/CreatorGrid";
import { ChevronRight, Home } from "lucide-react";

interface GamePageProps {
  params: Promise<{ gameSlug: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameSlug } = await params;
  const game = getGame(gameSlug);

  if (!game || !game.active) {
    notFound();
  }

  const creators = await getCreators(gameSlug);
  const languages = [...new Set(creators.flatMap((c) => c.languages))];
  const contentTypes = [...new Set(creators.flatMap((c) => c.contentType))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-white/30 mb-8">
        <Link href="/" className="hover:text-white/70 transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          Inicio
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white/60">{game.name}</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">{game.name}</h1>
        <p className="text-white/40 text-sm max-w-2xl mb-6">{game.description}</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
            <span className="text-white/40">Creadores</span>
            <span className="font-bold text-white">{creators.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
            <span className="text-white/40">Idiomas</span>
            <span className="font-bold text-white">{languages.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
            <span className="text-white/40">Tipos de contenido</span>
            <span className="font-bold text-white">{contentTypes.length}</span>
          </div>
        </div>
      </div>

      <CreatorGrid creators={creators} gameSlug={gameSlug} />
    </div>
  );
}

export async function generateStaticParams() {
  const { getGameStaticParams } = await import("@/lib/data");
  return getGameStaticParams();
}
