import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * CTA flotante para móvil (oculto en >= md). Barra sticky inferior de alta
 * visibilidad (#00F0FF) que invita a reclamar perfil / unirse.
 */
export function MobileClaimCTA() {
  return (
    <Link
      href="/auth/login?redirectTo=/dashboard"
      className="shine-btn neon-pulse md:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-2 py-3.5 rounded-2xl
                 border border-cyan-400/60 bg-gradient-to-r from-cyan-500/90 to-cyan-400/90 text-[#021016]
                 font-black text-sm tracking-wide
                 active:scale-[0.98] transition-transform"
    >
      <Sparkles className="h-4 w-4" />
      Reclamar perfil / Unirme
    </Link>
  );
}
