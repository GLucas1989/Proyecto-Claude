"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

function seededRating(creatorId: string): number {
  let hash = 0;
  for (let i = 0; i < creatorId.length; i++) {
    hash = (hash * 31 + creatorId.charCodeAt(i)) >>> 0;
  }
  return 3 + (hash % 20) / 10;
}

interface StarRatingProps {
  creatorId: string;
  compact?: boolean;
}

export function StarRating({ creatorId, compact = false }: StarRatingProps) {
  const storageKey = `rating:${creatorId}`;
  const communityAvg = seededRating(creatorId);
  const [userRating, setUserRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setUserRating(Number(saved));
  }, [storageKey]);

  function handleRate(star: number) {
    setUserRating(star);
    localStorage.setItem(storageKey, String(star));
  }

  const display = hovered || userRating;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-400">
        <Star className="h-3 w-3 fill-amber-400" />
        <span>{communityAvg.toFixed(1)}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Calificar ${star} estrella${star > 1 ? "s" : ""}`}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHovered(star)}
              className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  star <= display ? "fill-amber-400 text-amber-400" : "fill-transparent text-white/20"
                }`}
              />
            </button>
          ))}
        </div>
        {userRating > 0 && (
          <span className="text-xs text-white/40">Tu calificación: {userRating}/5</span>
        )}
      </div>
      <p className="text-xs text-white/40">
        Promedio comunidad: <span className="text-amber-400 font-semibold">{communityAvg.toFixed(1)}</span> / 5
      </p>
    </div>
  );
}
