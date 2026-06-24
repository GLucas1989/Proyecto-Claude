import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getGame, getCreators } from "@/lib/data";
import { CreatorGrid } from "@/components/creator/CreatorGrid";
import { ChevronRight, Home, Users, Globe, Layers } from "lucide-react";

interface GamePageProps {
  params: Promise<{ gameSlug: string }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { gameSlug } = await params;
  const game = getGame(gameSlug);
  if (!game) return {};

  const creators = await getCreators(gameSlug);
  const title = `${game.name} — Mejores Creadores | Creators S-HUB`;
  const description = `Descubrí los ${creators.length} mejores YouTubers y streamers de ${game.name}. Filtrá por idioma y tipo de contenido. ${game.description}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(game.logoUrl ? { images: [{ url: game.logoUrl, width: 460, height: 215 }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameSlug } = await params;
  const game = getGame(gameSlug);

  if (!game || !game.active) notFound();

  const creators = await getCreators(gameSlug);
  const languages = [...new Set(creators.flatMap((c) => c.languages))];
  const contentTypes = [...new Set(creators.flatMap((c) => c.contentType))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-xs font-mono text-white/25 mb-8">
        <Link href="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
          <Home className="h-3 w-3" />
          inicio
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white/50">{game.slug}</span>
      </nav>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          {game.emoji && <span className="text-3xl">{game.emoji}</span>}
          <h1 className="text-4xl font-black text-white tracking-tight">{game.name}</h1>
        </div>
        <p className="text-white/40 text-sm max-w-2xl mb-6">{game.description}</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/8 border border-cyan-500/20 text-sm">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-white/40">Creadores</span>
            <span className="font-bold text-cyan-400">{creators.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/8 border border-cyan-500/20 text-sm">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-white/40">Idiomas</span>
            <span className="font-bold text-cyan-400">{languages.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/8 border border-cyan-500/20 text-sm">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-white/40">Tipos de contenido</span>
            <span className="font-bold text-cyan-400">{contentTypes.length}</span>
          </div>
        </div>
      </div>

      <CreatorGrid creators={creators} gameSlug={gameSlug} availableFilters={game.filters} />
    </div>
  );
}

export async function generateStaticParams() {
  const { getGameStaticParams } = await import("@/lib/data");
  return getGameStaticParams();
}
