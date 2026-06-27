import { StreamTipAlert } from "@/components/overlays/StreamTipAlert";

export const dynamic = "force-dynamic";

interface OverlayPageProps {
  params: Promise<{ creatorId: string }>;
}

/**
 * Ruta pública ligera para OBS (fuente de navegador).
 * Fondo transparente: inyecta un style global que hace html/body transparentes
 * y cubre la UI del sitio con un lienzo fijo a pantalla completa.
 *
 * Uso: pegar https://creatorsshub.gg/overlays/alerts/<creatorId> como
 * "Fuente de navegador" en OBS (1920×1080, con transparencia activada).
 */
export default async function OverlayAlertsPage({ params }: OverlayPageProps) {
  const { creatorId } = await params;

  return (
    <>
      {/* Transparencia para OBS + ocultar nav/footer del sitio */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body { background: transparent !important; }
            body > nav, header, footer { display: none !important; }
            @keyframes tip-in {
              0%   { opacity: 0; transform: translateY(-24px) scale(0.92); }
              12%  { opacity: 1; transform: translateY(0) scale(1.04); }
              20%  { transform: scale(1); }
              85%  { opacity: 1; transform: translateY(0) scale(1); }
              100% { opacity: 0; transform: translateY(-12px) scale(0.98); }
            }
            .animate-tip-in { animation: tip-in 6s ease-out forwards; }
          `,
        }}
      />
      <div className="fixed inset-0 z-[9999] bg-transparent">
        <StreamTipAlert creatorId={creatorId} />
      </div>
    </>
  );
}
