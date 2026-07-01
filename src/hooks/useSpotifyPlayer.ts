"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export interface SpotifyTrackInfo {
  name: string;
  artists: string;
  albumImage: string | null;
}

export interface SpotifyPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track: SpotifyTrackInfo | null;
}

// Tipado mínimo del Web Playback SDK — evita depender de
// @types/spotify-web-playback-sdk para una superficie tan chica.
interface SpotifyWebPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      name: string;
      artists: { name: string }[];
      album: { images: { url: string }[] };
    };
  };
}

interface SpotifyPlayerInstance {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, cb: (data: unknown) => void): void;
  togglePlay(): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
  seek(ms: number): Promise<void>;
}

declare global {
  interface Window {
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayerInstance;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

const SDK_SRC = "https://sdk.scdn.co/spotify-player.js";
let sdkLoadPromise: Promise<void> | null = null;

function loadSpotifySdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Spotify) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    document.body.appendChild(script);
  });
  return sdkLoadPromise;
}

async function fetchFreshToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/spotify/token");
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken?: string };
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

/**
 * Maneja el ciclo de vida completo del Web Playback SDK: carga del script,
 * inicialización del Player, y estado de reproducción. Todos los errores
 * del SDK/red se atrapan y se exponen como `error` en vez de propagarse —
 * el layout de la app nunca debe romperse por esto.
 */
export function useSpotifyPlayer() {
  const { data: session, status } = useSession();
  const [player, setPlayer] = useState<SpotifyPlayerInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [state, setState] = useState<SpotifyPlaybackState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);

  const isAuthenticated = status === "authenticated" && !session?.error;

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    loadSpotifySdk()
      .then(() => {
        if (cancelled || !window.Spotify) return;

        const p = new window.Spotify.Player({
          name: "Creators S-HUB — Gaming Mode",
          getOAuthToken: (cb) => {
            fetchFreshToken().then((token) => {
              if (token) cb(token);
            });
          },
          volume: 0.5,
        });

        p.addListener("ready", () => { if (!cancelled) setIsReady(true); });
        p.addListener("not_ready", () => { if (!cancelled) setIsReady(false); });
        p.addListener("initialization_error", () => {
          if (!cancelled) setError("No se pudo inicializar el reproductor.");
        });
        p.addListener("authentication_error", () => {
          if (!cancelled) setError("Sesión de Spotify vencida — reconectá.");
        });
        p.addListener("account_error", () => {
          if (!cancelled) setError("Gaming Mode requiere Spotify Premium.");
        });
        // Errores de reproducción puntuales (pista no disponible, etc.) — silenciosos, no rompen el widget.
        p.addListener("playback_error", () => {});

        p.addListener("player_state_changed", (raw) => {
          if (cancelled || !raw) return;
          const playbackState = raw as SpotifyWebPlaybackState;
          const item = playbackState.track_window?.current_track;
          setState({
            paused: playbackState.paused,
            position: playbackState.position,
            duration: playbackState.duration,
            track: item
              ? {
                  name: item.name,
                  artists: (item.artists ?? []).map((a) => a.name).join(", "),
                  albumImage: item.album?.images?.[0]?.url ?? null,
                }
              : null,
          });
        });

        p.connect().catch(() => {
          if (!cancelled) setError("No se pudo conectar con Spotify.");
        });

        playerRef.current = p;
        setPlayer(p);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el SDK de Spotify.");
      });

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
      setPlayer(null);
      setIsReady(false);
      setState(null);
    };
  }, [isAuthenticated]);

  const togglePlay = useCallback(() => {
    player?.togglePlay().catch(() => {});
  }, [player]);

  const next = useCallback(() => {
    player?.nextTrack().catch(() => {});
  }, [player]);

  const previous = useCallback(() => {
    player?.previousTrack().catch(() => {});
  }, [player]);

  const seek = useCallback(
    (ms: number) => {
      player?.seek(ms).catch(() => {});
    },
    [player]
  );

  const connect = useCallback(() => {
    signIn("spotify").catch(() => {});
  }, []);

  const disconnect = useCallback(() => {
    playerRef.current?.disconnect();
    signOut({ redirect: false }).catch(() => {});
  }, []);

  return {
    isAuthenticated,
    isConnecting: status === "loading",
    isReady,
    state,
    error: session?.error ? "Sesión de Spotify vencida — reconectá." : error,
    connect,
    disconnect,
    togglePlay,
    next,
    previous,
    seek,
  };
}
