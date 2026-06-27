"use client";

import { useState, useTransition } from "react";
import { DollarSign, Check, X, Loader2, BadgeCheck } from "lucide-react";
import { resolveMonetizationRequest, type MonetizationRequestRow } from "@/app/actions/monetization";

interface MonetizationRequestsProps {
  initial: MonetizationRequestRow[];
}

/**
 * Panel admin: solicitudes de autorización de monetización de creadores oficiales.
 * Aprobar habilita can_monetize (source = admin) sin que paguen tarifa.
 */
export function MonetizationRequests({ initial }: MonetizationRequestsProps) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function resolve(id: string, approve: boolean) {
    setBusyId(id);
    startTransition(async () => {
      const res = await resolveMonetizationRequest(id, approve);
      if (res.ok) setRows((prev) => prev.filter((r) => r.id !== id));
      setBusyId(null);
    });
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0B0F19]/50 backdrop-blur-md overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8 bg-emerald-500/[0.04]">
        <DollarSign className="h-4 w-4 text-emerald-300" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Solicitudes de monetización</p>
          <p className="text-[11px] font-mono text-white/35">
            {"// creadores oficiales pidiendo autorización gratuita para monetizar"}
          </p>
        </div>
        {rows.length > 0 && (
          <span className="text-xs font-mono text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
            {rows.length}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-xs font-mono text-white/25">{"// sin solicitudes pendientes"}</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white/80 truncate">{r.display_name ?? "(sin nombre)"}</p>
                  {r.is_official_creator && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-cyan-400/70 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      <BadgeCheck className="h-2.5 w-2.5" /> OFICIAL
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-white/30 truncate">{r.email}</p>
                {r.note && <p className="text-[11px] text-white/40 mt-0.5 italic truncate">“{r.note}”</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => resolve(r.id, true)}
                  disabled={busyId === r.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 text-[10px] font-mono font-bold hover:bg-green-500/20 transition-colors disabled:opacity-50"
                >
                  {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Autorizar
                </button>
                <button
                  onClick={() => resolve(r.id, false)}
                  disabled={busyId === r.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/25 bg-red-500/8 text-red-400 text-[10px] font-mono font-bold hover:bg-red-500/15 transition-colors disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
