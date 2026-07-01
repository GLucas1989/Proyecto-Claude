"use client";

import Link from "next/link";
import { Lock, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { VideoEmbed } from "@/components/media/VideoEmbed";
import { youTubeUnlistedAsset } from "@/lib/media/types";

interface ExclusiveVideoGatekeeperProps {
  /** URL o ID de YouTube (Unlisted recomendado). */
  youtubeIdOrUrl: string;
  title: string;
  isExclusive: boolean;
}

/**
 * Envuelve el embed de YouTube (VideoEmbed, ya usa youtube-nocookie.com) con
 * un gate de sesión. Si is_exclusive=true y no hay sesión, no se renderiza
 * ningún iframe — se muestra el LockScreen en su lugar.
 *
 * Nota: el gate acá es de UX (evita mostrar el player a un anónimo), no de
 * seguridad de acceso al archivo — un video "Unlisted" de YouTube sigue
 * siendo reproducible por cualquiera que tenga la URL directa. Para un gate
 * de acceso real (token firmado, imposible de reproducir sin sesión) usar
 * el flujo de Mux (ExclusiveVideoPlayer.tsx) en vez de YouTube Unlisted.
 */
export function ExclusiveVideoGatekeeper({
  youtubeIdOrUrl,
  title,
  isExclusive,
}: ExclusiveVideoGatekeeperProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="aspect-video w-full rounded-xl border border-white/10 bg-black/40 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
      </div>
    );
  }

  if (isExclusive && !user) {
    return <LockScreen />;
  }

  const asset = youTubeUnlistedAsset(youtubeIdOrUrl, title);
  if (!asset) {
    return (
      <div className="aspect-video w-full rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
        <p className="text-xs text-white/30 font-mono">{"// video no disponible"}</p>
      </div>
    );
  }

  return <VideoEmbed asset={asset} />;
}

/** Pantalla de bloqueo cyber-SaaS para contenido exclusivo sin sesión. */
export function LockScreen() {
  return (
    <div className="aspect-video w-full rounded-xl border border-cyan-500/25 bg-gradient-to-br from-[#0B0F19] to-black flex flex-col items-center justify-center gap-3 text-center px-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl border border-cyan-400/40 bg-cyan-500/10">
        <Lock className="h-5 w-5 text-cyan-300" />
      </div>
      <p className="text-sm font-bold text-white">Contenido exclusivo para miembros</p>
      <p className="text-xs text-white/40 max-w-xs">
        Iniciá sesión para ver este video.
      </p>
      <Link
        href={`/auth/login?redirectTo=${encodeURIComponent(
          typeof window !== "undefined" ? window.location.pathname : "/"
        )}`}
        className="shine-btn flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-100 font-mono text-xs font-bold hover:shadow-[0_0_18px_rgba(0,240,255,0.25)] transition-all"
      >
        <LogIn className="h-3.5 w-3.5" /> Iniciar sesión
      </Link>
    </div>
  );
}
