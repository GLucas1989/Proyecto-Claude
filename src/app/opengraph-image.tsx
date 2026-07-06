import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Creators S-HUB — Directorio de creadores gaming";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const chakraPetch = await readFile(
    join(process.cwd(), "src/app/_og-assets/chakra-petch-700.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #d61f8f 0%, #a726d1 42%, #2563eb 100%)",
        }}
      >
        {/* grilla técnica sutil, mismo lenguaje visual del sitio */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            padding: "26px 40px",
            borderRadius: 24,
            border: "2px solid rgba(255,255,255,0.35)",
            background: "rgba(3,7,18,0.28)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 84,
              height: 84,
              borderRadius: 18,
              border: "3px solid rgba(255,255,255,0.6)",
              background: "rgba(255,255,255,0.12)",
            }}
          >
            <svg width="46" height="46" viewBox="0 0 24 24" fill="white">
              <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z" />
            </svg>
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Chakra Petch",
              fontWeight: 700,
              fontSize: 84,
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "#ffffff" }}>CREATORS&nbsp;</span>
            <span style={{ color: "#f5d0fe" }}>S-HUB</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 34,
            fontFamily: "Chakra Petch",
            fontWeight: 500,
            fontSize: 28,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Directorio de creadores gaming
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Chakra Petch", data: chakraPetch, weight: 700, style: "normal" }],
    }
  );
}
