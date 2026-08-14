# geoP

geoP is a globe-centered geopolitical intelligence platform built to make countries, conflicts, reporting, physical geography, and economic context explorable in one interface. The globe stays upright, progressively reveals detail by zoom level, and keeps deeper intelligence in a side rail instead of covering the map.

## What it does

- Rotatable MapLibre globe with selectable continents and countries
- Country highlighting with geographic-neighbor and UCDP conflict links
- Scale-aware Natural Earth rivers, lakes, cities, and labels
- Georeferenced UCDP events with parties, fatality estimates, dates, and provenance
- Live reporting from GDELT with Wikimedia Current Events failover
- News imagery enriched through Wikimedia Commons with attribution metadata
- World Bank indicators, UN Comtrade flows, global search, topic timelines, and Swagger API documentation
- PostgreSQL persistence through Prisma when `DATABASE_URL` is configured

## Architecture

The application uses the Next.js 16 App Router and React 19 for the experience layer. TanStack Query manages remote state, Zustand manages globe focus, and MapLibre GL renders the geographic layers. A NestJS 11 API normalizes public providers, caches responses, exposes provenance, and writes successful ingestions to PostgreSQL through Prisma.

```text
Next.js → TanStack Query → NestJS API → public providers
                               └──────→ Prisma → PostgreSQL
```

## The system

The global view remains readable while showing real conflict and publisher activity. At regional zoom, country names, cities, rivers, lakes, event locations, and news markers become progressively denser.

![Africa intelligence focus](docs/screenshots/geop-africa-focus.png)

Country pages keep the map and intelligence profile connected, with the selected state highlighted and its source-backed context alongside it.

![Country intelligence profile](docs/screenshots/geop-country.png)

## Technology

Next.js 16 · React 19 · TypeScript · Tailwind CSS · MapLibre GL · TanStack Query · Zustand · ECharts · NestJS 11 · PostgreSQL · Prisma · Swagger

The complete provider and endpoint inventory is in [API-SOURCES.md](API-SOURCES.md).

## Run locally

```bash
pnpm install
copy .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm data:geography
pnpm dev
```

Set a real PostgreSQL password in `DATABASE_URL` before running the migration. The web app runs at `http://localhost:3000`, the API at `http://localhost:4000/api/v1`, and Swagger at `http://localhost:4000/api/docs`.

## Verification

```bash
pnpm typecheck
pnpm build:api
pnpm build
```

Provider failures are surfaced as unavailable states; geoP does not generate substitute records. UCDP values remain estimates tied to their release and precision fields, and Wikimedia media retains provider, artist, and license metadata.
