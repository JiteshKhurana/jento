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
    id: "jaipur",
    name: "Jaipur",
    country: "India",
    tagline: "The Pink City of palaces and forts",
    categories: ["culture", "city", "food"],
    unsplashQuery: "jaipur india hawa mahal",
    initialMessage:
      "Plan a trip to Jaipur, India. I want to explore Amber Fort, Hawa Mahal, local bazaars, and Rajasthani cuisine.",
  },
  {
    id: "goa",
    name: "Goa",
    country: "India",
    tagline: "Sun, sand, and Portuguese charm",
    categories: ["beach", "food", "culture"],
    unsplashQuery: "goa india beach palm",
    initialMessage:
      "Help me plan a beach trip to Goa, India. Include the best beaches, seafood shacks, Portuguese heritage sites, and nightlife.",
  },
  {
    id: "kerala",
    name: "Kerala",
    country: "India",
    tagline: "Backwaters, spice gardens, and lush greenery",
    categories: ["culture", "beach", "food"],
    unsplashQuery: "kerala india backwaters houseboat",
    initialMessage:
      "Plan a relaxing trip to Kerala, India. Include houseboat cruises on the backwaters, Munnar tea plantations, and authentic South Indian food.",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    country: "India",
    tagline: "Bollywood, street food, and seafront energy",
    categories: ["city", "food", "culture"],
    unsplashQuery: "mumbai india gateway of india",
    initialMessage:
      "Help me plan a trip to Mumbai, India. I want to explore street food, Marine Drive, historic neighborhoods, and day trips to Elephanta Caves.",
  },
  {
    id: "udaipur",
    name: "Udaipur",
    country: "India",
    tagline: "Romantic lakes and royal palaces",
    categories: ["culture", "city"],
    unsplashQuery: "udaipur india lake palace",
    initialMessage:
      "Plan a romantic trip to Udaipur, India. Include Lake Pichola, City Palace, sunset boat rides, and heritage haveli stays.",
  },
  {
    id: "ladakh",
    name: "Ladakh",
    country: "India",
    tagline: "High-altitude desert and mountain monasteries",
    categories: ["adventure", "culture"],
    unsplashQuery: "ladakh india mountains monastery",
    initialMessage:
      "Plan an adventure trip to Ladakh, India. Include Leh, Pangong Lake, Nubra Valley, monasteries, and scenic high-altitude drives.",
  },
  {
    id: "varanasi",
    name: "Varanasi",
    country: "India",
    tagline: "Ancient ghats and spiritual rituals",
    categories: ["culture"],
    unsplashQuery: "varanasi india ganges ghats",
    initialMessage:
      "Help me plan a cultural trip to Varanasi, India. I want to experience the Ganges ghats at sunrise, temple visits, and local Banarasi cuisine.",
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
];

export const ITINERARY_TEMPLATES: ItineraryTemplate[] = [
  {
    id: "golden-triangle-7",
    title: "Golden Triangle in 7 Days",
    destination: "Delhi, Agra & Jaipur",
    country: "India",
    duration: 7,
    categories: ["culture", "city", "food"],
    highlights: ["Taj Mahal", "Amber Fort", "Old Delhi Food Walk"],
    unsplashQuery: "taj mahal india agra",
    initialMessage:
      "Create a 7-day Golden Triangle itinerary for India covering Delhi, Agra, and Jaipur. Include the Taj Mahal, forts, bazaars, and the best local food experiences.",
  },
  {
    id: "goa-5",
    title: "Goa in 5 Days",
    destination: "Goa",
    country: "India",
    duration: 5,
    categories: ["beach", "food", "culture"],
    highlights: ["Palolem Beach", "Old Goa Churches", "Spice Plantation Tour"],
    unsplashQuery: "goa india beach sunset",
    initialMessage:
      "Create a 5-day Goa, India itinerary with North and South Goa beaches, Portuguese churches in Old Goa, seafood restaurants, and a spice plantation visit.",
  },
  {
    id: "kerala-6",
    title: "Kerala in 6 Days",
    destination: "Kerala",
    country: "India",
    duration: 6,
    categories: ["culture", "beach", "food"],
    highlights: ["Alleppey Houseboat", "Munnar Tea Gardens", "Fort Kochi"],
    unsplashQuery: "kerala munnar tea plantation",
    initialMessage:
      "Plan a 6-day Kerala, India itinerary with a backwater houseboat stay in Alleppey, tea plantations in Munnar, and heritage walks in Fort Kochi.",
  },
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
    highlights: [
      "Ubud Monkey Forest",
      "Tegallalang Rice Terrace",
      "Seminyak Beach",
    ],
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
    highlights: [
      "Golden Circle",
      "Jökulsárlón Glacier Lagoon",
      "Northern Lights",
    ],
    unsplashQuery: "iceland ring road waterfall",
    initialMessage:
      "Plan a 10-day Iceland road trip along the Ring Road. Include the Golden Circle, South Coast waterfalls, glacier lagoon, whale watching, and the best spots for Northern Lights.",
  },
];

export const TRAVEL_CATEGORIES: {
  id: TravelCategory;
  label: string;
  emoji: string;
}[] = [
  { id: "all", label: "All", emoji: "✈️" },
  { id: "beach", label: "Beach", emoji: "🏖️" },
  { id: "city", label: "City", emoji: "🏙️" },
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "culture", label: "Culture", emoji: "🏛️" },
  { id: "food", label: "Food & Wine", emoji: "🍷" },
];
