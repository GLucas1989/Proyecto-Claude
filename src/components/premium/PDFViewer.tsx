"use client";

import { useState } from "react";
import { FileText, Download, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";

interface PDFViewerProps {
  url: string;
  title: string;
  fileName?: string;
}

export function PDFViewer({ url, title, fileName }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);

  const downloadName = fileName ?? `${title.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return (
    <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-red-500/10 bg-black/20">
        <FileText className="h-4 w-4 text-red-400 shrink-0" />
        <span className="text-sm font-semibold text-white/70 truncate flex-1">{title}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            title="Reducir zoom"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] font-mono text-white/25 w-10 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={url}
            download={downloadName}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/8 text-red-400 text-xs font-mono hover:bg-red-500/15 transition-colors"
          >
            <Download className="h-3 w-3" />
            PDF
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* PDF iframe embed */}
      <div className="w-full overflow-auto bg-[#0a0a0f]">
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0&zoom=${zoom}`}
          title={title}
          className="w-full border-0 transition-all duration-200"
          style={{ height: "600px" }}
        />
      </div>
    </div>
  );
}
