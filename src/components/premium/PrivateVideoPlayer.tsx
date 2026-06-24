"use client";

import { useState } from "react";
import { Video, Play, Volume2, Maximize2, ExternalLink } from "lucide-react";

interface PrivateVideoPlayerProps {
  url: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  /** "native" uses <video>, "embed" uses iframe (for YouTube unlisted / Vimeo) */
  type?: "native" | "embed";
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PrivateVideoPlayer({
  url,
  title,
  description,
  thumbnailUrl,
  durationSeconds,
  type = "native",
}: PrivateVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const duration = formatDuration(durationSeconds);

  return (
    <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.03] overflow-hidden">
      {/* Player area */}
      <div className="relative bg-black aspect-video w-full group">
        {!playing ? (
          <>
            {/* Thumbnail */}
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/5 flex items-center justify-center">
                <Video className="h-16 w-16 text-white/10" />
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
              <button
                onClick={() => setPlaying(true)}
                className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-white/30 bg-black/40 hover:bg-cyan-500/20 hover:border-cyan-400/60 text-white transition-all hover:scale-105"
              >
                <Play className="h-7 w-7 ml-1 fill-white" />
              </button>
              {duration && (
                <span className="text-xs font-mono text-white/50 bg-black/40 px-2 py-0.5 rounded">
                  {duration}
                </span>
              )}
            </div>
          </>
        ) : type === "native" ? (
          <video
            src={url}
            controls
            autoPlay
            className="w-full h-full"
            title={title}
          >
            Tu navegador no soporta reproducción de video.
          </video>
        ) : (
          <iframe
            src={url}
            title={title}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="w-full h-full border-0"
          />
        )}
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-cyan-500/10">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{title}</p>
          {description && (
            <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-white/20">
          <Volume2 className="h-3.5 w-3.5" />
          <Maximize2 className="h-3.5 w-3.5" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/50 transition-colors"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
