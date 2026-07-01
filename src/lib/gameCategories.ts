/**
 * Categorías de agrupación de juegos en la Home (rediseño). Son un criterio
 * editorial de agrupación, no un dato de negocio — ajustar libremente el
 * label u orden acá si cambia el criterio, sin tocar games.json.
 */
export interface GameCategoryDef {
  id: string;
  label: string;
}

export const GAME_CATEGORIES: GameCategoryDef[] = [
  { id: "moba", label: "MOBA" },
  { id: "rpg", label: "Acción & RPG" },
  { id: "estrategia", label: "Cartas & Estrategia" },
  { id: "mmo", label: "MMO & Sandbox" },
  { id: "shooter", label: "Shooter & Racing" },
  { id: "variedad", label: "Variedad" },
];

export function getCategoryLabel(categoryId?: string): string {
  return GAME_CATEGORIES.find((c) => c.id === categoryId)?.label ?? "Otros";
}
