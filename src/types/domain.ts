export type GeoKind = "country" | "territory" | "organization";
export type TopicKind = "Conflict" | "Tension" | "Diplomatic" | "Economic" | "Developing";
export type TimelineKind = "Diplomacy" | "Conflict" | "Economic" | "Statements" | "Agreements";

export interface Coordinates { lng: number; lat: number; zoom: number }
export interface Metric { label: string; value: string; detail: string }
export interface SeriesPoint { year: number; value: number }
export interface EconomicSeries { name: string; unit: string; color: string; points: SeriesPoint[] }

export interface GeoEntity {
  id: string;
  slug: string;
  name: string;
  officialName: string;
  kind: GeoKind;
  continent: string;
  region: string;
  capital: string;
  population: string;
  currency: string;
  languages: string[];
  government: string;
  coordinates: Coordinates;
  summary: string;
  context: string;
  topicSlugs: string[];
  relationSlugs: string[];
  memberships: string[];
  securityIssues: string[];
  metrics: Metric[];
  economy: EconomicSeries[];
  exports: TradePartner[];
  imports: TradePartner[];
  products: { exports: string[]; imports: string[] };
}

export interface Region {
  slug: string;
  name: string;
  continent: string;
  coordinates: Coordinates;
  entitySlugs: string[];
  topicSlugs: string[];
  summary: string;
  metrics: Metric[];
}

export interface TopicActor { slug: string; name: string; role: string; coordinates?: Coordinates }
export interface TimelineEvent { id: string; date: string; kind: TimelineKind; title: string; detail: string }
export interface CoverageGroup {
  name: string;
  volume: number;
  terms: string[];
  people: string[];
  organizations: string[];
  themes: string[];
  framing: string;
}

export interface Topic {
  slug: string;
  name: string;
  eyebrow: string;
  kind: TopicKind;
  status: string;
  region: string;
  coordinates: Coordinates;
  actorSlugs: string[];
  actors: TopicActor[];
  themes: string[];
  summary: string;
  whyItMatters: string;
  disagreements: string[];
  currentStatus: string;
  timeline: TimelineEvent[];
  coverage: CoverageGroup[];
  metrics: Metric[];
}

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  sourceCountry: string;
  publishedAt: string;
  category: string;
  topicSlug: string;
  entitySlugs: string[];
  summary: string;
  region: string;
}

export interface Statement {
  id: string;
  actorSlug: string;
  speaker: string;
  role: string;
  organization: string;
  date: string;
  topicSlug: string;
  summary: string;
  sourceType: "Official release" | "Briefing" | "Address";
}

export interface TradePartner { slug: string; name: string; value: number; share: number }
export interface Relationship {
  slugs: [string, string];
  status: string;
  summary: string;
  emphasis: string[];
  trade: string;
  developments: string[];
  timeline: TimelineEvent[];
}

export type SearchResult = {
  type: "Country" | "Region" | "Topic" | "Conflict";
  slug: string;
  name: string;
  meta: string;
  href: string;
};
