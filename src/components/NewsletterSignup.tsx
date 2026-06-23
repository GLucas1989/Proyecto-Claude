'use client';

import { useState } from "react";
import { Zap, Mail, CheckCircle2, Loader2 } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Error al suscribir");
      } else {
        setStatus("success");
        setMessage(data.already ? "¡Ya estás suscrito!" : "¡Suscripción confirmada!");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Intentá de nuevo.");
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 p-8 sm:p-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#22d3ee04_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee04_1px,transparent_1px)] bg-[size:2rem_2rem]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="relative z-10 max-w-xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
          <Mail className="h-3 w-3" />
          Newsletter gaming
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Nuevos creadores{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
            cada semana
          </span>
        </h2>
        <p className="text-white/40 text-sm mb-6">
          Recibí en tu inbox los mejores creadores de cada juego, guías destacadas y novedades del mundo gaming competitivo.
        </p>

        {status === "success" ? (
          <div className="flex items-center justify-center gap-2 text-cyan-400 font-semibold py-3">
            <CheckCircle2 className="h-5 w-5" />
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all font-mono"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Suscribirme
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-red-400 text-xs mt-2 font-mono">&gt;_ {message}</p>
        )}

        <p className="text-white/20 text-xs mt-4">Sin spam. Cancelá cuando quieras.</p>
      </div>
    </section>
  );
}
