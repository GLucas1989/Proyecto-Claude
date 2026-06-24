"use client";

import Link from "next/link";
import Image from "next/image";
import { Zap, Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from "lucide-react";

import { useState } from "react";
import gamesData from "@/data/games.json";
import { useAuth } from "@/components/auth/AuthProvider";

const activeGames = (gamesData as { id: string; name: string; slug: string; active: boolean }[]).filter((g) => g.active);

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopDropdown, setDesktopDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const { user, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/10 bg-background/80 backdrop-blur-xl">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
            <div className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 transition-all">
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="font-black text-lg tracking-tight">
              <span className="text-white">CREATORS </span>
              <span className="text-cyan-400">S-HUB</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-white/40">
            <div className="relative">
              <button
                onClick={() => setDesktopDropdown((v) => !v)}
                onBlur={() => setTimeout(() => setDesktopDropdown(false), 150)}
                className="flex items-center gap-1 px-3 py-2 hover:text-cyan-400 transition-colors"
              >
                &gt;_ Juegos
                <ChevronDown className={`h-3 w-3 transition-transform ${desktopDropdown ? "rotate-180" : ""}`} />
              </button>
              {desktopDropdown && (
                <div className="absolute right-0 top-full mt-1 w-52 border border-cyan-500/20 bg-[#030712]/95 backdrop-blur-xl rounded-lg overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                  {activeGames.map((game) => (
                    <Link
                      key={game.id}
                      href={`/${game.slug}`}
                      className="block px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors border-b border-cyan-500/10 last:border-0"
                      onClick={() => setDesktopDropdown(false)}
                    >
                      &gt;_ {game.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* User menu — desktop */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown((v) => !v)}
                  onBlur={() => setTimeout(() => setUserDropdown(false), 150)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:border-cyan-500/30 text-white/50 hover:text-white/80 text-xs font-mono transition-all"
                >
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="" width={20} height={20} className="rounded-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                  <span className="max-w-[120px] truncate">{profile?.display_name ?? user.email}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${userDropdown ? "rotate-180" : ""}`} />
                </button>
                {userDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 border border-white/10 bg-[#030712]/95 backdrop-blur-xl rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.4)]">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                    </Link>
                    <button
                      onClick={() => { signOut(); setUserDropdown(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-mono text-white/40 hover:text-red-400 hover:bg-red-500/8 transition-colors border-t border-white/8"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400/70 hover:text-cyan-300 text-xs font-mono transition-all"
              >
                <User className="h-3.5 w-3.5" /> Ingresar
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 transition-all"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-cyan-500/10 bg-[#030712]/98 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/25 px-3 pb-2">{'// Juegos'}</p>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-3 rounded-lg text-xs font-mono uppercase tracking-widest text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                </Link>
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg text-xs font-mono uppercase tracking-widest text-white/40 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all w-full text-left"
                >
                  <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
                </button>
                <div className="h-px bg-white/8 my-1" />
              </>
            )}
            {activeGames.map((game) => (
              <Link
                key={game.id}
                href={`/${game.slug}`}
                className="flex items-center gap-2 px-3 py-3 rounded-lg text-xs font-mono uppercase tracking-widest text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all"
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-cyan-500/40">&gt;_</span>
                {game.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
