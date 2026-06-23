import { NextRequest, NextResponse } from "next/server";

const MAILERLITE_GROUP_ID = "191104861556705085";

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Configuración pendiente" }, { status: 500 });
  }

  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      email,
      fields: { name: name ?? "" },
      groups: [MAILERLITE_GROUP_ID],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // 409 = already subscribed, treat as success
    if (res.status === 409) {
      return NextResponse.json({ ok: true, already: true });
    }
    return NextResponse.json({ error: body?.message ?? "Error al suscribir" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
