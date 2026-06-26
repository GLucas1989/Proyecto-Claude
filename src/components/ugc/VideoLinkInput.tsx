"use client";

import { useState } from "react";
import { Video, X, Plus } from "lucide-react";
import { parseYouTubeId } from "@/lib/media/types";

interface VideoLinkInputProps {
  /** URLs/embeds de video ya agregados (se guardan como URLs de YouTube) */
  value: string[];
  onChange: (urls: string[]) => void;
}

/**
 * Permite al creador adjuntar enlaces de video (YouTube Unlisted).
 * Valida el ID antes de aceptar. La infraestructura de reproducción
 * (VideoEmbed + MediaAsset) ya soporta migrar a Cloudflare/Vimeo a futuro.
 */
export function VideoLinkInput({ value, onChange }: VideoLinkInputProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addLink() {
    const id = parseYouTubeId(draft.trim());
    if (!id) {
      setError("Pegá un enlace válido de YouTube (recomendado: video Unlisted).");
      return;
    }
    const canonical = `https://www.youtube.com/watch?v=${id}`;
    if (value.includes(canonical)) {
      setError("Ese video ya fue agregado.");
      return;
    }
    setError(null);
    setDraft("");
    onChange([...value, canonical]);
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-black/20">
        <Video className="h-3.5 w-3.5 text-white/25" />
        <span className="text-xs font-mono text-white/30">
          {"// video › YouTube Unlisted (oculto, no listado)"}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/25 font-mono focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <button
            type="button"
            onClick={addLink}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-mono hover:bg-cyan-500/20 transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>

        {error && <p className="text-xs font-mono text-red-400/70 px-1">{error}</p>}

        {value.length > 0 && (
          <ul className="space-y-1.5">
            {value.map((url) => {
              const id = parseYouTubeId(url);
              return (
                <li key={url} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/6">
                  <Video className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span className="flex-1 text-xs font-mono text-white/50 truncate">{id ?? url}</span>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((u) => u !== url))}
                    className="text-white/20 hover:text-red-400 transition-colors"
                    title="Eliminar video"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
