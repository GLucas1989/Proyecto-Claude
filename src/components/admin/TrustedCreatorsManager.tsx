"use client";

import { useState, useTransition } from "react";
import { Search, ShieldCheck, Shield, Loader2, Zap, Check } from "lucide-react";
import { listCreators, setCreatorTrusted, type CreatorRow } from "@/app/actions/admin";

interface TrustedCreatorsManagerProps {
  initial: CreatorRow[];
}

/**
 * Panel admin para designar "creadores de confianza".
 * Sus publicaciones se auto-publican sin pasar por la cola de moderación.
 */
export function TrustedCreatorsManager({ initial }: TrustedCreatorsManagerProps) {
  const [rows, setRows] = useState<CreatorRow[]>(initial);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  // Acceso rápido: últimos 5 creadores marcados como de confianza
  const trusted = rows.filter((r) => r.is_trusted_creator).slice(0, 5);

  function runSearch() {
    startTransition(async () => {
      const data = await listCreators(search);
      setRows(data);
    });
  }

  function toggle(row: CreatorRow) {
    setBusyId(row.id);
    const next = !row.is_trusted_creator;
    startTransition(async () => {
      const res = await setCreatorTrusted(row.id, next);
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_trusted_creator: next } : r)));
        // Confirmación visual: flash en la fila durante 1.5s
        setFlashId(row.id);
        setTimeout(() => setFlashId((cur) => (cur === row.id ? null : cur)), 1500);
      }
      setBusyId(null);
    });
  }

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-[#0B0F19]/50 backdrop-blur-md overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8 bg-violet-500/[0.04]">
        <Zap className="h-4 w-4 text-violet-300" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Creadores de confianza</p>
          <p className="text-[11px] font-mono text-white/35">
            {"// sus publicaciones se publican sin pasar por moderación"}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="p-4 border-b border-white/5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
              placeholder="Buscar por nombre o email…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/25 font-mono focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <button
            onClick={runSearch}
            disabled={pending}
            className="px-4 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-mono hover:bg-violet-500/20 transition-colors disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
          </button>
        </div>
      </div>

      {/* Acceso rápido: creadores de confianza actuales */}
      {trusted.length > 0 && (
        <div className="px-4 py-3 border-b border-white/5 bg-green-500/[0.03]">
          <p className="text-[10px] font-mono text-green-300/60 uppercase tracking-widest mb-2">{"// acceso rápido · de confianza"}</p>
          <div className="flex flex-wrap gap-1.5">
            {trusted.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono border border-green-500/30 bg-green-500/10 text-green-300"
              >
                <ShieldCheck className="h-3 w-3" />
                {t.display_name ?? t.email}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      <ul className="divide-y divide-white/5">
        {rows.length === 0 ? (
          <li className="px-5 py-8 text-center text-xs font-mono text-white/25">{"// sin resultados"}</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className={`flex items-center gap-3 px-5 py-3 transition-colors duration-500 ${flashId === row.id ? "bg-green-500/10" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{row.display_name ?? "(sin nombre)"}</p>
                <p className="text-[11px] font-mono text-white/30 truncate">{row.email}</p>
              </div>
              {flashId === row.id && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-green-300">
                  <Check className="h-3 w-3" /> guardado
                </span>
              )}
              {row.role === "ADMIN" && (
                <span className="text-[9px] font-mono text-cyan-400/70 px-1.5 py-0.5 rounded border border-cyan-500/20">ADMIN</span>
              )}
              <button
                onClick={() => toggle(row)}
                disabled={busyId === row.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 ${
                  row.is_trusted_creator
                    ? "border border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                    : "border border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/20"
                }`}
              >
                {busyId === row.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : row.is_trusted_creator ? (
                  <><ShieldCheck className="h-3.5 w-3.5" /> De confianza</>
                ) : (
                  <><Shield className="h-3.5 w-3.5" /> Marcar confianza</>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
