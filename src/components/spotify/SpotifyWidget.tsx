"use client";

import { useCallback, useEffect, useState } from "react";
import { Music2, Play, Pause, SkipForward, ChevronDown, ChevronUp, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SPOTIFY_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SPOTIFY === "true";
const POLL_MS = 10_000;

interface PlaybackState {
  isPlaying: boolean;
  trackName: string;
  artistName: string;
  albumImage: string | null;
}

interface Playlist {
  id: string;
  name: string;
  uri: string;
}

/**
 * Widget flotante "Gaming Mode" — módulo sidecar 100% opcional, gateado por
 * NEXT_PUBLIC_ENABLE_SPOTIFY. No toca ningún estado de monetización/auth
 * de Supabase; usa su propia sesión OAuth (cookies httpOnly separadas,
 * ver src/lib/spotify/).
 */
export function SpotifyWidget() {
  if (!SPOTIFY_ENABLED) return null;
  return <SpotifyWidgetInner />;
}

function SpotifyWidgetInner() {
  const [collapsed, setCollapsed] = useState(true);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/spotify/status");
      const data = await res.json();
      setConnected(Boolean(data.connected));
      setPlayback(data.playing ?? null);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, POLL_MS);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  useEffect(() => {
    if (!connected) return;
    fetch("/api/spotify/playlists")
      .then((r) => r.json())
      .then((data) => setPlaylists(data.playlists ?? []))
      .catch(() => setPlaylists([]));
  }, [connected]);

  async function control(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch("/api/spotify/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      setTimeout(refreshStatus, 400);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    await fetch("/api/spotify/logout", { method: "POST" });
    setConnected(false);
    setPlayback(null);
    setPlaylists([]);
  }

  return (
    <div className="fixed bottom-24 sm:bottom-4 right-4 z-40 w-[280px] max-w-[calc(100vw-2rem)] font-mono">
      <div className="rounded-2xl border border-cyan-400/30 bg-[#030712]/95 backdrop-blur-xl shadow-[0_0_24px_rgba(0,240,255,0.15)] overflow-hidden">
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
              {connected === null
                ? "Cargando…"
                : connected
                  ? (playback?.trackName ?? "Sin reproducción")
                  : "Spotify desconectado"}
            </p>
          </div>
          {collapsed ? (
            <ChevronUp className="h-4 w-4 text-white/30 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />
          )}
        </button>

        {!collapsed && (
          <div className="px-4 pb-4 border-t border-white/8">
            {connected === false ? (
              <div className="pt-3">
                <p className="text-xs text-white/40 mb-3">
                  Conectá tu cuenta para controlar tu música sin salir de Creators S-HUB.
                </p>
                <a
                  href="/api/spotify/login"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-200 text-xs font-bold hover:shadow-[0_0_18px_rgba(0,240,255,0.25)] transition-all"
                >
                  Conectar Spotify
                </a>
              </div>
            ) : (
              <div className="pt-3 space-y-3">
                {/* Now playing */}
                <div className="flex items-center gap-3">
                  {playback?.albumImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={playback.albumImage}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/8 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-white/80 truncate">{playback?.trackName ?? "Nada sonando"}</p>
                    <p className="text-[10px] text-white/30 truncate">{playback?.artistName ?? "—"}</p>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={busy}
                    onClick={() => control(playback?.isPlaying ? "pause" : "play")}
                    className="border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/15 text-cyan-200"
                  >
                    {playback?.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={busy}
                    onClick={() => control("next")}
                    className="border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/15 text-cyan-200"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Selector de playlist */}
                {playlists.length > 0 && (
                  <Select
                    value={selectedPlaylist}
                    onValueChange={(uri) => {
                      setSelectedPlaylist(uri);
                      control("play-context", { contextUri: uri });
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white/70">
                      <SelectValue placeholder="Elegir playlist…" />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists.map((p) => (
                        <SelectItem key={p.id} value={p.uri}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <button
                  onClick={disconnect}
                  className="flex items-center gap-1.5 text-[10px] text-white/25 hover:text-red-400/70 transition-colors mx-auto"
                >
                  <Unlink className="h-3 w-3" /> Desconectar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
