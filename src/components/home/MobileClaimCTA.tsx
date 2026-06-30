"use client";

import Link from "next/link";
import { Sparkles, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * CTA flotante para móvil (oculto en >= md). Reactivo a la sesión:
 * - Sin sesión  → "Reclamar perfil / Unirme" → /auth/login
 * - Con sesión  → "Ir a mi Dashboard" → /dashboard
 * Durante la carga inicial no renderiza nada (evita el flicker invitado↔usuario).
 */
export function MobileClaimCTA() {
  const { user, loading } = useAuth();

  // Evita el parpadeo entre estado invitado y autenticado
  if (loading) return null;

  const authed = !!user;
  const href = authed ? "/dashboard" : "/auth/login?redirectTo=/dashboard";

  return (
    <Link
      href={href}
      className="shine-btn neon-pulse md:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-2 py-3.5 rounded-2xl
                 border border-cyan-400/60 bg-gradient-to-r from-cyan-500/90 to-cyan-400/90 text-[#021016]
                 font-black text-sm tracking-wide
                 active:scale-[0.98] transition-transform"
    >
      {authed ? (
        <>
          <LayoutDashboard className="h-4 w-4" />
          Ir a mi Dashboard
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Reclamar perfil / Unirme
        </>
      )}
    </Link>
  );
}
