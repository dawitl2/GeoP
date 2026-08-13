import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();
const url = "https://ucdp.uu.se/downloads/candidateged/GEDEvent_v26_0_6.csv";
const version = "26.0.6";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to persist UCDP events.");
  const response = await fetch(url, { headers: { "user-agent": "geoP-conflict-import/1.0" } });
  if (!response.ok) throw new Error(`UCDP download returned ${response.status}`);
  const rows = parse(await response.text(), { columns: true, skip_empty_lines: true, relax_quotes: true }) as Record<string, string>[];
  let written = 0;
  for (const row of rows) {
    await prisma.conflictEvent.upsert({
      where: { provider_providerId_sourceVersion: { provider: "ucdp", providerId: row.id, sourceVersion: version } },
      update: {},
      create: {
        provider: "ucdp", providerId: row.id, sourceVersion: version,
        conflictId: row.conflict_new_id || row.conflict_dset_id, conflictName: row.conflict_name || row.dyad_name,
        dyadName: row.dyad_name || null, sideA: row.side_a || null, sideB: row.side_b || null,
        alliesA: [], alliesB: [], country: row.country || null, region: row.region || null,
        latitude: Number(row.latitude), longitude: Number(row.longitude), locationName: row.where_coordinates || null,
        dateStart: new Date(row.date_start), dateEnd: new Date(row.date_end), fatalitiesBest: Number(row.best || 0),
        fatalitiesLow: Number(row.low || 0), fatalitiesHigh: Number(row.high || 0), civilianDeaths: Number(row.deaths_civilians || 0),
        typeOfViolence: Number(row.type_of_violence), sourceOriginal: row.source_original || null, sourceUrl: url,
        raw: row as Prisma.InputJsonObject,
      },
    });
    written += 1;
    if (written % 500 === 0) process.stdout.write(`Persisted ${written}/${rows.length}\n`);
  }
  process.stdout.write(`Persisted ${written} UCDP Candidate GED ${version} events.\n`);
}

main().finally(() => prisma.$disconnect());
