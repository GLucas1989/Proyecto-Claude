import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MarkdownPreview } from "@/components/ugc/MarkdownPreview";
import { VoteSection } from "@/components/ugc/VoteSection";
import { incrementViews } from "@/app/actions/ugc";
import { VideoEmbed } from "@/components/media/VideoEmbed";
import { PublicationRating } from "@/components/ugc/PublicationRating";
import { youTubeUnlistedAsset, parseYouTubeId } from "@/lib/media/types";
import {
  BookOpen, Swords, Trophy, ChevronRight, Lock,
  Calendar, Eye, Paperclip, Download, FileText, FileSpreadsheet,
  Star, ShieldCheck,
} from "lucide-react";
import type { UserPublication } from "@/types/database";

interface PublicationPageProps {
  params: Promise<{ publicationId: string }>;
}

// ── Metadata dinámica ──────────────────────────────────────────────────────────
export async function generateMetadata({ params }: PublicationPageProps): Promise<Metadata> {
  const { publicationId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_publications")
    .select("title, content_markdown, game_slug, type")
    .eq("id", publicationId)
    .eq("status", "PUBLISHED")
    .single();

  if (!data) return { title: "Guía no encontrada" };

  const excerpt = (data.content_markdown as string)
    .replace(/[#>*`_]/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 155);

  return {
    title: `${data.title} — CREATORS S-HUB`,
    description: excerpt,
    openGraph: {
      title: data.title as string,
      description: excerpt,
      type: "article",
    },
  };
}

const TYPE_CONFIG = {
  GUIDE:     { icon: <BookOpen className="h-4 w-4" />,  label: "Guía",      color: "text-cyan-400",   border: "border-cyan-500/20",   bg: "bg-cyan-500/[0.05]"   },
  BUILD:     { icon: <Swords className="h-4 w-4" />,    label: "Build",     color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/[0.05]" },
  TIER_LIST: { icon: <Trophy className="h-4 w-4" />,    label: "Tier List", color: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/[0.05]" },
};

function AttachmentIcon({ url }: { url: string }) {
  return url.endsWith(".pdf")
    ? <FileText className="h-4 w-4 text-red-400 shrink-0" />
    : <FileSpreadsheet className="h-4 w-4 text-orange-400 shrink-0" />;
}

// ── Página principal ───────────────────────────────────────────────────────────
export default async function PublicationPage({ params }: PublicationPageProps) {
  const { publicationId } = await params;
  const supabase = await createClient();

  // ── 1. Obtener publicación ──────────────────────────────────────────────────
  const { data: pubRaw } = await supabase
    .from("user_publications")
    .select("*")
    .eq("id", publicationId)
    .eq("status", "PUBLISHED")
    .single();

  if (!pubRaw) notFound();
  const pub = pubRaw as UserPublication;

  // ── 2. Obtener datos del autor + reputación ──────────────────────────────────
  const [authorResult, reputationResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, email, avatar_url")
      .eq("id", pub.user_id)
      .single(),
    supabase
      .from("user_reputation")
      .select("points, rank_title, guides_published")
      .eq("user_id", pub.user_id)
      .maybeSingle(),
  ]);

  const author     = authorResult.data;
  const reputation = reputationResult.data;

  // ── 3. Obtener votos ─────────────────────────────────────────────────────────
  const { data: votes } = await supabase
    .from("publication_votes")
    .select("vote_type")
    .eq("publication_id", publicationId);

  const upvotes   = votes?.filter((v) => v.vote_type === "UPVOTE").length  ?? 0;
  const downvotes = votes?.filter((v) => v.vote_type === "DOWNVOTE").length ?? 0;

  // ── 4. Verificar voto del usuario autenticado ────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();

  let userVote: "UPVOTE" | "DOWNVOTE" | null = null;
  if (user) {
    const { data: myVote } = await supabase
      .from("publication_votes")
      .select("vote_type")
      .eq("publication_id", publicationId)
      .eq("user_id", user.id)
      .maybeSingle();
    userVote = (myVote?.vote_type as "UPVOTE" | "DOWNVOTE") ?? null;
  }

  // ── 5. Verificar acceso a contenido premium ──────────────────────────────────
  // Regla: si is_premium = true, el lector necesita suscripción activa al juego
  // o ser el propio autor.
  const isAuthor = user?.id === pub.user_id;
  let hasAccess = !pub.is_premium || isAuthor;

  if (pub.is_premium && !isAuthor && user) {
    const { data: gameSub } = await supabase
      .from("game_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("game_slug", pub.game_slug)
      .eq("status", "active")
      .maybeSingle();
    hasAccess = !!gameSub;
  }

  // ── 6. Registrar vista (best-effort, no bloquea render) ─────────────────────
  void incrementViews(publicationId);

  // ── 7. Config de tipo ────────────────────────────────────────────────────────
  const cfg = TYPE_CONFIG[pub.type] ?? TYPE_CONFIG.GUIDE;

  const authorName   = author?.display_name ?? author?.email?.split("@")[0] ?? "Anónimo";
  const publishedDate = pub.published_at
    ? new Date(pub.published_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* ── Breadcrumb ── */}
      <div className="border-b border-white/5 bg-black/20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-xs font-mono text-white/25">
            <Link href="/" className="hover:text-white/50 transition-colors">Inicio</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/${pub.game_slug}`} className="hover:text-white/50 transition-colors capitalize">
              {pub.game_slug.replace(/-/g, " ")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className={`${cfg.color} font-bold`}>{cfg.label}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ── Header de la publicación ── */}
        <header className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-6`}>
          {/* Tipo + Premium badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`flex items-center gap-1.5 text-xs font-mono font-bold ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
            {pub.is_premium && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-violet-400 border border-violet-500/25 px-2 py-0.5 rounded-full bg-violet-500/8">
                <Lock className="h-2.5 w-2.5" /> Premium
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-white leading-tight mb-5">
            {pub.title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Autor */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/20 border border-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-white/60">
                {authorName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-white/70">{authorName}</p>
                {reputation && (
                  <p className={`text-[9px] font-mono ${cfg.color} opacity-70`}>
                    {reputation.rank_title} · {reputation.points} pts
                  </p>
                )}
              </div>
            </div>

            <div className="h-4 w-px bg-white/10" />

            {publishedDate && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-white/30">
                <Calendar className="h-3 w-3" /> {publishedDate}
              </div>
            )}
            <div className="flex items-center gap-1 text-[10px] font-mono text-white/25">
              <Eye className="h-3 w-3" /> {pub.views_count + 1} vistas
            </div>
            {pub.attachments_urls.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-white/25">
                <Paperclip className="h-3 w-3" /> {pub.attachments_urls.length} adjunto{pub.attachments_urls.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </header>

        {/* ── Contenido ── */}
        {hasAccess ? (
          <>
            {/* Markdown renderizado y sanitizado */}
            <section className="rounded-2xl border border-white/6 bg-white/[0.01] p-6 lg:p-8">
              <MarkdownPreview content={pub.content_markdown} />
            </section>

            {/* Videos embebidos (YouTube Unlisted) */}
            {pub.attachments_urls.filter((u) => parseYouTubeId(u) && /youtube\.com|youtu\.be/.test(u)).length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-white/30">{"// videos"}</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {pub.attachments_urls
                    .filter((u) => parseYouTubeId(u) && /youtube\.com|youtu\.be/.test(u))
                    .map((url, i) => {
                      const asset = youTubeUnlistedAsset(url, `Video ${i + 1}`);
                      return asset ? <VideoEmbed key={url} asset={asset} /> : null;
                    })}
                </div>
              </section>
            )}

            {/* Adjuntos (archivos, sin videos) */}
            {pub.attachments_urls.filter((u) => !/youtube\.com|youtu\.be/.test(u)).length > 0 && (
              <section className="rounded-2xl border border-white/8 bg-black/20 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/6">
                  <Paperclip className="h-3.5 w-3.5 text-white/25" />
                  <span className="text-xs font-mono text-white/30">
                    {"// archivos adjuntos"}
                  </span>
                </div>
                <ul className="divide-y divide-white/5">
                  {pub.attachments_urls.filter((u) => !/youtube\.com|youtu\.be/.test(u)).map((url) => {
                    const name = decodeURIComponent(url.split("/").pop() ?? url);
                    return (
                      <li key={url} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.01] transition-colors">
                        <AttachmentIcon url={url} />
                        <span className="flex-1 text-xs font-mono text-white/50 truncate">{name}</span>
                        <a
                          href={url}
                          download={name}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/30 text-[10px] font-mono hover:border-white/20 hover:text-white/60 transition-colors"
                        >
                          <Download className="h-3 w-3" /> Descargar
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Sección de votos */}
            <section className="rounded-2xl border border-white/6 bg-white/[0.01] px-6 py-5">
              <p className="text-xs font-mono text-white/30 mb-4">
                {"// ¿te fue útil esta publicación?"}
              </p>
              <VoteSection
                publicationId={pub.id}
                initialUpvotes={upvotes}
                initialDownvotes={downvotes}
                initialUserVote={userVote}
              />
            </section>

            {/* Calificación con estrellas + reseñas */}
            <PublicationRating publicationId={pub.id} />
          </>
        ) : (
          /* ── Paywall premium ── */
          <div className="relative rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] overflow-hidden">
            {/* Contenido borroso detrás */}
            <div className="p-6 lg:p-8 blur-sm select-none pointer-events-none opacity-30" aria-hidden>
              <MarkdownPreview content={pub.content_markdown.slice(0, 400)} />
            </div>

            {/* Overlay de paywall */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent px-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl border border-violet-500/30 bg-violet-500/10">
                <Lock className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-1">
                  Contenido Premium
                </p>
                <p className="text-xs text-white/40 font-mono max-w-sm">
                  Suscribite a la academia de{" "}
                  <span className="text-violet-300 capitalize">
                    {pub.game_slug.replace(/-/g, " ")}
                  </span>{" "}
                  para desbloquear esta guía y todo el contenido exclusivo.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                {user ? (
                  <Link
                    href={`/${pub.game_slug}#academia`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-violet-500/40 bg-violet-500/15 text-violet-300 text-xs font-mono font-bold hover:bg-violet-500/25 transition-colors"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Suscribirme — $4.99/mes
                  </Link>
                ) : (
                  <Link
                    href={`/auth/login?redirectTo=/ugc/${pub.id}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/20 transition-colors"
                  >
                    Iniciar sesión para acceder
                  </Link>
                )}
                <Link
                  href={`/${pub.game_slug}`}
                  className="text-xs font-mono text-white/25 hover:text-white/50 transition-colors"
                >
                  Ver otras guías gratuitas
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Pie: volver al juego ── */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/${pub.game_slug}`}
            className="flex items-center gap-2 text-xs font-mono text-white/25 hover:text-white/50 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            Volver a {pub.game_slug.replace(/-/g, " ")}
          </Link>
          {user && (
            <Link
              href="/ugc/new"
              className={`flex items-center gap-1.5 text-xs font-mono font-bold ${cfg.color} hover:opacity-70 transition-opacity`}
            >
              <Star className="h-3.5 w-3.5" /> Publicar mi propia guía
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
