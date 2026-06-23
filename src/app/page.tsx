import { getGames, getCreators } from "@/lib/data";
import { GameCard } from "@/components/game/GameCard";
import { Swords, Users, Gamepad2, Globe } from "lucide-react";

export default async function HomePage() {
  const games = getGames();
  const activeGames = games.filter((g) => g.active);
  const creatorCounts = await Promise.all(
    activeGames.map((g) => getCreators(g.slug).then((c) => c.length))
  );
  const totalCreators = creatorCounts.reduce((a, b) => a + b, 0);

  const stats = [
    { label: "Creadores", value: totalCreators, icon: Users },
    { label: "Juegos activos", value: activeGames.length, icon: Gamepad2 },
    { label: "Idiomas", value: 2, icon: Globe },
  ];

  return (
    <div className="flex flex-col">
      <section className="relative flex flex-col items-center justify-center px-4 py-28 text-center overflow-hidden min-h-[80vh]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#f59e0b18,transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium mb-8 backdrop-blur-sm">
            <Swords className="h-4 w-4" />
            Directorio de Creadores Gaming
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Encuentra a los{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">
              mejores creadores
            </span>
            <br />
            de tu juego favorito
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-12">
            Directorio curado de YouTubers y streamers especializados en videojuegos competitivos.
            Filtra por formato, idioma y tipo de contenido.
          </p>

          <div className="inline-flex items-center gap-8 px-8 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-2xl font-black text-white">
                  <Icon className="h-5 w-5 text-amber-400" />
                  {value}
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Elige tu juego</h2>
            <p className="text-white/50 text-sm">
              {activeGames.length} {activeGames.length === 1 ? "juego activo" : "juegos activos"} ·{" "}
              {games.filter((g) => g.comingSoon).length} próximamente
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
