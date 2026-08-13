"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Map as MapLibreMap, setWorkerUrl, type MapLayerMouseEvent, type StyleSpecification } from "maplibre-gl";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-50m.json";
import type { FeatureCollection, GeoJsonProperties, Geometry, Point, Position } from "geojson";
import { Banknote, Crosshair, ExternalLink, MapPin, Minus, Newspaper, Plus, RotateCcw, Ship, Swords, Waves, X } from "lucide-react";
import { useConflictEvents, useEntities, useMapGeography, useNews, useTopics } from "@/lib/queries";
import { continentFocuses, type ConflictBrief, type MapHoverDetail } from "@/data/map-static";
import { slugifyCountryName } from "@/lib/text";
import type { GeoEntity, NewsArticle, Topic } from "@/types/domain";

type GlobeProps = {
  compact?: boolean;
  controlledEntity?: string;
  controlledTopic?: string;
  relatedSlugs?: string[];
};

const WORLD_CENTER: [number, number] = [18, 12];
const WORLD_ZOOM = 1.2;
const emptyFilter = () => ["==", ["get", "slug"], ""] as ["==", ["get", string], string];
const emptyFeatures: FeatureCollection = { type: "FeatureCollection", features: [] };

const globeStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "ocean", type: "background", paint: { "background-color": "#0b3443" } }],
  sky: {
    "sky-color": "#010407",
    "sky-horizon-blend": 0.22,
    "horizon-color": "#77a9b8",
    "horizon-fog-blend": 0.1,
    "fog-color": "#1c5263",
    "fog-ground-blend": 0.6,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.95, 6, 0.16],
  },
};

const continentByCountry: Record<string, string> = {
  Ethiopia: "africa", Egypt: "africa", Sudan: "africa", Somalia: "africa", Eritrea: "africa", Kenya: "africa", "South Africa": "africa",
  Ukraine: "europe", Russia: "europe", France: "europe", Germany: "europe", "United Kingdom": "europe", Türkiye: "europe",
  China: "asia", Taiwan: "asia", Iran: "asia", Israel: "asia", India: "asia", Japan: "asia", "Saudi Arabia": "asia", "United Arab Emirates": "asia",
  "United States": "north-america", Brazil: "south-america",
};

const sourcePalette: Record<string, { background: string; color: string; mark: string }> = {
  CNN: { background: "#c40000", color: "#fff", mark: "CNN" },
  BBC: { background: "#fff", color: "#111", mark: "BBC" },
  Reuters: { background: "#f47b20", color: "#111", mark: "R" },
  DW: { background: "#1688c8", color: "#fff", mark: "DW" },
  "France 24": { background: "#1684bc", color: "#fff", mark: "F24" },
  "Al Jazeera": { background: "#d8a833", color: "#111", mark: "AJ" },
  Nikkei: { background: "#c9272c", color: "#fff", mark: "N" },
  CCTV: { background: "#d22730", color: "#fff", mark: "CCTV" },
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

function sourceMark(source: string) {
  return sourcePalette[source] ?? { background: "#2b4d58", color: "#e8f4f1", mark: source.slice(0, 3).toUpperCase() };
}

export function GeoGlobe({ compact = false, controlledEntity, controlledTopic, relatedSlugs = [] }: GlobeProps) {
  const container = useRef<HTMLDivElement>(null);
  const magnifier = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<MapHoverDetail | null>(null);
  const [activeDetail, setActiveDetail] = useState<MapHoverDetail | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(controlledEntity ?? null);
  const [selectedCountryInfo, setSelectedCountryInfo] = useState<MapHoverDetail | null>(null);
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [lens, setLens] = useState<MapHoverDetail | null>(null);
  const { data: entities = [] } = useEntities();
  const { data: topics = [] } = useTopics();
  const { data: news = [] } = useNews();
  const { data: geography } = useMapGeography();
  const { data: conflictEvents = [] } = useConflictEvents();
  const realRiverFeatures = geography?.rivers ?? emptyFeatures;
  const realLakeFeatures = geography?.lakes ?? emptyFeatures;
  const realCityFeatures = geography?.cities ?? emptyFeatures;

  const entityBySlug = useMemo(() => new Map(entities.map((entity) => [entity.slug, entity])), [entities]);
  const topicBySlug = useMemo(() => new Map(topics.map((topic) => [topic.slug, topic])), [topics]);
  const countries = useMemo(() => {
    const topology = countriesTopology as { objects: { countries: unknown } };
    const collection = feature(countriesTopology as never, topology.objects.countries as never) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;
    collection.features.forEach((item) => {
      const originalName = String(item.properties?.name ?? "Unknown");
      const slug = slugifyCountryName(originalName);
      const entity = entityBySlug.get(slug);
      const center = featureCenter(item.geometry);
      item.properties = {
        ...item.properties,
        name: entity?.name ?? originalName,
        slug: entity?.slug ?? slug,
        rich: entity ? 1 : 0,
        continent: entity ? continentByCountry[entity.name] ?? continentFromCoordinate(center) : continentFromCoordinate(center),
        centerLng: entity?.coordinates.lng ?? center[0],
        centerLat: entity?.coordinates.lat ?? center[1],
        detail: entity?.summary ?? `${originalName} is selectable. Full country intelligence expands as verified data sources are connected.`,
      };
    });
    return collection;
  }, [entityBySlug]);

  const countryLabels = useMemo<FeatureCollection<Point>>(() => ({
    type: "FeatureCollection",
    features: countries.features.map((item, index) => ({
      type: "Feature",
      id: `country-label-${index}`,
      properties: { name: item.properties?.name, slug: item.properties?.slug, rich: item.properties?.rich },
      geometry: { type: "Point", coordinates: [Number(item.properties?.centerLng), Number(item.properties?.centerLat)] },
    })),
  }), [countries]);

  const eventFeatures = useMemo<FeatureCollection<Point>>(() => ({
    type: "FeatureCollection",
    features: [
      ...conflictEvents.map((event) => ({
        type: "Feature" as const,
        properties: { name: event.name || event.dyad, slug: event.id, detail: `${event.dyad}; UCDP best estimate ${event.fatalities.best} fatalities.`, status: event.dateEnd, kind: "Conflict", mapType: "event", source: "UCDP" },
        geometry: { type: "Point" as const, coordinates: [event.coordinates.lng, event.coordinates.lat] },
      })),
      ...topics.map((topic) => ({
        type: "Feature" as const,
        properties: { name: topic.name, slug: topic.slug, detail: topic.summary, status: topic.status, kind: topic.kind, mapType: "event" },
        geometry: { type: "Point" as const, coordinates: [topic.coordinates.lng, topic.coordinates.lat] },
      })),
    ],
  }), [conflictEvents, topics]);

  const newsFeatures = useMemo<FeatureCollection<Point>>(() => ({
    type: "FeatureCollection",
    features: [
      ...news.flatMap((article, index) => {
        const entity = article.entitySlugs.map((slug) => entityBySlug.get(slug)).find(Boolean);
        if (!entity) return [];
        return [{
          type: "Feature" as const,
          id: `catalog-${article.id}`,
          properties: { name: article.headline, slug: article.topicSlug, detail: article.summary, source: article.source, category: article.category, mapType: "news" },
          geometry: { type: "Point" as const, coordinates: [entity.coordinates.lng + (index % 3 - 1) * 1.4, entity.coordinates.lat + (index % 2 ? 1 : -1)] },
        }];
      }),
    ],
  }), [entityBySlug, news]);

  const focusContinentFromMap = useCallback((slug: string, map: MapLibreMap) => {
    const continent = continentFocuses.find((item) => item.slug === slug);
    if (!continent) return;
    setSelectedContinent(slug);
    setSelectedCountry(null);
    setSelectedCountryInfo(null);
    setActiveDetail(null);
    setLens(null);
    map.setFilter("country-selected", ["==", ["get", "continent"], slug]);
    map.easeTo({ center: continent.center, zoom: continent.zoom, bearing: 0, pitch: 0, duration: 1450, essential: true });
  }, []);

  useEffect(() => {
    if (!container.current || mapRef.current || !entities.length || !geography) return;
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
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.on("style.load", () => map.setProjection({ type: "globe" }));
    map.on("load", () => {
      map.addSource("countries", { type: "geojson", data: countries, promoteId: "slug" });
      map.addLayer({ id: "country-fill", type: "fill", source: "countries", paint: { "fill-color": ["case", ["==", ["get", "rich"], 1], "#668876", "#4f6f63"], "fill-opacity": 0.98, "fill-outline-color": "#9bb7ad" } });
      map.addLayer({ id: "country-selected", type: "fill", source: "countries", filter: emptyFilter(), paint: { "fill-color": "#c2d68f", "fill-opacity": 0.62 } });

      map.addSource("lakes", { type: "geojson", data: realLakeFeatures });
      map.addLayer({ id: "lakes", type: "fill", source: "lakes", minzoom: 2, paint: { "fill-color": "#17657b", "fill-outline-color": "#68a9ba", "fill-opacity": 0.92 } });
      map.addSource("country-label-source", { type: "geojson", data: countryLabels });
      map.addLayer({ id: "country-labels", type: "symbol", source: "country-label-source", minzoom: 1.65, layout: { "text-field": ["get", "name"], "text-size": ["interpolate", ["linear"], ["zoom"], 1.65, 8, 4.5, 12], "text-letter-spacing": 0.13, "text-transform": "uppercase", "text-allow-overlap": false, "text-padding": 5 }, paint: { "text-color": "#eef3e8", "text-halo-color": "#21463f", "text-halo-width": 1.4, "text-opacity": ["interpolate", ["linear"], ["zoom"], 1.65, 0.72, 3.5, 0.95] } });

      map.addSource("rivers", { type: "geojson", data: realRiverFeatures });
      map.addLayer({ id: "rivers", type: "line", source: "rivers", minzoom: 2.35, paint: { "line-color": "#64b5ca", "line-width": ["interpolate", ["linear"], ["zoom"], 2.35, 1, 6, 3.4], "line-opacity": 0.9 } });
      map.addLayer({ id: "river-labels", type: "symbol", source: "rivers", minzoom: 2.6, layout: { "symbol-placement": "line", "text-field": ["get", "name"], "text-size": 10, "text-letter-spacing": 0.08 }, paint: { "text-color": "#9bd0db", "text-halo-color": "#173f49", "text-halo-width": 1.5 } });
      map.addLayer({ id: "river-hit", type: "line", source: "rivers", minzoom: 2.35, paint: { "line-color": "#fff", "line-width": 14, "line-opacity": 0 } });

      map.addSource("cities", { type: "geojson", data: realCityFeatures });
      map.addLayer({ id: "cities", type: "circle", source: "cities", minzoom: 2.25, paint: { "circle-radius": ["match", ["get", "priority"], 1, 4.3, 2, 3.4, 2.8], "circle-color": "#f2d98d", "circle-stroke-width": 1.2, "circle-stroke-color": "#172027" } });
      map.addLayer({ id: "city-labels", type: "symbol", source: "cities", minzoom: 2.45, layout: { "text-field": ["get", "name"], "text-size": ["interpolate", ["linear"], ["zoom"], 2.45, 9, 5, 12], "text-offset": [0, 1.15], "text-anchor": "top", "text-allow-overlap": false, "text-padding": 4 }, paint: { "text-color": "#fff1c7", "text-halo-color": "#142c30", "text-halo-width": 1.5 } });

      map.addSource("events", { type: "geojson", data: eventFeatures });
      map.addLayer({ id: "event-halo", type: "circle", source: "events", minzoom: 1.25, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 1.25, 9, 4, 16], "circle-color": ["match", ["get", "kind"], "Conflict", "#df6661", "Tension", "#e1b255", "#62a7c8"], "circle-opacity": 0.24 } });
      map.addLayer({ id: "events", type: "circle", source: "events", minzoom: 1.25, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 1.25, 3.6, 4, 6.5], "circle-color": ["match", ["get", "kind"], "Conflict", "#ef746e", "Tension", "#f0c15e", "#73bfdf"], "circle-stroke-width": 1, "circle-stroke-color": "#101417" } });

      map.addSource("news", { type: "geojson", data: newsFeatures });
      map.addLayer({ id: "news-halo", type: "circle", source: "news", minzoom: 1.35, paint: { "circle-radius": 8, "circle-color": "#74c29c", "circle-opacity": 0.15 } });
      map.addLayer({ id: "news-markers", type: "circle", source: "news", minzoom: 1.35, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 1.35, 2.8, 4, 5], "circle-color": "#7ee0ae", "circle-stroke-width": 1, "circle-stroke-color": "#0a221b" } });
      map.once("idle", () => setReady(true));
    });

    const hoverLayer = (layer: string, fallbackType: MapHoverDetail["type"]) => {
      map.on("mousemove", layer, (event: MapLayerMouseEvent) => {
        const item = event.features?.[0];
        if (!item) return;
        const coordinates = item.geometry.type === "Point" ? item.geometry.coordinates as [number, number] : [event.lngLat.lng, event.lngLat.lat] as [number, number];
        const mapType = String(item.properties?.mapType ?? fallbackType) as MapHoverDetail["type"];
        const detail: MapHoverDetail = {
          type: mapType,
          name: String(item.properties?.name ?? "Unknown"),
          eyebrow: mapType === "country" ? String(item.properties?.continent ?? "Country") : mapType === "news" ? String(item.properties?.category ?? "News pulse") : mapType,
          detail: String(item.properties?.detail ?? item.properties?.status ?? "Prototype geographic detail"),
          coordinates,
          lens: Boolean(item.properties?.lens),
          slug: item.properties?.slug ? String(item.properties.slug) : undefined,
          source: item.properties?.source ? String(item.properties.source) : undefined,
        };
        map.getCanvas().style.cursor = "pointer";
        setHover(detail);
        if (mapType === "river" && detail.lens) setLens({ ...detail, eyebrow: "Magnified river detail" });
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
      const center: [number, number] = [Number(item.properties?.centerLng ?? event.lngLat.lng), Number(item.properties?.centerLat ?? event.lngLat.lat)];
      const continentSlug = String(item.properties?.continent ?? continentFromCoordinate(center));
      if (map.getZoom() < 1.65) {
        focusContinentFromMap(continentSlug, map);
        return;
      }
      const info: MapHoverDetail = { type: "country", name: String(item.properties?.name ?? slug), eyebrow: continentSlug, detail: String(item.properties?.detail), coordinates: center, slug };
      setSelectedCountry(slug);
      setSelectedCountryInfo(info);
      setSelectedContinent(null);
      setActiveDetail(info);
      map.setFilter("country-selected", ["==", ["get", "slug"], slug]);
      map.easeTo({ center, zoom: Math.max(map.getZoom(), 3), bearing: 0, pitch: 0, duration: 1350, essential: true });
    });

    const activateLayer = (layer: string, type: MapHoverDetail["type"]) => map.on("click", layer, (event: MapLayerMouseEvent) => {
      const item = event.features?.[0];
      if (!item) return;
      const resolvedType = String(item.properties?.mapType ?? type) as MapHoverDetail["type"];
      setActiveDetail({
        type: resolvedType,
        name: String(item.properties?.name ?? "Map intelligence"),
        eyebrow: resolvedType === "news" ? String(item.properties?.category ?? "News pulse") : resolvedType,
        detail: String(item.properties?.detail ?? "Prototype map intelligence"),
        coordinates: item.geometry.type === "Point" ? item.geometry.coordinates as [number, number] : [event.lngLat.lng, event.lngLat.lat],
        slug: item.properties?.slug ? String(item.properties.slug) : undefined,
        source: item.properties?.source ? String(item.properties.source) : undefined,
      });
    });
    activateLayer("events", "event");
    activateLayer("news-markers", "news");
    map.on("click", "river-hit", (event: MapLayerMouseEvent) => {
      const item = event.features?.[0];
      if (!item) return;
      const detail: MapHoverDetail = { type: "river", name: String(item.properties?.name), eyebrow: "Hydrographic detail", detail: String(item.properties?.detail), coordinates: [event.lngLat.lng, event.lngLat.lat], lens: Boolean(item.properties?.lens) };
      setActiveDetail(detail);
      if (detail.lens) setLens({ ...detail, eyebrow: "Magnified river detail" });
    });
    map.on("error", (event) => console.error("[geoP globe]", event.error));
    return () => { map.remove(); mapRef.current = null; };
  }, [compact, countries, countryLabels, entities.length, eventFeatures, focusContinentFromMap, geography, newsFeatures, realCityFeatures, realLakeFeatures, realRiverFeatures]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const entity = controlledEntity ? entityBySlug.get(controlledEntity) : undefined;
    const topic = controlledTopic ? topicBySlug.get(controlledTopic) : undefined;
    if (entity) map.flyTo({ center: [entity.coordinates.lng, entity.coordinates.lat], zoom: 3.2, bearing: 0, pitch: 0, duration: 1100, essential: true });
    if (topic) map.flyTo({ center: [topic.coordinates.lng, topic.coordinates.lat], zoom: Math.max(topic.coordinates.zoom, 3.2), bearing: 0, pitch: 0, duration: 1100, essential: true });
    if (relatedSlugs.length) map.setFilter("country-selected", ["in", ["get", "slug"], ["literal", relatedSlugs]]);
  }, [controlledEntity, controlledTopic, entityBySlug, ready, relatedSlugs, topicBySlug]);

  useEffect(() => {
    if (!lens || !magnifier.current) return;
    const map = new MapLibreMap({ container: magnifier.current, style: globeStyle, center: lens.coordinates, zoom: 5.2, attributionControl: false, interactive: false });
    map.on("load", () => {
      map.addSource("countries-lens", { type: "geojson", data: countries });
      map.addLayer({ id: "countries-lens", type: "fill", source: "countries-lens", paint: { "fill-color": "#597b6c", "fill-outline-color": "#aac3b8", "fill-opacity": 1 } });
      map.addSource("lakes-lens", { type: "geojson", data: realLakeFeatures });
      map.addLayer({ id: "lakes-lens", type: "fill", source: "lakes-lens", paint: { "fill-color": "#17657b", "fill-opacity": 0.95 } });
      map.addSource("rivers-lens", { type: "geojson", data: realRiverFeatures });
      map.addLayer({ id: "rivers-lens", type: "line", source: "rivers-lens", paint: { "line-color": "#80d1df", "line-width": 3 } });
    });
    return () => map.remove();
  }, [countries, lens]);

  const focusContinent = (slug: string) => { const map = mapRef.current; if (map) focusContinentFromMap(slug, map); };
  const reset = () => {
    setSelectedCountry(null);
    setSelectedCountryInfo(null);
    setSelectedContinent(null);
    setActiveDetail(null);
    setLens(null);
    mapRef.current?.setFilter("country-selected", emptyFilter());
    mapRef.current?.flyTo({ center: WORLD_CENTER, zoom: compact ? 1 : WORLD_ZOOM, bearing: 0, pitch: 0, duration: 850 });
  };

  const railDetail = hover ?? activeDetail;
  const activeEntity = selectedCountry ? entityBySlug.get(selectedCountry) : undefined;
  const activeContinent = selectedContinent ? continentFocuses.find((item) => item.slug === selectedContinent) : undefined;
  const activeTopic = railDetail?.slug ? topicBySlug.get(railDetail.slug) : undefined;
  const liveConflict = railDetail?.slug ? conflictEvents.find((event) => event.id === railDetail.slug) : undefined;
  const conflict = liveConflict ? {
    slug: liveConflict.id,
    intensity: "active" as const,
    participants: [{ name: liveConflict.sideA, role: "UCDP side A", losses: `${liveConflict.fatalities.sideA} recorded deaths` }, { name: liveConflict.sideB, role: "UCDP side B", losses: `${liveConflict.fatalities.sideB} recorded deaths` }].filter((actor) => actor.name),
    civilianImpact: `Best estimate ${liveConflict.fatalities.best}; range ${liveConflict.fatalities.low}-${liveConflict.fatalities.high}; civilian deaths ${liveConflict.fatalities.civilians}. UCDP Candidate GED ${liveConflict.provenance.release}; estimates may be revised.`,
  } : undefined;
  const relatedNews = activeTopic ? news.filter((item) => item.topicSlug === activeTopic.slug).slice(0, 3) : activeEntity ? news.filter((item) => item.entitySlugs.includes(activeEntity.slug)).slice(0, 3) : news.slice(0, 3);

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden bg-[#010407]" aria-label="Interactive geopolitical globe">
      <div className={`absolute inset-y-0 left-0 ${compact ? "right-0" : "right-0 lg:right-[336px]"}`}><div ref={container} className="absolute inset-0 h-full w-full" /></div>
      {!ready ? <div className="absolute inset-0 grid place-items-center bg-[#010407]"><div className="text-center"><div className="mx-auto h-12 w-12 rounded-full border border-[#9dbdb4]/60"/><div className="eyebrow mt-3">Rendering intelligence layers</div></div></div> : null}

      {!compact ? <div className="absolute left-4 top-4 z-10 hidden w-48 border border-white/12 bg-[#071117]/92 p-3 backdrop-blur-md md:block"><div className="eyebrow mb-2">Geographic focus</div>{continentFocuses.map((item) => <button key={item.slug} onClick={() => focusContinent(item.slug)} className={`flex w-full items-center justify-between border-t border-white/[.07] py-2 text-left text-[11px] ${selectedContinent === item.slug ? "text-[#c9d98d]" : "text-[var(--muted)] hover:text-white"}`}><span>{item.name}</span><span className="mono text-[7px]">FOCUS</span></button>)}</div> : null}
      {!compact ? <div className="absolute left-4 top-[350px] z-10 hidden w-48 border border-white/10 bg-[#071117]/88 p-3 backdrop-blur-md md:block"><div className="eyebrow mb-2">Layer key</div><LayerKey color="#ef746e" label="Active conflict"/><LayerKey color="#f0c15e" label="Tension / warning"/><LayerKey color="#7ee0ae" label="News pulse"/><LayerKey color="#d4af62" label="Trade corridor" dashed/><LayerKey color="#64b5ca" label="River / water"/></div> : null}

      {!compact ? <aside className="absolute bottom-4 right-14 top-4 z-20 hidden w-[310px] overflow-y-auto border border-white/12 bg-[#061016]/96 shadow-2xl backdrop-blur-xl lg:block" aria-label="Map intelligence rail">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#061016]/96 px-4 py-3"><div><div className="eyebrow text-[#75cfa5]">Intelligence rail</div><div className="mono mt-1 text-[8px] text-[var(--faint)]">PROTOTYPE · MULTI-SOURCE</div></div>{railDetail || selectedCountryInfo || activeContinent ? <button onClick={() => { setActiveDetail(null); setHover(null); setSelectedCountryInfo(null); }} className="p-2 text-[var(--muted)]" aria-label="Clear map detail"><X size={14}/></button> : null}</div>
        <div className="p-4">
          {railDetail ? <RailDetail detail={railDetail} topic={activeTopic} conflict={conflict} entity={activeEntity} news={relatedNews}/> : selectedCountryInfo ? <CountryRail name={activeEntity?.name ?? selectedCountryInfo.name} detail={activeEntity?.summary ?? selectedCountryInfo.detail} entity={activeEntity} news={relatedNews}/> : activeContinent ? <><div className="eyebrow">Continent focus</div><h2 className="mt-3 text-2xl tracking-[-.04em]">{activeContinent.name}</h2><p className="mt-3 text-xs leading-6 text-[var(--muted)]">{activeContinent.description}</p><DensityGuide/></> : <><div className="eyebrow">Global situation</div><h2 className="mt-3 text-xl tracking-[-.035em]">The map gets denser as you approach.</h2><p className="mt-3 text-xs leading-6 text-[var(--muted)]">Hover a label, route, conflict, city, river, or news pulse. Click to pin its context here without covering the Earth.</p><DensityGuide/><div className="mt-6"><div className="eyebrow mb-3">Source network</div><div className="grid grid-cols-4 gap-2">{["CNN","BBC","Reuters","DW","France 24","Al Jazeera","Nikkei","CCTV"].map((source) => <SourceBadge key={source} source={source}/>)}</div></div></>}
        </div>
      </aside> : null}

      {lens ? <aside className="absolute bottom-4 left-4 z-30 w-[min(330px,calc(100%-32px))] overflow-hidden border border-white/15 bg-[#061016]/97 shadow-2xl"><div className="relative h-40 bg-[#0b3443]"><div ref={magnifier} className="absolute inset-0"/><div className="pointer-events-none absolute inset-3 border border-white/30"/><Crosshair className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70" size={18}/><button onClick={() => setLens(null)} className="absolute right-2 top-2 bg-[#061016]/90 p-2" aria-label="Close magnified detail"><X size={14}/></button></div><div className="p-4"><div className="eyebrow text-[#7dc7d5]">{lens.eyebrow}</div><h3 className="mt-2 text-base">{lens.name}</h3><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{lens.detail}</p><div className="mono mt-3 text-[8px] text-[var(--faint)]">SCHEMATIC HYDROGRAPHY · DEMO</div></div></aside> : null}

      <div className="absolute bottom-4 right-4 z-30 flex flex-col border border-white/15 bg-[#061016]/92"><button onClick={() => mapRef.current?.zoomIn({ duration: 350 })} className="border-b border-white/10 p-2.5 hover:bg-white/5" aria-label="Zoom in"><Plus size={15}/></button><button onClick={() => mapRef.current?.zoomOut({ duration: 350 })} className="border-b border-white/10 p-2.5 hover:bg-white/5" aria-label="Zoom out"><Minus size={15}/></button><button onClick={reset} className="p-2.5 hover:bg-white/5" aria-label="Reset globe"><RotateCcw size={14}/></button></div>
      {!compact ? <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 border border-white/10 bg-[#061016]/86 px-4 py-2 text-[9px] text-[#d1dcda]">Drag to rotate · Scroll to reveal labels, cities, water, news, conflict, and trade</div> : null}
    </div>
  );
}

function DensityGuide() {
  return <div className="mt-6 border-t border-white/10"><div className="flex items-center justify-between py-3 text-[10px]"><span>World</span><span className="text-[var(--muted)]">oceans · active issues</span></div><div className="flex items-center justify-between border-t border-white/10 py-3 text-[10px]"><span>Region</span><span className="text-[var(--muted)]">countries · news · trade</span></div><div className="flex items-center justify-between border-t border-white/10 py-3 text-[10px]"><span>Local</span><span className="text-[var(--muted)]">cities · rivers · lakes</span></div></div>;
}

function CountryRail({ name, detail, entity, news }: { name: string; detail: string; entity?: GeoEntity; news: NewsArticle[] }) {
  return <><div className="eyebrow">Country focus</div><h2 className="mt-3 text-2xl tracking-[-.04em]">{name}</h2><p className="mt-3 text-xs leading-6 text-[var(--muted)]">{detail}</p>{entity ? <div className="mt-5 grid grid-cols-2 gap-px bg-white/10"><Metric label="Capital" value={entity.capital}/><Metric label="Population" value={entity.population}/><Metric label="Currency" value={entity.currency}/><Metric label="Region" value={entity.region}/></div> : <div className="mt-5 border border-white/10 p-3 text-[10px] leading-5 text-[var(--muted)]">Selectable global geometry. Rich demographic and economic coverage is still limited in this prototype.</div>}<NewsList news={news}/></>;
}

function RailDetail({ detail, topic, conflict, entity, news }: { detail: MapHoverDetail; topic?: Topic; conflict?: ConflictBrief; entity?: GeoEntity; news: NewsArticle[] }) {
  const Icon = detail.type === "event" ? Swords : detail.type === "trade" ? Ship : detail.type === "news" ? Newspaper : detail.type === "river" || detail.type === "water" ? Waves : MapPin;
  return <><div className="flex items-center gap-2"><Icon size={13} className="text-[#87cdb2]"/><div className="eyebrow">{detail.eyebrow}</div></div>{detail.source ? <div className="mt-4 flex items-center gap-3"><SourceBadge source={detail.source}/><div><div className="text-xs">{detail.source}</div><div className="mono mt-1 text-[8px] text-[var(--faint)]">SOURCE VIEW · DEMO</div></div></div> : null}<h2 className="mt-4 text-xl leading-6 tracking-[-.035em]">{detail.name}</h2><p className="mt-3 text-[11px] leading-6 text-[var(--muted)]">{topic?.summary ?? detail.detail}</p>{detail.type === "trade" ? <TradeGraphic detail={detail.detail}/> : null}{conflict ? <ConflictGraphic conflict={conflict}/> : null}{topic ? <><div className="mt-6"><div className="eyebrow mb-3">How sides frame it</div>{topic.coverage.slice(1,4).map((side) => <div key={side.name} className="border-t border-white/10 py-3"><div className="flex items-center justify-between"><span className="text-[10px]">{side.name}</span><span className="mono text-[8px] text-[var(--faint)]">{side.volume}%</span></div><p className="mt-2 text-[9px] leading-4 text-[var(--muted)]">{side.framing}</p></div>)}</div><Link href={`/topic/${topic.slug}`} className="mt-4 flex items-center gap-2 text-[10px] text-[#bfcf87]">Open full topic context <ExternalLink size={11}/></Link></> : null}{entity && detail.type === "country" ? <div className="mt-5 grid grid-cols-2 gap-px bg-white/10"><Metric label="Capital" value={entity.capital}/><Metric label="Currency" value={entity.currency}/></div> : null}<NewsList news={news}/></>;
}

function ConflictGraphic({ conflict }: { conflict: ConflictBrief }) {
  return <div className="mt-5 border border-[#df6b66]/25 bg-[#df6b66]/[.04] p-3"><div className="flex items-center justify-between"><span className="eyebrow text-[#e78882]">Conflict impact</span><span className="mono text-[8px] uppercase text-[#e78882]">{conflict.intensity}</span></div><div className="mt-3 space-y-3">{conflict.participants.map((actor, index) => <div key={actor.name}><div className="flex justify-between gap-3 text-[9px]"><span>{actor.name}</span><span className="text-right text-[var(--muted)]">{actor.losses}</span></div><div className="mt-1.5 h-1 bg-white/8"><div className="h-full bg-[#df6b66]" style={{ width: `${Math.max(28, 82 - index * 20)}%` }}/></div></div>)}</div><p className="mt-3 border-t border-white/10 pt-3 text-[9px] leading-4 text-[var(--muted)]">{conflict.civilianImpact}</p><div className="mono mt-2 text-[7px] text-[var(--faint)]">ILLUSTRATIVE RANGES · NOT LIVE CASUALTY DATA</div></div>;
}

function TradeGraphic({ detail }: { detail: string }) {
  return <div className="mt-5 border border-[#d4af62]/25 bg-[#d4af62]/[.04] p-3"><div className="flex items-center gap-2"><Banknote size={12} className="text-[#d4af62]"/><span className="eyebrow text-[#d4af62]">Flow and currency</span></div><div className="mt-4 flex items-center gap-2"><div className="h-2 flex-1 bg-[#d4af62]/25"><div className="h-full w-[72%] bg-[#d4af62]"/></div><span className="mono text-[8px]">72 INDEX</span></div><p className="mt-3 text-[9px] leading-4 text-[var(--muted)]">{detail}. Route width and index are illustrative until verified trade feeds are connected.</p></div>;
}

function NewsList({ news }: { news: NewsArticle[] }) {
  if (!news.length) return null;
  return <div className="mt-6"><div className="eyebrow mb-2">Related coverage</div>{news.map((item) => <div key={item.id} className="flex gap-3 border-t border-white/10 py-3"><SourceBadge source={item.source}/><div className="min-w-0"><div className="text-[9px] leading-4">{item.headline}</div><div className="mono mt-1 text-[7px] text-[var(--faint)]">{item.category} · DEMO</div></div></div>)}</div>;
}

function SourceBadge({ source }: { source: string }) {
  const mark = sourceMark(source);
  const domain = source.includes(".") ? source.replace(/^www\./, "") : null;
  return <div title={source} className="grid h-8 min-w-8 shrink-0 place-items-center overflow-hidden px-1 text-center font-bold tracking-[-.06em]" style={{ background: mark.background, color: mark.color, fontSize: mark.mark.length > 3 ? 7 : 9 }}>{domain ? <Image src={`https://${domain}/favicon.ico`} alt={`${source} logo`} width={22} height={22} unoptimized/> : mark.mark}</div>;
}

function LayerKey({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return <div className="flex items-center gap-2 border-t border-white/[.06] py-2 text-[8px] text-[var(--muted)]"><span className={`h-0 w-6 border-t-2 ${dashed ? "border-dashed" : ""}`} style={{ borderColor: color }}/><span>{label}</span></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#09141a] p-3"><div className="eyebrow text-[7px]">{label}</div><div className="mt-2 truncate text-[9px]">{value}</div></div>;
}


