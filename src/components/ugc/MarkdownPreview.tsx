import DOMPurify from "isomorphic-dompurify";

interface MarkdownPreviewProps {
  content: string;
}

// Allowed HTML tags produced by mdToHtml — nothing else survives DOMPurify.
// class= attributes are allowed so Tailwind styles pass through intact.
// Type is widened to satisfy both isomorphic-dompurify and @types/dompurify overloads.
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3",
    "p", "br", "hr", "div",
    "strong", "em", "code", "pre",
    "blockquote",
    "ul", "ol", "li",
    "table", "tr", "th", "td",
    "span",
  ] as string[],
  ALLOWED_ATTR: ["class"] as string[],
  // Explicitly block anything that could execute scripts
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"] as string[],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "href", "src", "action"] as string[],
};

function mdToHtml(content: string): string {
  return content
    // Fenced code blocks — escape HTML entities inside to prevent injection
    .replace(/```[\w]*\n([\s\S]*?)```/g, (_m, code) => {
      const escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<pre class="bg-black/40 border border-white/8 rounded-xl p-4 my-3 overflow-x-auto"><code class="text-[10px] font-mono text-green-300/70 leading-relaxed whitespace-pre">${escaped}</code></pre>`;
    })
    // Headings
    .replace(/^# (.+)$/gm,   '<h1 class="text-xl font-bold text-white font-mono mb-3 mt-5 first:mt-0">$1</h1>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-base font-bold text-cyan-300 font-mono mb-2 mt-4 border-b border-cyan-500/10 pb-1">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-violet-300 font-mono mb-1.5 mt-3">$1</h3>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-cyan-500/40 pl-3 italic text-white/50 text-xs my-3">$1</blockquote>')
    // HR
    .replace(/^---$/gm, '<hr class="border-white/8 my-4" />')
    // Bold / italic / inline code
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/_(.+?)_/g,       '<em class="text-white/70 italic">$1</em>')
    .replace(/`([^`]+)`/g,     '<code class="bg-white/5 text-cyan-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/8">$1</code>')
    // Unordered list items
    .replace(/^[-*] (.+)$/gm,
      '<li class="flex gap-2 text-xs text-white/60 font-mono my-1"><span class="text-cyan-500/50 shrink-0">›</span><span>$1</span></li>',
    )
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm,
      '<li class="flex gap-2 text-xs text-white/60 font-mono my-1"><span class="text-violet-400/50 shrink-0">•</span><span>$1</span></li>',
    )
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, (m) => `<ul class="my-2 space-y-0.5 list-none">${m}</ul>`)
    // Table rows (skip separator rows)
    .replace(/^\|(.+)\|$/gm, (row) => {
      if (/^[\s|:-]+$/.test(row)) return "";
      const cells = row.split("|").slice(1, -1).map((c) => c.trim());
      return `<tr class="border-b border-white/5">${cells
        .map((c) => `<td class="text-[10px] font-mono text-white/50 py-1.5 px-3">${c}</td>`)
        .join("")}</tr>`;
    })
    // Wrap consecutive <tr> in <table>
    .replace(/(<tr[\s\S]*?<\/tr>\n?)+/g, (m) =>
      `<table class="w-full border border-white/8 rounded-lg overflow-hidden my-3">${m}</table>`,
    )
    // Paragraph spacing
    .replace(/\n\n/g, '<div class="mb-3"></div>')
    .replace(/\n/g, "<br />");
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const rawHtml  = mdToHtml(content);
  const safeHtml = DOMPurify.sanitize(rawHtml, DOMPURIFY_CONFIG) as string;

  return (
    <div
      className="text-xs leading-relaxed"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
