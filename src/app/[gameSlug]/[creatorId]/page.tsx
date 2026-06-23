import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getGame, getCreator, getCreators } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/creator/VideoCard";
import { ArrowLeft, Play, Tv, AtSign, ChevronRight, Home, Video } from "lucide-react";
import { TwitchLiveBadge } from "@/components/creator/TwitchLiveBadge";
import { StarRating } from "@/components/creator/StarRating";

interface CreatorPageProps {
  params: Promise<{ gameSlug: string; creatorId: string }>;
}

const contentTypeLabel: Record<string, string> = {
  competitive: "Competitivo",
  casual: "Casual",
  draft: "Draft",
  lore: "Lore",
  educational: "Educativo",
};

const contentTypeVariant: Record<string, "competitive" | "casual" | "draft" | "lore"> = {
  competitive: "competitive",
  casual: "casual",
  draft: "draft",
  lore: "lore",
  educational: "casual",
};

const formatLabel: Record<string, string> = {
  standard: "Standard",
  explorer: "Explorer",
  alchemy: "Alchemy",
  historic: "Historic",
  brawl: "Brawl",
};

const languageLabel: Record<string, string> = {
  es: "🇪🇸 Español",
  en: "🇺🇸 English",
};

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { gameSlug, creatorId } = await params;
  const game = getGame(gameSlug);

  if (!game || !game.active) {
    notFound();
  }

  const creator = await getCreator(gameSlug, creatorId);

  if (!creator) {
    notFound();
  }

  const twitchRaw = creator.socials.twitch;
  const twitchUsername = twitchRaw
    ? twitchRaw.startsWith("http")
      ? twitchRaw.split("/").pop()!
      : twitchRaw
    : undefined;
  const twitchUrl = twitchRaw
    ? twitchRaw.startsWith("http")
      ? twitchRaw
      : `https://twitch.tv/${twitchRaw}`
    : undefined;
  const twitterRaw = creator.socials.twitter;
  const twitterUrl = twitterRaw
    ? twitterRaw.startsWith("http")
      ? twitterRaw
      : `https://twitter.com/${twitterRaw}`
    : undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-white/30 mb-8 flex-wrap">
        <Link href="/" className="hover:text-white/60 transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          Inicio
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link href={`/${gameSlug}`} className="hover:text-white/60 transition-colors">
          {game.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-white/60 truncate">{creator.name}</span>
      </nav>

      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] overflow-hidden mb-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-white/15">
                <Image src={creator.avatar} alt={creator.name} width={112} height={112} className="object-cover w-full h-full" priority />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 flex-wrap mb-3">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{creator.name}</h1>
                {twitchUsername && <TwitchLiveBadge username={twitchUsername} />}
                <div className="flex gap-1.5 mt-1">
                  {creator.languages.map((lang) => (
                    <Badge key={lang} variant="lang" className="text-xs">{languageLabel[lang]}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {creator.contentType.map((type) => (
                  <Badge key={type} variant={contentTypeVariant[type]}>{contentTypeLabel[type]}</Badge>
                ))}
                {creator.formats?.map((format) => (
                  <Badge key={format} variant="format">{formatLabel[format]}</Badge>
                ))}
              </div>
              <p className="text-white/60 leading-relaxed text-sm sm:text-base mb-6 max-w-2xl">{creator.bioLong}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {creator.socials.youtube && (
                  <Button asChild size="sm" className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-600/30 hover:border-red-500/50 gap-2 transition-all" variant="ghost">
                    <a href={creator.socials.youtube} target="_blank" rel="noopener noreferrer"><Play className="h-3.5 w-3.5" />YouTube</a>
                  </Button>
                )}
                {twitchUrl && (
                  <Button asChild size="sm" className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-600/30 hover:border-purple-500/50 gap-2 transition-all" variant="ghost">
                    <a href={twitchUrl} target="_blank" rel="noopener noreferrer"><Tv className="h-3.5 w-3.5" />Twitch</a>
                  </Button>
                )}
                {twitterUrl && (
                  <Button asChild size="sm" className="bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-600/30 hover:border-sky-500/50 gap-2 transition-all" variant="ghost">
                    <a href={twitterUrl} target="_blank" rel="noopener noreferrer"><AtSign className="h-3.5 w-3.5" />Twitter</a>
                  </Button>
                )}
              </div>
              <StarRating creatorId={creator.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
          <div className="text-2xl font-black text-white mb-0.5">{creator.latestVideos.length}</div>
          <div className="text-xs text-white/40">Videos recientes</div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
          <div className="text-2xl font-black text-white mb-0.5">{creator.formats?.length ?? 0}</div>
          <div className="text-xs text-white/40">Formatos</div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
          <div className="text-2xl font-black text-white mb-0.5">{creator.contentType.length}</div>
          <div className="text-xs text-white/40">Tipos de contenido</div>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20">
            <Video className="h-4 w-4 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Últimos Videos</h2>
          <span className="text-sm text-white/30">{creator.latestVideos.length} publicados</span>
        </div>
        {creator.latestVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creator.latestVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-white/30 border border-white/8 rounded-2xl bg-white/[0.02]">
            <Play className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin videos disponibles aún</p>
          </div>
        )}
      </section>

      <div className="mt-12 pt-8 border-t border-white/5">
        <Button asChild variant="ghost" size="sm" className="text-white/30 hover:text-white/70 -ml-2 gap-1">
          <Link href={`/${gameSlug}`}><ArrowLeft className="h-4 w-4" />Volver a {game.name}</Link>
        </Button>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const { getCreatorStaticParams } = await import("@/lib/data");
  return getCreatorStaticParams();
}
