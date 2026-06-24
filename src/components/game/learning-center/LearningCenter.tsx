import { Lock, Zap, CheckCircle, FileText, FileSpreadsheet, Headphones, Video } from "lucide-react";
import {
  getGameSubscriptionPlan,
  getUserGameSubscription,
  getPlatformContent,
} from "@/app/actions/gameSubscription";
import { SubscribeGameButton } from "./SubscribeGameButton";
import { ContentItem } from "./ContentItem";

interface LearningCenterProps {
  gameSlug: string;
  gameName: string;
}

const TYPE_ICONS = [
  { icon: FileText,        label: "PDF Guides",    color: "text-red-400/60"    },
  { icon: FileSpreadsheet, label: "PPT Slides",    color: "text-orange-400/60" },
  { icon: Headphones,      label: "Audiobooks",    color: "text-violet-400/60" },
  { icon: Video,           label: "Video Guides",  color: "text-cyan-400/60"   },
];

export async function LearningCenter({ gameSlug, gameName }: LearningCenterProps) {
  const [plan, subscription, content] = await Promise.all([
    getGameSubscriptionPlan(gameSlug),
    getUserGameSubscription(gameSlug),
    getPlatformContent(gameSlug),
  ]);

  if (!plan) return null;

  const isSubscribed = subscription?.status === "active";
  const price = (plan.price_cents / 100).toFixed(2);

  return (
    <section className="mt-16 mb-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/20" />
        <div className="text-center">
          <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.3em] mb-0.5">
            {"// centro de aprendizaje pro"}
          </p>
          <p className="text-white/30 text-xs font-mono">
            Contenido exclusivo de la plataforma
          </p>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/20" />
      </div>

      <div className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.04] to-violet-500/[0.03] overflow-hidden">
        {/* Top accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        <div className="p-6 sm:p-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/8 text-cyan-400 text-[10px] font-mono uppercase tracking-widest mb-3">
                <Zap className="h-2.5 w-2.5" />
                {gameName} Pro
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
                Master Guides & Recursos Pro
              </h2>
              <p className="text-sm text-white/40 max-w-lg">
                Accedé a guías PDF, slides PPT, audiobooks y video-guías exclusivas
                creadas por el equipo de Creators S-HUB.
              </p>

              {/* Content type pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {TYPE_ICONS.map(({ icon: Icon, label, color }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-white/30 border border-white/8 rounded-md px-2 py-0.5"
                  >
                    <Icon className={`h-2.5 w-2.5 ${color}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Price + CTA */}
            <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
              {!isSubscribed && (
                <div className="text-right">
                  <p className="text-2xl font-black text-white">
                    ${price}
                    <span className="text-sm text-white/30 font-normal"> /mes</span>
                  </p>
                  <p className="text-[10px] text-white/25 font-mono">Sin permanencia · Cancelá cuando quieras</p>
                </div>
              )}
              <SubscribeGameButton
                gameSlug={gameSlug}
                gameName={gameName}
                plan={plan}
                initialSubscription={subscription}
              />
            </div>
          </div>

          {/* Content area */}
          {isSubscribed ? (
            content.length > 0 ? (
              <div className="flex flex-col gap-2">
                {content.map((item) => (
                  <ContentItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-8 text-center">
                <p className="text-xs text-white/30 font-mono">
                  {"// Contenido en preparación — disponible pronto"}
                </p>
              </div>
            )
          ) : (
            /* Locked preview */
            <div className="relative">
              {/* Blurred ghost items */}
              <div className="flex flex-col gap-2 select-none pointer-events-none" aria-hidden>
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-white/6 bg-white/[0.02] blur-[2px] opacity-50"
                  >
                    <div className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/50 truncate">{feature}</p>
                      <div className="h-2 w-16 bg-white/10 rounded mt-1" />
                    </div>
                    <div className="w-20 h-7 rounded-lg border border-white/10 bg-white/5 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-transparent via-[#030712]/60 to-[#030712]/90 rounded-xl">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl border border-cyan-500/20 bg-cyan-500/8">
                  <Lock className="h-6 w-6 text-cyan-400/60" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white/70">
                    Contenido exclusivo para suscriptores Pro
                  </p>
                  <p className="text-xs text-white/35 font-mono mt-1">
                    Suscribite por ${price}/mes para desbloquear
                  </p>
                </div>
                <ul className="flex flex-col items-start gap-1.5">
                  {plan.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/40">
                      <CheckCircle className="h-3 w-3 text-cyan-400/50 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
