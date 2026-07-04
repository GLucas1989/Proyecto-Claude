// Cron migrado de vercel.json — dispara el endpoint existente, la lógica
// real vive en src/app/api/cron/recompute-reputation/route.ts.
export default async () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const res = await fetch(`${siteUrl}/api/cron/recompute-reputation`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  console.log("recompute-reputation:", res.status, await res.text());
};

export const config = {
  schedule: "17 3 * * *",
};
