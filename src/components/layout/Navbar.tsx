import Link from "next/link";
import { Zap } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/10 bg-background/80 backdrop-blur-xl">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 transition-all">
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="font-black text-lg tracking-tight">
              <span className="text-white">GAMERS</span>
              <span className="text-cyan-400">HUB</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-white/40">
            <Link href="/" className="hover:text-cyan-400 transition-colors">&gt;_ Juegos</Link>
            <Link href="/mtg-arena" className="hover:text-cyan-400 transition-colors">&gt;_ MTG Arena</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
