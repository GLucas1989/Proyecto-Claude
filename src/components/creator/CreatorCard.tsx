import Link from "next/link";
import Image from "next/image";
import { Creator } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Tv, AtSign, ArrowUpRight } from "lucide-react";
import { TwitchLiveBadge } from "./TwitchLiveBadge";
import { StarRating } from "./StarRating";
import { FollowButton } from "@/components/follow/FollowButton";

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

interface CreatorCardProps {
  creator: Creator;
  gameSlug: string;
}

export function CreatorCard({ creator, gameSlug }: CreatorCardProps) {
  const videoCount = creator.latestVideos.length;
  const twitchRaw = creator.socials.twitch;
  const twitchUsername = twitchRaw
    ? twitchRaw.startsWith("http") ? twitchRaw.split("/").pop()! : twitchRaw
    : undefined;
  const twitchUrl = twitchRaw
    ? twitchRaw.startsWith("http") ? twitchRaw : `https://twitch.tv/${twitchRaw}`
    : undefined;
  const twitterUrl = creator.socials.twitter
    ? `https://twitter.com/${creator.socials.twitter}`
    : undefined;

  const featured = creator.isFeatured === true;

  return (
    <div className={`group relative flex flex-col rounded-2xl border bg-gradient-to-b transition-all duration-300 overflow-hidden ${
      featured
        ? "border-amber-400/60 from-amber-500/[0.08] to-amber-900/[0.04] shadow-[0_0_20px_rgba(251,191,36,0.18)] hover:shadow-[0_0_28px_rgba(251,191,36,0.28)]"
        : "border-white/8 from-white/[0.06] to-white/[0.02] hover:border-white/20 hover:from-white/[0.09] hover:to-white/[0.04]"
    }`}>
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent transition-all duration-500 ${
        featured ? "via-amber-400/90 animate-pulse" : "via-amber-500/0 group-hover:via-amber-500/60"
      }`} />
      {/* Featured badge */}
      {featured && (
        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-semibold tracking-wide">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Destacado
        </div>
      )}
      <div className="p-5 flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 group-hover:border-amber-500/40 transition-colors duration-300">
            <Image src={creator.avatar} alt={creator.name} width={56} height={56} className="object-cover w-full h-full" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex gap-0.5">
            {creator.languages.map((lang) => (
              <span key={lang} className="text-[10px] leading-none">{lang === "es" ? "🇪🇸" : "🇺🇸"}</span>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-bold text-white text-base leading-tight truncate">{creator.name}</h3>
              {twitchUsername && <TwitchLiveBadge username={twitchUsername} />}
            </div>
            {videoCount > 0 && (
              <span className="shrink-0 text-[10px] text-white/30 font-medium whitespace-nowrap">{videoCount} videos</span>
            )}
          </div>
          <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">{creator.bioShort}</p>
          <div className="mt-2"><StarRating creatorId={creator.id} compact /></div>
        </div>
      </div>
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {creator.contentType.map((type) => (
          <Badge key={type} variant={contentTypeVariant[type] ?? "casual"} className="text-[10px] px-2 py-0.5">{contentTypeLabel[type] ?? type}</Badge>
        ))}
        {creator.formats?.slice(0, 2).map((format) => (
          <Badge key={format} variant="format" className="text-[10px] px-2 py-0.5">{formatLabel[format]}</Badge>
        ))}
        {(creator.formats?.length ?? 0) > 2 && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-white/10 text-white/30">+{(creator.formats?.length ?? 0) - 2}</Badge>
        )}
      </div>
      <div className="mt-auto px-5 pb-5 pt-3 flex items-center justify-between border-t border-white/5">
        <div className="flex gap-1.5">
          {creator.socials.youtube && (
            <a href={creator.socials.youtube} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all" aria-label="YouTube" onClick={(e) => e.stopPropagation()}>
              <Play className="w-3.5 h-3.5" />
            </a>
          )}
          {twitchUrl && (
            <a href={twitchUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-white/30 hover:text-purple-400 hover:bg-purple-400/10 transition-all" aria-label="Twitch" onClick={(e) => e.stopPropagation()}>
              <Tv className="w-3.5 h-3.5" />
            </a>
          )}
          {twitterUrl && (
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-white/30 hover:text-sky-400 hover:bg-sky-400/10 transition-all" aria-label="Twitter / X" onClick={(e) => e.stopPropagation()}>
              <AtSign className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FollowButton targetId={creator.id} type="author" />
          <Button asChild size="sm" className="h-7 px-3 text-xs bg-white/8 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 hover:border-amber-500/40 text-white/70 transition-all gap-1" variant="ghost">
            <Link href={`/${gameSlug}/${creator.id}`}>Ver Perfil<ArrowUpRight className="h-3 w-3" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
