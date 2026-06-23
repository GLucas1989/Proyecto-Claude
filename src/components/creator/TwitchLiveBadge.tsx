"use client";

import { useEffect, useState } from "react";
import { Tv } from "lucide-react";

interface TwitchLiveBadgeProps {
  username: string;
}

export function TwitchLiveBadge({ username }: TwitchLiveBadgeProps) {
  const [isLive, setIsLive] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/twitch/live?channels=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data: Record<string, boolean>) => {
        if (!cancelled) setIsLive(data[username.toLowerCase()] ?? false);
      })
      .catch(() => { if (!cancelled) setIsLive(false); });
    return () => { cancelled = true; };
  }, [username]);

  if (isLive === null) return null;
  if (!isLive) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-950/50 border border-red-800/40 rounded-full px-2 py-0.5">
      <Tv className="h-3 w-3" />
      LIVE
    </span>
  );
}
