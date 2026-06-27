"use client";

import { useEffect, useState, useTransition } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { getPublicationRating, ratePublication, listReviews, type ReviewRow } from "@/app/actions/ratings";

interface PublicationRatingProps {
  publicationId: string;
}

export function PublicationRating({ publicationId }: PublicationRatingProps) {
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [summary, revs] = await Promise.all([
        getPublicationRating(publicationId),
        listReviews(publicationId),
      ]);
      setAvg(summary.average); setCount(summary.count); setUserScore(summary.userScore);
      setReviews(revs); setLoaded(true);
    })();
  }, [publicationId]);

  function submit(score: number) {
    setMsg(null);
    startTransition(async () => {
      const res = await ratePublication(publicationId, score, comment || undefined);
      if (res.ok) {
        setUserScore(score);
        const [summary, revs] = await Promise.all([
          getPublicationRating(publicationId),
          listReviews(publicationId),
        ]);
        setAvg(summary.average); setCount(summary.count);
        setReviews(revs); setComment("");
        setMsg("¡Gracias por tu calificación!");
      } else {
        setMsg(res.error ?? "No se pudo calificar.");
      }
    });
  }

  const display = hovered || userScore || 0;

  return (
    <section className="rounded-2xl border border-amber-500/15 bg-[#0B0F19]/50 backdrop-blur-md px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-mono text-white/30">{"// calificá esta guía"}</p>
        {loaded && count > 0 && (
          <div className="flex items-center gap-1.5 text-amber-400">
            <Star className="h-4 w-4 fill-amber-400" />
            <span className="text-sm font-bold tabular-nums">{avg.toFixed(1)}</span>
            <span className="text-[11px] text-white/30 font-mono">({count})</span>
          </div>
        )}
      </div>

      {/* Estrellas interactivas */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => submit(s)}
            disabled={pending}
            className="p-0.5 transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
            aria-label={`${s} estrellas`}
          >
            <Star className={`h-7 w-7 transition-colors ${s <= display ? "fill-amber-400 text-amber-400" : "text-white/20"}`} />
          </button>
        ))}
        {pending && <Loader2 className="h-4 w-4 text-white/30 animate-spin ml-2" />}
      </div>

      {/* Comentario opcional */}
      <div className="flex gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={600}
          placeholder="Dejá un comentario (opcional)…"
          className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-amber-500/40 transition-colors"
        />
        <button
          onClick={() => submit(userScore || hovered || 5)}
          disabled={pending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-mono hover:bg-amber-500/20 transition-colors disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" /> Enviar
        </button>
      </div>

      {msg && <p className="text-xs font-mono text-cyan-400/80 mt-2">{msg}</p>}

      {/* Reseñas */}
      {reviews.length > 0 && (
        <ul className="mt-5 space-y-3 border-t border-white/5 pt-4">
          {reviews.map((r) => (
            <li key={r.id} className="text-sm">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3 w-3 ${s <= r.score ? "fill-amber-400 text-amber-400" : "text-white/15"}`} />
                  ))}
                </div>
                <span className="text-[11px] text-white/40">{r.display_name ?? "Anónimo"}</span>
              </div>
              <p className="text-white/55 text-xs leading-relaxed">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
