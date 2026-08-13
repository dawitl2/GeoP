"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Map as MapLibreMap, setWorkerUrl, type MapLayerMouseEvent, type StyleSpecification } from "maplibre-gl";
import { feature, neighbors } from "topojson-client";
import countriesTopology from "world-atlas/countries-50m.json";
import type { FeatureCollection, GeoJsonProperties, Geometry, LineString, Point, Position } from "geojson";
import { Crosshair, ExternalLink, MapPin, Minus, Newspaper, Plus, RotateCcw, Ship, Swords, Waves, X } from "lucide-react";
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
const emptyLines: FeatureCollection<LineString> = { type: "FeatureCollection", features: [] };

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
  const entityByName = useMemo(() => new Map(entities.map((entity) => [entity.name.toLowerCase(), entity])), [entities]);
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

  const countryNeighbors = useMemo(() => {
    const topology = countriesTopology as unknown as { objects: { countries: { geometries: unknown[] } } };
    const indexes = neighbors(topology.objects.countries.geometries as never);
    return new Map(countries.features.map((country, index) => [String(country.properties?.slug), indexes[index].map((neighborIndex) => String(countries.features[neighborIndex]?.properties?.slug)).filter(Boolean)]));
  }, [countries]);

  const eventFeatures = useMemo<FeatureCollection<Point>>(() => ({
    type: "FeatureCollection",
    features: [
      ...conflictEvents.map((event) => ({
        type: "Feature" as const,
        properties: { name: event.name || event.dyad, slug: `ucdp-${slugifyCountryName(event.conflictId || event.name)}`, eventId: event.id, detail: `${event.dyad}; UCDP best estimate ${event.fatalities.best} fatalities.`, status: event.dateEnd, kind: "Conflict", mapType: "event", source: "UCDP" },
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
        const entity = article.entitySlugs.map((slug) => entityBySlug.get(slug)).find(Boolean) ?? entityByName.get(article.sourceCountry.toLowerCase());
        if (!entity) return [];
        return [{
          type: "Feature" as const,
          id: `catalog-${article.id}`,
          properties: { name: article.headline, slug: article.topicSlug, detail: `${article.summary} Marker location represents the publisher country reported by GDELT.`, source: article.source, category: article.category, mapType: "news" },
          geometry: { type: "Point" as const, coordinates: [entity.coordinates.lng + (index % 3 - 1) * 1.4, entity.coordinates.lat + (index % 2 ? 1 : -1)] },
        }];
      }),
    ],
  }), [entityByName, entityBySlug, news]);

  const countryRelationshipData = useCallback((slug: string, center: [number, number], countryName: string): FeatureCollection<LineString> => {
    const features: FeatureCollection<LineString>["features"] = [];
    for (const neighborSlug of countryNeighbors.get(slug) ?? []) {
      const neighbor = entityBySlug.get(neighborSlug);
      if (!neighbor) continue;
      features.push({ type: "Feature", properties: { relationship: "neighbor", name: neighbor.name }, geometry: { type: "LineString", coordinates: [center, [neighbor.coordinates.lng, neighbor.coordinates.lat]] } });
    }
    const countryConflicts = conflictEvents.filter((conflict) => conflict.country.toLowerCase() === countryName.toLowerCase());
    const groupedLocations = new Map<string, typeof countryConflicts>();
    for (const conflict of countryConflicts) groupedLocations.set(conflict.dyad, [...(groupedLocations.get(conflict.dyad) ?? []), conflict]);
    for (const [dyad, rows] of groupedLocations) {
      const latest = rows.reduce((left, right) => left.dateEnd > right.dateEnd ? left : right);
      features.push({ type: "Feature", properties: { relationship: "conflict", name: dyad, events: rows.length, latest: latest.dateEnd }, geometry: { type: "LineString", coordinates: [center, [latest.coordinates.lng, latest.coordinates.lat]] } });
    }
    return { type: "FeatureCollection", features };
  }, [conflictEvents, countryNeighbors, entityBySlug]);

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
      map.addSource("country-relationships", { type: "geojson", data: emptyLines });
      map.addLayer({ id: "country-neighbors", type: "line", source: "country-relationships", filter: ["==", ["get", "relationship"], "neighbor"], paint: { "line-color": "#86c9ad", "line-width": 1.4, "line-opacity": 0.72, "line-dasharray": [2, 2] } });
      map.addLayer({ id: "country-conflicts", type: "line", source: "country-relationships", filter: ["==", ["get", "relationship"], "conflict"], paint: { "line-color": "#ef746e", "line-width": ["interpolate", ["linear"], ["get", "events"], 1, 1, 30, 4], "line-opacity": 0.78 } });

      map.addSource("lakes", { type: "geojson", data: realLakeFeatures });
      map.addLayer({ id: "lakes-major", type: "fill", source: "lakes", minzoom: 1, filter: ["<=", ["get", "min_zoom"], 2], paint: { "fill-color": "#17657b", "fill-outline-color": "#4f91a2", "fill-opacity": 0.86 } });
      map.addLayer({ id: "lakes-regional", type: "fill", source: "lakes", minzoom: 3, filter: ["all", [">", ["get", "min_zoom"], 2], ["<=", ["get", "min_zoom"], 4.7]], paint: { "fill-color": "#17657b", "fill-outline-color": "#4f91a2", "fill-opacity": 0.82 } });
      map.addLayer({ id: "lakes-local", type: "fill", source: "lakes", minzoom: 5, filter: [">", ["get", "min_zoom"], 4.7], paint: { "fill-color": "#17657b", "fill-outline-color": "#4f91a2", "fill-opacity": 0.78 } });
      map.addSource("country-label-source", { type: "geojson", data: countryLabels });
      map.addLayer({ id: "country-labels", type: "symbol", source: "country-label-source", minzoom: 1.65, layout: { "text-field": ["get", "name"], "text-size": ["interpolate", ["linear"], ["zoom"], 1.65, 8, 4.5, 12], "text-letter-spacing": 0.13, "text-transform": "uppercase", "text-allow-overlap": false, "text-padding": 5 }, paint: { "text-color": "#eef3e8", "text-halo-color": "#21463f", "text-halo-width": 1.4, "text-opacity": ["interpolate", ["linear"], ["zoom"], 1.65, 0.72, 3.5, 0.95] } });

      map.addSource("rivers", { type: "geojson", data: realRiverFeatures });
      const riverClass = ["!=", ["get", "featurecla"], "Lake Centerline"] as never;
      const riverPaint = { "line-color": "#559daf", "line-width": ["interpolate", ["linear"], ["get", "scalerank"], 0, 1.45, 10, 0.35], "line-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.5, 5, 0.78, 7, 0.9] } as never;
      map.addLayer({ id: "rivers-major", type: "line", source: "rivers", minzoom: 2, filter: ["all", riverClass, ["<=", ["get", "min_zoom"], 2.1]], paint: riverPaint });
      map.addLayer({ id: "rivers-regional", type: "line", source: "rivers", minzoom: 3, filter: ["all", riverClass, [">", ["get", "min_zoom"], 2.1], ["<=", ["get", "min_zoom"], 4.7]], paint: riverPaint });
      map.addLayer({ id: "rivers-local", type: "line", source: "rivers", minzoom: 5, filter: ["all", riverClass, [">", ["get", "min_zoom"], 4.7]], paint: riverPaint });
      map.addLayer({ id: "river-labels-major", type: "symbol", source: "rivers", minzoom: 2.5, filter: ["all", riverClass, ["!=", ["get", "name"], null], ["<=", ["get", "min_label"], 3]], layout: { "symbol-placement": "line", "text-field": ["get", "name"], "text-size": 10, "text-letter-spacing": 0.06 }, paint: { "text-color": "#8ec4d0", "text-halo-color": "#173f49", "text-halo-width": 1.3 } });
      map.addLayer({ id: "river-labels-detail", type: "symbol", source: "rivers", minzoom: 5, filter: ["all", riverClass, ["!=", ["get", "name"], null], [">", ["get", "min_label"], 3]], layout: { "symbol-placement": "line", "text-field": ["get", "name"], "text-size": 9, "text-letter-spacing": 0.05 }, paint: { "text-color": "#8ec4d0", "text-halo-color": "#173f49", "text-halo-width": 1.2 } });
      map.addLayer({ id: "river-hit", type: "line", source: "rivers", minzoom: 3, filter: riverClass, paint: { "line-color": "#fff", "line-width": 10, "line-opacity": 0 } });

      map.addSource("cities", { type: "geojson", data: realCityFeatures });
      map.addLayer({ id: "cities-major", type: "circle", source: "cities", minzoom: 1.7, filter: ["<=", ["get", "min_zoom"], 3], paint: { "circle-radius": ["interpolate", ["linear"], ["get", "rank"], 1, 2.2, 14, 4.5], "circle-color": "#f2d98d", "circle-stroke-width": 1, "circle-stroke-color": "#172027" } });
      map.addLayer({ id: "cities", type: "circle", source: "cities", minzoom: 4, filter: [">", ["get", "min_zoom"], 3], paint: { "circle-radius": ["interpolate", ["linear"], ["get", "rank"], 1, 2, 14, 4], "circle-color": "#f2d98d", "circle-stroke-width": 1, "circle-stroke-color": "#172027" } });
      map.addLayer({ id: "city-labels-major", type: "symbol", source: "cities", minzoom: 1.7, filter: ["<=", ["get", "min_zoom"], 3], layout: { "text-field": ["get", "name"], "text-size": ["interpolate", ["linear"], ["zoom"], 1.7, 8, 5, 12], "text-offset": [0, 1.15], "text-anchor": "top", "text-allow-overlap": false, "text-padding": 4 }, paint: { "text-color": "#fff1c7", "text-halo-color": "#142c30", "text-halo-width": 1.5 } });
      map.addLayer({ id: "city-labels", type: "symbol", source: "cities", minzoom: 4, filter: [">", ["get", "min_zoom"], 3], layout: { "text-field": ["get", "name"], "text-size": 10, "text-offset": [0, 1.15], "text-anchor": "top", "text-allow-overlap": false, "text-padding": 4 }, paint: { "text-color": "#fff1c7", "text-halo-color": "#142c30", "text-halo-width": 1.5 } });

      map.addSource("events", { type: "geojson", data: eventFeatures });
      map.addLayer({ id: "event-halo", type: "circle", source: "events", minzoom: 0.5, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 0.5, 4, 4, 16], "circle-color": ["match", ["get", "kind"], "Conflict", "#df6661", "Tension", "#e1b255", "#62a7c8"], "circle-opacity": 0.2 } });
      map.addLayer({ id: "events", type: "circle", source: "events", minzoom: 0.5, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 0.5, 1.6, 4, 6.5], "circle-color": ["match", ["get", "kind"], "Conflict", "#ef746e", "Tension", "#f0c15e", "#73bfdf"], "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 0.5, 0.35, 3, 1], "circle-stroke-color": "#101417" } });

      map.addSource("news", { type: "geojson", data: newsFeatures });
      map.addLayer({ id: "news-halo", type: "circle", source: "news", minzoom: 0.5, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 0.5, 4, 4, 8], "circle-color": "#74c29c", "circle-opacity": 0.15 } });
      map.addLayer({ id: "news-markers", type: "circle", source: "news", minzoom: 0.5, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 0.5, 1.8, 4, 5], "circle-color": "#7ee0ae", "circle-stroke-width": 1, "circle-stroke-color": "#0a221b" } });
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
          detail: String(item.properties?.detail ?? item.properties?.status ?? "Source metadata unavailable"),
          coordinates,
          lens: Boolean(item.properties?.lens),
          slug: item.properties?.slug ? String(item.properties.slug) : undefined,
          source: item.properties?.source ? String(item.properties.source) : undefined,
          eventId: item.properties?.eventId ? String(item.properties.eventId) : undefined,
        };
        map.getCanvas().style.cursor = "pointer";
        setHover(detail);
        if (mapType === "river" && detail.lens) setLens({ ...detail, eyebrow: "Magnified river detail" });
      });
      map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; setHover(null); });
    };

    hoverLayer("country-fill", "country");
    hoverLayer("cities", "city");
    hoverLayer("cities-major", "city");
    hoverLayer("river-hit", "river");
    hoverLayer("events", "event");
    hoverLayer("news-markers", "news");

    map.on("click", "country-fill", (event: MapLayerMouseEvent) => {
      const item = event.features?.[0];
      if (!item) return;
      const slug = String(item.properties?.slug ?? "");
      const center: [number, number] = [Number(item.properties?.centerLng ?? event.lngLat.lng), Number(item.properties?.centerLat ?? event.lngLat.lat)];
      const continentSlug = String(item.properties?.continent ?? continentFromCoordinate(center));
      const info: MapHoverDetail = { type: "country", name: String(item.properties?.name ?? slug), eyebrow: continentSlug, detail: String(item.properties?.detail), coordinates: center, slug };
      setSelectedCountry(slug);
      setSelectedCountryInfo(info);
      setSelectedContinent(null);
      setActiveDetail(info);
      map.setFilter("country-selected", ["==", ["get", "slug"], slug]);
      const countryName = String(item.properties?.name ?? "");
      (map.getSource("country-relationships") as import("maplibre-gl").GeoJSONSource).setData(countryRelationshipData(slug, center, countryName));
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
        detail: String(item.properties?.detail ?? "Source metadata unavailable"),
        coordinates: item.geometry.type === "Point" ? item.geometry.coordinates as [number, number] : [event.lngLat.lng, event.lngLat.lat],
        slug: item.properties?.slug ? String(item.properties.slug) : undefined,
        source: item.properties?.source ? String(item.properties.source) : undefined,
        eventId: item.properties?.eventId ? String(item.properties.eventId) : undefined,
      });
      if (resolvedType === "event") map.easeTo({ center: [event.lngLat.lng, event.lngLat.lat], zoom: Math.max(map.getZoom(), 4.2), bearing: 0, pitch: 0, duration: 700 });
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
  }, [compact, countries, countryLabels, countryRelationshipData, entities.length, entityBySlug, eventFeatures, focusContinentFromMap, geography, newsFeatures, realCityFeatures, realLakeFeatures, realRiverFeatures]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource("events") as import("maplibre-gl").GeoJSONSource | undefined)?.setData(eventFeatures);
    (map.getSource("news") as import("maplibre-gl").GeoJSONSource | undefined)?.setData(newsFeatures);
  }, [eventFeatures, newsFeatures, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const entity = controlledEntity ? entityBySlug.get(controlledEntity) : undefined;
    const topic = controlledTopic ? topicBySlug.get(controlledTopic) : undefined;
    if (entity) {
      const center: [number, number] = [entity.coordinates.lng, entity.coordinates.lat];
      map.setFilter("country-selected", ["==", ["get", "slug"], entity.slug]);
      (map.getSource("country-relationships") as import("maplibre-gl").GeoJSONSource | undefined)?.setData(countryRelationshipData(entity.slug, center, entity.name));
      map.flyTo({ center, zoom: 3.2, bearing: 0, pitch: 0, duration: 1100, essential: true });
    }
    if (topic) map.flyTo({ center: [topic.coordinates.lng, topic.coordinates.lat], zoom: Math.max(topic.coordinates.zoom, 3.2), bearing: 0, pitch: 0, duration: 1100, essential: true });
    if (relatedSlugs.length) map.setFilter("country-selected", ["in", ["get", "slug"], ["literal", relatedSlugs]]);
  }, [controlledEntity, controlledTopic, countryRelationshipData, entityBySlug, ready, relatedSlugs, topicBySlug]);

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
    (mapRef.current?.getSource("country-relationships") as import("maplibre-gl").GeoJSONSource | undefined)?.setData(emptyLines);
    mapRef.current?.flyTo({ center: WORLD_CENTER, zoom: compact ? 1 : WORLD_ZOOM, bearing: 0, pitch: 0, duration: 850 });
  };

  const railDetail = hover ?? activeDetail;
  const activeEntity = selectedCountry ? entityBySlug.get(selectedCountry) : undefined;
  const activeContinent = selectedContinent ? continentFocuses.find((item) => item.slug === selectedContinent) : undefined;
  const activeTopic = railDetail?.slug ? topicBySlug.get(railDetail.slug) : undefined;
  const liveConflict = railDetail?.eventId ? conflictEvents.find((event) => event.id === railDetail.eventId) : undefined;
  const conflict = liveConflict ? {
    slug: liveConflict.id,
    intensity: "active" as const,
    participants: [{ name: liveConflict.sideA, role: "UCDP side A", losses: `${liveConflict.fatalities.sideA} recorded deaths` }, { name: liveConflict.sideB, role: "UCDP side B", losses: `${liveConflict.fatalities.sideB} recorded deaths` }].filter((actor) => actor.name),
    civilianImpact: `Best estimate ${liveConflict.fatalities.best}; range ${liveConflict.fatalities.low}-${liveConflict.fatalities.high}; civilian deaths ${liveConflict.fatalities.civilians}. UCDP Candidate GED ${liveConflict.provenance.release}; estimates may be revised.`,
  } : undefined;
  const relatedNews = activeTopic ? news.filter((item) => item.topicSlug === activeTopic.slug).slice(0, 3) : activeEntity ? news.filter((item) => item.entitySlugs.includes(activeEntity.slug)).slice(0, 3) : news.slice(0, 3);
  const selectedNeighbors = activeEntity ? (countryNeighbors.get(activeEntity.slug) ?? []).map((slug) => entityBySlug.get(slug)).filter((entity): entity is GeoEntity => Boolean(entity)) : [];
  const selectedConflicts = activeEntity ? conflictEvents.filter((event) => event.country.toLowerCase() === activeEntity.name.toLowerCase()).sort((a, b) => b.dateEnd.localeCompare(a.dateEnd)) : [];

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden bg-[#010407]" aria-label="Interactive geopolitical globe">
      <div className={`absolute inset-y-0 left-0 ${compact ? "right-0" : "right-0 lg:right-[336px]"}`}><div ref={container} className="absolute inset-0 h-full w-full" /></div>
      {!ready ? <div className="absolute inset-0 grid place-items-center bg-[#010407]"><div className="text-center"><div className="mx-auto h-12 w-12 rounded-full border border-[#9dbdb4]/60"/><div className="eyebrow mt-3">Rendering intelligence layers</div></div></div> : null}

      {!compact ? <div className="absolute left-4 top-4 z-10 hidden w-48 border border-white/12 bg-[#071117]/92 p-3 backdrop-blur-md md:block"><div className="eyebrow mb-2">Geographic focus</div>{continentFocuses.map((item) => <button key={item.slug} onClick={() => focusContinent(item.slug)} className={`flex w-full items-center justify-between border-t border-white/[.07] py-2 text-left text-[11px] ${selectedContinent === item.slug ? "text-[#c9d98d]" : "text-[var(--muted)] hover:text-white"}`}><span>{item.name}</span><span className="mono text-[7px]">FOCUS</span></button>)}</div> : null}
      {!compact ? <div className="absolute left-4 top-[350px] z-10 hidden w-48 border border-white/10 bg-[#071117]/88 p-3 backdrop-blur-md md:block"><div className="eyebrow mb-2">Layer key</div><LayerKey color="#ef746e" label="UCDP conflict event"/><LayerKey color="#7ee0ae" label="News publisher"/><LayerKey color="#86c9ad" label="Border neighbor" dashed/><LayerKey color="#64b5ca" label="River / water"/></div> : null}

      {!compact ? <aside className="absolute bottom-4 right-14 top-4 z-20 hidden w-[310px] overflow-y-auto border border-white/12 bg-[#061016]/96 shadow-2xl backdrop-blur-xl lg:block" aria-label="Map intelligence rail">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#061016]/96 px-4 py-3"><div><div className="eyebrow text-[#75cfa5]">Intelligence rail</div><div className="mono mt-1 text-[8px] text-[var(--faint)]">LIVE · MULTI-SOURCE</div></div>{railDetail || selectedCountryInfo || activeContinent ? <button onClick={() => { setActiveDetail(null); setHover(null); setSelectedCountryInfo(null); }} className="p-2 text-[var(--muted)]" aria-label="Clear map detail"><X size={14}/></button> : null}</div>
        <div className="p-4">
          {railDetail ? <RailDetail detail={railDetail} topic={activeTopic} conflict={conflict} entity={activeEntity} news={relatedNews}/> : selectedCountryInfo ? <CountryRail name={activeEntity?.name ?? selectedCountryInfo.name} detail={activeEntity?.summary ?? selectedCountryInfo.detail} entity={activeEntity} news={relatedNews} neighbors={selectedNeighbors} conflicts={selectedConflicts}/> : activeContinent ? <><div className="eyebrow">Continent focus</div><h2 className="mt-3 text-2xl tracking-[-.04em]">{activeContinent.name}</h2><p className="mt-3 text-xs leading-6 text-[var(--muted)]">{activeContinent.description}</p><DensityGuide/></> : <><div className="eyebrow">Global situation</div><h2 className="mt-3 text-xl tracking-[-.035em]">The map gets denser as you approach.</h2><p className="mt-3 text-xs leading-6 text-[var(--muted)]">Hover a label, route, conflict, city, river, or news pulse. Click to pin its context here without covering the Earth.</p><DensityGuide/><div className="mt-6"><div className="eyebrow mb-3">Source network</div><div className="grid grid-cols-4 gap-2">{["CNN","BBC","Reuters","DW","France 24","Al Jazeera","Nikkei","CCTV"].map((source) => <SourceBadge key={source} source={source}/>)}</div></div></>}
        </div>
      </aside> : null}

      {lens ? <aside className="absolute bottom-4 left-4 z-30 w-[min(330px,calc(100%-32px))] overflow-hidden border border-white/15 bg-[#061016]/97 shadow-2xl"><div className="relative h-40 bg-[#0b3443]"><div ref={magnifier} className="absolute inset-0"/><div className="pointer-events-none absolute inset-3 border border-white/30"/><Crosshair className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70" size={18}/><button onClick={() => setLens(null)} className="absolute right-2 top-2 bg-[#061016]/90 p-2" aria-label="Close magnified detail"><X size={14}/></button></div><div className="p-4"><div className="eyebrow text-[#7dc7d5]">{lens.eyebrow}</div><h3 className="mt-2 text-base">{lens.name}</h3><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{lens.detail}</p><div className="mono mt-3 text-[8px] text-[var(--faint)]">NATURAL EARTH HYDROGRAPHY</div></div></aside> : null}

      <div className="absolute bottom-4 right-4 z-30 flex flex-col border border-white/15 bg-[#061016]/92"><button onClick={() => mapRef.current?.zoomIn({ duration: 350 })} className="border-b border-white/10 p-2.5 hover:bg-white/5" aria-label="Zoom in"><Plus size={15}/></button><button onClick={() => mapRef.current?.zoomOut({ duration: 350 })} className="border-b border-white/10 p-2.5 hover:bg-white/5" aria-label="Zoom out"><Minus size={15}/></button><button onClick={reset} className="p-2.5 hover:bg-white/5" aria-label="Reset globe"><RotateCcw size={14}/></button></div>
      {!compact ? <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 border border-white/10 bg-[#061016]/86 px-4 py-2 text-[9px] text-[#d1dcda]">Drag to rotate · Scroll to reveal labels, cities, water, news, conflict, and trade</div> : null}
    </div>
  );
}

function DensityGuide() {
  return <div className="mt-6 border-t border-white/10"><div className="flex items-center justify-between py-3 text-[10px]"><span>World</span><span className="text-[var(--muted)]">oceans · active issues</span></div><div className="flex items-center justify-between border-t border-white/10 py-3 text-[10px]"><span>Region</span><span className="text-[var(--muted)]">countries · news · trade</span></div><div className="flex items-center justify-between border-t border-white/10 py-3 text-[10px]"><span>Local</span><span className="text-[var(--muted)]">cities · rivers · lakes</span></div></div>;
}

function CountryRail({ name, detail, entity, news, neighbors, conflicts }: { name: string; detail: string; entity?: GeoEntity; news: NewsArticle[]; neighbors: GeoEntity[]; conflicts: import("@/services/geo-service").RealConflictEvent[] }) {
  const parties = [...new Set(conflicts.flatMap((event) => event.parties))].slice(0, 10);
  return <><div className="eyebrow">Country focus</div><h2 className="mt-3 text-2xl tracking-[-.04em]">{name}</h2><p className="mt-3 text-xs leading-6 text-[var(--muted)]">{detail}</p>{entity ? <div className="mt-5 grid grid-cols-2 gap-px bg-white/10"><Metric label="Capital" value={entity.capital}/><Metric label="Population" value={entity.population}/><Metric label="Currency" value={entity.currency}/><Metric label="Region" value={entity.region}/></div> : null}<div className="mt-6"><div className="eyebrow text-[#86c9ad]">Border neighbors</div><p className="mt-2 text-[9px] leading-4 text-[var(--muted)]">Geographic adjacency only; this does not imply friendship.</p><div className="mt-2 flex flex-wrap gap-1">{neighbors.map((neighbor) => <span key={neighbor.slug} className="border border-[#86c9ad]/25 px-2 py-1 text-[8px]">{neighbor.name}</span>)}</div></div><div className="mt-6"><div className="eyebrow text-[#ef746e]">Recorded conflict exposure</div><p className="mt-2 text-[9px] leading-4 text-[var(--muted)]">{conflicts.length} UCDP events in the loaded period · {parties.length} visible parties</p>{parties.map((party) => <div key={party} className="border-t border-white/10 py-2 text-[9px]">{party}</div>)}{conflicts.slice(0, 4).map((event) => <Link key={event.id} href={`/topic/ucdp-${slugifyCountryName(event.conflictId || event.name)}`} className="block border-t border-white/10 py-3"><div className="text-[9px] text-[#ef918c]">{event.dyad}</div><div className="mono mt-1 text-[7px] text-[var(--faint)]">{event.dateEnd.slice(0, 10)} · BEST EST. {event.fatalities.best}</div></Link>)}</div><NewsList news={news}/></>;
}

function RailDetail({ detail, topic, conflict, entity, news }: { detail: MapHoverDetail; topic?: Topic; conflict?: ConflictBrief; entity?: GeoEntity; news: NewsArticle[] }) {
  const Icon = detail.type === "event" ? Swords : detail.type === "trade" ? Ship : detail.type === "news" ? Newspaper : detail.type === "river" || detail.type === "water" ? Waves : MapPin;
  return <><div className="flex items-center gap-2"><Icon size={13} className="text-[#87cdb2]"/><div className="eyebrow">{detail.eyebrow}</div></div>{detail.source ? <div className="mt-4 flex items-center gap-3"><SourceBadge source={detail.source}/><div><div className="text-xs">{detail.source}</div><div className="mono mt-1 text-[8px] text-[var(--faint)]">SOURCE-LINKED VIEW</div></div></div> : null}<h2 className="mt-4 text-xl leading-6 tracking-[-.035em]">{detail.name}</h2><p className="mt-3 text-[11px] leading-6 text-[var(--muted)]">{topic?.summary ?? detail.detail}</p>{conflict ? <ConflictGraphic conflict={conflict}/> : null}{topic ? <><div className="mt-6"><div className="eyebrow mb-3">How sides frame it</div>{topic.coverage.slice(1,4).map((side) => <div key={side.name} className="border-t border-white/10 py-3"><div className="flex items-center justify-between"><span className="text-[10px]">{side.name}</span><span className="mono text-[8px] text-[var(--faint)]">{side.volume}%</span></div><p className="mt-2 text-[9px] leading-4 text-[var(--muted)]">{side.framing}</p></div>)}</div><Link href={detail.eventId ? `/topic/${topic.slug}?event=${encodeURIComponent(detail.eventId)}#timeline-${encodeURIComponent(detail.eventId)}` : `/topic/${topic.slug}`} className="mt-4 flex items-center gap-2 text-[10px] text-[#bfcf87]">{detail.eventId ? "Open this event in the timeline" : "Open full topic context"} <ExternalLink size={11}/></Link></> : null}{entity && detail.type === "country" ? <div className="mt-5 grid grid-cols-2 gap-px bg-white/10"><Metric label="Capital" value={entity.capital}/><Metric label="Currency" value={entity.currency}/></div> : null}<NewsList news={news}/></>;
}

function ConflictGraphic({ conflict }: { conflict: ConflictBrief }) {
  return <div className="mt-5 border border-[#df6b66]/25 bg-[#df6b66]/[.04] p-3"><div className="flex items-center justify-between"><span className="eyebrow text-[#e78882]">Conflict impact</span><span className="mono text-[8px] uppercase text-[#e78882]">{conflict.intensity}</span></div><div className="mt-3 space-y-3">{conflict.participants.map((actor, index) => <div key={actor.name}><div className="flex justify-between gap-3 text-[9px]"><span>{actor.name}</span><span className="text-right text-[var(--muted)]">{actor.losses}</span></div><div className="mt-1.5 h-1 bg-white/8"><div className="h-full bg-[#df6b66]" style={{ width: `${Math.max(28, 82 - index * 20)}%` }}/></div></div>)}</div><p className="mt-3 border-t border-white/10 pt-3 text-[9px] leading-4 text-[var(--muted)]">{conflict.civilianImpact}</p><div className="mono mt-2 text-[7px] text-[var(--faint)]">UCDP CANDIDATE GED · ESTIMATES MAY BE REVISED</div></div>;
}

function NewsList({ news }: { news: NewsArticle[] }) {
  if (!news.length) return null;
  return <div className="mt-6"><div className="eyebrow mb-2">Related coverage</div>{news.map((item) => <div key={item.id} className="flex gap-3 border-t border-white/10 py-3"><SourceBadge source={item.source}/><div className="min-w-0"><div className="text-[9px] leading-4">{item.headline}</div><div className="mono mt-1 text-[7px] text-[var(--faint)]">{item.category} · {item.sourceCountry}</div></div></div>)}</div>;
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

