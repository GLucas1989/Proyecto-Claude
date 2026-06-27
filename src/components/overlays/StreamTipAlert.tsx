"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface TipAlert {
  id: string;
  amount: number;
  description: string | null;
}

interface StreamTipAlertProps {
  creatorId: string;
}

/**
 * Widget de alertas para OBS (fuente de navegador, fondo transparente).
 * Escucha en tiempo real las inserciones STREAM_TIP en wallet_transactions
 * del creador y dispara una animación rápida. Si Realtime no está disponible,
 * cae a polling controlado cada 8s.
 */
export function StreamTipAlert({ creatorId }: StreamTipAlertProps) {
  const [active, setActive] = useState<TipAlert | null>(null);
  const queueRef = useRef<TipAlert[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const showingRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    function enqueue(tip: TipAlert) {
      if (seenRef.current.has(tip.id)) return;
      seenRef.current.add(tip.id);
      queueRef.current.push(tip);
      drain();
    }

    function drain() {
      if (showingRef.current) return;
      const next = queueRef.current.shift();
      if (!next) return;
      showingRef.current = true;
      setActive(next);
      // Mostrar 6s, luego limpiar y continuar la cola
      setTimeout(() => {
        setActive(null);
        showingRef.current = false;
        setTimeout(drain, 400);
      }, 6000);
    }

    // ── Realtime ──────────────────────────────────────────────────────────
    const channel = supabase
      .channel(`stream-tips-${creatorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${creatorId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; type: string; amount: number; description: string | null };
          if (row.type === "STREAM_TIP") {
            enqueue({ id: row.id, amount: row.amount, description: row.description });
          }
        }
      )
      .subscribe();

    // ── Polling de respaldo (por si Realtime no está habilitado) ──────────
    let lastCheck = new Date().toISOString();
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("id, type, amount, description, created_at")
        .eq("user_id", creatorId)
        .eq("type", "STREAM_TIP")
        .gt("created_at", lastCheck)
        .order("created_at", { ascending: true });
      lastCheck = new Date().toISOString();
      for (const row of data ?? []) {
        enqueue({ id: row.id, amount: row.amount, description: row.description });
      }
    }, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [creatorId]);

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-16 pointer-events-none">
      {active && (
        <div
          key={active.id}
          className="animate-tip-in flex flex-col items-center gap-3 rounded-2xl border border-cyan-400/40 bg-[#0B0F19]/90 px-10 py-7 shadow-[0_0_40px_rgba(0,240,255,0.35)] backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-sm font-mono uppercase tracking-[0.3em] text-cyan-300">
              ¡Nueva propina!
            </span>
          </div>
          <div className="text-5xl font-black text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]">
            ${active.amount.toFixed(2)}
          </div>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-pink-500/60 to-transparent" />
          <span className="text-xs font-mono text-pink-400/80">STREAM TIP · S-CREDITS</span>
        </div>
      )}
    </div>
  );
}
