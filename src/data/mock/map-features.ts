import type { FeatureCollection, LineString, Point, Polygon } from "geojson";

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
    ["Lagos", 3.38, 6.52, "Nigeria", "West African commercial megacity"],
    ["Kinshasa", 15.31, -4.32, "DR Congo", "Congo basin megacity and national capital"],
    ["Dar es Salaam", 39.21, -6.79, "Tanzania", "Indian Ocean trade and logistics hub"],
    ["Casablanca", -7.59, 33.57, "Morocco", "North African commercial and port city"],
    ["Algiers", 3.06, 36.75, "Algeria", "Mediterranean capital and energy center"],
    ["Dakar", -17.47, 14.72, "Senegal", "Atlantic West African capital"],
    ["Accra", -0.19, 5.56, "Ghana", "West African political and commercial center"],
    ["Mexico City", -99.13, 19.43, "Mexico", "North American megacity and national capital"],
    ["New York", -74.01, 40.71, "United States", "Global finance, media, and diplomacy center"],
    ["Los Angeles", -118.24, 34.05, "United States", "Pacific trade and media center"],
    ["Toronto", -79.38, 43.65, "Canada", "Canadian finance and population center"],
    ["Vancouver", -123.12, 49.28, "Canada", "Pacific-facing Canadian trade city"],
    ["Buenos Aires", -58.38, -34.6, "Argentina", "Southern Cone political and commercial center"],
    ["Lima", -77.04, -12.05, "Peru", "Andean Pacific capital"],
    ["Bogota", -74.07, 4.71, "Colombia", "Northern South American political center"],
    ["Santiago", -70.67, -33.45, "Chile", "Southern Pacific finance and political center"],
    ["Caracas", -66.9, 10.48, "Venezuela", "Caribbean-facing national capital"],
    ["Madrid", -3.7, 40.42, "Spain", "European political and transport center"],
    ["Paris", 2.35, 48.86, "France", "European diplomatic and economic center"],
    ["Berlin", 13.41, 52.52, "Germany", "European political center"],
    ["Rome", 12.5, 41.9, "Italy", "Mediterranean political and cultural center"],
    ["Warsaw", 21.01, 52.23, "Poland", "Central European security and logistics hub"],
    ["Brussels", 4.35, 50.85, "Belgium", "European Union and NATO institutional center"],
    ["Stockholm", 18.07, 59.33, "Sweden", "Nordic political and technology center"],
    ["Athens", 23.73, 37.98, "Greece", "Eastern Mediterranean capital"],
    ["Dubai", 55.27, 25.2, "United Arab Emirates", "Global aviation, finance, and logistics hub"],
    ["Riyadh", 46.68, 24.71, "Saudi Arabia", "Gulf political and economic center"],
    ["Baghdad", 44.37, 33.31, "Iraq", "Mesopotamian political center"],
    ["Karachi", 67.01, 24.86, "Pakistan", "Arabian Sea port megacity"],
    ["Mumbai", 72.88, 19.08, "India", "Indian financial and port megacity"],
    ["Dhaka", 90.41, 23.81, "Bangladesh", "Ganges delta megacity"],
    ["Bangkok", 100.5, 13.76, "Thailand", "Mainland Southeast Asian hub"],
    ["Singapore", 103.82, 1.35, "Singapore", "Global maritime and finance hub"],
    ["Jakarta", 106.85, -6.21, "Indonesia", "Southeast Asian megacity"],
    ["Manila", 120.98, 14.6, "Philippines", "Western Pacific national capital"],
    ["Seoul", 126.98, 37.57, "South Korea", "Northeast Asian technology and political center"],
    ["Shanghai", 121.47, 31.23, "China", "Yangtze delta financial and shipping center"],
    ["Hong Kong", 114.17, 22.32, "China", "Pearl River finance and logistics center"],
    ["Perth", 115.86, -31.95, "Australia", "Indian Ocean resources and trade city"],
    ["Auckland", 174.76, -36.85, "New Zealand", "South Pacific commercial center"],
  ].map(([name, lng, lat, country, detail], index) => ({
    type: "Feature",
    id: `city-${index}`,
    properties: { name, country, detail, kind: "city", priority: index < 22 ? 1 : index < 45 ? 2 : 3 },
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
    { type: "Feature", properties: { name: "Congo", detail: "A major equatorial river and transport system in Central Africa.", lens: false, kind: "river" }, geometry: { type: "LineString", coordinates: [[25.2,-11.5],[27,-7],[24,-3],[20,-1],[17.7,-4],[12.5,-6]] } },
    { type: "Feature", properties: { name: "Niger", detail: "A major West African river supporting cities, agriculture, and regional trade.", lens: false, kind: "river" }, geometry: { type: "LineString", coordinates: [[-10.8,9.5],[-6,11],[-2,16],[2,15],[5,12],[6.5,5.5]] } },
    { type: "Feature", properties: { name: "Mekong", detail: "A transboundary Southeast Asian river central to food, energy, and regional diplomacy.", lens: false, kind: "river" }, geometry: { type: "LineString", coordinates: [[94,33],[99,25],[101,21],[103,18],[105,14],[106,10]] } },
    { type: "Feature", properties: { name: "Ganges", detail: "A densely populated South Asian river system with major cultural and economic importance.", lens: false, kind: "river" }, geometry: { type: "LineString", coordinates: [[78.5,30.2],[81,26],[85,25],[88,24],[90.5,23]] } },
    { type: "Feature", properties: { name: "Indus", detail: "A major South Asian river supporting irrigation, cities, and industry.", lens: false, kind: "river" }, geometry: { type: "LineString", coordinates: [[80.7,32.5],[75,34],[72,31],[69,27],[67,24]] } },
    { type: "Feature", properties: { name: "Volga", detail: "Europe's longest river and a core Russian transport and industrial corridor.", lens: false, kind: "river" }, geometry: { type: "LineString", coordinates: [[33,57],[38,56],[44,53],[48,49],[47,46]] } },
    { type: "Feature", properties: { name: "Parana", detail: "A major South American river system connecting inland production to Atlantic ports.", lens: false, kind: "river" }, geometry: { type: "LineString", coordinates: [[-47,-20],[-54,-25],[-58,-30],[-58,-34]] } },
    { type: "Feature", properties: { name: "Murray-Darling", detail: "Australia's most important agricultural river basin.", lens: false, kind: "river" }, geometry: { type: "LineString", coordinates: [[147,-36],[144,-35],[141,-34],[139,-35]] } },
  ],
};

export const waterLabelFeatures: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    ["Pacific Ocean", -150, 5, "ocean", 1], ["Pacific Ocean", 160, 5, "ocean", 1], ["Atlantic Ocean", -30, 4, "ocean", 1],
    ["Indian Ocean", 78, -24, "ocean", 1], ["Arctic Ocean", 20, 78, "ocean", 1], ["Southern Ocean", 10, -62, "ocean", 1],
    ["Mediterranean Sea", 18, 35, "sea", 2], ["Red Sea", 38, 20, "sea", 2], ["Arabian Sea", 64, 15, "sea", 2],
    ["South China Sea", 114, 13, "sea", 2], ["Caribbean Sea", -75, 16, "sea", 2], ["Black Sea", 34, 43, "sea", 2],
    ["Baltic Sea", 19, 58, "sea", 3], ["Persian Gulf", 51, 27, "sea", 3], ["Gulf of Mexico", -90, 24, "sea", 2],
    ["Lake Victoria", 33, -1, "lake", 3], ["Lake Tanganyika", 29.5, -6.3, "lake", 3], ["Lake Baikal", 107.6, 53.5, "lake", 3],
    ["Caspian Sea", 51, 41, "lake", 2], ["Lake Superior", -88, 47.7, "lake", 3], ["Lake Michigan", -87, 44, "lake", 3],
    ["Lake Titicaca", -69.4, -15.8, "lake", 3], ["Great Bear Lake", -121, 66, "lake", 3], ["Lake Chad", 14.3, 13, "lake", 3],
  ].map(([name, lng, lat, kind, priority], index) => ({ type: "Feature", id: `water-${index}`, properties: { name, kind, priority }, geometry: { type: "Point", coordinates: [lng as number, lat as number] } })),
};

export const lakeFeatures: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    ["Lake Victoria", [[31.7,-0.1],[32,-2.1],[33.7,-2.6],[34.8,-1.6],[34.5,0.2],[33.2,0.6],[31.7,-0.1]]],
    ["Lake Tanganyika", [[29.1,-3.3],[29,-5.3],[29.4,-7.8],[30.7,-8.8],[30.9,-6.2],[29.8,-3.5],[29.1,-3.3]]],
    ["Lake Baikal", [[103.8,51.5],[105.3,53.1],[107.6,55.8],[109.8,55.9],[108.2,53.5],[105.8,51.7],[103.8,51.5]]],
    ["Lake Superior", [[-92,46.6],[-90,48],[-87,48.7],[-84.5,47.9],[-86.8,46.5],[-90,46.1],[-92,46.6]]],
    ["Lake Michigan", [[-88.1,46.1],[-86.2,45.7],[-86,43],[-87.2,41.6],[-88,43.7],[-88.1,46.1]]],
    ["Lake Titicaca", [[-70.1,-15.2],[-68.9,-15.4],[-68.7,-16.3],[-69.6,-16.6],[-70.1,-15.2]]],
    ["Lake Chad", [[13.5,13.2],[14.1,12.5],[14.8,12.8],[14.7,13.6],[13.5,13.2]]],
  ].map(([name, coordinates], index) => ({ type: "Feature", id: `lake-${index}`, properties: { name, kind: "lake", detail: `${name} is a strategically important freshwater system.` }, geometry: { type: "Polygon", coordinates: [coordinates as number[][]] } })),
};

export const globalNewsFeatures: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    ["CNN", "Security talks dominate Washington agenda", -77, 39, "Security", "United States framing emphasizes alliances and deterrence."],
    ["BBC", "European capitals debate the next security package", -0.1, 51.5, "Conflict", "British coverage emphasizes diplomacy, battlefield changes, and European security."],
    ["Reuters", "Markets track shipping and energy risk", 2.3, 48.9, "Trade", "A wire-service view connecting geopolitical risk with commodities and transport."],
    ["DW", "European industry watches trade-route disruption", 13.4, 52.5, "Economy", "German coverage emphasizes industrial exposure and European policy."],
    ["France 24", "Mediterranean diplomacy enters a new round", 2.35, 48.7, "Diplomacy", "French international coverage emphasizes diplomacy and regional institutions."],
    ["Al Jazeera", "Regional voices assess Red Sea escalation", 51.5, 25.3, "Security", "Regional coverage foregrounds civilian impact and Middle Eastern perspectives."],
    ["Ahram", "Nile states restate water-security positions", 31.2, 30, "Diplomacy", "Egyptian framing emphasizes water security and binding coordination."],
    ["Addis Standard", "Horn corridor talks return to focus", 38.8, 9, "Diplomacy", "Ethiopian coverage emphasizes development, access, and regional integration."],
    ["Africa Report", "Investors assess Africa infrastructure corridors", 3.4, 6.5, "Trade", "Pan-African business coverage emphasizes infrastructure and capital flows."],
    ["SABC", "Southern African currencies respond to commodity moves", 28, -26.2, "Currency", "Regional coverage follows currencies, mining, and export demand."],
    ["Globo", "Amazon policy and commodity exports shape debate", -47.9, -15.8, "Economy", "Brazilian coverage connects environmental policy, exports, and domestic politics."],
    ["AP", "Pacific governments review regional posture", -118.2, 34, "Security", "International coverage tracks regional partnerships and military signaling."],
    ["Nikkei", "Asian supply chains price in maritime risk", 139.7, 35.7, "Trade", "Japanese business coverage emphasizes shipping, chips, and supply chains."],
    ["CCTV", "Regional cooperation leads economic bulletin", 116.4, 39.9, "Economy", "Chinese state-media framing emphasizes stability, sovereignty, and development."],
    ["Yonhap", "Technology exporters monitor regional tensions", 127, 37.6, "Trade", "Korean coverage focuses on semiconductors, exports, and security."],
    ["ABC", "Pacific trade and climate security share agenda", 151.2, -33.9, "Climate", "Australian coverage connects maritime security, trade, and climate resilience."],
    ["NDTV", "Energy prices and border diplomacy lead regional coverage", 77.1, 28.7, "Economy", "Indian coverage foregrounds energy exposure and strategic autonomy."],
    ["TRT World", "Black Sea and Middle East diplomacy intersect", 29, 41, "Diplomacy", "Turkish coverage emphasizes mediation, corridors, and regional security."],
  ].map(([source, name, lng, lat, category, detail], index) => ({ type: "Feature", id: `pulse-${index}`, properties: { source, name, category, detail, mapType: "news", slug: `pulse-${index}` }, geometry: { type: "Point", coordinates: [lng as number, lat as number] } })),
};

export const globalEventFeatures: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    ["eastern-congo", "Eastern Congo conflict", 29.2, -1.7, "Conflict", "Multiple state and non-state actors contest territory around the Great Lakes region."],
    ["sahel-instability", "Sahel instability", 1.5, 15, "Conflict", "Insurgencies, military governments, local forces, and external partners shape a cross-border security crisis."],
    ["yemen-conflict", "Yemen conflict", 45.2, 15.4, "Conflict", "A multi-party conflict with domestic, regional, maritime, and humanitarian dimensions."],
    ["myanmar-conflict", "Myanmar conflict", 96, 20, "Conflict", "State forces and multiple armed organizations contest territory and political authority."],
    ["korean-peninsula", "Korean Peninsula tension", 127.3, 38, "Tension", "Military signaling, missile activity, alliances, and nuclear policy drive recurring tension."],
    ["south-china-sea", "South China Sea disputes", 114, 12, "Tension", "Overlapping claims, maritime patrols, fisheries, and alliance commitments create persistent friction."],
    ["caucasus-tension", "South Caucasus tension", 45, 40.2, "Tension", "Border security, transport corridors, displaced populations, and diplomacy remain closely connected."],
    ["guyana-venezuela", "Guyana–Venezuela dispute", -60.5, 7, "Tension", "A territorial dispute intersects with offshore energy development and regional diplomacy."],
    ["kashmir-tension", "Kashmir tension", 75, 34, "Tension", "Territorial claims, security incidents, and bilateral rivalry shape a persistent flashpoint."],
    ["haiti-crisis", "Haiti security crisis", -72.3, 19, "Conflict", "Armed groups, public institutions, civilian communities, and international missions form a complex crisis."],
  ].map(([slug, name, lng, lat, kind, detail], index) => ({ type: "Feature", id: `global-event-${index}`, properties: { slug, name, detail, kind, status: kind === "Conflict" ? "Active" : "Heightened", mapType: "event" }, geometry: { type: "Point", coordinates: [lng as number, lat as number] } })),
};

export const conflictRouteFeatures: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [
    ["russia-ukraine", "Russia–Ukraine", [[37.6,55.8],[34.5,52],[30.5,50.5]], "Active strike and front-line context"],
    ["sudan-conflict", "Sudan Conflict", [[32.6,15.5],[30.5,14.5],[28.8,13]], "Multiple armed parties and shifting control"],
    ["iran-israel", "Iran–Israel", [[51.4,35.7],[44,33],[35.2,31.8]], "Direct and networked regional escalation"],
    ["taiwan-strait", "Taiwan Strait", [[116.4,39.9],[120,29],[121.6,25]], "Military signaling across the strait"],
    ["eastern-congo", "Eastern Congo conflict", [[30.1,-1.9],[29.2,-1.7],[28.9,-2.5]], "Regional and non-state armed actors around the Great Lakes"],
    ["yemen-conflict", "Yemen conflict", [[44.2,15.4],[45.1,14],[45,12.8]], "Domestic and regional armed networks"],
    ["korean-peninsula", "Korean Peninsula tension", [[125.8,39],[127.3,38],[127,37.5]], "Military signaling across the demarcation zone"],
    ["south-china-sea", "South China Sea disputes", [[116.4,20],[114,14],[120.9,14.6]], "Overlapping maritime claims and patrol routes"],
    ["guyana-venezuela", "Guyana–Venezuela dispute", [[-66.9,10.5],[-62,8],[-58.2,6.8]], "Territorial claim and offshore energy context"],
  ].map(([slug, name, coordinates, detail], index) => ({ type: "Feature", id: `conflict-${index}`, properties: { slug, name, detail, kind: slug === "taiwan-strait" ? "Tension" : "Conflict", mapType: "event" }, geometry: { type: "LineString", coordinates: coordinates as number[][] } })),
};

export const tradeRouteFeatures: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [
    ["Trans-Pacific container route", [[121.5,31.2],[165,35],[-150,35],[-118.2,34]], "$1.8T demo annual corridor", "USD / CNY / JPY"],
    ["Asia–Europe maritime route", [[103.8,1.3],[80,8],[43,13],[32.5,30],[12,38],[4,51]], "$1.2T demo annual corridor", "USD / EUR / CNY"],
    ["North Atlantic trade route", [[-74,40.7],[-38,47],[-0.1,51.5]], "$940B demo annual corridor", "USD / EUR / GBP"],
    ["South Atlantic commodities route", [[-46.6,-23.5],[-20,-24],[18,-34],[55,25]], "$310B demo annual corridor", "BRL / USD / AED"],
  ].map(([name, coordinates, detail, currency], index) => ({ type: "Feature", id: `trade-${index}`, properties: { name, detail, currency, mapType: "trade" }, geometry: { type: "LineString", coordinates: coordinates as number[][] } })),
};

export type ConflictBrief = {
  slug: string;
  participants: Array<{ name: string; role: string; losses: string }>;
  civilianImpact: string;
  intensity: "active" | "volatile" | "heightened";
};

export const conflictBriefs: Record<string, ConflictBrief> = {
  "russia-ukraine": { slug: "russia-ukraine", intensity: "active", civilianImpact: "Severe displacement and infrastructure damage", participants: [{ name: "Ukraine", role: "Primary actor", losses: "Demo range: 45–70k" }, { name: "Russia", role: "Primary actor", losses: "Demo range: 70–110k" }, { name: "External partners", role: "Support network", losses: "Not represented" }] },
  "sudan-conflict": { slug: "sudan-conflict", intensity: "active", civilianImpact: "Large-scale displacement and humanitarian access constraints", participants: [{ name: "State-aligned forces", role: "Primary actor", losses: "Demo range: 8–16k" }, { name: "Opposing armed forces", role: "Primary actor", losses: "Demo range: 9–18k" }, { name: "Civilians", role: "Affected population", losses: "Demo range: 12–30k" }] },
  "iran-israel": { slug: "iran-israel", intensity: "volatile", civilianImpact: "Regional escalation and infrastructure risk", participants: [{ name: "Iran-aligned network", role: "Primary network", losses: "Demo index: elevated" }, { name: "Israel and partners", role: "Primary network", losses: "Demo index: elevated" }] },
  "taiwan-strait": { slug: "taiwan-strait", intensity: "heightened", civilianImpact: "No casualty estimate; scenario tracks military pressure", participants: [{ name: "China", role: "Primary actor", losses: "Not applicable" }, { name: "Taiwan", role: "Primary actor", losses: "Not applicable" }, { name: "Regional partners", role: "External actors", losses: "Not applicable" }] },
  "eastern-congo": { slug: "eastern-congo", intensity: "active", civilianImpact: "Displacement and severe insecurity across civilian communities", participants: [{ name: "Congolese state forces", role: "State actor", losses: "Demo index: high" }, { name: "Armed movements", role: "Non-state actors", losses: "Demo index: high" }, { name: "Regional actors", role: "External network", losses: "Not consolidated" }] },
  "sahel-instability": { slug: "sahel-instability", intensity: "active", civilianImpact: "Cross-border displacement, food insecurity, and restricted public services", participants: [{ name: "State forces", role: "Multiple governments", losses: "Demo index: elevated" }, { name: "Insurgent networks", role: "Non-state actors", losses: "Demo index: elevated" }, { name: "Local communities", role: "Affected population", losses: "Demo index: severe" }] },
  "yemen-conflict": { slug: "yemen-conflict", intensity: "active", civilianImpact: "Long-running humanitarian crisis and infrastructure damage", participants: [{ name: "Government-aligned network", role: "Coalition", losses: "Demo index: high" }, { name: "Opposing armed movement", role: "Primary actor", losses: "Demo index: high" }, { name: "Regional actors", role: "External parties", losses: "Not consolidated" }] },
  "myanmar-conflict": { slug: "myanmar-conflict", intensity: "active", civilianImpact: "Large-scale displacement and restricted humanitarian access", participants: [{ name: "State military", role: "State actor", losses: "Demo index: high" }, { name: "Resistance forces", role: "Multiple organizations", losses: "Demo index: high" }, { name: "Ethnic armed organizations", role: "Multiple parties", losses: "Not consolidated" }] },
  "korean-peninsula": { slug: "korean-peninsula", intensity: "heightened", civilianImpact: "No current casualty range; escalation-risk tracker", participants: [{ name: "North Korea", role: "Primary actor", losses: "Not applicable" }, { name: "South Korea", role: "Primary actor", losses: "Not applicable" }, { name: "Alliance partners", role: "External actors", losses: "Not applicable" }] },
  "south-china-sea": { slug: "south-china-sea", intensity: "heightened", civilianImpact: "Maritime safety and fishing-community exposure", participants: [{ name: "China", role: "Primary claimant", losses: "Not applicable" }, { name: "Southeast Asian claimants", role: "Multiple states", losses: "Not applicable" }, { name: "External navies", role: "Security actors", losses: "Not applicable" }] },
  "guyana-venezuela": { slug: "guyana-venezuela", intensity: "heightened", civilianImpact: "No current casualty range; territorial escalation tracker", participants: [{ name: "Guyana", role: "Primary claimant", losses: "Not applicable" }, { name: "Venezuela", role: "Primary claimant", losses: "Not applicable" }, { name: "Regional mediators", role: "Diplomatic actors", losses: "Not applicable" }] },
};

export type MapHoverDetail = {
  type: "country" | "city" | "river" | "event" | "news" | "trade" | "water";
  name: string;
  eyebrow: string;
  detail: string;
  coordinates: [number, number];
  lens?: boolean;
  slug?: string;
  source?: string;
};
