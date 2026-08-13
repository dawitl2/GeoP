# geoP — Level 1 frontend prototype

geoP is a globe-centered geopolitical intelligence and exploration interface. Level 1 is a complete clickable frontend prototype built with local structured demonstration data. It intentionally does not call live geopolitical services or implement the future NestJS backend.

## Run locally

Requirements: Node.js 20+ and pnpm.

```text
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Production validation uses `pnpm typecheck` and `pnpm build`.

## Technology

- Next.js App Router, React, and strict TypeScript
- Tailwind CSS
- MapLibre GL JS with globe projection and locally packaged Natural Earth-derived land geometry
- Zustand for shared selection and map state
- TanStack Query for asynchronous data access
- Apache ECharts for economy and trade visualizations
- Lucide icons

No paid tile provider, API key, live external geopolitical API, or image-of-Earth substitute is used. The current globe is self-contained and uses local world geometry.

## Important routes

- `/` and `/world` — interactive global experience
- `/continent/africa` — continent experience
- `/region/horn-of-africa` — regional experience
- `/country/ethiopia` — country intelligence experience
- `/topic/nile-gerd` — topic experience
- `/relationship/ethiopia/china` — bilateral relationship experience
- `/discover` — topic and conflict discovery
- `/news` — global news discovery

## Frontend structure

The UI is organized by domain under `src/components`: globe, geo entities, topics, relationships, news, statements, timelines, charts, discovery, navigation, and reusable states. Route files remain small and pass URL state into these experiences.

Strong domain types live in `src/types/domain.ts`. Mock records live under `src/data/mock`, never directly inside view components. Components retrieve records through:

```text
UI → TanStack Query hooks → geoService → mockRepository
```

The Zustand store contains only shared interaction state: map focus, selected entity/topic, related actors, preview visibility, map mode, legend, and time range.

## MapLibre architecture

`GeoGlobe` currently renders a clear, draggable WebGL Earth using MapLibre's globe projection and local Natural Earth-derived land geometry. This first step intentionally focuses on rotation, zoom, and reset. Country selection and geopolitical layers will be introduced later.

## Later NestJS migration

The repository binding in `src/services/geo-service.ts` is the replacement boundary. A future NestJS client can implement the same repository methods and replace the local binding while query keys, loading/error behavior, shared map state, route components, and domain presentation stay intact.

## Data notice

All news headlines, statement summaries, economic values, trade values, timelines, and coverage comparisons are fictional or illustrative prototype content. A subtle “Demo dataset” indicator appears in the application header.
