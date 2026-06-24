import Image from "next/image";
import { ExternalLink } from "lucide-react";

export type AdVariant = "between-games" | "game-page-top" | "creator-sidebar" | "banner";

export interface NativeAdSlotProps {
  brand: string;
  logo?: string;
  message: string;
  tagline?: string;
  link: string;
  ctaLabel?: string;
  variant?: AdVariant;
  /** "Sponsored" (default) or "Partner" */
  badge?: "Sponsored" | "Partner";
}

/**
 * Variant: between-games
 * Horizontal card injected between game rows on homepage.
 */
function AdBetweenGames({ brand, logo, message, tagline, link, ctaLabel, badge }: NativeAdSlotProps) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-5 py-4 rounded-xl border border-dashed border-white/10 bg-white/[0.015] hover:border-cyan-500/20 hover:bg-white/[0.025] transition-all duration-300 overflow-hidden"
    >
      {/* Subtle cyber grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#22d3ee03_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee03_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

      {/* Logo slot */}
      <div className="shrink-0 relative flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-white/10 bg-white/[0.03] group-hover:border-cyan-500/20 transition-colors overflow-hidden">
        {logo ? (
          <Image src={logo} alt={brand} fill className="object-contain p-1.5" sizes="40px" />
        ) : (
          <span className="text-[10px] font-black text-white/20 uppercase tracking-tight">{brand.slice(0, 2)}</span>
        )}
      </div>

      {/* Copy */}
      <div className="flex-1 text-center sm:text-left min-w-0 relative z-10">
        <div className="inline-flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/20">{"// "}{badge ?? "Sponsored"}</span>
          <span className="text-[9px] font-mono text-white/15">·</span>
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/20">{brand}</span>
        </div>
        <p className="text-sm font-semibold text-white/40 group-hover:text-white/60 transition-colors truncate">{message}</p>
        {tagline && (
          <p className="text-xs text-white/20 mt-0.5 truncate">{tagline}</p>
        )}
      </div>

      {/* CTA */}
      <div className="shrink-0 relative z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 bg-white/[0.02] group-hover:border-cyan-500/30 group-hover:bg-cyan-500/6 group-hover:text-cyan-300 text-white/25 text-xs font-mono transition-all duration-200">
        {ctaLabel ?? "Ver más"}
        <ExternalLink className="w-3 h-3" />
      </div>
    </a>
  );
}

/**
 * Variant: game-page-top
 * Full-width banner at the top of a game's creator grid.
 */
function AdGamePageTop({ brand, logo, message, tagline, link, ctaLabel, badge }: NativeAdSlotProps) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/6 bg-white/[0.02] hover:border-cyan-500/15 hover:bg-white/[0.035] transition-all mb-4 overflow-hidden"
    >
      {logo && (
        <div className="relative shrink-0 w-6 h-6 rounded overflow-hidden">
          <Image src={logo} alt={brand} fill className="object-contain" sizes="24px" />
        </div>
      )}
      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/20 shrink-0">
        {badge ?? "Sponsored"}
      </span>
      <span className="text-xs text-white/35 group-hover:text-white/55 transition-colors truncate flex-1">{message}</span>
      <span className="shrink-0 text-[10px] font-mono text-white/20 group-hover:text-cyan-400/60 transition-colors">
        {ctaLabel ?? "Ver →"}
      </span>
    </a>
  );
}

/**
 * Variant: creator-sidebar
 * Compact card for creator profile pages.
 */
function AdCreatorSidebar({ brand, logo, message, link, ctaLabel, badge }: NativeAdSlotProps) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group block rounded-xl border border-dashed border-white/8 bg-white/[0.015] hover:border-cyan-500/20 hover:bg-white/[0.025] transition-all overflow-hidden p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        {logo && (
          <div className="relative shrink-0 w-7 h-7 rounded overflow-hidden border border-white/10">
            <Image src={logo} alt={brand} fill className="object-contain p-0.5" sizes="28px" />
          </div>
        )}
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/20">
          {"// "}{badge ?? "Sponsored"}
        </span>
      </div>
      <p className="text-xs font-semibold text-white/40 group-hover:text-white/60 transition-colors mb-2">{message}</p>
      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-white/20 group-hover:text-cyan-400/60 transition-colors">
        {ctaLabel ?? "Ver más"} <ExternalLink className="w-2.5 h-2.5" />
      </span>
    </a>
  );
}

/**
 * Variant: banner
 * Global top/bottom banner strip.
 */
function AdBanner({ brand, logo, message, link, ctaLabel, badge }: NativeAdSlotProps) {
  return (
    <div className="border-y border-white/6 bg-white/[0.012]">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 py-2 hover:bg-transparent transition-all"
      >
        {logo && (
          <div className="relative shrink-0 w-5 h-5 rounded overflow-hidden">
            <Image src={logo} alt={brand} fill className="object-contain" sizes="20px" />
          </div>
        )}
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/15 shrink-0">
          {badge ?? "Sponsored"}
        </span>
        <span className="text-xs text-white/30 group-hover:text-white/50 transition-colors truncate">{message}</span>
        <span className="ml-auto shrink-0 text-[10px] font-mono text-white/20 group-hover:text-cyan-400/50 transition-colors">
          {ctaLabel ?? "Ver →"}
        </span>
      </a>
    </div>
  );
}

export function NativeAdSlot(props: NativeAdSlotProps) {
  const variant = props.variant ?? "between-games";
  switch (variant) {
    case "game-page-top":    return <AdGamePageTop    {...props} />;
    case "creator-sidebar":  return <AdCreatorSidebar {...props} />;
    case "banner":           return <AdBanner         {...props} />;
    default:                 return <AdBetweenGames   {...props} />;
  }
}
