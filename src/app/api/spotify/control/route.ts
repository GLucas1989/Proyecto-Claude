import { NextResponse } from "next/server";
import { spotifyFetch } from "@/lib/spotify/client";

export const runtime = "nodejs";

interface ControlBody {
  action?: "play" | "pause" | "next" | "play-context";
  contextUri?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ControlBody;

  let res: Response;
  switch (body.action) {
    case "play":
      res = await spotifyFetch("/me/player/play", { method: "PUT" });
      break;
    case "pause":
      res = await spotifyFetch("/me/player/pause", { method: "PUT" });
      break;
    case "next":
      res = await spotifyFetch("/me/player/next", { method: "POST" });
      break;
    case "play-context":
      if (!body.contextUri) {
        return NextResponse.json({ error: "Falta contextUri" }, { status: 400 });
      }
      res = await spotifyFetch("/me/player/play", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context_uri: body.contextUri }),
      });
      break;
    default:
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  if (res.status === 401) {
    return NextResponse.json({ error: "No conectado a Spotify" }, { status: 401 });
  }
  if (res.status === 404) {
    // Spotify devuelve 404 cuando no hay ningún dispositivo activo (NO_ACTIVE_DEVICE)
    return NextResponse.json(
      { error: "Abrí Spotify en algún dispositivo (celular, PC, etc.) para poder controlarlo desde acá." },
      { status: 409 }
    );
  }
  if (!res.ok && res.status !== 204) {
    return NextResponse.json({ error: "Error al comunicarse con Spotify" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
