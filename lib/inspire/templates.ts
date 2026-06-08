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

export type ItineraryTemplate = {
  id: string;
  title: string;
  destination: string;
  country: string;
  duration: number;
  categories: TravelCategory[];
  highlights: string[];
  unsplashQuery: string;
  initialMessage: string;
};

export const FEATURED_DESTINATIONS: FeaturedDestination[] = [
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    tagline: "Where tradition meets the future",
    categories: ["city", "culture", "food"],
    unsplashQuery: "tokyo japan city",
    initialMessage:
      "Plan me an amazing trip to Tokyo, Japan. I want to experience the best of Japanese culture, food, and technology.",
  },
  {
    id: "bali",
    name: "Bali",
    country: "Indonesia",
    tagline: "The Island of the Gods",
    categories: ["beach", "culture", "adventure"],
    unsplashQuery: "bali indonesia temple",
    initialMessage:
      "I'd love to plan a trip to Bali, Indonesia. Include beaches, temples, rice terraces, and great local food.",
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    tagline: "The City of Light",
    categories: ["city", "culture", "food"],
    unsplashQuery: "paris france eiffel",
    initialMessage:
      "Help me plan a trip to Paris, France. I want to see iconic landmarks, visit world-class museums, and enjoy French cuisine.",
  },
  {
    id: "santorini",
    name: "Santorini",
    country: "Greece",
    tagline: "Sunsets over the Aegean",
    categories: ["beach", "culture"],
    unsplashQuery: "santorini greece sunset",
    initialMessage:
      "Plan a romantic trip to Santorini, Greece with stunning sunsets, whitewashed villages, and amazing Mediterranean food.",
  },
  {
    id: "new-york",
    name: "New York",
    country: "USA",
    tagline: "The City That Never Sleeps",
    categories: ["city", "food", "culture"],
    unsplashQuery: "new york city manhattan",
    initialMessage:
      "Help me plan a trip to New York City. I want to explore different neighborhoods, catch Broadway shows, and eat at amazing restaurants.",
  },
  {
    id: "machu-picchu",
    name: "Machu Picchu",
    country: "Peru",
    tagline: "Lost city of the Incas",
    categories: ["adventure", "culture"],
    unsplashQuery: "machu picchu peru ancient",
    initialMessage:
      "I want to visit Machu Picchu in Peru. Plan me a trip that includes hiking, Inca history, and exploring Cusco.",
  },
  {
    id: "amalfi",
    name: "Amalfi Coast",
    country: "Italy",
    tagline: "Clifftop villages above turquoise seas",
    categories: ["beach", "food", "culture"],
    unsplashQuery: "amalfi coast italy sea",
    initialMessage:
      "Plan a scenic trip along the Amalfi Coast in Italy. Include coastal drives, charming villages, fresh seafood, and day trips to Pompeii.",
  },
  {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    tagline: "Ancient temples and bamboo forests",
    categories: ["culture", "city", "food"],
    unsplashQuery: "kyoto japan temple cherry",
    initialMessage:
      "Help me plan a trip to Kyoto, Japan. I want to visit ancient temples, walk through bamboo groves, and experience a tea ceremony.",
  },
  {
    id: "safari",
    name: "Serengeti",
    country: "Tanzania",
    tagline: "The great migration awaits",
    categories: ["adventure", "culture"],
    unsplashQuery: "serengeti safari africa wildlife",
    initialMessage:
      "Plan a safari adventure in the Serengeti, Tanzania. I want to see the Big Five and experience African wildlife up close.",
  },
  {
    id: "maldives",
    name: "Maldives",
    country: "Maldives",
    tagline: "Crystal waters and overwater bungalows",
    categories: ["beach"],
    unsplashQuery: "maldives overwater bungalow ocean",
    initialMessage:
      "Plan a luxury beach trip to the Maldives with an overwater bungalow, snorkeling, and ultimate relaxation.",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    tagline: "Gaudí, beaches, and tapas",
    categories: ["city", "food", "culture", "beach"],
    unsplashQuery: "barcelona spain gaudi",
    initialMessage:
      "Help me plan a trip to Barcelona, Spain. I want to see Gaudí's architecture, enjoy tapas, visit the beach, and explore the Gothic Quarter.",
  },
  {
    id: "iceland",
    name: "Iceland",
    country: "Iceland",
    tagline: "Northern lights and volcanic landscapes",
    categories: ["adventure"],
    unsplashQuery: "iceland northern lights aurora",
    initialMessage:
      "Plan an adventure trip to Iceland with Northern Lights viewing, the Golden Circle, waterfalls, and geothermal pools.",
  },
];

export const ITINERARY_TEMPLATES: ItineraryTemplate[] = [
  {
    id: "tokyo-7",
    title: "7 Days in Tokyo",
    destination: "Tokyo",
    country: "Japan",
    duration: 7,
    categories: ["city", "culture", "food"],
    highlights: ["Shibuya Crossing", "teamLab Borderless", "Tsukiji Market"],
    unsplashQuery: "tokyo shibuya night",
    initialMessage:
      "Create a detailed 7-day itinerary for Tokyo, Japan. Include must-see landmarks like Shibuya, Shinjuku, Asakusa, and Harajuku, plus day trips to Nikko and Kamakura. Add top restaurant and food stall recommendations.",
  },
  {
    id: "paris-weekend",
    title: "A Weekend in Paris",
    destination: "Paris",
    country: "France",
    duration: 3,
    categories: ["city", "culture", "food"],
    highlights: ["Eiffel Tower", "Louvre Museum", "Montmartre"],
    unsplashQuery: "paris eiffel tower evening",
    initialMessage:
      "Plan a perfect 3-day weekend in Paris, France. Include the Eiffel Tower, Louvre, Notre-Dame, a Seine River cruise, and the best Parisian cafés and restaurants.",
  },
  {
    id: "bali-5",
    title: "Bali in 5 Days",
    destination: "Bali",
    country: "Indonesia",
    duration: 5,
    categories: ["beach", "culture", "adventure"],
    highlights: ["Ubud Monkey Forest", "Tegallalang Rice Terrace", "Seminyak Beach"],
    unsplashQuery: "bali rice terrace ubud",
    initialMessage:
      "Create a 5-day Bali, Indonesia itinerary covering Ubud's cultural heart, Seminyak beaches, Tanah Lot temple, rice terraces, and a cooking class.",
  },
  {
    id: "nyc-long-weekend",
    title: "NYC Long Weekend",
    destination: "New York City",
    country: "USA",
    duration: 4,
    categories: ["city", "food", "culture"],
    highlights: ["Central Park", "The High Line", "Brooklyn Bridge"],
    unsplashQuery: "new york brooklyn bridge skyline",
    initialMessage:
      "Plan a 4-day New York City trip. Include Central Park, Times Square, Brooklyn Bridge, Chelsea Market, MOMA, a Broadway show, and the best spots in different neighborhoods.",
  },
  {
    id: "amalfi-week",
    title: "Amalfi Coast Week",
    destination: "Amalfi Coast",
    country: "Italy",
    duration: 7,
    categories: ["beach", "food", "culture"],
    highlights: ["Positano", "Ravello Gardens", "Pompeii Day Trip"],
    unsplashQuery: "positano amalfi coast colorful",
    initialMessage:
      "Create a 7-day Amalfi Coast itinerary covering Positano, Ravello, Amalfi town, a boat trip to Capri, and a day trip to Pompeii. Include the best seafood restaurants and hiking trails.",
  },
  {
    id: "iceland-ring-road",
    title: "Iceland Ring Road",
    destination: "Iceland",
    country: "Iceland",
    duration: 10,
    categories: ["adventure"],
    highlights: ["Golden Circle", "Jökulsárlón Glacier Lagoon", "Northern Lights"],
    unsplashQuery: "iceland ring road waterfall",
    initialMessage:
      "Plan a 10-day Iceland road trip along the Ring Road. Include the Golden Circle, South Coast waterfalls, glacier lagoon, whale watching, and the best spots for Northern Lights.",
  },
];

export const TRAVEL_CATEGORIES: { id: TravelCategory; label: string; emoji: string }[] = [
  { id: "all", label: "All", emoji: "✈️" },
  { id: "beach", label: "Beach", emoji: "🏖️" },
  { id: "city", label: "City", emoji: "🏙️" },
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "culture", label: "Culture", emoji: "🏛️" },
  { id: "food", label: "Food & Wine", emoji: "🍷" },
];
