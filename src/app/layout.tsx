import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Chakra_Petch } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SpotifyPlayerWidget } from "@/components/spotify/SpotifyPlayerWidget";
import { Analytics } from "@vercel/analytics/next";

// Sistema tipográfico de 3 roles (identidad HUD propia, no la del scaffold):
//  - Chakra Petch (display): titulares y logo — cuadrada/techno, la voz de la marca.
//  - JetBrains Mono (utility): eyebrows "//", terminal ">_", datos y labels.
//  - Geist (body): solo texto de lectura — neutral a propósito.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://creatorsshub.com"),
  title: {
    default: "Creators S-HUB — Directorio de creadores gaming",
    template: "%s · Creators S-HUB",
  },
  description:
    "YouTubers y streamers de MTG Arena, Wild Rift, League of Legends, Diablo y más — organizados por juego, idioma y tipo de contenido.",
  openGraph: {
    siteName: "Creators S-HUB",
    type: "website",
    locale: "es_AR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${jetbrainsMono.variable} ${chakraPetch.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-cyan-500/10 py-6 text-center text-xs text-white/20 font-mono tracking-widest uppercase">
            Creators S-HUB © {new Date().getFullYear()} &mdash; Directorio de creadores gaming
          </footer>
        </AuthProvider>
        <SpotifyPlayerWidget />
        <Analytics />
      </body>
    </html>
  );
}
