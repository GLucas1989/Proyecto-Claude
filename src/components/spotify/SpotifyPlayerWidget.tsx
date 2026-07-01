"use client";

import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Play, Pause, SkipBack, SkipForward, Music2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Widget flotante "Gaming Mode" — siempre montado en el layout raíz.
 * Auto-arranca: si ya hay sesión de Spotify (cookie de next-auth), el SDK
 * se inicializa solo al montar, sin acción del usuario.
 *
 * Envuelve su propio SessionProvider para no forzar que el resto de la app
 * (que usa Supabase para auth) dependa de next-auth.
 */
export function SpotifyPlayerWidget() {
  return (
    <SessionProvider>
      <SpotifyPlayerWidgetInner />
    </SessionProvider>
  );
}

function SpotifyPlayerWidgetInner() {
  const [collapsed, setCollapsed] = useState(true);
  const {
    isAuthenticated,
    isReady,
    state,
    error,
    connect,
    togglePlay,
    next,
    previous,
  } = useSpotifyPlayer();

  // Progreso animado localmente entre eventos del SDK (que no llegan cada segundo)
  const [localPosition, setLocalPosition] = useState(0);
  useEffect(() => {
    if (!state) return;
    setLocalPosition(state.position);
    if (state.paused) return;

    const start = Date.now();
    const base = state.position;
    const interval = setInterval(() => {
      setLocalPosition(Math.min(base + (Date.now() - start), state.duration));
    }, 500);
    return () => clearInterval(interval);
  }, [state]);

  const progressPct = state?.duration ? Math.min(100, (localPosition / state.duration) * 100) : 0;

  return (
    <div className="fixed bottom-24 sm:bottom-4 right-4 z-40 w-[280px] max-w-[calc(100vw-2rem)] font-mono">
      <div className="rounded-2xl border border-cyan-400/30 bg-black/80 backdrop-blur-xl shadow-[0_0_24px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* Header — siempre visible, colapsa/expande el resto */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-cyan-500/5 transition-colors"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg border border-cyan-400/30 bg-cyan-400/10 shrink-0">
            <Music2 className="h-3.5 w-3.5 text-cyan-300" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-cyan-400/60">Gaming Mode</p>
            <p className="text-xs text-white/60 truncate">
              {!isAuthenticated
                ? "Spotify desconectado"
                : error
                  ? error
                  : (state?.track?.name ?? (isReady ? "Sin reproducción" : "Conectando…"))}
            </p>
          </div>
          {collapsed ? (
            <ChevronUp className="h-4 w-4 text-white/30 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />
          )}
        </button>

        {!collapsed && (
          <div className="px-4 pb-4 pt-3 border-t border-white/8">
            {!isAuthenticated ? (
              <div>
                <p className="text-xs text-white/40 mb-3">
                  Conectá tu cuenta de Spotify (requiere Premium) para escuchar música sin
                  salir de Creators S-HUB.
                </p>
                <button
                  onClick={connect}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-200 text-xs font-bold hover:shadow-[0_0_18px_rgba(0,240,255,0.25)] transition-all"
                >
                  Conectar Spotify
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Now playing */}
                <div className="flex items-center gap-3">
                  {state?.track?.albumImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={state.track.albumImage}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/8 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-white/80 truncate">{state?.track?.name ?? "Nada sonando"}</p>
                    <p className="text-[10px] text-white/30 truncate">{state?.track?.artists ?? "—"}</p>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400/70 transition-[width] duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-white/25 tabular-nums">
                    <span>{formatTime(localPosition)}</span>
                    <span>{formatTime(state?.duration ?? 0)}</span>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={previous}
                    className="border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/15 text-cyan-200"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={togglePlay}
                    className="border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/15 text-cyan-200"
                  >
                    {state && !state.paused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={next}
                    className="border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/15 text-cyan-200"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {error && <p className="text-[10px] text-amber-400/70 text-center">{error}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
