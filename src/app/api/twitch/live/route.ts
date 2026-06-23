import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? "";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Twitch token error: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

const liveCache = new Map<string, { live: boolean; fetchedAt: number }>();
const CACHE_TTL = 2 * 60 * 1000;

export async function GET(req: NextRequest) {
  const channels = req.nextUrl.searchParams.get("channels");
  if (!channels) {
    return NextResponse.json({ error: "Missing channels param" }, { status: 400 });
  }
  const channelList = channels.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean).slice(0, 20);

  if (!CLIENT_ID || !CLIENT_SECRET) {
    const result = Object.fromEntries(channelList.map((c) => [c, false]));
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=120" } });
  }

  const now = Date.now();
  const cached: Record<string, boolean> = {};
  const toFetch: string[] = [];

  for (const ch of channelList) {
    const entry = liveCache.get(ch);
    if (entry && now - entry.fetchedAt < CACHE_TTL) {
      cached[ch] = entry.live;
    } else {
      toFetch.push(ch);
    }
  }

  if (toFetch.length > 0) {
    try {
      const token = await getAppToken();
      const query = toFetch.map((c) => `user_login=${encodeURIComponent(c)}`).join("&");
      const res = await fetch(`https://api.twitch.tv/helix/streams?${query}`, {
        headers: { "Client-ID": CLIENT_ID, Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { data: Array<{ user_login: string }> };
        const liveSet = new Set(data.data.map((s) => s.user_login.toLowerCase()));
        for (const ch of toFetch) {
          const isLive = liveSet.has(ch);
          cached[ch] = isLive;
          liveCache.set(ch, { live: isLive, fetchedAt: now });
        }
      } else {
        for (const ch of toFetch) cached[ch] = false;
      }
    } catch {
      for (const ch of toFetch) cached[ch] = false;
    }
  }

  return NextResponse.json(cached, { headers: { "Cache-Control": "public, s-maxage=120" } });
}
