export type MapHoverDetail = {
  type: "country" | "city" | "river" | "water" | "event" | "news" | "trade";
  name: string;
  eyebrow: string;
  detail: string;
  coordinates: [number, number];
  lens?: boolean;
  slug?: string;
  source?: string;
  eventId?: string;
};

export type ConflictBrief = {
  slug: string;
  intensity: "active" | "heightened" | "volatile";
  participants: { name: string; role: string; losses: string }[];
  civilianImpact: string;
};

export const continentFocuses = [
  { slug: "africa", name: "Africa", center: [20, 4] as [number, number], zoom: 2.35, description: "Source-backed geographic and intelligence layers" },
  { slug: "asia", name: "Asia", center: [92, 28] as [number, number], zoom: 1.9, description: "Source-backed geographic and intelligence layers" },
  { slug: "europe", name: "Europe", center: [16, 51] as [number, number], zoom: 2.75, description: "Source-backed geographic and intelligence layers" },
  { slug: "north-america", name: "North America", center: [-102, 43] as [number, number], zoom: 2.1, description: "Source-backed geographic and intelligence layers" },
  { slug: "south-america", name: "South America", center: [-60, -18] as [number, number], zoom: 2.2, description: "Source-backed geographic and intelligence layers" },
  { slug: "oceania", name: "Oceania", center: [145, -23] as [number, number], zoom: 2.1, description: "Source-backed geographic and intelligence layers" },
  { slug: "antarctica", name: "Antarctica", center: [15, -84] as [number, number], zoom: 2.25, description: "Treaty-governed continent and research locations" },
];
