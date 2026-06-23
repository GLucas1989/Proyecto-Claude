import { MetadataRoute } from "next";
import { getGames, getCreators } from "@/lib/data";

const BASE_URL = "https://creatorsshub.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = getGames().filter((g) => g.active);

  const gameUrls = games.map((game) => ({
    url: `${BASE_URL}/${game.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const creatorUrls = (
    await Promise.all(
      games.map(async (game) => {
        const creators = await getCreators(game.slug);
        return creators.map((creator) => ({
          url: `${BASE_URL}/${game.slug}/${creator.id}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
      })
    )
  ).flat();

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...gameUrls,
    ...creatorUrls,
  ];
}
