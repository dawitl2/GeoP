"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type StyleSpecification,
} from "maplibre-gl";
import { feature, mesh } from "topojson-client";
import countriesTopology from "world-atlas/countries-110m.json";
import type { FeatureCollection, GeoJsonProperties, Geometry, MultiLineString, Point, Position } from "geojson";
import { Crosshair, ExternalLink, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useEntities, useNews, useTopics } from "@/lib/queries";
import { continentFocuses, cityFeatures, riverFeatures, type MapHoverDetail } from "@/data/mock/map-features";
import { slugifyCountryName } from "@/lib/text";

type GlobeProps = {
  compact?: boolean;
  controlledEntity?: string;
  controlledTopic?: string;
  relatedSlugs?: string[];
};

const WORLD_CENTER: [number, number] = [18, 12];
const WORLD_ZOOM = 1.2;
const globeStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "ocean", type: "background", paint: { "background-color": "#12333d" } }],
  sky: {
    "sky-color": "#020507",
    "sky-horizon-blend": 0.22,
    "horizon-color": "#7fa5ad",
    "horizon-fog-blend": 0.08,
    "fog-color": "#234a55",
    "fog-ground-blend": 0.55,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.9, 6, 0.18],
  },
};

const continentByCountry: Record<string, string> = {
  Ethiopia: "africa", Egypt: "africa", Sudan: "africa", Somalia: "africa", Eritrea: "africa", Kenya: "africa", "South Africa": "africa",
  Ukraine: "europe", Russia: "europe", France: "europe", Germany: "europe", "United Kingdom": "europe", "Türkiye": "europe",
  China: "asia", Taiwan: "asia", Iran: "asia", Israel: "asia", India: "asia", Japan: "asia", "Saudi Arabia": "asia", "United Arab Emirates": "asia",
  "United States": "north-america", Brazil: "south-america",
};

function collectPositions(value: unknown, output: Position[]) {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === "number" && typeof value[1] === "number") {
    output.push(value as Position);
    return;
  }
  value.forEach((item) => collectPositions(item, output));
}

function featureCenter(geometry: Geometry): [number, number] {
  const positions: Position[] = [];
  if ("coordinates" in geometry) collectPositions(geometry.coordinates, positions);
  if (!positions.length) return [0, 0];
  let longitudes = positions.map((point) => point[0]);
  const latitudes = positions.map((point) => point[1]);
  if (Math.max(...longitudes) - Math.min(...longitudes) > 300) longitudes = longitudes.map((value) => value < 0 ? value + 360 : value);
  let lng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
  if (lng > 180) lng -= 360;
  return [lng, (Math.min(...latitudes) + Math.max(...latitudes)) / 2];
}

function continentFromCoordinate([lng, lat]: [number, number]): string {
  if (lat < -58) return "antarctica";
  if (lng < -25 && lat >= 8) return "north-america";
  if (lng < -28 && lat < 18) return "south-america";
  if (lng >= -25 && lng <= 58 && lat >= -38 && lat < 38) return "africa";
  if (lng >= -25 && lng <= 62 && lat >= 38) return "europe";
  if ((lng >= 105 && lat < 2) || (lng < -120 && lat < 10)) return "oceania";
  return "asia";
}

const buildEventFeatures = (topics: Awaited<ReturnType<typeof import("@/services/geo-service").geoService.topics>>): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: topics.map((topic) => ({
    type: "Feature",
    properties: { name: topic.name, slug: topic.slug, detail: topic.summary, status: topic.status, kind: topic.kind },
    geometry: { type: "Point", coordinates: [topic.coordinates.lng, topic.coordinates.lat] },
  })),
});

const buildNewsFeatures = (
  articles: Awaited<ReturnType<typeof import("@/services/geo-service").geoService.news>>,
  entities: Awaited<ReturnType<typeof import("@/services/geo-service").geoService.entities>>,
): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: articles.slice(0, 8).flatMap((article, index) => {
    const entity = article.entitySlugs.map((slug) => entities.find((item) => item.slug === slug)).find(Boolean);
    if (!entity) return [];
    return [{
      type: "Feature" as const,
      properties: { name: article.headline, slug: article.topicSlug, detail: article.summary, source: article.source, mapType: "news" },
      geometry: { type: "Point" as const, coordinates: [entity.coordinates.lng + (index % 3 - 1) * 1.2, entity.coordinates.lat + (index % 2 ? 0.8 : -0.8)] },
    }];
  }),
});

export function GeoGlobe({ compact = false, controlledEntity, controlledTopic, relatedSlugs = [] }: GlobeProps) {
  const container = useRef<HTMLDivElement>(null);
  const magnifier = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const magnifierRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<MapHoverDetail | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(controlledEntity ?? null);
  const [selectedCountryInfo, setSelectedCountryInfo] = useState<MapHoverDetail | null>(null);
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [lens, setLens] = useState<MapHoverDetail | null>(null);
  const [zoom, setZoom] = useState(WORLD_ZOOM);
  const { data: entities = [] } = useEntities();
  const { data: topics = [] } = useTopics();
  const { data: news = [] } = useNews();

  const entityBySlug = useMemo(() => new Map(entities.map((entity) => [entity.slug, entity])), [entities]);
  const countries = useMemo(() => {
    const topology = countriesTopology as { objects: { countries: unknown } };
    const collection = feature(countriesTopology as never, topology.objects.countries as never) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;
    collection.features.forEach((item) => {
      const name = String(item.properties?.name ?? "Unknown");
      const slug = slugifyCountryName(name);
      const entity = entityBySlug.get(slug);
      const center = featureCenter(item.geometry);
      item.properties = {
        ...item.properties,
        name: entity?.name ?? name,
        slug: entity?.slug ?? slug,
        rich: entity ? 1 : 0,
        continent: entity ? continentByCountry[entity.name] ?? continentFromCoordinate(center) : continentFromCoordinate(center),
        centerLng: entity?.coordinates.lng ?? center[0],
        centerLat: entity?.coordinates.lat ?? center[1],
        detail: entity?.summary ?? "Global country geometry. Detailed local intelligence is limited in this prototype.",
      };
    });
    return collection;
  }, [entityBySlug]);

  const countryBorders = useMemo(() => {
    const topology = countriesTopology as { objects: { countries: unknown } };
    return mesh(countriesTopology as never, topology.objects.countries as never, (a, b) => a !== b) as unknown as MultiLineString;
  }, []);

  const events = useMemo(() => buildEventFeatures(topics), [topics]);
  const newsFeatures = useMemo(() => buildNewsFeatures(news, entities), [entities, news]);

  const updateVisibility = useCallback((map: MapLibreMap) => {
    if (!map.isStyleLoaded()) return;
    const close = zoom >= 2.5;
    ["cities", "city-labels", "rivers", "river-hit", "events", "event-halo", "news-markers"].forEach((layer) => {
      if (map.getLayer(layer)) map.setLayoutProperty(layer, "visibility", close ? "visible" : "none");
    });
  }, [zoom]);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    setReady(false);
    setWorkerUrl("/maplibre-gl-worker.mjs");
    const map = new MapLibreMap({
      container: container.current,
      style: globeStyle,
      center: WORLD_CENTER,
      zoom: compact ? 1 : WORLD_ZOOM,
      minZoom: 0.5,
      maxZoom: 7,
      attributionControl: false,
      dragRotate: true,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    map.on("style.load", () => map.setProjection({ type: "globe" }));
    map.on("load", () => {
      map.addSource("countries", { type: "geojson", data: countries, promoteId: "slug" });
      map.addLayer({ id: "country-fill", type: "fill", source: "countries", paint: { "fill-color": ["case", ["==", ["get", "rich"], 1], "#809484", "#697c70"], "fill-opacity": 1 } });
      map.addLayer({ id: "country-selected", type: "fill", source: "countries", filter: ["==", ["get", "slug"], ""], paint: { "fill-color": "#cad8cf", "fill-opacity": 0.7 } });
      map.addSource("country-borders", { type: "geojson", data: countryBorders });
      map.addLayer({ id: "country-borders", type: "line", source: "country-borders", paint: { "line-color": "#d4ded7", "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 5, 1], "line-opacity": 0.55 } });
      map.addSource("rivers", { type: "geojson", data: riverFeatures });
      map.addLayer({ id: "rivers", type: "line", source: "rivers", layout: { visibility: "none" }, paint: { "line-color": "#7bb5c2", "line-width": ["interpolate", ["linear"], ["zoom"], 2.5, 1.4, 6, 3], "line-opacity": 0.9 } });
      map.addLayer({ id: "river-hit", type: "line", source: "rivers", layout: { visibility: "none" }, paint: { "line-color": "#fff", "line-width": 12, "line-opacity": 0 } });
      map.addSource("cities", { type: "geojson", data: cityFeatures });
      map.addLayer({ id: "cities", type: "circle", source: "cities", layout: { visibility: "none" }, paint: { "circle-radius": 4, "circle-color": "#f0e8d5", "circle-stroke-width": 1.5, "circle-stroke-color": "#172027" } });
      map.addLayer({ id: "city-labels", type: "symbol", source: "cities", minzoom: 2.7, layout: { visibility: "none", "text-field": ["get", "name"], "text-size": 10, "text-offset": [0, 1.25], "text-anchor": "top", "text-allow-overlap": false }, paint: { "text-color": "#e7ebe4", "text-halo-color": "#102129", "text-halo-width": 1.5 } });
      map.addSource("events", { type: "geojson", data: events });
      map.addLayer({ id: "event-halo", type: "circle", source: "events", layout: { visibility: "none" }, paint: { "circle-radius": 12, "circle-color": ["match", ["get", "kind"], "Conflict", "#b85d59", "Tension", "#c09457", "#6d98b5"], "circle-opacity": 0.18 } });
      map.addLayer({ id: "events", type: "circle", source: "events", layout: { visibility: "none" }, paint: { "circle-radius": 5, "circle-color": ["match", ["get", "kind"], "Conflict", "#d46c65", "Tension", "#d6a75d", "#79a5c2"], "circle-stroke-width": 1, "circle-stroke-color": "#101417" } });
      map.addSource("news", { type: "geojson", data: newsFeatures });
      map.addLayer({ id: "news-markers", type: "circle", source: "news", layout: { visibility: "none" }, paint: { "circle-radius": 4, "circle-color": "#75b996", "circle-stroke-width": 1, "circle-stroke-color": "#101417" } });
      map.once("idle", () => setReady(true));
    });

    const hoverLayer = (layer: string, type: MapHoverDetail["type"]) => {
      map.on("mousemove", layer, (event: MapLayerMouseEvent) => {
        const item = event.features?.[0];
        if (!item) return;
        const point = item.geometry.type === "Point" ? item.geometry.coordinates as [number, number] : [event.lngLat.lng, event.lngLat.lat] as [number, number];
        map.getCanvas().style.cursor = "pointer";
        const resolvedType = item.properties?.mapType === "news" ? "news" : type;
        const detail: MapHoverDetail = {
          type: resolvedType,
          name: String(item.properties?.name ?? "Unknown"),
          eyebrow: resolvedType === "country" ? String(item.properties?.continent ?? "Country") : resolvedType === "news" ? String(item.properties?.source ?? "News") : resolvedType,
          detail: String(item.properties?.detail ?? item.properties?.status ?? "Limited prototype detail"),
          coordinates: point,
          lens: Boolean(item.properties?.lens),
          slug: item.properties?.slug ? String(item.properties.slug) : undefined,
        };
        setHover(detail);
        if (resolvedType === "river" && detail.lens) setLens({ ...detail, eyebrow: "Magnified river detail" });
      });
      map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; setHover(null); });
    };
    hoverLayer("country-fill", "country");
    hoverLayer("cities", "city");
    hoverLayer("river-hit", "river");
    hoverLayer("events", "event");
    hoverLayer("news-markers", "news");

    map.on("click", "country-fill", (event: MapLayerMouseEvent) => {
      const item = event.features?.[0];
      if (!item) return;
      const slug = String(item.properties?.slug ?? "");
      const entity = entityBySlug.get(slug);
      const center: [number, number] = [Number(item.properties?.centerLng ?? event.lngLat.lng), Number(item.properties?.centerLat ?? event.lngLat.lat)];
      const continentSlug = String(item.properties?.continent ?? continentFromCoordinate(center));
      if (map.getZoom() < 1.65) {
        focusContinentFromMap(continentSlug, map);
        return;
      }
      const info: MapHoverDetail = { type: "country", name: String(item.properties?.name ?? slug), eyebrow: continentSlug, detail: String(item.properties?.detail ?? "Limited prototype country detail"), coordinates: center, slug };
      setSelectedCountry(slug);
      setSelectedCountryInfo(info);
      setSelectedContinent(null);
      map.setFilter("country-selected", ["==", ["get", "slug"], slug]);
      map.easeTo({ center, zoom: 3, bearing: map.getBearing() + 18, duration: 1450, essential: true });
    });
    map.on("click", "river-hit", (event: MapLayerMouseEvent) => {
      const item = event.features?.[0];
      if (!item) return;
      setLens({ type: "river", name: String(item.properties?.name), eyebrow: "Magnified river detail", detail: String(item.properties?.detail), coordinates: [event.lngLat.lng, event.lngLat.lat], lens: true });
    });
    map.on("click", "events", (event: MapLayerMouseEvent) => {
      const item = event.features?.[0];
      if (!item) return;
      setLens({ type: "event", name: String(item.properties?.name), eyebrow: String(item.properties?.kind), detail: String(item.properties?.detail), coordinates: item.geometry.type === "Point" ? item.geometry.coordinates as [number, number] : [event.lngLat.lng, event.lngLat.lat], slug: String(item.properties?.slug) });
    });
    map.on("zoom", () => setZoom(map.getZoom()));
    map.on("error", (event) => console.error("[geoP globe]", event.error));
    return () => { map.remove(); mapRef.current = null; };
  }, [compact, countries, countryBorders, entityBySlug, events, newsFeatures]);

  useEffect(() => { const map = mapRef.current; if (ready && map) updateVisibility(map); }, [ready, updateVisibility]);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const entity = controlledEntity ? entityBySlug.get(controlledEntity) : undefined;
    const topic = controlledTopic ? topics.find((item) => item.slug === controlledTopic) : undefined;
    if (entity) map.flyTo({ center: [entity.coordinates.lng, entity.coordinates.lat], zoom: 3, duration: 1200, essential: true });
    if (topic) map.flyTo({ center: [topic.coordinates.lng, topic.coordinates.lat], zoom: Math.max(topic.coordinates.zoom, 3.2), duration: 1200, essential: true });
    if (relatedSlugs.length) map.setFilter("country-selected", ["in", ["get", "slug"], ["literal", relatedSlugs]]);
  }, [controlledEntity, controlledTopic, entityBySlug, ready, relatedSlugs, topics]);

  useEffect(() => {
    if (!lens || !magnifier.current) return;
    const map = new MapLibreMap({ container: magnifier.current, style: globeStyle, center: lens.coordinates, zoom: 5.4, attributionControl: false, interactive: false });
    magnifierRef.current = map;
    map.on("load", () => {
      map.addSource("countries-lens", { type: "geojson", data: countries });
      map.addLayer({ id: "countries-lens", type: "fill", source: "countries-lens", paint: { "fill-color": "#718475", "fill-opacity": 1 } });
      map.addSource("rivers-lens", { type: "geojson", data: riverFeatures });
      map.addLayer({ id: "rivers-lens", type: "line", source: "rivers-lens", paint: { "line-color": "#7dc4d0", "line-width": 3 } });
    });
    return () => { map.remove(); magnifierRef.current = null; };
  }, [countries, lens]);

  const focusContinentFromMap = (slug: string, map: MapLibreMap) => {
    const continent = continentFocuses.find((item) => item.slug === slug);
    if (!continent) return;
    setSelectedContinent(slug); setSelectedCountry(null); setSelectedCountryInfo(null); setLens(null);
    map.setFilter("country-selected", ["==", ["get", "continent"], slug]);
    map.easeTo({ center: continent.center, zoom: continent.zoom, bearing: map.getBearing() + 24, duration: 1500, essential: true });
  };
  const focusContinent = (slug: string) => { const map = mapRef.current; if (map) focusContinentFromMap(slug, map); };
  const reset = () => { setSelectedCountry(null); setSelectedCountryInfo(null); setSelectedContinent(null); setLens(null); mapRef.current?.setFilter("country-selected", ["==", ["get", "slug"], ""]); mapRef.current?.flyTo({ center: WORLD_CENTER, zoom: compact ? 1 : WORLD_ZOOM, bearing: 0, pitch: 0, duration: 850 }); };
  const activeEntity = selectedCountry ? entityBySlug.get(selectedCountry) : undefined;
  const activeContinent = selectedContinent ? continentFocuses.find((item) => item.slug === selectedContinent) : undefined;
  const relevantNews = activeEntity ? news.filter((item) => item.entitySlugs.includes(activeEntity.slug)).slice(0, 2) : [];

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden bg-[#020507]" aria-label="Interactive geopolitical globe">
      <div ref={container} className="absolute inset-0 h-full w-full" />
      {!ready ? <div className="absolute inset-0 grid place-items-center bg-[#020507]"><div className="text-center"><div className="mx-auto h-12 w-12 rounded-full border border-[#9dbdb4]/60"/><div className="eyebrow mt-3">Rendering Earth</div></div></div> : null}

      {!compact ? <div className="absolute left-5 top-5 z-10 hidden w-52 border border-white/12 bg-[#091014]/92 p-3 backdrop-blur-md md:block"><div className="eyebrow mb-2">Continents</div>{continentFocuses.map((item) => <button key={item.slug} onClick={() => focusContinent(item.slug)} className={`flex w-full items-center justify-between border-t border-white/[.07] py-2.5 text-left text-xs ${selectedContinent === item.slug ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-white"}`}><span>{item.name}</span><span className="mono text-[8px]">FOCUS</span></button>)}</div> : null}

      {hover ? <div className="pointer-events-none absolute left-1/2 top-20 z-20 w-64 -translate-x-1/2 border border-white/12 bg-[#091014]/95 p-4 shadow-2xl backdrop-blur-xl"><div className="eyebrow text-[var(--accent)]">{hover.eyebrow}</div><div className="mt-2 text-sm font-medium">{hover.name}</div><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{hover.detail}</p>{hover.lens ? <div className="mono mt-3 text-[8px] text-[#93bac3]">MAGNIFIED DETAIL OPEN</div> : null}</div> : null}

      {(selectedCountryInfo || activeContinent) && !compact ? <aside className="absolute bottom-5 right-16 top-5 z-10 hidden w-72 overflow-y-auto border border-white/12 bg-[#091014]/94 p-5 backdrop-blur-xl lg:block"><button onClick={reset} className="absolute right-3 top-3 p-1.5 text-[var(--muted)]" aria-label="Close focused view"><X size={15}/></button><div className="eyebrow">{selectedCountryInfo ? "Country focus" : "Continent focus"}</div><h2 className="mt-4 text-2xl font-medium tracking-[-.04em]">{activeEntity?.name ?? selectedCountryInfo?.name ?? activeContinent?.name}</h2><p className="mt-3 text-xs leading-6 text-[var(--muted)]">{activeEntity?.summary ?? selectedCountryInfo?.detail ?? activeContinent?.description}</p>{selectedCountryInfo ? <>{activeEntity ? <div className="mt-6 grid grid-cols-2 gap-px bg-white/10"><FocusMetric label="Capital" value={activeEntity.capital}/><FocusMetric label="Population" value={activeEntity.population}/><FocusMetric label="Region" value={activeEntity.region}/><FocusMetric label="Topics" value={String(activeEntity.topicSlugs.length)}/></div> : <div className="mt-6 border border-white/10 p-4 text-[10px] leading-5 text-[var(--muted)]">Global selection works here, but detailed city, news, and conflict coverage is limited to the richer demo countries.</div>}<div className="mt-6"><div className="eyebrow mb-2">Limited live view</div>{relevantNews.length ? relevantNews.map((item) => <div key={item.id} className="border-t border-white/10 py-3"><div className="text-[10px] leading-4">{item.headline}</div><div className="mono mt-1 text-[8px] text-[var(--faint)]">{item.source} · DEMO</div></div>) : <div className="border-t border-white/10 py-3 text-[10px] text-[var(--muted)]">No rich news entries in this limited demo region.</div>}</div></> : <div className="mt-6 border-t border-white/10 pt-4 text-[10px] leading-5 text-[var(--muted)]">Click a country to rotate and zoom closer. Cities, rivers, conflicts, and news markers appear as the camera approaches.</div>}</aside> : null}

      {lens ? <aside className="absolute bottom-5 left-5 z-30 w-[min(340px,calc(100%-40px))] overflow-hidden border border-white/15 bg-[#091014]/96 shadow-2xl"><div className="relative h-44 bg-[#102d36]"><div ref={magnifier} className="absolute inset-0"/><div className="pointer-events-none absolute inset-3 border border-white/30"/><Crosshair className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70" size={18}/><button onClick={() => setLens(null)} className="absolute right-2 top-2 bg-[#071014]/90 p-2" aria-label="Close magnified detail"><X size={14}/></button></div><div className="p-4"><div className="eyebrow text-[#8dbcc5]">{lens.eyebrow}</div><h3 className="mt-2 text-base">{lens.name}</h3><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{lens.detail}</p>{lens.slug ? <a href={`/topic/${lens.slug}`} className="mt-3 flex items-center gap-2 text-[10px] text-[var(--accent)]">Open topic context <ExternalLink size={11}/></a> : null}</div></aside> : null}

      <div className="absolute bottom-5 right-5 z-20 flex flex-col border border-white/15 bg-[#071014]/90"><button onClick={() => mapRef.current?.zoomIn({ duration: 350 })} className="border-b border-white/10 p-2.5 hover:bg-white/5" aria-label="Zoom in"><Plus size={15}/></button><button onClick={() => mapRef.current?.zoomOut({ duration: 350 })} className="border-b border-white/10 p-2.5 hover:bg-white/5" aria-label="Zoom out"><Minus size={15}/></button><button onClick={reset} className="p-2.5 hover:bg-white/5" aria-label="Reset globe"><RotateCcw size={14}/></button></div>
      {!compact ? <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 border border-white/10 bg-[#071014]/85 px-4 py-2 text-[10px] text-[#d1dcda]">Drag to rotate · Click a continent or country · Zoom for cities and events</div> : null}
    </div>
  );
}

function FocusMetric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#0c1216] p-3"><div className="eyebrow text-[8px]">{label}</div><div className="mt-2 truncate text-[10px]">{value}</div></div>;
}
