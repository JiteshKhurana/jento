export const EXPLORE_CATEGORIES = [
  { id: "for-you", label: "For you", query: "top attractions" },
  { id: "things", label: "Things to do", query: "things to do attractions" },
  { id: "restaurants", label: "Restaurants", query: "restaurants" },
  { id: "stays", label: "Stays", query: "hotels" },
  { id: "locations", label: "Locations", query: "neighborhoods landmarks" },
] as const;

export type ExploreCategoryId = (typeof EXPLORE_CATEGORIES)[number]["id"];
