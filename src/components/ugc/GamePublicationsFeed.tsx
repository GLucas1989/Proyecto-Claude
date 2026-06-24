"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { PublicationCard } from "./PublicationCard";
import { votePublication } from "@/app/actions/ugc";
import type { UserPublication } from "@/types/database";

interface FeedItem {
  publication: UserPublication;
  authorName: string;
  authorRank: string;
  upvotes: number;
  downvotes: number;
  isPromoted: boolean;
}

interface GamePublicationsFeedProps {
  gameSlug: string;
  gameName: string;
  initialItems: FeedItem[];
}

export function GamePublicationsFeed({ gameSlug, gameName, initialItems }: GamePublicationsFeedProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [, startTransition] = useTransition();

  const handleVote = (publicationId: string, type: "UPVOTE" | "DOWNVOTE") => {
    startTransition(async () => {
      await votePublication(publicationId, type);
    });
  };

  if (items.length === 0) {
    return (
      <section className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest mb-0.5">
              {"// comunidad"}
            </p>
            <h2 className="text-lg font-bold text-white">Guías de la Comunidad</h2>
          </div>
          <Link
            href={`/ugc/new?game=${gameSlug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/8 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/15 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Crear guía
          </Link>
        </div>
        <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.01] p-8 text-center">
          <BookOpen className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white/30 mb-1">Sin guías todavía</p>
          <p className="text-xs text-white/20 font-mono mb-4">
            {"// Sé el primero en compartir tu conocimiento sobre " + gameName}
          </p>
          <Link
            href={`/ugc/new?game=${gameSlug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Crear la primera guía
          </Link>
        </div>
      </section>
    );
  }

  const promoted = items.filter((i) => i.isPromoted);
  const regular  = items.filter((i) => !i.isPromoted);

  return (
    <section className="mt-12 mb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest mb-0.5">
            {"// comunidad"}
          </p>
          <h2 className="text-lg font-bold text-white">
            Guías de la Comunidad
            <span className="ml-2 text-xs font-mono font-normal text-white/25">
              ({items.length})
            </span>
          </h2>
        </div>
        <Link
          href={`/ugc/new?game=${gameSlug}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/8 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/15 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Crear guía
        </Link>
      </div>

      {/* Promoted items primero */}
      {promoted.length > 0 && (
        <div className="mb-4 space-y-3">
          {promoted.map(({ publication, authorName, authorRank, upvotes, downvotes }) => (
            <PublicationCard
              key={publication.id}
              publication={publication}
              authorName={authorName}
              authorRank={authorRank}
              upvotes={upvotes}
              downvotes={downvotes}
              isPromoted
              onVote={(type) => handleVote(publication.id, type)}
            />
          ))}
        </div>
      )}

      {/* Grid regular */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {regular.map(({ publication, authorName, authorRank, upvotes, downvotes }) => (
          <PublicationCard
            key={publication.id}
            publication={publication}
            authorName={authorName}
            authorRank={authorRank}
            upvotes={upvotes}
            downvotes={downvotes}
            onVote={(type) => handleVote(publication.id, type)}
          />
        ))}
      </div>
    </section>
  );
}
