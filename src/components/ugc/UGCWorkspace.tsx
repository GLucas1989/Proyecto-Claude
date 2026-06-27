"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TemplateSelector, type TemplateId } from "./TemplateSelector";
import { MarkdownEditor } from "./MarkdownEditor";
import { AttachmentUploader } from "./AttachmentUploader";
import { VideoLinkInput } from "./VideoLinkInput";
import { ChevronRight, Save, Send, Lock, Globe, Sparkles } from "lucide-react";
import type { PublicationType } from "@/types/database";

/** Distingue enlaces de video (YouTube) de archivos subidos al storage. */
function isVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

interface UGCWorkspaceProps {
  gameSlug: string;
  gameName: string;
  publicationId?: string;
  initialData?: {
    title: string;
    type: PublicationType;
    content: string;
    attachments: string[];
    isPremium: boolean;
  };
}

const TYPE_LABELS: Record<PublicationType, string> = {
  GUIDE:     "// Guía",
  BUILD:     "// Build",
  TIER_LIST: "// Tier List",
};

export function UGCWorkspace({ gameSlug, gameName, publicationId, initialData }: UGCWorkspaceProps) {
  const router = useRouter();
  const [step, setStep]               = useState<"template" | "editor">(publicationId ? "editor" : "template");
  const [title, setTitle]             = useState(initialData?.title ?? "");
  const [type, setType]               = useState<PublicationType>(initialData?.type ?? "GUIDE");
  const [content, setContent]         = useState(initialData?.content ?? "");
  const [attachments, setAttachments] = useState<string[]>(initialData?.attachments ?? []);
  const [isPremium, setIsPremium]     = useState(initialData?.isPremium ?? false);
  const [saving, setSaving]           = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [saved, setSaved]             = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleTemplateSelect = useCallback(
    (_id: TemplateId, markdown: string, pubType: PublicationType) => {
      setType(pubType);
      setContent(markdown);
      setStep("editor");
    },
    [],
  );

  const handleSaveDraft = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { saveDraft } = await import("@/app/actions/ugc");
      await saveDraft({ publicationId, gameSlug, title, type, content, attachments, isPremium });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!title.trim() || content.length < 100) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { submitForReview } = await import("@/app/actions/ugc");
      const result = await submitForReview({ publicationId, gameSlug, title, type, content, attachments, isPremium });
      if (result?.id) {
        router.push(`/dashboard?submitted=${result.id}`);
      }
    } catch {
      setSubmitError("Error al enviar. Guardá un borrador e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && content.length >= 100;

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* ── Sticky header ── */}
      <div className="border-b border-cyan-500/10 bg-black/40 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-mono text-white/25 shrink-0">
            <span className="hover:text-white/50 cursor-pointer" onClick={() => router.push(`/${gameSlug}`)}>
              {gameName}
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-cyan-400/70">UGC Workspace</span>
            {step === "editor" && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white/40 font-bold">{TYPE_LABELS[type]}</span>
              </>
            )}
          </nav>

          <div className="flex-1" />

          {step === "editor" && (
            <>
              {/* Type selector */}
              <div className="flex items-center gap-0.5 border border-white/8 rounded-lg p-0.5">
                {(["GUIDE", "BUILD", "TIER_LIST"] as PublicationType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                      type === t
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25"
                        : "text-white/25 hover:text-white/60"
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              {/* Premium toggle */}
              <button
                onClick={() => setIsPremium((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                  isPremium
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                    : "border-white/8 text-white/25 hover:text-white/50"
                }`}
              >
                {isPremium ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {isPremium ? "Premium" : "Free"}
              </button>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || !title.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/40 text-xs font-mono hover:border-white/20 hover:text-white/70 transition-colors disabled:opacity-30"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saved ? "Guardado ✓" : saving ? "Guardando…" : "Borrador"}
                </button>
                <button
                  onClick={handleSubmitForReview}
                  disabled={submitting || !canSubmit}
                  title={!canSubmit ? "Necesitás un título y al menos 100 caracteres de contenido" : undefined}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? "Enviando…" : "Enviar a revisión"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        {step === "template" ? (
          <TemplateSelector onSelect={handleTemplateSelect} />
        ) : (
          <>
            {/* Title input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono text-white/20 select-none pointer-events-none">
                title:
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="El título de tu publicación…"
                maxLength={120}
                className="w-full bg-white/[0.02] border border-white/8 rounded-xl pl-16 pr-16 py-3.5 text-white text-sm font-semibold placeholder:text-white/15 focus:outline-none focus:border-cyan-500/30 focus:bg-white/[0.04] transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/15">
                {title.length}/120
              </span>
            </div>

            {/* Markdown editor */}
            <MarkdownEditor value={content} onChange={setContent} />

            {/* Attachment uploader (PDF/PPT/audio) */}
            <AttachmentUploader
              gameSlug={gameSlug}
              value={attachments.filter((u) => !isVideoUrl(u))}
              onChange={(files) => setAttachments([...attachments.filter(isVideoUrl), ...files])}
            />

            {/* Video links (YouTube Unlisted) */}
            <VideoLinkInput
              value={attachments.filter(isVideoUrl)}
              onChange={(videos) => setAttachments([...attachments.filter((u) => !isVideoUrl(u)), ...videos])}
            />

            {/* Premium info */}
            {isPremium && (
              <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-mono font-bold text-violet-300">
                    Contenido Premium — Split 50 / 50
                  </span>
                </div>
                <p className="text-xs text-white/35 font-mono leading-relaxed">
                  {"// 50% de los ingresos van a tu billetera · 50% a la plataforma"}<br />
                  {"// +20 pts de reputación cada vez que alguien se suscribe a tu guía"}
                </p>
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <p className="text-xs font-mono text-red-400/80 px-1">{submitError}</p>
            )}

            {/* Character count hint */}
            {content.length < 100 && content.length > 0 && (
              <p className="text-[10px] font-mono text-white/20 px-1">
                {"// mínimo 100 caracteres para enviar a revisión · "}
                {100 - content.length} restantes
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
