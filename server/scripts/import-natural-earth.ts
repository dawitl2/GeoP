import AdmZip from "adm-zip";
import * as shapefile from "shapefile";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

const DOWNLOAD_ROOT = "https://naciscdn.org/naturalearth/10m";
const layers = {
  rivers: [
    `${DOWNLOAD_ROOT}/physical/ne_10m_rivers_lake_centerlines_scale_rank.zip`,
  ],
  lakes: [
    `${DOWNLOAD_ROOT}/physical/ne_10m_lakes.zip`,
  ],
  cities: [`${DOWNLOAD_ROOT}/cultural/ne_10m_populated_places_simple.zip`],
};

async function download(url: string, target: string) {
  const response = await fetch(url, { headers: { "user-agent": "geoP-data-import/1.0" } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
}

async function readZip(url: string, directory: string): Promise<Feature<Geometry, GeoJsonProperties>[]> {
  const zipPath = join(directory, basename(url));
  await download(url, zipPath);
  const extraction = join(directory, basename(url, ".zip"));
  await mkdir(extraction, { recursive: true });
  new AdmZip(await readFile(zipPath)).extractAllTo(extraction, true);
  const shpName = new AdmZip(await readFile(zipPath)).getEntries().find((entry) => entry.entryName.toLowerCase().endsWith(".shp"))?.entryName;
  if (!shpName) throw new Error(`${url} does not contain a shapefile`);
  const shapePath = join(extraction, shpName.replaceAll("/", "\\"));
  const dbfPath = shapePath.replace(/\.shp$/i, ".dbf");
  const collection = await shapefile.read(shapePath, dbfPath, { encoding: "utf-8" }) as FeatureCollection;
  return collection.features;
}

function compactFeature(layer: string, feature: Feature): Feature {
  const p = feature.properties ?? {};
  const clean = (value: unknown) => typeof value === "string" ? value.replaceAll("\0", "").trim() : value;
  const common = {
    name: clean(p.name_en) || clean(p.nameascii) || clean(p.name) || null,
    min_zoom: Number(p.min_zoom ?? 0),
    scalerank: Number(p.scalerank ?? p.labelrank ?? 10),
    ne_id: String(p.ne_id ?? ""),
    featurecla: clean(p.featurecla) || layer,
    wikidataid: clean(p.wikidataid) || null,
  };
  const properties = layer === "cities"
    ? { ...common, country: clean(p.adm0name), iso_a2: clean(p.iso_a2), population: Number(p.pop_max ?? 0), capital: Boolean(p.adm0cap), rank: Number(p.rank_max ?? 0) }
    : { ...common, min_label: Number(p.min_label ?? p.min_zoom ?? 0) };
  return { ...feature, properties };
}

function deduplicate(features: Feature[]): Feature[] {
  const seen = new Set<string>();
  return features.filter((feature) => {
    const key = createHash("sha1").update(JSON.stringify(feature.geometry)).digest("hex");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const staging = join(tmpdir(), `geop-natural-earth-${process.pid}`);
  await mkdir(staging, { recursive: true });
  try {
    const output: Record<string, FeatureCollection> = {};
    for (const [name, urls] of Object.entries(layers)) {
      const features: Feature[] = [];
      for (const url of urls) {
        process.stdout.write(`Downloading ${url}\n`);
        features.push(...(await readZip(url, staging)).map((feature) => compactFeature(name, feature)));
      }
      output[name] = { type: "FeatureCollection", features: deduplicate(features) };
    }
    const destination = join(process.cwd(), "server", "data", "natural-earth-10m.json");
    await mkdir(join(process.cwd(), "server", "data"), { recursive: true });
    await writeFile(destination, JSON.stringify({
      ...output,
      provenance: {
        provider: "Natural Earth",
        scale: "1:10m",
        retrievedAt: new Date().toISOString(),
        downloads: Object.values(layers).flat(),
        note: "Global 1:10m rivers, lake centerlines, lakes, and populated places from Natural Earth. Regional supplements are intentionally excluded to prevent overlapping duplicate geometry.",
      },
    }));
    process.stdout.write(`Wrote ${destination}: ${output.rivers.features.length} rivers, ${output.lakes.features.length} lakes, ${output.cities.features.length} populated places.\n`);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

void main();
