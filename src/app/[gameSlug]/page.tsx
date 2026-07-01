import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { getGame, getCreators } from "@/lib/data";
import { CreatorGrid } from "@/components/creator/CreatorGrid";
import { ChevronRight, Home, Users, Globe, Layers } from "lucide-react";
import { GamePageHero } from "@/components/game/GamePageHero";
import { getGameGridGradient } from "@/lib/gameTheme";
import { LearningCenter } from "@/components/game/learning-center/LearningCenter";
import { GamePublicationsFeed } from "@/components/ugc/GamePublicationsFeed";
import { Leaderboard } from "@/components/ranking/Leaderboard";
import { getPublicationsForGame, getPromotedForGame } from "@/app/actions/ugc";
import type { UserPublication, PromotedContent } from "@/types/database";

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

  const [creators, publications, promoted] = await Promise.all([
    getCreators(gameSlug),
    getPublicationsForGame(gameSlug),
    getPromotedForGame(gameSlug),
  ]);

  const languages    = [...new Set(creators.flatMap((c) => c.languages))];
  const contentTypes = [...new Set(creators.flatMap((c) => c.contentType))];
  const gridGradient = getGameGridGradient(game.id);

  // Build promoted IDs set for fast lookup
  const promotedIds = new Set(promoted.map((p: PromotedContent) => p.publication_id));

  // Build feed items (author data would come from a join in production;
  // here we use placeholder until profiles join is available)
  const feedItems = publications.map((pub: UserPublication) => ({
    publication: pub,
    authorName: "Comunidad",
    authorRank: "",
    upvotes: 0,
    downvotes: 0,
    isPromoted: promotedIds.has(pub.id),
  }));

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GamePageHero
          game={game}
          creatorsCount={creators.length}
          languagesCount={languages.length}
          contentTypesCount={contentTypes.length}
        />
      </div>

      <div style={{ background: gridGradient }} className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-16">
          <CreatorGrid creators={creators} gameSlug={gameSlug} availableFilters={game.filters} />

          {/* Ranking de creadores del juego */}
          <div className="mt-10">
            <Suspense fallback={null}>
              <Leaderboard gameSlug={gameSlug} />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <LearningCenter gameSlug={gameSlug} gameName={game.name} />
          </Suspense>
          <GamePublicationsFeed
            gameSlug={gameSlug}
            gameName={game.name}
            initialItems={feedItems}
          />
        </div>
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const { getGameStaticParams } = await import("@/lib/data");
  return getGameStaticParams();
}
