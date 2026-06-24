import { Zap, ArrowRight } from "lucide-react";

export function SponsoredCard() {
  return (
    <div className="relative rounded-xl border border-dashed border-white/12 bg-white/[0.015] overflow-hidden group hover:border-cyan-500/25 transition-colors duration-300">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#22d3ee04_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee04_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-5 py-4">
        {/* Left: icon slot */}
        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-cyan-500/20 bg-cyan-500/5 text-cyan-500/40 group-hover:border-cyan-500/40 group-hover:text-cyan-500/60 transition-colors">
          <Zap className="w-4 h-4" />
        </div>

        {/* Center: copy */}
        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-cyan-500/40">// sponsored</span>
          </div>
          <p className="text-sm font-semibold text-white/30">Espacio publicitario nativo</p>
          <p className="text-xs text-white/20 mt-0.5">Alcanzá a miles de gamers hispanohablantes con contenido integrado.</p>
        </div>

        {/* Right: CTA */}
        <a
          href="mailto:hola@creatorsshub.com?subject=Publicidad nativa en Creators S-HUB"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 hover:bg-cyan-500/8 hover:text-cyan-300 text-white/30 text-xs font-mono transition-all duration-200"
        >
          Contactar
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
