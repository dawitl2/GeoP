# geoP API and data-source inventory

This file lists every external provider currently implemented or explicitly prepared in the codebase. Runtime endpoints are served under `/api/v1`; interactive OpenAPI documentation is available at `/api/docs`.

| Provider | geoP use | Authentication | Refresh/cache | Runtime status |
|---|---|---|---|---|
| World Bank API v2 | Countries, coordinates, capitals, regions, population, economic indicators | None | Countries/indicators: 24 hours | Active |
| UCDP Candidate GED 26.0.6 | Georeferenced organized-violence events, parties, dates, precision fields, fatality estimates | None for candidate CSV | 6 hours | Active |
| GDELT DOC 2.0 | Current multilingual news discovery, source domains, publisher countries, original URLs, social images | None | 10 minutes | Active primary news provider; may throttle |
| Wikimedia Current Events | Source-linked current-event records when GDELT is throttled | None; descriptive user agent | 15 minutes | Active real-source failover |
| Wikimedia Commons MediaWiki API | Licensed image search, thumbnails, creator, credit, and license metadata | None; descriptive user agent | 24 hours | Active |
| Natural Earth 1:10m | Global rivers, lake centerlines, lakes, and populated places | None | Imported local snapshot | Active |
| UN Comtrade API | Reporter/partner trade flows, commodity, flow, primary value, and net weight | Public preview; optional key improves limits | 6 hours | Active |
| world-atlas 50m | Country polygons and topology adjacency used for border-neighbor relationships | Package dataset | Build-time package | Active |
| REST Countries v5 | Extended country metadata adapter | Free key required | — | Prepared, not activated without a key |

## geoP endpoints

| Endpoint | Result |
|---|---|
| `GET /health` | API, provider, and PostgreSQL status |
| `GET /sources` | Machine-readable provider inventory |
| `GET /entities` / `GET /entities/:slug` | World Bank country catalog and individual country |
| `GET /regions` / `GET /regions/:slug` | Live regional aggregations |
| `GET /conflicts?days=365` | UCDP events for a requested time window |
| `GET /topics` / `GET /topics/:slug` | Conflict topics grouped from UCDP events |
| `GET /news?query=&limit=` | GDELT reporting with Wikimedia Current Events failover |
| `GET /media/search?q=&limit=` | Wikimedia Commons image enrichment |
| `GET /economy/:code?indicator=` | World Bank indicator observations |
| `GET /trade/:reporter?partner=&period=&flow=` | UN Comtrade observations |
| `GET /relationships/:a/:b` | World Bank, UCDP, and Comtrade relationship synthesis |
| `GET /map/geography` | Natural Earth river, lake, and city GeoJSON |
| `GET /search?q=` | Unified country, region, and conflict search |

## PostgreSQL persistence

Prisma models persist provider metadata, geographic entities, news articles, conflict events, economic observations, trade observations, geographic features, actor designations, and ingestion runs. Provider reads remain available when PostgreSQL is offline; when `DATABASE_URL` is configured and connected, successful country, news, conflict, economic, and trade responses are inserted with provider IDs and uniqueness constraints.

No provider failure is replaced with invented records. If both the primary and real-source failover are unavailable, the API returns an unavailable state.
