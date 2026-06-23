export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
}

export type ContentType = "competitive" | "casual" | "draft" | "lore" | "educational";
export type MTGFormat = "standard" | "explorer" | "alchemy" | "historic" | "brawl";
export type WRRole = "top" | "jungle" | "mid" | "adc" | "support";
export type Language = "es" | "en";

export interface Socials {
  youtube?: string;
  twitch?: string;
  twitter?: string;
}

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
  formats?: MTGFormat[];
  roles?: WRRole[];
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
  filters?: string[];
}

export interface CreatorFilters {
  search: string;
  contentType: ContentType | "";
  format: MTGFormat | "";
  language: Language | "";
}
