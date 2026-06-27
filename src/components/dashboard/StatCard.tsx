import type { LucideIcon } from "lucide-react";

type Accent = "cyan" | "pink" | "violet";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: Accent;
}

const ACCENT = {
  cyan:   { icon: "text-cyan-300",   border: "border-cyan-500/25",   glow: "from-cyan-500/[0.08]" },
  pink:   { icon: "text-pink-300",   border: "border-pink-500/25",   glow: "from-pink-500/[0.08]" },
  violet: { icon: "text-violet-300", border: "border-violet-500/25", glow: "from-violet-500/[0.08]" },
} as const;

/**
 * Tarjeta de métrica con glassmorphism suave: fondo oscuro translúcido (0.5),
 * borde brillante de 1px y blur. Icono junto a la etiqueta para lectura rápida.
 */
export function StatCard({ icon: Icon, label, value, hint, accent = "cyan" }: StatCardProps) {
  const a = ACCENT[accent];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${a.border} bg-[#0B0F19]/50 backdrop-blur-md p-5 transition-all hover:border-opacity-60`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${a.glow} to-transparent`} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${a.icon}`} />
          <p className="text-xs font-mono text-white/50 uppercase tracking-widest">{label}</p>
        </div>
        <p className="text-3xl font-black text-white tabular-nums">{value}</p>
        {hint && <p className="text-[10px] text-white/30 font-mono mt-1">{hint}</p>}
      </div>
    </div>
  );
}
