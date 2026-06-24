import { FileText, FileSpreadsheet, Headphones, Video, Download, ExternalLink } from "lucide-react";
import type { PlatformContentType } from "@/types/database";
import type { PlatformContentItem } from "@/app/actions/gameSubscription";

const TYPE_CONFIG: Record<
  PlatformContentType,
  { icon: React.ElementType; label: string; color: string; border: string; bg: string }
> = {
  pdf:   { icon: FileText,        label: "PDF",       color: "text-red-400",    border: "border-red-500/20",    bg: "bg-red-500/5"    },
  ppt:   { icon: FileSpreadsheet, label: "PPT",       color: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/5" },
  audio: { icon: Headphones,      label: "AUDIO",     color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/5" },
  video: { icon: Video,           label: "VIDEO",     color: "text-cyan-400",   border: "border-cyan-500/20",   bg: "bg-cyan-500/5"   },
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface ContentItemProps {
  item: PlatformContentItem;
}

export function ContentItem({ item }: ContentItemProps) {
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg.icon;
  const isDownloadable = item.type === "pdf" || item.type === "ppt";
  const meta = [
    formatSize(item.file_size_bytes),
    formatDuration(item.duration_seconds),
  ].filter(Boolean).join(" · ");

  return (
    <div className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl border ${cfg.border} ${cfg.bg} hover:brightness-110 transition-all`}>
      {/* Icon */}
      <div className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border ${cfg.border} bg-black/20`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${cfg.color} opacity-70`}>
            {cfg.label}
          </span>
          {meta && (
            <span className="text-[10px] text-white/25 font-mono">{meta}</span>
          )}
        </div>
        {item.description && (
          <p className="text-[11px] text-white/35 mt-1 line-clamp-1">{item.description}</p>
        )}
      </div>

      {/* CTA */}
      <a
        href={item.file_url}
        target={isDownloadable ? undefined : "_blank"}
        rel="noopener noreferrer"
        download={isDownloadable}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${cfg.border} text-xs font-mono ${cfg.color} hover:bg-black/20 transition-all`}
      >
        {isDownloadable ? (
          <><Download className="h-3 w-3" /> Descargar</>
        ) : (
          <><ExternalLink className="h-3 w-3" /> Ver</>
        )}
      </a>
    </div>
  );
}
