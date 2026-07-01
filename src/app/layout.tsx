import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SpotifyPlayerWidget } from "@/components/spotify/SpotifyPlayerWidget";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CreatorsHub — Directorio de Creadores de Videojuegos",
  description:
    "Encuentra los mejores creadores de contenido de MTG Arena, Wild Rift, Diablo Immortal y más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-cyan-500/10 py-6 text-center text-xs text-white/20 font-mono tracking-widest uppercase">
            CreatorsHub © {new Date().getFullYear()} &mdash; Directorio de creadores gaming
          </footer>
        </AuthProvider>
        <SpotifyPlayerWidget />
        <Analytics />
      </body>
    </html>
  );
}
