import { getGames, getCreators } from "@/lib/data";
import { GameCard } from "@/components/game/GameCard";
import { GameShowcase } from "@/components/game/GameShowcase";
import { Zap, Users, Gamepad2, Globe } from "lucide-react";

export default async function HomePage() {
  const games = getGames();
  const activeGames = games.filter((g) => g.active);
  const comingSoonGames = games.filter((g) => g.comingSoon && !g.active);
  const activeWithCreators = await Promise.all(
    activeGames.map(async (g) => ({ game: g, creators: (await getCreators(g.slug)).slice(0, 5) }))
  );
  const totalCreators = activeWithCreators.reduce((a, { creators }) => a + creators.length, 0);

  const stats = [
    { label: "Creadores", value: totalCreators, icon: Users },
    { label: "Juegos activos", value: activeGames.length, icon: Gamepad2 },
    { label: "Idiomas", value: 2, icon: Globe },
  ];

  return (
    <div className="flex flex-col">
      {/* ── CYBERPUNK HERO BANNER ── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-20 text-center overflow-hidden">

        {/* Cyber grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#22d3ee06_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee06_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />

        {/* Neon radial glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,#22d3ee14,transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_85%_65%,#a855f710,transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_15%_70%,#3b82f610,transparent)]" />

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />

        {/* Corner brackets — cyberpunk decoration */}
        <div className="absolute top-10 left-6 sm:left-12 w-14 h-14 border-l-2 border-t-2 border-cyan-500/30 cyber-border" />
        <div className="absolute top-10 right-6 sm:right-12 w-14 h-14 border-r-2 border-t-2 border-cyan-500/30 cyber-border" />
        <div className="absolute bottom-20 left-6 sm:left-12 w-14 h-14 border-l-2 border-b-2 border-violet-500/30 cyber-border" />
        <div className="absolute bottom-20 right-6 sm:right-12 w-14 h-14 border-r-2 border-b-2 border-violet-500/30 cyber-border" />

        {/* Horizontal accent lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* System badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/8 text-cyan-400 text-xs font-mono uppercase tracking-[0.2em] mb-6">
            <Zap className="h-3 w-3" />
            Gaming Creator Directory // sys.v2
          </div>

          {/* Main title */}
          <h1 className="font-black leading-none tracking-tighter mb-4 select-none">
            <span className="block text-5xl sm:text-7xl lg:text-[8rem] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 cyber-glow">
              CREATORS
            </span>
            <span className="block text-6xl sm:text-8xl lg:text-[9.5rem] text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400"
              style={{ filter: "drop-shadow(0 0 30px rgba(168,85,247,0.4))" }}>
              SHUB
            </span>
          </h1>

          {/* Terminal tagline */}
          <p className="font-mono text-xs sm:text-sm text-cyan-400/50 tracking-[0.3em] uppercase mb-3">
            &gt;_ inicializando directorio de creadores...
          </p>
          <p className="text-white/40 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
            YouTubers y streamers especializados en videojuegos competitivos.<br className="hidden sm:block" />
            Filtrá por formato, idioma y tipo de contenido.
          </p>

          {/* Stats panel */}
          <div className="inline-flex items-center gap-6 sm:gap-10 px-6 sm:px-10 py-4 rounded-xl border border-cyan-500/15 bg-cyan-500/4 backdrop-blur-sm">
            {stats.map(({ label, value, icon: Icon }, i) => (
              <>
                {i > 0 && <div key={`div-${label}`} className="w-px h-8 bg-cyan-500/15" />}
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5 text-2xl font-black text-cyan-400">
                    <Icon className="h-4 w-4" />
                    {value}
                  </div>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">{label}</span>
                </div>
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMES SECTION ── */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/20" />
            <div className="text-center">
              <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.3em] mb-0.5">// creadores por juego</p>
              <p className="text-white/30 text-xs font-mono">
                {activeGames.length} juegos activos &nbsp;·&nbsp; {comingSoonGames.length} próximamente
              </p>
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/20" />
          </div>

          <div className="flex flex-col gap-3">
            {activeWithCreators.map(({ game, creators }, i) => (
              <GameShowcase key={game.id} game={game} creators={creators} defaultOpen={i === 0} />
            ))}
          </div>

          {comingSoonGames.length > 0 && (
            <div className="mt-20">
              <p className="text-[10px] font-mono text-violet-400/50 uppercase tracking-[0.3em] mb-6">// próximamente</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {comingSoonGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
