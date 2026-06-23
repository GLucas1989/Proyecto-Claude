import Link from "next/link";
import { Swords } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
              <Swords className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              Creator<span className="text-primary">Hub</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">Juegos</Link>
            <Link href="/mtg-arena" className="hover:text-white transition-colors">MTG Arena</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
