import { FileSpreadsheet, Download, ExternalLink } from "lucide-react";

interface PPTDownloadProps {
  url: string;
  title: string;
  description?: string;
  fileSizeBytes?: number | null;
  /** Optional Google Slides / OneDrive preview URL */
  previewUrl?: string;
}

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PPTDownload({ url, title, description, fileSizeBytes, previewUrl }: PPTDownloadProps) {
  const downloadName = `${title.replace(/\s+/g, "-").toLowerCase()}.pptx`;
  const size = formatSize(fileSizeBytes);

  return (
    <div className="rounded-2xl border border-orange-500/15 bg-orange-500/[0.03] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-orange-500/10">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-orange-500/20 bg-orange-500/8 shrink-0">
          <FileSpreadsheet className="h-5 w-5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{title}</p>
          {description && (
            <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{description}</p>
          )}
        </div>
        {size && (
          <span className="shrink-0 text-[10px] font-mono text-white/20">{size}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 py-3">
        <a
          href={url}
          download={downloadName}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-orange-500/25 bg-orange-500/8 text-orange-300 text-xs font-mono font-semibold hover:bg-orange-500/15 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar .PPTX
        </a>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/8 text-white/35 text-xs font-mono hover:border-white/20 hover:text-white/60 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver en línea
          </a>
        )}
        <p className="ml-auto text-[10px] text-white/20 font-mono">
          {"// Microsoft PowerPoint / Google Slides"}
        </p>
      </div>
    </div>
  );
}
