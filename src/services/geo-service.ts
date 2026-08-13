import type { GeoEntity, NewsArticle, Region, Relationship, SearchResult, Statement, Topic } from "@/types/domain";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { accept: "application/json" } });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`geoP API ${response.status}: ${detail || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const continents = [
  { slug: "africa", name: "Africa", coordinates: { lng: 20, lat: 3, zoom: 2.2 }, regions: ["Northern Africa", "Western Africa", "Eastern Africa", "Middle Africa", "Southern Africa"], entityCount: "Live" },
  { slug: "asia", name: "Asia", coordinates: { lng: 90, lat: 28, zoom: 1.8 }, regions: ["Eastern Asia", "Southern Asia", "South-eastern Asia", "Central Asia", "Western Asia"], entityCount: "Live" },
  { slug: "europe", name: "Europe", coordinates: { lng: 15, lat: 51, zoom: 2.6 }, regions: ["Northern Europe", "Western Europe", "Eastern Europe", "Southern Europe"], entityCount: "Live" },
  { slug: "americas", name: "Americas", coordinates: { lng: -80, lat: 15, zoom: 1.6 }, regions: ["Northern America", "Central America", "Caribbean", "South America"], entityCount: "Live" },
  { slug: "oceania", name: "Oceania", coordinates: { lng: 145, lat: -22, zoom: 2 }, regions: ["Australia and New Zealand", "Melanesia", "Micronesia", "Polynesia"], entityCount: "Live" },
];

export const geoService = {
  entities: () => request<GeoEntity[]>("/entities"),
  entity: (slug: string) => request<GeoEntity>(`/entities/${encodeURIComponent(slug)}`),
  topics: () => request<Topic[]>("/topics"),
  topic: (slug: string) => request<Topic>(`/topics/${encodeURIComponent(slug)}`),
  regions: () => request<Region[]>("/regions"),
  region: (slug: string) => request<Region>(`/regions/${encodeURIComponent(slug)}`),
  news: () => request<NewsArticle[]>("/news?limit=100"),
  statements: () => request<Statement[]>("/statements"),
  relationship: (a: string, b: string) => request<Relationship>(`/relationships/${encodeURIComponent(a)}/${encodeURIComponent(b)}`),
  search: (query: string) => request<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`),
  geography: () => request<RealMapGeography>("/map/geography"),
  conflicts: () => request<RealConflictEvent[]>("/conflicts?days=365"),
  continents,
};

export type RealMapGeography = {
  rivers: GeoJSON.FeatureCollection;
  lakes: GeoJSON.FeatureCollection;
  cities: GeoJSON.FeatureCollection;
  provenance: { provider: string; scale: string; retrievedAt: string; note: string };
};

export type RealConflictEvent = {
  id: string; conflictId: string; name: string; dyad: string; sideA: string; sideB: string; parties: string[];
  country: string; region: string; coordinates: { lng: number; lat: number }; location: string; dateStart: string; dateEnd: string;
  fatalities: { best: number; low: number; high: number; civilians: number; sideA: number; sideB: number; unknown: number };
  sourceOriginal: string; sourceArticle: string; provenance: { provider: string; release: string; retrievedAt: string; sourceUrl: string };
};
