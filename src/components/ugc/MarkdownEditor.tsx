"use client";

import { useState, useRef } from "react";
import { Code2, Eye, Columns2 } from "lucide-react";
import { MarkdownPreview } from "./MarkdownPreview";

type ViewMode = "editor" | "preview" | "split";

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
}

const FORMAT_BUTTONS = [
  { label: "B",    before: "**",    after: "**",  title: "Negrita" },
  { label: "I",    before: "_",     after: "_",   title: "Cursiva" },
  { label: "H2",   before: "## ",   after: "",    title: "Subtítulo" },
  { label: "H3",   before: "### ",  after: "",    title: "Sección" },
  { label: "`",    before: "`",     after: "`",   title: "Código inline" },
  { label: "```",  before: "```\n", after: "\n```", title: "Bloque de código" },
  { label: "> ",   before: "> ",    after: "",    title: "Cita" },
  { label: "—",    before: "\n---\n", after: "",  title: "Separador" },
];

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [mode, setMode] = useState<ViewMode>("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSnippet = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const wordCount  = value.split(/\s+/).filter(Boolean).length;
  const lineCount  = value.split("\n").length;

  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden bg-black/20">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/8 bg-black/30">
        <div className="flex items-center gap-0.5 flex-wrap">
          {FORMAT_BUTTONS.map(({ label, before, after, title }) => (
            <button
              key={label}
              title={title}
              onClick={() => insertSnippet(before, after)}
              className="px-2 py-1 text-[10px] font-mono font-bold text-white/30 hover:text-white/70 hover:bg-white/5 rounded transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 border border-white/8 rounded-lg p-0.5">
          {([
            { id: "editor" as ViewMode,  icon: <Code2 className="h-3.5 w-3.5" />,    label: "Editor" },
            { id: "split"  as ViewMode,  icon: <Columns2 className="h-3.5 w-3.5" />, label: "Split"  },
            { id: "preview"as ViewMode,  icon: <Eye className="h-3.5 w-3.5" />,      label: "Preview" },
          ]).map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              title={label}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono transition-all ${
                mode === id
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-white/25 hover:text-white/60"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Panels ── */}
      <div
        className={`flex ${mode === "split" ? "divide-x divide-white/5" : ""}`}
        style={{ height: "520px" }}
      >
        {/* Editor panel */}
        {(mode === "editor" || mode === "split") && (
          <div className={`flex flex-col ${mode === "split" ? "w-1/2" : "w-full"}`}>
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-black/20">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                <div className="w-2 h-2 rounded-full bg-green-500/40" />
              </div>
              <span className="text-[9px] font-mono text-white/15">markdown</span>
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-transparent resize-none p-4 text-xs font-mono text-white/70 placeholder:text-white/15 focus:outline-none leading-relaxed"
              placeholder={"# Tu publicación comienza aquí…\n\nEscribe en Markdown o usa los atajos de arriba."}
              style={{ tabSize: 2 }}
            />
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/5 bg-black/10">
              <span className="text-[9px] font-mono text-white/15">
                {value.length} chars · {lineCount} líneas
              </span>
              <span className="text-[9px] font-mono text-white/10">
                {wordCount} palabras
              </span>
            </div>
          </div>
        )}

        {/* Preview panel */}
        {(mode === "preview" || mode === "split") && (
          <div className={`flex flex-col overflow-hidden ${mode === "split" ? "w-1/2" : "w-full"}`}>
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-black/20">
              <Eye className="h-3 w-3 text-white/15" />
              <span className="text-[9px] font-mono text-white/15">preview en vivo</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {value.trim() ? (
                <MarkdownPreview content={value} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs font-mono text-white/15">
                    {"// preview vacío — empieza a escribir"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
