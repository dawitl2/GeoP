import type { FeatureCollection, LineString, Point } from "geojson";

export type ContinentFocus = {
  slug: string;
  name: string;
  center: [number, number];
  zoom: number;
  description: string;
};

export const continentFocuses: ContinentFocus[] = [
  { slug: "africa", name: "Africa", center: [20, 4], zoom: 2.35, description: "54+ states and interconnected regional systems" },
  { slug: "asia", name: "Asia", center: [92, 28], zoom: 1.9, description: "East, South, Central, and Western Asian systems" },
  { slug: "europe", name: "Europe", center: [16, 51], zoom: 2.75, description: "Dense political, economic, and security networks" },
  { slug: "north-america", name: "North America", center: [-102, 43], zoom: 2.1, description: "Continental trade, security, and diplomatic links" },
  { slug: "south-america", name: "South America", center: [-60, -18], zoom: 2.2, description: "Amazon, Andes, Atlantic, and regional institutions" },
  { slug: "oceania", name: "Oceania", center: [145, -23], zoom: 2.1, description: "Australia, the Pacific, and island states" },
  { slug: "antarctica", name: "Antarctica", center: [15, -84], zoom: 2.25, description: "Treaty governance, research, and climate systems" },
];

export const cityFeatures: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    ["Addis Ababa", 38.75, 9.03, "Ethiopia", "Diplomatic and African institutional center"],
    ["Cairo", 31.24, 30.04, "Egypt", "Nile megacity and political center"],
    ["Khartoum", 32.56, 15.5, "Sudan", "Confluence city on the Blue and White Nile"],
    ["Nairobi", 36.82, -1.29, "Kenya", "East African economic and diplomatic hub"],
    ["Mogadishu", 45.32, 2.05, "Somalia", "Indian Ocean capital"],
    ["Kyiv", 30.52, 50.45, "Ukraine", "National capital and major conflict-context city"],
    ["Moscow", 37.62, 55.76, "Russia", "National capital and strategic center"],
    ["Beijing", 116.4, 39.9, "China", "National political center"],
    ["Taipei", 121.56, 25.04, "Taiwan", "Cross-strait political and economic center"],
    ["Tokyo", 139.69, 35.69, "Japan", "Global economic and regional security center"],
    ["Tehran", 51.39, 35.69, "Iran", "National capital and regional diplomatic center"],
    ["Jerusalem", 35.21, 31.77, "Israel", "Politically significant and contested city"],
    ["Washington, D.C.", -77.04, 38.9, "United States", "Federal capital and global diplomatic center"],
    ["London", -0.13, 51.51, "United Kingdom", "Financial and diplomatic center"],
    ["Brasília", -47.88, -15.79, "Brazil", "Federal capital"],
    ["Manaus", -60.02, -3.12, "Brazil", "Major Amazon basin city"],
    ["São Paulo", -46.63, -23.55, "Brazil", "South American economic hub"],
    ["Johannesburg", 28.05, -26.2, "South Africa", "Southern African economic center"],
    ["Delhi", 77.1, 28.7, "India", "National capital region"],
    ["Istanbul", 28.98, 41.01, "Türkiye", "Bosphorus city bridging Europe and Asia"],
    ["Sydney", 151.21, -33.87, "Australia", "Pacific-facing global city"],
  ].map(([name, lng, lat, country, detail], index) => ({
    type: "Feature",
    id: `city-${index}`,
    properties: { name, country, detail, kind: "city" },
    geometry: { type: "Point", coordinates: [lng as number, lat as number] },
  })),
};

export const riverFeatures: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Nile", detail: "A transboundary river central to water, agriculture, energy, and diplomacy.", lens: true, kind: "river" },
      geometry: { type: "LineString", coordinates: [[31.2, 30.1], [31.1, 27], [32.1, 23], [32.5, 18], [32.6, 15.6], [33.2, 13], [34.5, 10.8], [35.1, 8.2], [33.9, 2.1], [32.9, -0.4]] },
    },
    {
      type: "Feature",
      properties: { name: "Amazon", detail: "The world's largest river system by discharge, crossing the Amazon basin to the Atlantic.", lens: true, kind: "river" },
      geometry: { type: "LineString", coordinates: [[-73.5, -4.4], [-70, -4], [-66, -3.7], [-62, -3.1], [-58, -2.5], [-54, -1.7], [-50.5, -1.1]] },
    },
    {
      type: "Feature",
      properties: { name: "Danube", detail: "A major European river linking Central and Eastern Europe to the Black Sea.", lens: false, kind: "river" },
      geometry: { type: "LineString", coordinates: [[8.2, 48.1], [12.5, 48.5], [16.4, 48.2], [19.1, 47.5], [22.8, 45.2], [26.1, 44.1], [29.7, 45.2]] },
    },
    {
      type: "Feature",
      properties: { name: "Yangtze", detail: "China's longest river and a major economic and population corridor.", lens: false, kind: "river" },
      geometry: { type: "LineString", coordinates: [[91, 33], [99, 30.5], [104.1, 29.8], [108.5, 30.7], [114.3, 30.6], [121.5, 31.4]] },
    },
    {
      type: "Feature",
      properties: { name: "Mississippi", detail: "A continental river system connecting the central United States to the Gulf of Mexico.", lens: false, kind: "river" },
      geometry: { type: "LineString", coordinates: [[-95.2, 47], [-93.2, 44.9], [-90.2, 38.6], [-90.1, 35.1], [-91.1, 30.1], [-89.2, 29.1]] },
    },
  ],
};

export type MapHoverDetail = {
  type: "country" | "city" | "river" | "event" | "news";
  name: string;
  eyebrow: string;
  detail: string;
  coordinates: [number, number];
  lens?: boolean;
  slug?: string;
};
