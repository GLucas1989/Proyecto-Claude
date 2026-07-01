"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, X, Lock, Unlock, Loader2, CheckCircle2, AlertCircle, Film } from "lucide-react";
import { createVideoUploadUrl, getVideoAssetStatus } from "@/app/actions/video";

const PROMO_HASHTAG = "#CreatorsSHUB";
const POLL_MS = 4000;

type Step = "idle" | "uploading" | "processing" | "ready" | "error";

interface VideoUploadFormProps {
  gameSlug?: string;
}

/**
 * Formulario de carga de video exclusivo (Mux Direct Upload).
 * #CreatorsSHUB va siempre incluido y no se puede quitar — garantiza el
 * marketing viral interno en cualquier video publicado desde acá.
 */
export function VideoUploadForm({ gameSlug }: VideoUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isExclusive, setIsExclusive] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("Elegí un archivo de video válido.");
      return;
    }
    setError(null);
    setFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  function addTag() {
    const clean = tagInput.trim();
    if (!clean) return;
    const withHash = clean.startsWith("#") ? clean : `#${clean}`;
    if (withHash.toLowerCase() === PROMO_HASHTAG.toLowerCase()) {
      setTagInput("");
      return; // ya está siempre incluido, no duplicar
    }
    if (!extraTags.some((t) => t.toLowerCase() === withHash.toLowerCase())) {
      setExtraTags((prev) => [...prev, withHash]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setExtraTags((prev) => prev.filter((t) => t !== tag));
  }

  // Polling de estado tras terminar el upload físico (Mux procesa async).
  useEffect(() => {
    if (step !== "processing" || !assetId) return;
    const interval = setInterval(async () => {
      const data = await getVideoAssetStatus(assetId);
      if (data?.status === "ready") {
        setStep("ready");
        clearInterval(interval);
      } else if (data?.status === "errored") {
        setStep("error");
        setError("Mux no pudo procesar el video. Probá con otro archivo.");
        clearInterval(interval);
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [step, assetId]);

  const handleSubmit = useCallback(async () => {
    if (!file) { setError("Elegí un video primero."); return; }
    if (!title.trim()) { setError("El título es obligatorio."); return; }

    setError(null);
    setStep("uploading");
    setProgress(0);

    const res = await createVideoUploadUrl({
      title,
      description,
      gameSlug,
      tags: extraTags,
      isExclusive,
    });

    if (!res.ok || !res.uploadUrl || !res.assetId) {
      setStep("error");
      setError(res.error ?? "No se pudo iniciar la carga.");
      return;
    }

    setAssetId(res.assetId);

    // PUT directo al proveedor de video — XHR para poder trackear progreso real.
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", res.uploadUrl, true);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) setProgress(Math.round((evt.loaded / evt.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStep("processing");
      } else {
        setStep("error");
        setError("Falló la subida del archivo al proveedor de video.");
      }
    };
    xhr.onerror = () => {
      setStep("error");
      setError("Falló la subida del archivo al proveedor de video.");
    };
    xhr.send(file);
  }, [file, title, description, gameSlug, extraTags, isExclusive]);

  const busy = step === "uploading" || step === "processing";

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-[#0B0F19]/60 backdrop-blur-md p-6 sm:p-7 space-y-5">
      <div className="flex items-center gap-2">
        <Film className="h-4 w-4 text-cyan-300" />
        <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-[0.3em]">
          {"// subir video exclusivo"}
        </p>
      </div>

      {step === "ready" ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="h-9 w-9 text-cyan-400" />
          <p className="text-sm text-white/70">Video procesado y listo para reproducirse.</p>
          <button
            onClick={() => {
              setStep("idle"); setFile(null); setTitle(""); setDescription("");
              setExtraTags([]); setIsExclusive(false); setAssetId(null); setProgress(0);
            }}
            className="text-xs font-mono text-cyan-400/70 hover:text-cyan-300 underline underline-offset-4"
          >
            Subir otro video
          </button>
        </div>
      ) : (
        <>
          {/* Drag & drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 px-6 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              dragOver
                ? "border-cyan-400/70 bg-cyan-500/10"
                : "border-white/10 bg-white/[0.02] hover:border-cyan-500/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <UploadCloud className="h-8 w-8 text-cyan-400/50" />
            <p className="text-sm text-white/50 text-center">
              {file ? file.name : "Arrastrá un video acá o hacé clic para elegir uno"}
            </p>
            {file && <p className="text-[10px] text-white/25 font-mono">{(file.size / 1_000_000).toFixed(1)} MB</p>}
          </div>

          {/* Título / descripción */}
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del video"
              disabled={busy}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/25 font-mono focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              disabled={busy}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/25 font-mono focus:outline-none focus:border-cyan-500/50 disabled:opacity-50 resize-none"
            />
          </div>

          {/* Hashtags promocionales */}
          <div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">
              Hashtags promocionales *
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/20 border border-cyan-500/50 text-cyan-200">
                <Lock className="h-3 w-3" /> {PROMO_HASHTAG}
              </span>
              {extraTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white/60"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} disabled={busy} className="hover:text-red-400 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="#OtroHashtag"
                disabled={busy}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs placeholder:text-white/25 font-mono focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
              />
              <button
                onClick={addTag}
                disabled={busy}
                type="button"
                className="px-3 py-2 rounded-lg border border-white/10 text-white/50 text-xs font-mono hover:text-white/80 hover:border-white/20 transition-colors disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
            <p className="text-[10px] text-white/20 font-mono mt-1.5">
              {`${PROMO_HASHTAG} va siempre incluido — no se puede quitar.`}
            </p>
          </div>

          {/* Toggle contenido exclusivo */}
          <button
            type="button"
            onClick={() => setIsExclusive((v) => !v)}
            disabled={busy}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all disabled:opacity-50 ${
              isExclusive
                ? "border-pink-500/40 bg-pink-500/10"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {isExclusive ? <Lock className="h-4 w-4 text-pink-300" /> : <Unlock className="h-4 w-4 text-white/30" />}
            <div className="text-left flex-1">
              <p className={`text-sm font-bold ${isExclusive ? "text-pink-200" : "text-white/60"}`}>
                Contenido Exclusivo
              </p>
              <p className="text-[10px] text-white/30 font-mono">
                {isExclusive ? "Solo visible para usuarios logueados" : "Visible para todo el público"}
              </p>
            </div>
            <div className={`w-10 h-5 rounded-full border transition-colors relative shrink-0 ${
              isExclusive ? "bg-pink-500/40 border-pink-500/60" : "bg-white/10 border-white/15"
            }`}>
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${
                isExclusive ? "left-5" : "left-0.5"
              }`} />
            </div>
          </button>

          {/* Progreso */}
          {busy && (
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-cyan-400/80 transition-[width] duration-300"
                  style={{ width: `${step === "processing" ? 100 : progress}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-white/30 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                {step === "uploading" ? `Subiendo… ${progress}%` : "Procesando en el servidor de video…"}
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400/80 font-mono flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={busy || !file}
            className="shine-btn w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-100 font-mono text-sm font-bold hover:shadow-[0_0_18px_rgba(0,240,255,0.25)] transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {busy ? "Subiendo…" : "Publicar video"}
          </button>
        </>
      )}
    </div>
  );
}
