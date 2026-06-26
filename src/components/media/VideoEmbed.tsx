"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { resolveVideoEmbedUrl, type MediaAsset } from "@/lib/media/types";

interface VideoEmbedProps {
  asset: MediaAsset;
  /** Carga diferida: muestra la miniatura hasta el primer click (mejor LCP) */
  lazy?: boolean;
}

/**
 * Reproductor de video responsivo (aspect-ratio 16:9) agnóstico del proveedor.
 * Usa resolveVideoEmbedUrl, por lo que soporta YouTube Unlisted hoy y queda
 * preparado para Cloudflare Stream / Vimeo OTT sin cambios en la UI.
 */
export function VideoEmbed({ asset, lazy = true }: VideoEmbedProps) {
  const [active, setActive] = useState(!lazy);
  const embedUrl = resolveVideoEmbedUrl(asset);

  if (!embedUrl) {
    return (
      <div className="aspect-video w-full rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
        <p className="text-xs text-white/30 font-mono">{"// video no disponible"}</p>
      </div>
    );
  }

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="group relative aspect-video w-full rounded-xl overflow-hidden border border-cyan-500/15 bg-black"
        aria-label={`Reproducir ${asset.title}`}
      >
        {asset.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.thumbnailUrl}
            alt={asset.title}
            className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent">
          <span className="flex items-center justify-center w-14 h-14 rounded-full border border-cyan-400/40 bg-cyan-500/15 backdrop-blur-sm group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-cyan-300 translate-x-0.5" fill="currentColor" />
          </span>
        </div>
        <span className="absolute bottom-3 left-3 text-xs font-mono text-white/80 max-w-[80%] truncate text-left">
          {asset.title}
        </span>
      </button>
    );
  }

  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-cyan-500/15 bg-black">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
      </div>
      <iframe
        src={`${embedUrl}&autoplay=1`}
        title={asset.title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
