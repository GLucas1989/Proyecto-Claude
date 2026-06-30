/**
 * Placeholder de analítica para Revenue-Driven Development.
 *
 * Centraliza el tracking de interacciones críticas (conversión, monetización).
 * Hoy loguea a consola; en el futuro se conecta a Vercel Analytics / PostHog /
 * Segment sin tocar los call-sites.
 */
export type AnalyticsEvent =
  | "monetization_potential_viewed"
  | "explore_academies_clicked"
  | "quick_premium_publish_clicked"
  | "premium_auto_approved"
  | "admin_business_summary_viewed";

export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}): void {
  // TODO: reemplazar por el proveedor real (Vercel Analytics custom event / PostHog).
  if (typeof window !== "undefined") {
    // Evento client-side
    console.info(`[analytics] ${event}`, props);
    // window.va?.("event", { name: event, ...props });  // ejemplo Vercel Analytics
  } else {
    // Evento server-side
    console.info(`[analytics:server] ${event}`, props);
  }
}
