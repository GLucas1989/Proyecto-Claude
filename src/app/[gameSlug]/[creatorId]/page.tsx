import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { getGame, getCreator, getCreators } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/creator/VideoCard";
import { ArrowLeft, Play, Tv, AtSign, ChevronRight, Home, Video, Zap } from "lucide-react";
import { TwitchLiveBadge } from "@/components/creator/TwitchLiveBadge";
import { StarRating } from "@/components/creator/StarRating";
import { ClaimProfileModal } from "@/components/auth/ClaimProfileModal";
import { FollowButton } from "@/components/follow/FollowButton";

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

export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const { gameSlug, creatorId } = await params;
  const game = getGame(gameSlug);
  if (!game) return {};
  const creator = await getCreator(gameSlug, creatorId);
  if (!creator) return {};

  const title = `${creator.name} — ${game.name} | Creators S-HUB`;
  const description = `${creator.bioShort} Mirá los últimos videos de ${creator.name} en ${game.name} y seguí su contenido en YouTube${creator.socials.twitch ? " y Twitch" : ""}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: [{ url: creator.avatar, width: 150, height: 150 }],
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { gameSlug, creatorId } = await params;
  const game = getGame(gameSlug);

  if (!game || !game.active) notFound();

  const creator = await getCreator(gameSlug, creatorId);
  if (!creator) notFound();

  const twitchRaw = creator.socials.twitch;
  const twitchUsername = twitchRaw
    ? twitchRaw.startsWith("http") ? twitchRaw.split("/").pop()! : twitchRaw
    : undefined;
  const twitchUrl = twitchRaw
    ? twitchRaw.startsWith("http") ? twitchRaw : `https://twitch.tv/${twitchRaw}`
    : undefined;
  const twitterRaw = creator.socials.twitter;
  const twitterUrl = twitterRaw
    ? twitterRaw.startsWith("http") ? twitterRaw : `https://twitter.com/${twitterRaw}`
    : undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-xs font-mono text-white/25 mb-8 flex-wrap">
        <Link href="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
          <Home className="h-3 w-3" />
          inicio
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href={`/${gameSlug}`} className="hover:text-cyan-400 transition-colors">{game.slug}</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-white/50 truncate">{creator.id}</span>
      </nav>

      {/* Creator header */}
      <div className="relative rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 overflow-hidden mb-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-cyan-500/20">
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
                  <Button asChild size="sm" className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-600/30 gap-2" variant="ghost">
                    <a href={creator.socials.youtube} target="_blank" rel="noopener noreferrer"><Play className="h-3.5 w-3.5" />YouTube</a>
                  </Button>
                )}
                {twitchUrl && (
                  <Button asChild size="sm" className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-600/30 gap-2" variant="ghost">
                    <a href={twitchUrl} target="_blank" rel="noopener noreferrer"><Tv className="h-3.5 w-3.5" />Twitch</a>
                  </Button>
                )}
                {twitterUrl && (
                  <Button asChild size="sm" className="bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-600/30 gap-2" variant="ghost">
                    <a href={twitterUrl} target="_blank" rel="noopener noreferrer"><AtSign className="h-3.5 w-3.5" />Twitter</a>
                  </Button>
                )}
                <FollowButton targetId={creator.id} type="author" label="Seguir creador" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <StarRating creatorId={creator.id} />
                <ClaimProfileModal
                  creatorSlug={creator.id}
                  gameSlug={gameSlug}
                  creatorName={creator.name}
                  defaultChannelUrl={creator.channelUrl}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { label: "Videos recientes", value: creator.latestVideos.length },
          { label: "Formatos", value: creator.formats?.length ?? 0 },
          { label: "Tipos contenido", value: creator.contentType.length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4 text-center">
            <div className="text-2xl font-black text-cyan-400 mb-0.5">{value}</div>
            <div className="text-xs text-white/40">{label}</div>
          </div>
        ))}
      </div>

      {/* Videos */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20">
            <Video className="h-4 w-4 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Últimos Videos</h2>
          <span className="text-sm text-white/30">{creator.latestVideos.length} publicados</span>
        </div>
        {creator.latestVideos.length > 0 ? (
          <>
            {/* Mobile: carrusel horizontal con peek */}
            <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {creator.latestVideos.map((video) => (
                <div key={video.id} className="shrink-0 w-[260px] snap-start">
                  <VideoCard video={video} />
                </div>
              ))}
            </div>
            {/* sm+: grid estático */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4">
              {creator.latestVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-white/30 border border-white/8 rounded-2xl bg-white/[0.02]">
            <Play className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin videos disponibles aún</p>
          </div>
        )}
      </section>

      {/* CTA — Reclamá tu perfil */}
      <section className="relative rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-6 mb-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-2 rounded-lg border border-violet-500/30 bg-violet-500/10 shrink-0">
            <Zap className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm">¿Sos {creator.name}?</h3>
            <p className="text-white/40 text-xs mt-0.5">
              Reclamá tu perfil para actualizar tu bio, agregar links de afiliado y obtener estadísticas de visitas.
            </p>
          </div>
          <a
            href={`mailto:hola@creatorsshub.com?subject=Reclamo de perfil: ${creator.name}&body=Hola, soy ${creator.name} y quiero reclamar mi perfil en Creators S-HUB. Canal: ${creator.channelUrl}`}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-mono font-semibold transition-colors"
          >
            <Zap className="h-3 w-3" />
            Reclamar perfil
          </a>
        </div>
      </section>

      <div className="pt-4 border-t border-white/5">
        <Button asChild variant="ghost" size="sm" className="text-white/30 hover:text-cyan-400 -ml-2 gap-1">
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
