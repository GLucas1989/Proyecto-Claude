"use client";

import { useEffect, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { Lock, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

interface ExclusiveVideoPlayerProps {
  assetId: string;
  title: string;
  isExclusive: boolean;
}

interface TokenResponse {
  token: string | null;
  playbackId: string | null;
  error?: string;
}

/**
 * Reproductor de video de Mux. Si el contenido es exclusivo, el player
 * (y el fetch del token firmado) ni siquiera se monta sin sesión activa —
 * se muestra un paywall en su lugar.
 */
export function ExclusiveVideoPlayer({ assetId, title, isExclusive }: ExclusiveVideoPlayerProps) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canView = !isExclusive || Boolean(user);

  useEffect(() => {
    if (!canView) return;
    let cancelled = false;
    fetch(`/api/mux/playback-token?assetId=${encodeURIComponent(assetId)}`)
      .then((r) => r.json())
      .then((json: TokenResponse) => {
        if (cancelled) return;
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => { if (!cancelled) setError("No se pudo cargar el video."); });
    return () => { cancelled = true; };
  }, [assetId, canView]);

  if (authLoading) {
    return (
      <div className="aspect-video rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
      </div>
    );
  }

  // ── Paywall: contenido exclusivo sin sesión ──
  if (!canView) {
    return (
      <div className="aspect-video rounded-2xl border border-pink-500/25 bg-gradient-to-br from-pink-500/5 to-black/60 flex flex-col items-center justify-center gap-3 text-center px-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl border border-pink-500/40 bg-pink-500/10">
          <Lock className="h-5 w-5 text-pink-300" />
        </div>
        <p className="text-sm font-bold text-white">Contenido solo para miembros</p>
        <p className="text-xs text-white/40 max-w-xs">
          Este video es exclusivo. Iniciá sesión para verlo.
        </p>
        <Link
          href={`/auth/login?redirectTo=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
          className="shine-btn flex items-center gap-2 px-5 py-2.5 rounded-xl border border-pink-500/40 bg-gradient-to-r from-pink-500/20 to-pink-400/10 text-pink-100 font-mono text-xs font-bold hover:shadow-[0_0_18px_rgba(244,63,94,0.25)] transition-all"
        >
          <LogIn className="h-3.5 w-3.5" /> Iniciar sesión
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-video rounded-2xl border border-red-500/20 bg-black/40 flex items-center justify-center">
        <p className="text-xs text-red-400/70 font-mono px-6 text-center">{error}</p>
      </div>
    );
  }

  if (!data?.playbackId) {
    return (
      <div className="aspect-video rounded-2xl border border-cyan-500/15 bg-black/40 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-cyan-400/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-cyan-500/20 bg-black">
      <MuxPlayer
        streamType="on-demand"
        playbackId={data.playbackId}
        tokens={data.token ? { playback: data.token } : undefined}
        metadata={{ video_title: title }}
        accentColor="#00F0FF"
        style={{ aspectRatio: "16/9", width: "100%" }}
      />
    </div>
  );
}
