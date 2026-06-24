"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { votePublication } from "@/app/actions/ugc";

interface VoteSectionProps {
  publicationId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote?: "UPVOTE" | "DOWNVOTE" | null;
}

export function VoteSection({
  publicationId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote = null,
}: VoteSectionProps) {
  const [upvotes, setUpvotes]     = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote]   = useState(initialUserVote);
  const [, startTransition]       = useTransition();

  const handleVote = (type: "UPVOTE" | "DOWNVOTE") => {
    const wasThis = userVote === type;
    const wasDiff = userVote !== null && userVote !== type;

    // Optimistic update
    if (type === "UPVOTE") {
      setUpvotes((v)   => wasThis ? v - 1 : v + 1);
      if (wasDiff) setDownvotes((v) => v - 1);
    } else {
      setDownvotes((v) => wasThis ? v - 1 : v + 1);
      if (wasDiff) setUpvotes((v) => v - 1);
    }
    setUserVote(wasThis ? null : type);

    startTransition(async () => {
      await votePublication(publicationId, type);
    });
  };

  const score = upvotes - downvotes;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleVote("UPVOTE")}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
          userVote === "UPVOTE"
            ? "border-green-500/40 bg-green-500/10 text-green-400"
            : "border-white/10 text-white/30 hover:border-green-500/30 hover:text-green-400"
        }`}
      >
        <ThumbsUp className="h-4 w-4" />
        {upvotes > 0 && <span>{upvotes}</span>}
        Útil
      </button>

      <button
        onClick={() => handleVote("DOWNVOTE")}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono transition-all ${
          userVote === "DOWNVOTE"
            ? "border-red-500/40 bg-red-500/10 text-red-400"
            : "border-white/8 text-white/20 hover:border-red-500/20 hover:text-red-400"
        }`}
      >
        <ThumbsDown className="h-4 w-4" />
        {downvotes > 0 && <span>{downvotes}</span>}
      </button>

      {score !== 0 && (
        <span className={`text-xs font-mono ${score > 0 ? "text-green-400/60" : "text-red-400/60"}`}>
          {score > 0 ? `+${score}` : score} puntos de reputación al autor
        </span>
      )}
    </div>
  );
}
