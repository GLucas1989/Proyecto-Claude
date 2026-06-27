import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { approvePublication, rejectPublication } from "@/app/actions/ugc";
import { listCreators } from "@/app/actions/admin";
import { TrustedCreatorsManager } from "@/components/admin/TrustedCreatorsManager";
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, BookOpen, Swords, Trophy, AlertTriangle,
} from "lucide-react";
import type { UserPublication } from "@/types/database";

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/dashboard/admin/moderation");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") notFound();

  const { data: pending } = await supabase
    .from("user_publications")
    .select("*, profiles(display_name, email)")
    .eq("status", "PENDING_REVIEW")
    .order("updated_at", { ascending: true });

  const queue = (pending ?? []) as (UserPublication & { profiles: { display_name: string | null; email: string } | null })[];

  const creators = await listCreators();

  const TYPE_ICON: Record<string, React.ReactNode> = {
    GUIDE:     <BookOpen className="h-4 w-4 text-cyan-400" />,
    BUILD:     <Swords className="h-4 w-4 text-violet-400" />,
    TIER_LIST: <Trophy className="h-4 w-4 text-orange-400" />,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="h-5 w-5 text-cyan-400" />
        <div>
          <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest">
            {"// admin › moderación"}
          </p>
          <h1 className="text-xl font-black text-white">
            Cola de Revisión
            <span className="ml-2 text-sm font-mono font-normal text-white/30">
              ({queue.length} pendientes)
            </span>
          </h1>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.01] p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-400/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white/40">Cola vacía</p>
          <p className="text-xs text-white/20 font-mono mt-1">{"// no hay publicaciones pendientes de revisión"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((pub) => (
            <article
              key={pub.id}
              className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.02] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start gap-3 px-5 py-4 border-b border-amber-500/10">
                <div className="mt-0.5">{TYPE_ICON[pub.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{pub.title}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[10px] font-mono text-white/30">
                      {pub.profiles?.display_name ?? pub.profiles?.email ?? "Usuario desconocido"}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400/50">
                      <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                      {new Date(pub.updated_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[10px] font-mono text-white/20">
                      /{pub.game_slug} · {pub.type}
                      {pub.is_premium && " · 🔒 Premium"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content preview */}
              <div className="px-5 py-3">
                <p className="text-xs font-mono text-white/35 leading-relaxed line-clamp-4">
                  {pub.content_markdown.slice(0, 400).replace(/[#>*`]/g, "")}{pub.content_markdown.length > 400 ? "…" : ""}
                </p>
                {pub.attachments_urls.length > 0 && (
                  <p className="text-[10px] font-mono text-white/20 mt-2">
                    📎 {pub.attachments_urls.length} adjunto(s)
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 px-5 py-3 border-t border-amber-500/10 bg-black/10">
                <Link
                  href={`/ugc/${pub.id}/preview`}
                  className="text-[10px] font-mono text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
                >
                  Ver preview completo →
                </Link>
                <div className="flex-1" />

                {/* Reject form */}
                <form
                  action={async (fd: FormData) => {
                    "use server";
                    const reason = fd.get("reason") as string;
                    await rejectPublication(pub.id, reason || "Revisá el contenido y volvé a enviar.");
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    name="reason"
                    placeholder="Motivo de rechazo (opcional)"
                    className="text-[10px] font-mono bg-white/[0.02] border border-white/8 rounded-lg px-2.5 py-1.5 text-white/50 placeholder:text-white/15 focus:outline-none focus:border-red-500/30 w-48"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/25 bg-red-500/8 text-red-400 text-[10px] font-mono font-bold hover:bg-red-500/15 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Rechazar
                  </button>
                </form>

                {/* Approve */}
                <form
                  action={async () => {
                    "use server";
                    await approvePublication(pub.id);
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-[10px] font-mono font-bold hover:bg-green-500/20 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Publicar
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Gestión de creadores de confianza (auto-publicación) */}
      <div className="mt-10">
        <TrustedCreatorsManager initial={creators} />
      </div>
    </div>
  );
}
