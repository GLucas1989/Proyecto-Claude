# Gaming Content Creator Hub

Directorio multi-juego de creadores de contenido gaming. Construido con Next.js 16, TypeScript y Tailwind CSS v4.

## Stack

- **Next.js 16.2.9** — App Router + SSG
- **TypeScript** strict mode
- **Tailwind CSS v4** con tema oscuro
- **Shadcn/ui** components (manual)
- **Twitch Helix API** — live badge en tiempo real

## Juegos soportados

- MTG Arena (5 creadores)
- Wild Rift (3 creadores)
- Raid: Shadow Legends (3 creadores)
- Dark and Darker (3 creadores)
- Beyond All Reason (3 creadores)
- Albion Online (4 creadores)
- Diablo Immortal (próximamente)

## Setup

```bash
npm install
npm run dev
```

## Variables de entorno (opcional)

```
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
```

Sin estas variables el badge de LIVE no aparece (graceful degradation).
