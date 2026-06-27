"use client";

import { useState } from "react";
import { Radio, Copy, Check } from "lucide-react";

interface OBSOverlayCardProps {
  userId: string;
}

/**
 * Muestra al creador su URL de overlay para OBS (alertas de propinas STREAM_TIP),
 * con botón de copiar. Se pega como "Fuente de navegador" en OBS.
 */
export function OBSOverlayCard({ userId }: OBSOverlayCardProps) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/overlays/alerts/${userId}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-[#0B0F19]/50 backdrop-blur-md p-5">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="h-4 w-4 text-violet-300" />
        <p className="text-xs font-mono text-white/50 uppercase tracking-widest">Alertas para OBS</p>
      </div>
      <p className="text-[11px] text-white/35 font-mono mb-3 leading-relaxed">
        {"// pegá esta URL como Fuente de navegador en OBS para mostrar las propinas en vivo"}
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-violet-200 truncate">
          {url}
        </code>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300 text-xs font-mono hover:bg-violet-500/20 transition-colors shrink-0"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
