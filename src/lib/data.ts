import { Creator, Game } from "@/types";
import gamesData from "@/data/games.json";

export function getGames(): Game[] {
  return gamesData as Game[];
}

export function getGame(slug: string): Game | undefined {
  return getGames().find((g) => g.slug === slug);
}

export function getActiveGames(): Game[] {
  return getGames().filter((g) => g.active);
}

export async function getCreators(gameSlug: string): Promise<Creator[]> {
  try {
    const data = await import(`@/data/${gameSlug}/creators.json`);
    return data.default as Creator[];
  } catch {
    return [];
  }
}

export async function getCreator(
  gameSlug: string,
  creatorId: string
): Promise<Creator | undefined> {
  const creators = await getCreators(gameSlug);
  return creators.find((c) => c.id === creatorId);
}

export function getGameStaticParams() {
  return getActiveGames().map((g) => ({ gameSlug: g.slug }));
}

export async function getCreatorStaticParams() {
  const params: { gameSlug: string; creatorId: string }[] = [];
  for (const game of getActiveGames()) {
    const creators = await getCreators(game.slug);
    for (const creator of creators) {
      params.push({ gameSlug: game.slug, creatorId: creator.id });
    }
  }
  return params;
}
