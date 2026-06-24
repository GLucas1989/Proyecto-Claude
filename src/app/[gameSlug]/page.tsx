import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getGame, getCreators } from "@/lib/data";
import { CreatorGrid } from "@/components/creator/CreatorGrid";
import { ChevronRight, Home, Users, Globe, Layers } from "lucide-react";
import { GamePageHero } from "@/components/game/GamePageHero";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <GamePageHero
        game={game}
        creatorsCount={creators.length}
        languagesCount={languages.length}
        contentTypesCount={contentTypes.length}
      />
      {/* Negative margin pulls the grid up into the gradient fade zone */}
      <div className="-mt-24 relative z-10 pb-8">
        <CreatorGrid creators={creators} gameSlug={gameSlug} availableFilters={game.filters} />
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const { getGameStaticParams } = await import("@/lib/data");
  return getGameStaticParams();
}
