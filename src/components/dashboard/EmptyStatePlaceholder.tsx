import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Accent = "cyan" | "pink";

interface EmptyStatePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  ctaIcon?: LucideIcon;
  accent?: Accent;
}

const ACCENT = {
  cyan: {
    border: "border-cyan-500/25",
    ring: "border-cyan-500/30 bg-cyan-500/[0.06] shadow-[0_0_30px_rgba(0,240,255,0.12)]",
    iconColor: "text-cyan-300",
    glowFrom: "from-cyan-500/[0.07]",
    btn: "border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-200 hover:from-cyan-500/30 hover:to-cyan-400/20 hover:shadow-[0_0_24px_rgba(0,240,255,0.25)]",
  },
  pink: {
    border: "border-pink-500/25",
    ring: "border-pink-500/30 bg-pink-500/[0.06] shadow-[0_0_30px_rgba(244,63,94,0.12)]",
    iconColor: "text-pink-300",
    glowFrom: "from-pink-500/[0.07]",
    btn: "border-pink-500/40 bg-gradient-to-r from-pink-500/20 to-pink-400/10 text-pink-200 hover:from-pink-500/30 hover:to-pink-400/20 hover:shadow-[0_0_24px_rgba(244,63,94,0.25)]",
  },
} as const;

/**
 * Empty state reutilizable (Alumno/Creador). El CTA es el protagonista:
 * icono grande centrado, borde sutil de la paleta y botón con glow.
 */
export function EmptyStatePlaceholder({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  ctaIcon: CtaIcon,
  accent = "cyan",
}: EmptyStatePlaceholderProps) {
  const a = ACCENT[accent];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-dashed ${a.border} bg-white/[0.015] px-6 py-10 sm:py-12 flex flex-col items-center text-center gap-5`}
    >
      {/* glow radial sutil */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${a.glowFrom} to-transparent`} />

      <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border ${a.ring}`}>
        <Icon className={`h-7 w-7 ${a.iconColor}`} strokeWidth={1.6} />
      </div>

      <div className="relative max-w-xs">
        <p className="text-base font-bold text-white mb-1.5">{title}</p>
        <p className="text-xs font-mono text-white/35 leading-relaxed">{description}</p>
      </div>

      <Link
        href={ctaHref}
        className={`relative inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border font-mono text-sm font-bold transition-all duration-200 shadow-[0_0_10px_rgba(0,240,255,0.3)] hover:scale-[1.02] active:scale-95 ${a.btn}`}
      >
        {CtaIcon && <CtaIcon className="h-4 w-4" />}
        {ctaLabel}
      </Link>
    </div>
  );
}
