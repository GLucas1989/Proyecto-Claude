import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Zap, User, ShieldCheck, Clock } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirectTo=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: claimedProfile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: pendingClaim } = await supabase
    .from("claim_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  const roleLabel = profile?.role === "CREATOR"
    ? "Creador verificado"
    : profile?.role === "ADMIN"
    ? "Administrador"
    : "Usuario";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.3em] mb-1">
          {"// panel de control"}
        </p>
        <h1 className="text-2xl font-black text-white">
          Hola, <span className="text-cyan-400">{profile?.display_name ?? user.email}</span>
        </h1>
        <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-white/50">
          {profile?.role === "CREATOR" ? <ShieldCheck className="h-3 w-3 text-cyan-400" /> : <User className="h-3 w-3" />}
          {roleLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Perfil reclamado */}
        {claimedProfile ? (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <p className="text-sm font-semibold text-white">Perfil reclamado</p>
            </div>
            <p className="text-xs text-white/50 font-mono">/{claimedProfile.game_slug}/{claimedProfile.slug}</p>
            <p className="text-[10px] text-cyan-400/60 mt-1 font-mono">
              {claimedProfile.verified ? "✓ Verificado" : "⏳ Pendiente de verificación"}
            </p>
          </div>
        ) : pendingClaim ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-semibold text-white">Solicitud en revisión</p>
            </div>
            <p className="text-xs text-white/50 font-mono">
              {pendingClaim.game_slug}/{pendingClaim.creator_slug}
            </p>
            <p className="text-[10px] text-amber-400/60 mt-1 font-mono">
              Revisaremos tu solicitud en 24-48 hs
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-white/30" />
              <p className="text-sm font-semibold text-white/50">Sin perfil reclamado</p>
            </div>
            <p className="text-xs text-white/30">
              {"Visitá tu perfil en el directorio y hacé clic en \"Reclamar este perfil\"."}
            </p>
          </div>
        )}

        {/* Info de cuenta */}
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
          <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3">{"// cuenta"}</p>
          <p className="text-xs text-white/50 font-mono truncate">{user.email}</p>
          <p className="text-[10px] text-white/25 font-mono mt-1">
            Registrado: {new Date(user.created_at).toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>
    </div>
  );
}
