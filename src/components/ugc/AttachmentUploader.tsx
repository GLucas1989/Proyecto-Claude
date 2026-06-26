"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, FileSpreadsheet, FileAudio, X, Loader2 } from "lucide-react";

interface AttachmentUploaderProps {
  gameSlug: string;
  value: string[];
  onChange: (urls: string[]) => void;
}

const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Audio-guías
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
];
const MAX_MB = 50;

function FileIcon({ name }: { name: string }) {
  if (name.endsWith(".pdf")) return <FileText className="h-4 w-4 text-red-400 shrink-0" />;
  if (/\.(mp3|m4a|wav|ogg|weba)$/i.test(name)) return <FileAudio className="h-4 w-4 text-violet-400 shrink-0" />;
  return <FileSpreadsheet className="h-4 w-4 text-orange-400 shrink-0" />;
}

export function AttachmentUploader({ gameSlug, value, onChange }: AttachmentUploaderProps) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!ALLOWED_MIME.includes(file.type)) {
      setError("Solo se permiten archivos PDF, PPTX o audio (MP3/M4A/WAV/OGG).");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera los ${MAX_MB} MB.`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { uploadAttachment } = await import("@/app/actions/ugc");
      const url = await uploadAttachment(gameSlug, file.name, await file.arrayBuffer());
      if (url) onChange([...value, url]);
      else setError("No se pudo obtener la URL del archivo.");
    } catch {
      setError("Error al subir el archivo. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }, [gameSlug, value, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-black/20">
        <Upload className="h-3.5 w-3.5 text-white/25" />
        <span className="text-xs font-mono text-white/30">
          {"// adjuntos › PDF · PPTX · audio · máx 50 MB por archivo"}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            dragging
              ? "border-cyan-500/50 bg-cyan-500/5"
              : "border-white/8 hover:border-white/20 hover:bg-white/[0.01]"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
          ) : (
            <Upload className={`h-6 w-6 ${dragging ? "text-cyan-400" : "text-white/15"}`} />
          )}
          <p className="text-xs font-mono text-white/25 text-center">
            {uploading
              ? "Subiendo archivo…"
              : dragging
                ? "Suelta aquí para subir"
                : "Arrastrá tu PDF o PPTX, o hacé clic para seleccionar"}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.pptx,.mp3,.m4a,.wav,.ogg,.weba,audio/*"
            className="sr-only"
            onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }}
          />
        </div>

        {error && (
          <p className="text-xs font-mono text-red-400/70 px-1">{error}</p>
        )}

        {value.length > 0 && (
          <ul className="space-y-1.5">
            {value.map((url) => {
              const name = decodeURIComponent(url.split("/").pop() ?? url);
              return (
                <li key={url} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/6">
                  <FileIcon name={name} />
                  <span className="flex-1 text-xs font-mono text-white/50 truncate">{name}</span>
                  <button
                    onClick={() => onChange(value.filter((u) => u !== url))}
                    className="text-white/20 hover:text-red-400 transition-colors"
                    title="Eliminar adjunto"
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
