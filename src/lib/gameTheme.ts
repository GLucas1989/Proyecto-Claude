// Per-game color themes matching the SVG banner palettes
const gameThemes: Record<string, { from: string; via: string }> = {
  "mtg-arena":           { from: "rgba(107,33,168,0.18)", via: "rgba(107,33,168,0.06)" },  // purple
  "wild-rift":           { from: "rgba(0,144,212,0.18)", via: "rgba(0,144,212,0.06)" },    // blue
  "raid-shadow-legends": { from: "rgba(192,64,32,0.20)", via: "rgba(100,16,16,0.08)" },    // red/crimson
  "dark-and-darker":     { from: "rgba(96,48,16,0.18)", via: "rgba(80,64,48,0.06)" },      // stone/torch
  "beyond-all-reason":   { from: "rgba(32,160,64,0.18)", via: "rgba(16,96,32,0.06)" },     // military green
  "albion-online":       { from: "rgba(212,160,16,0.18)", via: "rgba(128,88,0,0.06)" },    // gold
  "diablo-immortal":     { from: "rgba(192,32,0,0.22)", via: "rgba(96,0,0,0.08)" },        // hellfire red
  "league-of-legends":   { from: "rgba(10,200,185,0.16)", via: "rgba(10,58,92,0.07)" },    // hextech teal/blue
  "diablo-iv":           { from: "rgba(160,8,0,0.22)", via: "rgba(64,0,0,0.08)" },         // blood red
  "multigenero":         { from: "rgba(255,136,0,0.18)", via: "rgba(180,60,0,0.06)" },     // rubius orange
  "world-of-warcraft":   { from: "rgba(212,160,23,0.18)", via: "rgba(138,98,0,0.06)" },    // gold
  "clash-royale":        { from: "rgba(124,58,237,0.18)", via: "rgba(76,29,149,0.06)" },   // royal purple
  "minecraft":           { from: "rgba(63,155,31,0.18)", via: "rgba(30,90,13,0.06)" },     // grass green
  "path-of-exile-2":     { from: "rgba(159,18,57,0.20)", via: "rgba(69,10,30,0.08)" },     // rose/blood
  "ragnarok-x-next-generation": { from: "rgba(8,145,178,0.18)", via: "rgba(22,78,99,0.06)" }, // cyan
};

const BG = "#030712";

export function getGameGridGradient(gameId: string): string {
  const theme = gameThemes[gameId];
  if (!theme) return `linear-gradient(to bottom, transparent, ${BG})`;
  return `linear-gradient(to bottom, ${theme.from} 0%, ${theme.via} 35%, ${BG} 70%)`;
}
