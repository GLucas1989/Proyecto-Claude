/**
 * Tipos y config visual del feed de noticias — sin imports server-only, para
 * que los componentes de cliente (NewsSection, LiveHubWidget) puedan
 * importarlos sin arrastrar el cliente de Supabase server-side al bundle.
 */
export type NewsCategory = "main_events" | "regional_grinding" | "patch_notes";

export interface NewsItem {
  id: string;
  game_slug: string;
  category: NewsCategory;
  title: string;
  summary: string | null;
  url: string | null;
  published_at: string;
}

/** Config visual por categoría — colores neón consistentes en toda la UI. */
export const NEWS_CATEGORY_CONFIG: Record<NewsCategory, { label: string; badge: string; dot: string }> = {
  main_events: {
    label: "Main Events",
    badge: "border-cyan-400/40 bg-cyan-500/10 text-cyan-300",
    dot: "bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.7)]",
  },
  regional_grinding: {
    label: "Regional Grinding",
    badge: "border-violet-400/40 bg-violet-500/10 text-violet-300",
    dot: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.7)]",
  },
  patch_notes: {
    label: "Patch Notes",
    badge: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  },
};
