export type TravelCategory =
  | "all"
  | "beach"
  | "city"
  | "adventure"
  | "culture"
  | "food";

export type FeaturedDestination = {
  id: string;
  name: string;
  country: string;
  tagline: string;
  categories: TravelCategory[];
  unsplashQuery: string;
  initialMessage: string;
};
