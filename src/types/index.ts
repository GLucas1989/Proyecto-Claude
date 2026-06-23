export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
}

// MTG Arena specific
export type ContentType = "competitive" | "casual" | "draft" | "lore" | "educational";
export type MTGFormat = "standard" | "explorer" | "alchemy" | "historic" | "brawl";

// Wild Rift specific
export type WRRole = "top" | "jungle" | "mid" | "adc" | "support";

export type Language = "es" | "en";

export interface Socials {
  youtube?: string;
  twitch?: string;
  twitter?: string;
}

// Generic creator — each game can have its own extra fields
export interface Creator {
  id: string;
  name: string;
  channelId: string;
  channelUrl: string;
  avatar: string;
  bioShort: string;
  bioLong: string;
  contentType: ContentType[];
  languages: Language[];
  socials: Socials;
  latestVideos: Video[];
  // MTG Arena
  formats?: MTGFormat[];
  // Wild Rift
  roles?: WRRole[];
  // Future games can add their own optional fields
  [key: string]: unknown;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  active: boolean;
  comingSoon?: boolean;
  emoji?: string;
  logoUrl?: string;
  filters?: string[];
}

export interface CreatorFilters {
  search: string;
  contentType: ContentType | "";
  format: MTGFormat | "";
  language: Language | "";
}
