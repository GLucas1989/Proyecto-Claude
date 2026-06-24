"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, Swords, Trophy, ThumbsUp, ThumbsDown,
  Eye, Paperclip, Lock, Star, ChevronRight,
} from "lucide-react";
import type { UserPublication } from "@/types/database";

interface PublicationCardProps {
  publication: UserPublication;
  authorName?: string;
  authorRank?: string;
  upvotes?: number;
  downvotes?: number;
  userVote?: "UPVOTE" | "DOWNVOTE" | null;
  isPromoted?: boolean;
  onVote?: (type: "UPVOTE" | "DOWNVOTE") => void;
}

const TYPE_CONFIG = {
  GUIDE:     { icon: <BookOpen className="h-3.5 w-3.5" />, label: "Guía",     color: "text-cyan-400",   border: "border-cyan-500/20",   bg: "bg-cyan-500/[0.03]"   },
  BUILD:     { icon: <Swords className="h-3.5 w-3.5" />,   label: "Build",    color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/[0.03]" },
  TIER_LIST: { icon: <Trophy className="h-3.5 w-3.5" />,   label: "Tier List",color: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/[0.03]" },
};

function excerpt(md: string, maxChars = 160): string {
  return md
    .replace(/^#{1,3} .+$/gm, "")
    .replace(/\*\*|__|`|>/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, maxChars)
    .concat("…");
}

export function PublicationCard({
  publication,
  authorName,
  authorRank,
  upvotes = 0,
  downvotes = 0,
  userVote = null,
  isPromoted = false,
  onVote,
}: PublicationCardProps) {
  const [localUpvotes, setLocalUpvotes]     = useState(upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(downvotes);
  const [localVote, setLocalVote]           = useState(userVote);
  const cfg = TYPE_CONFIG[publication.type];

  const handleVote = async (type: "UPVOTE" | "DOWNVOTE") => {
    if (!onVote) return;

    const wasThis = localVote === type;
    const wasDiff = localVote !== null && localVote !== type;

    // Optimistic update
    if (type === "UPVOTE") {
      setLocalUpvotes((v) => wasThis ? v - 1 : v + 1);
      if (wasDiff) setLocalDownvotes((v) => v - 1);
    } else {
      setLocalDownvotes((v) => wasThis ? v - 1 : v + 1);
      if (wasDiff) setLocalUpvotes((v) => v - 1);
    }
    setLocalVote(wasThis ? null : type);

    onVote(type);
  };

  const score = localUpvotes - localDownvotes;

  return (
    <article
      className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all hover:border-opacity-40 relative`}
    >
      {/* Promoted badge */}
      {isPromoted && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-[9px] font-mono font-bold text-yellow-400">
          <Star className="h-2.5 w-2.5" />
          Destacado
        </div>
      )}

      <div className="p-5">
        {/* Type + meta */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`flex items-center gap-1 text-[10px] font-mono font-bold ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
          {publication.is_premium && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-violet-400/70 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
              <Lock className="h-2.5 w-2.5" /> Premium
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-white mb-2 leading-tight line-clamp-2">
          {publication.title}
        </h3>

        {/* Excerpt */}
        <p className="text-xs text-white/40 font-mono leading-relaxed line-clamp-3 mb-4">
          {excerpt(publication.content_markdown)}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-3 border-t border-white/5">
          {/* Author */}
          {authorName && (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-white/40 truncate">{authorName}</p>
              {authorRank && (
                <p className={`text-[9px] font-mono ${cfg.color} opacity-70`}>{authorRank}</p>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-[10px] font-mono text-white/20">
              <Eye className="h-3 w-3" /> {publication.views_count}
            </div>
            {publication.attachments_urls.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-white/20">
                <Paperclip className="h-3 w-3" /> {publication.attachments_urls.length}
              </div>
            )}

            {/* Votes */}
            <button
              onClick={() => handleVote("UPVOTE")}
              className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                localVote === "UPVOTE"
                  ? "text-green-400 bg-green-500/10"
                  : "text-white/25 hover:text-green-400"
              }`}
            >
              <ThumbsUp className="h-3 w-3" /> {localUpvotes}
            </button>
            <button
              onClick={() => handleVote("DOWNVOTE")}
              className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                localVote === "DOWNVOTE"
                  ? "text-red-400 bg-red-500/10"
                  : "text-white/25 hover:text-red-400"
              }`}
            >
              <ThumbsDown className="h-3 w-3" /> {localDownvotes}
            </button>
          </div>

          {/* Read more */}
          <Link
            href={`/ugc/${publication.id}`}
            className={`flex items-center gap-0.5 text-[10px] font-mono font-bold ${cfg.color} hover:opacity-80 transition-opacity shrink-0`}
          >
            Leer <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Score indicator */}
        {score !== 0 && (
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${score > 0 ? "bg-green-500/20" : "bg-red-500/20"}`} />
        )}
      </div>
    </article>
  );
}
