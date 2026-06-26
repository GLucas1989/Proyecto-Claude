import { buildWatermarkLabel } from "@/lib/security/watermark";

interface WatermarkOverlayProps {
  /** Email del comprador autenticado que está viendo el contenido premium */
  email: string;
  /** Opacidad del mosaico (default sutil) */
  opacity?: number;
}

/**
 * Mosaico de marca de agua dinámico para vistas premium (anti-piratería).
 * Renderiza el email enmascarado + token trazable repetido en diagonal,
 * con pointer-events-none para no interferir con la lectura.
 */
export function WatermarkOverlay({ email, opacity = 0.06 }: WatermarkOverlayProps) {
  const label = buildWatermarkLabel(email);
  const rows = Array.from({ length: 10 });
  const cols = Array.from({ length: 4 });

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none z-10"
      aria-hidden
      data-watermark
    >
      <div className="absolute inset-0 -rotate-[24deg] scale-150">
        {rows.map((_, r) => (
          <div key={r} className="flex justify-around whitespace-nowrap py-6">
            {cols.map((__, c) => (
              <span
                key={c}
                className="text-[11px] font-mono tracking-wide text-white"
                style={{ opacity }}
              >
                {label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
