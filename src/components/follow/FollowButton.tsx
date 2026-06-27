"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Heart, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toggleFollow } from "@/app/actions/follows";
import type { FollowTargetType } from "@/types/database";

interface FollowButtonProps {
  targetId: string;
  type: FollowTargetType;
  /** Variante visual: chip compacto (tarjetas) o botón grande (hero) */
  size?: "sm" | "lg";
  /** Etiqueta opcional cuando NO sigue (default "Seguir") */
  label?: string;
}

/**
 * Botón de seguir/dejar de seguir (juego o autor) con estado optimista.
 * Se auto-resuelve: consulta su propio estado al montar, sin prop-drilling.
 */
export function FollowButton({ targetId, type, size = "sm", label = "Seguir" }: FollowButtonProps) {
  const [following, setFollowing] = useState<boolean | null>(null);
  const [authed, setAuthed] = useState(false);
  const [pending, startTransition] = useTransition();
  const sbRef = useRef<SupabaseClient | null>(null);

  function sb() {
    if (!sbRef.current) sbRef.current = createClient();
    return sbRef.current;
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await sb().auth.getUser();
      if (!active) return;
      if (!user) { setAuthed(false); setFollowing(false); return; }
      setAuthed(true);
      const { data } = await sb()
        .from("user_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_id", targetId)
        .eq("type", type)
        .maybeSingle();
      if (active) setFollowing(!!data);
    })();
    return () => { active = false; };
  }, [targetId, type]);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!authed) {
      window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    const prev = following;
    setFollowing(!prev); // optimista
    startTransition(async () => {
      const res = await toggleFollow(targetId, type);
      if (res.error || typeof res.following !== "boolean") {
        setFollowing(prev); // revertir
      } else {
        setFollowing(res.following);
      }
    });
  }

  const isLg = size === "lg";
  const base = isLg
    ? "px-5 py-2.5 text-sm gap-2 rounded-xl"
    : "px-3 py-1.5 text-xs gap-1.5 rounded-lg";

  // Estado de carga inicial
  if (following === null) {
    return (
      <span className={`inline-flex items-center ${base} border border-white/10 bg-white/[0.03] text-white/30 font-mono`}>
        <Loader2 className={isLg ? "h-4 w-4 animate-spin" : "h-3.5 w-3.5 animate-spin"} />
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`inline-flex items-center font-mono font-semibold transition-all disabled:opacity-60 ${base} ${
        following
          ? "border border-pink-500/40 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20"
          : "border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-cyan-400/5 text-cyan-200 hover:from-cyan-500/25 hover:to-cyan-400/15 hover:shadow-[0_0_18px_rgba(0,240,255,0.2)]"
      }`}
    >
      {following ? (
        <>
          <Check className={isLg ? "h-4 w-4" : "h-3.5 w-3.5"} />
          Siguiendo
        </>
      ) : (
        <>
          <Heart className={isLg ? "h-4 w-4" : "h-3.5 w-3.5"} />
          {label}
        </>
      )}
    </button>
  );
}
