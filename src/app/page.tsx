import { Fragment } from "react";
import Link from "next/link";
import { getGames, getCreators } from "@/lib/data";
import { getUserFollows } from "@/lib/follows";
import { GameCard } from "@/components/game/GameCard";
import { HomeFeedTabs } from "@/components/home/HomeFeedTabs";
import { MobileClaimCTA } from "@/components/home/MobileClaimCTA";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Zap, Users, Gamepad2, Globe, Tv, Package, GraduationCap, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const games = getGames();
  const activeGames = games.filter((g) => g.active);
  const comingSoonGames = games.filter((g) => g.comingSoon && !g.active);
  const activeWithCreators = await Promise.all(
    activeGames.map(async (g) => ({ game: g, creators: (await getCreators(g.slug)).slice(0, 5) }))
  );
  const totalCreators = activeWithCreators.reduce((a, { creators }) => a + creators.length, 0);

  // ── Feed personalizado: pestaña "Siguiendo" cruzando user_follows real ──
  const follows = await getUserFollows();

  // ── Creadores destacados: solo los marcados isFeatured=true (dato real,
  // curado a mano) — si no hay ninguno todavía, la franja no se muestra.
  const featuredCreators = activeWithCreators
    .flatMap(({ game, creators }) => creators.filter((c) => c.isFeatured).map((c) => ({ creator: c, game })))
    .slice(0, 8);

  const stats = [
    { label: "Creadores", value: totalCreators, icon: Users },
    { label: "Juegos activos", value: activeGames.length, icon: Gamepad2 },
    { label: "Idiomas", value: 2, icon: Globe },
  ];

  return (
    <div className="flex flex-col">
      {/* ── CYBERPUNK HERO BANNER ── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-8 pb-10 sm:pt-16 sm:pb-20 text-center overflow-hidden">

        {/* Cyber grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#22d3ee06_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee06_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />

        {/* Neon radial glow — único, suavizado (se sacaron los otros 2 + corner brackets) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,#22d3ee14,transparent)]" />

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />

        {/* Horizontal accent lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* System badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/8 text-cyan-400 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] mb-3 sm:mb-6">
            <Zap className="h-3 w-3" />
            Gaming Creator Directory // sys.v2
          </div>

          {/* Main title */}
          <h1 className="font-black leading-none tracking-tighter mb-3 sm:mb-4 select-none">
            <span className="block text-4xl sm:text-7xl lg:text-[8rem] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 cyber-glow">
              CREATORS
            </span>
            <span className="block text-5xl sm:text-8xl lg:text-[9.5rem] text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400"
              style={{ filter: "drop-shadow(0 0 30px rgba(168,85,247,0.4))" }}>
              S-HUB
            </span>
          </h1>

          {/* Terminal tagline — oculto en móvil para ahorrar espacio */}
          <p className="hidden sm:block font-mono text-xs sm:text-sm text-cyan-400/50 tracking-[0.3em] uppercase mb-3">
            &gt;_ inicializando directorio de creadores...
          </p>
          <p className="text-white/40 text-xs sm:text-base max-w-xl mx-auto leading-relaxed mb-5 sm:mb-8">
            YouTubers y streamers especializados en videojuegos competitivos.<br className="hidden sm:block" />
            Filtrá por formato, idioma y tipo de contenido.
          </p>

          {/* Stats panel */}
          <div className="inline-flex items-center gap-5 sm:gap-10 px-5 sm:px-10 py-2.5 sm:py-4 rounded-xl border border-cyan-500/15 bg-cyan-500/4 backdrop-blur-sm">
            {stats.map(({ label, value, icon: Icon }, i) => (
              <Fragment key={label}>
                {i > 0 && <div className="w-px h-8 bg-cyan-500/15" />}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black text-cyan-400">
                    <Icon className="h-4 w-4" />
                    {value}
                  </div>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">{label}</span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUÉ ENCONTRÁS ACÁ ── */}
      <section className="px-4 pb-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.3em] mb-4">
            {"// qué encontrás acá"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Tv, title: "Directorio", desc: "Creadores ES/EN organizados por juego, sin perderte en YouTube." },
              { icon: Package, title: "The Vault", desc: "Guías, tier lists y builds en PDF, PPT, audio o video — subidas por creadores y por vos." },
              { icon: GraduationCap, title: "La Academia", desc: "Bundle mensual con contenido curado de todos los juegos, desde $5/mes." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 rounded-2xl border border-white/8 bg-white/[0.02]">
                <Icon className="h-5 w-5 text-cyan-400/70 mb-2.5" />
                <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMES SECTION ── */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/20" />
            <div className="text-center">
              <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.3em] mb-0.5">{'// explorá por juego'}</p>
              <p className="text-white/30 text-xs font-mono">
                {activeGames.length} juegos activos &nbsp;·&nbsp; {comingSoonGames.length} próximamente
              </p>
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/20" />
          </div>

          <HomeFeedTabs
            items={activeWithCreators}
            followedGameSlugs={[...follows.games]}
            followedAuthorIds={[...follows.authors]}
          />

          {comingSoonGames.length > 0 && (
            <div className="mt-20">
              <p className="text-[10px] font-mono text-violet-400/50 uppercase tracking-[0.3em] mb-6">{'// próximamente'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {comingSoonGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}

          {/* Creadores destacados — solo si hay alguno marcado isFeatured=true */}
          {featuredCreators.length > 0 && (
            <div className="mt-20">
              <p className="text-[10px] font-mono text-violet-400/50 uppercase tracking-[0.3em] mb-5">
                {"// creadores destacados esta semana"}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                {featuredCreators.map(({ creator, game }) => (
                  <Link
                    key={creator.id}
                    href={`/${game.slug}/${creator.id}`}
                    className="shrink-0 w-[150px] p-3.5 rounded-xl border border-white/8 bg-white/[0.02] hover:border-violet-500/30 transition-colors text-center"
                  >
                    <div className="w-11 h-11 rounded-full mx-auto mb-2 bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-[#02131a] font-black text-xs">
                      {creator.name.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{creator.name}</p>
                    <p className="text-[10px] font-mono text-white/35 truncate mt-0.5">{game.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CREATOR CTA ── */}
      <section className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-7 rounded-2xl border border-violet-500/25 bg-violet-500/[0.05] text-center">
            <h3 className="text-lg font-black text-white mb-2">¿Sos creador de contenido gamer?</h3>
            <p className="text-sm text-white/50 max-w-md mx-auto mb-5">
              Reclamá tu perfil, subí guías a The Vault y ganá el 60% de cada venta.
            </p>
            <Link
              href="/auth/login"
              className="shine-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 text-white font-bold text-sm hover:bg-violet-400 transition-colors"
            >
              Sumate como creador <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      {/* ── NEWSLETTER ── */}
      <section className="px-4 pb-24 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <NewsletterSignup />
        </div>
      </section>

      {/* CTA flotante (solo móvil) */}
      <MobileClaimCTA />
    </div>
  );
}
