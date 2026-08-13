import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { parse } from "csv-parse/sync";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaService } from "../database/prisma.service";

type CacheEntry<T> = { expires: number; value: T };
type RestCountry = {
  cca2?: string; cca3?: string; name: { common: string; official: string };
  continents?: string[]; region?: string; subregion?: string; capital?: string[];
  population?: number; currencies?: Record<string, { name: string; symbol?: string }>;
  languages?: Record<string, string>; latlng?: number[]; status?: string;
  unMember?: boolean; maps?: { openStreetMaps?: string };
};
type UcdpRow = Record<string, string>;

const UCDP_CANDIDATE_URL = "https://ucdp.uu.se/downloads/candidateged/GEDEvent_v26_0_6.csv";
const GEOGRAPHY_FILE = join(process.cwd(), "server", "data", "natural-earth-10m.json");

@Injectable()
export class IntelligenceService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private providerErrors = new Map<string, string>();

  constructor(private readonly http: HttpService, private readonly db: PrismaService) {}

  private async persist(label: string, writer: () => Promise<unknown>) {
    if (!this.db.connected) return;
    try { await writer(); }
    catch (error) { this.providerErrors.set(`postgresql:${label}`, error instanceof Error ? error.message : String(error)); }
  }

  private async cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key) as CacheEntry<T> | undefined;
    if (hit && hit.expires > Date.now()) return hit.value;
    try {
      const value = await loader();
      this.cache.set(key, { value, expires: Date.now() + ttlMs });
      this.providerErrors.delete(key.split(":")[0]);
      return value;
    } catch (error) {
      this.providerErrors.set(key.split(":")[0], error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  sources() {
    return [
      { id: "world-bank", role: "country metadata and economic indicators", url: "https://api.worldbank.org", authentication: "none" },
      { id: "gdelt", role: "current news and imagery", url: "https://api.gdeltproject.org", authentication: "none" },
      { id: "rest-countries", role: "optional extended country metadata", url: "https://restcountries.com", authentication: "free key required for v5; not active without user key" },
      { id: "ucdp", role: "georeferenced organized violence", url: "https://ucdp.uu.se", authentication: "download center; token needed for API" },
      { id: "natural-earth", role: "rivers, lakes and populated places", url: "https://www.naturalearthdata.com", authentication: "none" },
      { id: "un-comtrade", role: "trade flows", url: "https://comtradeapi.un.org", authentication: "public calls available; key improves limits" },
      { id: "wikimedia", role: "image enrichment and encyclopedic media metadata", url: "https://commons.wikimedia.org/w/api.php", authentication: "none; descriptive user-agent required" },
      { id: "wikimedia-current-events", role: "current source-linked events when GDELT is throttled", url: "https://en.wikipedia.org/w/api.php", authentication: "none; descriptive user-agent required" },
    ];
  }

  health() {
    return {
      status: "ok",
      generatedAt: new Date().toISOString(),
      persistence: { configured: this.db.configured, connected: this.db.connected, engine: "PostgreSQL + Prisma" },
      providers: this.sources().map((source) => ({ ...source, error: this.providerErrors.get(source.id) ?? null })),
      policy: "No generated substitution: provider failures are returned as unavailable states.",
    };
  }

  private slug(value: string) {
    return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  private entityView(country: RestCountry) {
    const [lat = 0, lng = 0] = country.latlng ?? [];
    const currencies = Object.values(country.currencies ?? {});
    const languageList = Object.values(country.languages ?? {});
    const name = country.name.common;
    return {
      id: country.cca3 ?? country.cca2 ?? this.slug(name), slug: this.slug(name), name,
      officialName: country.name.official, kind: country.status === "officially-assigned" ? "country" : "territory",
      continent: country.continents?.[0] ?? country.region ?? "Unknown", region: country.subregion ?? country.region ?? "Unknown",
      capital: country.capital?.join(", ") ?? "Not available", population: country.population?.toLocaleString("en-US") ?? "Not available",
      currency: currencies.map((value) => `${value.name}${value.symbol ? ` (${value.symbol})` : ""}`).join(", ") || "Not available",
      languages: languageList, government: "Not supplied by REST Countries",
      coordinates: { lng, lat, zoom: 3.2 },
      summary: `${country.name.official} is in ${country.subregion ?? country.region ?? "an unspecified region"}. Population and administrative metadata are supplied live by REST Countries.`,
      context: `UN membership: ${country.unMember ? "member" : "not listed as a member"}.`,
      topicSlugs: [], relationSlugs: [], memberships: country.unMember ? ["United Nations"] : [], securityIssues: [],
      metrics: [
        { label: "Population", value: country.population?.toLocaleString("en-US") ?? "N/A", detail: "REST Countries current response" },
        { label: "ISO", value: country.cca3 ?? country.cca2 ?? "N/A", detail: "ISO country code" },
      ],
      economy: [], exports: [], imports: [], products: { exports: [], imports: [] },
      provenance: { provider: "REST Countries", retrievedAt: new Date().toISOString(), sourceUrl: country.maps?.openStreetMaps },
    };
  }

  async entities() {
    return this.cached("world-bank:countries", 24 * 60 * 60_000, async () => {
      const [countriesResponse, populationResponse] = await Promise.all([
        firstValueFrom(this.http.get("https://api.worldbank.org/v2/country", { params: { format: "json", per_page: 400 } })),
        firstValueFrom(this.http.get("https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL", { params: { format: "json", per_page: 1000, mrv: 1 } })),
      ]);
      const rows = Array.isArray(countriesResponse.data?.[1]) ? countriesResponse.data[1] : [];
      const populations = new Map<string, number>((Array.isArray(populationResponse.data?.[1]) ? populationResponse.data[1] : []).map((row: Record<string, unknown>) => [String(row.countryiso3code), Number(row.value)]));
      const entities = rows.filter((row: Record<string, unknown>) => String((row.region as Record<string, unknown>)?.id) !== "NA").map((row: Record<string, unknown>) => {
        const name = String(row.name);
        const region = row.region as Record<string, unknown>;
        const income = row.incomeLevel as Record<string, unknown>;
        const population = populations.get(String(row.id));
        return {
          id: String(row.id), slug: this.slug(name), name, officialName: name, kind: "country",
          continent: String(region?.value ?? "Unknown"), region: String(region?.value ?? "Unknown"),
          capital: String(row.capitalCity || "Not available"), population: Number.isFinite(population) ? population!.toLocaleString("en-US") : "Not available",
          currency: "Not supplied by World Bank country endpoint", languages: [], government: "Not supplied by World Bank country endpoint",
          coordinates: { lng: Number(row.longitude || 0), lat: Number(row.latitude || 0), zoom: 3.2 },
          summary: `${name} is classified by the World Bank in ${String(region?.value ?? "an unspecified region")} with income group ${String(income?.value ?? "not available")}.`,
          context: "Country and population fields come from current World Bank API responses.", topicSlugs: [], relationSlugs: [], memberships: [], securityIssues: [],
          metrics: [{ label: "Population", value: Number.isFinite(population) ? population!.toLocaleString("en-US") : "N/A", detail: "World Bank SP.POP.TOTL latest available" }, { label: "ISO", value: String(row.id), detail: "World Bank ISO3 code" }],
          economy: [], exports: [], imports: [], products: { exports: [], imports: [] },
          provenance: { provider: "World Bank API v2", retrievedAt: new Date().toISOString(), sourceUrl: "https://api.worldbank.org/v2/country" },
        };
      }).sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
      await this.persist("entities", () => this.db.geoEntity.createMany({ data: entities.map((entity) => ({ slug: entity.slug, canonicalName: entity.officialName, displayName: entity.name, entityType: "SOVEREIGN_STATE", isoAlpha3: entity.id, continent: entity.continent, region: entity.region, capital: entity.capital === "Not available" ? null : entity.capital, population: entity.population === "Not available" ? null : BigInt(entity.population.replaceAll(",", "")), aliases: [], centroidLng: entity.coordinates.lng, centroidLat: entity.coordinates.lat, boundarySource: "World Bank API v2", retrievedAt: new Date() })), skipDuplicates: true }));
      return entities;
    });
  }

  async entity(slug: string) {
    const entity = (await this.entities()).find((item) => item.slug === slug || item.id.toLowerCase() === slug.toLowerCase());
    if (!entity) throw new NotFoundException(`No real country record found for ${slug}`);
    return entity;
  }

  async regions() {
    const entities = await this.entities();
    const groups = new Map<string, typeof entities>();
    for (const entity of entities) groups.set(entity.region, [...(groups.get(entity.region) ?? []), entity]);
    return [...groups.entries()].map(([name, members]) => ({
      slug: this.slug(name), name, continent: members[0]?.continent ?? "Unknown",
      coordinates: { lng: members.reduce((sum, item) => sum + item.coordinates.lng, 0) / members.length, lat: members.reduce((sum, item) => sum + item.coordinates.lat, 0) / members.length, zoom: 2.5 },
      entitySlugs: members.map((item) => item.slug), topicSlugs: [], summary: `${members.length} country and territory records from REST Countries.`,
      metrics: [{ label: "Entities", value: String(members.length), detail: "Current provider response" }],
    }));
  }

  async region(slug: string) {
    const region = (await this.regions()).find((item) => item.slug === slug);
    if (!region) throw new NotFoundException(`No real regional aggregation found for ${slug}`);
    return region;
  }

  async news(query = "geopolitics", requestedLimit = 100) {
    const limit = Math.min(Math.max(requestedLimit || 100, 1), 250);
    const cacheKey = `gdelt:${query}:${limit}`;
    try { return await this.cached(cacheKey, 10 * 60_000, async () => {
      const params = { query, mode: "artlist", maxrecords: limit, format: "json", sort: "datedesc" };
      const response = await firstValueFrom(this.http.get("https://api.gdeltproject.org/api/v2/doc/doc", { params }));
      const articles = Array.isArray(response.data?.articles) ? response.data.articles : [];
      const news = articles.map((article: Record<string, unknown>) => {
        const url = String(article.url ?? "");
        const domain = String(article.domain ?? new URL(url).hostname);
        const id = createHash("sha256").update(url).digest("hex").slice(0, 24);
        const published = String(article.seendate ?? "");
        const publishedAt = /^\d{14}$/.test(published)
          ? `${published.slice(0, 4)}-${published.slice(4, 6)}-${published.slice(6, 8)}T${published.slice(8, 10)}:${published.slice(10, 12)}:${published.slice(12, 14)}Z`
          : new Date().toISOString();
        return {
          id, headline: String(article.title ?? "Untitled report"), source: domain, sourceCountry: String(article.sourcecountry ?? "Unknown"),
          publishedAt, category: "Current coverage", topicSlug: this.slug(query), entitySlugs: [],
          summary: `Current article indexed by GDELT from ${domain}. Open the original source for the complete report.`,
          region: String(article.sourcecountry ?? "Global"), originalUrl: url, imageUrl: article.socialimage ? String(article.socialimage) : null,
          language: article.language ? String(article.language) : null,
          provenance: { provider: "GDELT DOC 2.0", retrievedAt: new Date().toISOString(), originalUrl: url },
        };
      });
      await this.persist("news", () => this.db.newsArticle.createMany({ data: news.map((article: { id: string; headline: string; originalUrl: string; imageUrl: string | null; source: string; sourceCountry: string; language: string | null; publishedAt: string; category: string; entitySlugs: string[] }) => ({ provider: "GDELT DOC 2.0", providerId: article.id, headline: article.headline, originalUrl: article.originalUrl, imageUrl: article.imageUrl, sourceName: article.source, sourceDomain: article.source, sourceCountry: article.sourceCountry, language: article.language, publishedAt: new Date(article.publishedAt), themes: [article.category], entitySlugs: article.entitySlugs })), skipDuplicates: true }));
      return news;
    }); } catch { return this.currentEvents(limit); }
  }

  private decodeHtml(value: string) {
    return value.replace(/<[^>]+>/g, " ").replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  }

  private async currentEvents(requestedLimit: number) {
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    return this.cached(`wikimedia-current-events:${limit}`, 15 * 60_000, async () => {
      const dates = Array.from({ length: 14 }, (_, offset) => new Date(Date.now() - offset * 86_400_000));
      const pages = await Promise.all(dates.map(async (date) => {
        const page = `Portal:Current events/${date.getUTCFullYear()} ${date.toLocaleString("en-US", { month: "long", timeZone: "UTC" })} ${date.getUTCDate()}`;
        try {
          const response = await firstValueFrom(this.http.get("https://en.wikipedia.org/w/api.php", { params: { action: "parse", page, prop: "text", format: "json", origin: "*" }, headers: { "user-agent": process.env.WIKIMEDIA_USER_AGENT || "geoP/1.0 (educational project; configure WIKIMEDIA_USER_AGENT)" } }));
          return { date, html: String(response.data?.parse?.text?.["*"] ?? "") };
        } catch { return { date, html: "" }; }
      }));
      const entities = await this.entities();
      const records = pages.flatMap(({ date, html }) => [...html.matchAll(/<li>([\s\S]*?)<\/li>/gi)].flatMap((match) => {
        const raw = match[1];
        const text = this.decodeHtml(raw);
        if (text.length < 80) return [];
        const external = raw.match(/href="(https?:\/\/[^"#]+)"/i)?.[1]?.replaceAll("&amp;", "&");
        if (!external) return [];
        const entity = entities.find((item) => new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));
        const source = new URL(external).hostname.replace(/^www\./, "");
        const sentence = text.match(/^(.{80,220}?[.!?])(?:\s|$)/)?.[1] ?? `${text.slice(0, 217)}${text.length > 217 ? "…" : ""}`;
        const id = createHash("sha256").update(`${external}:${text}`).digest("hex").slice(0, 24);
        return [{ id, headline: sentence, source, sourceCountry: entity?.name ?? "Global", publishedAt: date.toISOString(), category: "Current events", topicSlug: "current-events", entitySlugs: entity ? [entity.slug] : [], summary: text, region: entity?.region ?? "Global", originalUrl: external, imageUrl: null, language: "English", provenance: { provider: "Wikimedia Current Events", retrievedAt: new Date().toISOString(), originalUrl: external } }];
      })).slice(0, limit);
      await this.persist("news", () => this.db.newsArticle.createMany({ data: records.map((article) => ({ provider: "Wikimedia Current Events", providerId: article.id, headline: article.headline, originalUrl: article.originalUrl, imageUrl: article.imageUrl, sourceName: article.source, sourceDomain: article.source, sourceCountry: article.sourceCountry, language: article.language, publishedAt: new Date(article.publishedAt), themes: [article.category], entitySlugs: article.entitySlugs })), skipDuplicates: true }));
      return records;
    });
  }

  async media(query: string, requestedLimit = 3) {
    const cleaned = query.trim().slice(0, 180);
    if (!cleaned) return [];
    const limit = Math.min(Math.max(requestedLimit || 3, 1), 10);
    return this.cached(`wikimedia:${cleaned}:${limit}`, 24 * 60 * 60_000, async () => {
      const params = { action: "query", generator: "search", gsrsearch: cleaned, gsrnamespace: 6, gsrlimit: limit, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: 1000, format: "json", origin: "*" };
      const headers = { "user-agent": process.env.WIKIMEDIA_USER_AGENT || "geoP/1.0 (educational project; configure WIKIMEDIA_USER_AGENT)" };
      const response = await firstValueFrom(this.http.get("https://commons.wikimedia.org/w/api.php", { params, headers }));
      const pages = Object.values(response.data?.query?.pages ?? {}) as Array<Record<string, unknown>>;
      return pages.flatMap((page) => {
        const info = Array.isArray(page.imageinfo) ? page.imageinfo[0] as Record<string, unknown> : undefined;
        if (!info) return [];
        const metadata = info.extmetadata as Record<string, { value?: string }> | undefined;
        return [{
          title: String(page.title ?? "Wikimedia Commons image"),
          imageUrl: String(info.thumburl ?? info.url ?? ""),
          originalUrl: String(info.descriptionurl ?? ""),
          width: Number(info.thumbwidth ?? 0), height: Number(info.thumbheight ?? 0),
          artist: metadata?.Artist?.value?.replace(/<[^>]+>/g, "") ?? null,
          license: metadata?.LicenseShortName?.value ?? null,
          licenseUrl: metadata?.LicenseUrl?.value ?? null,
          credit: metadata?.Credit?.value?.replace(/<[^>]+>/g, "") ?? null,
          provider: "Wikimedia Commons",
        }];
      }).filter((item) => item.imageUrl);
    });
  }

  async conflicts(days = 180) {
    return this.cached("ucdp:candidate", 6 * 60 * 60_000, async () => {
      const response = await firstValueFrom(this.http.get<string>(UCDP_CANDIDATE_URL, { responseType: "text" }));
      const rows = parse(response.data, { columns: true, skip_empty_lines: true, relax_quotes: true }) as UcdpRow[];
      const cutoff = Date.now() - Math.max(days, 1) * 86_400_000;
      const events = rows.filter((row) => new Date(row.date_end).getTime() >= cutoff && !row.side_a.startsWith("XXX") && !row.side_b.startsWith("XXX")).map((row) => ({
        id: row.id, conflictId: row.conflict_new_id || row.conflict_dset_id, name: row.conflict_name,
        dyad: row.dyad_name, sideA: row.side_a, sideB: row.side_b, parties: [row.side_a, row.side_b].filter(Boolean),
        country: row.country, region: row.region, coordinates: { lat: Number(row.latitude), lng: Number(row.longitude) },
        location: row.where_coordinates, dateStart: row.date_start, dateEnd: row.date_end,
        fatalities: { best: Number(row.best || 0), low: Number(row.low || 0), high: Number(row.high || 0), civilians: Number(row.deaths_civilians || 0), sideA: Number(row.deaths_a || 0), sideB: Number(row.deaths_b || 0), unknown: Number(row.deaths_unknown || 0) },
        typeOfViolence: Number(row.type_of_violence), sourceOriginal: row.source_original, sourceArticle: row.source_article,
        confidence: { codeStatus: row.code_status, eventClarity: row.event_clarity, datePrecision: row.date_prec, locationPrecision: row.where_prec },
        provenance: { provider: "UCDP Candidate GED", release: "26.0.6", retrievedAt: new Date().toISOString(), sourceUrl: UCDP_CANDIDATE_URL },
      }));
      await this.persist("conflicts", () => this.db.conflictEvent.createMany({ data: events.map((event) => ({ provider: "UCDP Candidate GED", providerId: event.id, sourceVersion: event.provenance.release, conflictId: event.conflictId, conflictName: event.name, dyadName: event.dyad, sideA: event.sideA, sideB: event.sideB, alliesA: [], alliesB: [], country: event.country, region: event.region, latitude: event.coordinates.lat, longitude: event.coordinates.lng, locationName: event.location, dateStart: new Date(event.dateStart), dateEnd: new Date(event.dateEnd), fatalitiesBest: event.fatalities.best, fatalitiesLow: event.fatalities.low, fatalitiesHigh: event.fatalities.high, civilianDeaths: event.fatalities.civilians, typeOfViolence: event.typeOfViolence, sourceOriginal: event.sourceOriginal, sourceUrl: event.sourceArticle })), skipDuplicates: true }));
      return events;
    });
  }

  async topics() {
    const events = await this.conflicts(365);
    const grouped = new Map<string, typeof events>();
    for (const event of events) grouped.set(event.conflictId || event.name, [...(grouped.get(event.conflictId || event.name) ?? []), event]);
    return [...grouped.entries()].map(([id, rows]) => {
      const latest = rows.reduce((a, b) => new Date(a.dateEnd) > new Date(b.dateEnd) ? a : b);
      const parties = [...new Set(rows.flatMap((row) => row.parties))];
      const fatalities = rows.reduce((sum, row) => sum + row.fatalities.best, 0);
      return {
        slug: `ucdp-${this.slug(id)}`, name: latest.name || latest.dyad, eyebrow: "UCDP organized violence", kind: "Conflict", status: `Latest event ${latest.dateEnd.slice(0, 10)}`,
        region: latest.region, coordinates: { ...latest.coordinates, zoom: 4 }, actorSlugs: parties.map((party) => this.slug(party)),
        actors: parties.map((party) => ({ slug: this.slug(party), name: party, role: "UCDP conflict party" })), themes: ["organized violence"],
        summary: `${rows.length} georeferenced event${rows.length === 1 ? "" : "s"} in the selected period; UCDP best estimate ${fatalities.toLocaleString("en-US")} fatalities. Estimates may be revised.`,
        whyItMatters: "UCDP records organized violence using documented coding rules. Figures are estimates and should be read with their precision fields and source release.",
        disagreements: ["Fatality totals may be uncertain or revised", "Event locations and dates have explicit precision codes"], currentStatus: latest.dateEnd,
        timeline: rows.slice().sort((a, b) => a.dateEnd.localeCompare(b.dateEnd)).slice(-30).map((row) => ({ id: row.id, date: row.dateEnd.slice(0, 10), kind: "Conflict", title: row.location || row.country, detail: `${row.dyad}; best estimate ${row.fatalities.best} fatalities.` })),
        coverage: [], metrics: [{ label: "Events", value: String(rows.length), detail: "UCDP Candidate GED" }, { label: "Best fatality estimate", value: fatalities.toLocaleString("en-US"), detail: "Sum for loaded release and time window" }],
        provenance: latest.provenance,
      };
    }).sort((a, b) => b.timeline.at(-1)!.date.localeCompare(a.timeline.at(-1)!.date));
  }

  async topic(slug: string) {
    const topic = (await this.topics()).find((item) => item.slug === slug);
    if (!topic) throw new NotFoundException(`No source-backed conflict topic found for ${slug}`);
    return topic;
  }

  async economy(code: string, indicator = "NY.GDP.MKTP.CD") {
    return this.cached(`world-bank:${code}:${indicator}`, 24 * 60 * 60_000, async () => {
      const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(code)}/indicator/${encodeURIComponent(indicator)}`;
      const response = await firstValueFrom(this.http.get(url, { params: { format: "json", per_page: 100, mrv: 30 } }));
      const [meta, rows] = response.data ?? [];
      const observations = Array.isArray(rows) ? rows.map((row: Record<string, unknown>) => ({ year: Number(row.date), value: typeof row.value === "number" ? row.value : null, unit: row.unit ? String(row.unit) : null })) : [];
      await this.persist("economy", () => this.db.economicObservation.createMany({ data: observations.map((observation) => ({ provider: "World Bank Indicators API", entityCode: code.toUpperCase(), indicator, indicatorName: String((rows?.[0] as Record<string, unknown> | undefined)?.indicator && ((rows[0] as Record<string, unknown>).indicator as Record<string, unknown>).value || indicator), year: observation.year, value: observation.value, unit: observation.unit })), skipDuplicates: true }));
      return { indicator, entityCode: code.toUpperCase(), observations, provenance: { provider: "World Bank Indicators API", retrievedAt: new Date().toISOString(), sourceUrl: url, providerMetadata: meta } };
    });
  }

  async trade(reporter: string, partner = "0", period = String(new Date().getUTCFullYear() - 1), flow = "X,M") {
    const url = "https://comtradeapi.un.org/public/v1/preview/C/A/HS";
    return this.cached(`un-comtrade:${reporter}:${partner}:${period}:${flow}`, 6 * 60 * 60_000, async () => {
      const response = await firstValueFrom(this.http.get(url, { params: { period, reporterCode: reporter, partnerCode: partner, partner2Code: 0, cmdCode: "TOTAL", flowCode: flow, customsCode: "C00", motCode: 0, maxRecords: 500 }, headers: process.env.UN_COMTRADE_API_KEY ? { "Ocp-Apim-Subscription-Key": process.env.UN_COMTRADE_API_KEY } : undefined }));
      const rows = Array.isArray(response.data?.data) ? response.data.data as Array<Record<string, unknown>> : [];
      const observations = rows.map((row) => ({ reporterCode: String(row.reporterCode ?? reporter), reporter: String(row.reporterDesc ?? reporter), partnerCode: String(row.partnerCode ?? partner), partner: String(row.partnerDesc ?? partner), flowCode: String(row.flowCode ?? flow), flow: String(row.flowDesc ?? flow), commodityCode: String(row.cmdCode ?? "TOTAL"), commodity: String(row.cmdDesc ?? "Total trade"), period: String(row.period ?? period), valueUsd: Number(row.primaryValue ?? 0), netWeightKg: row.netWgt == null ? null : Number(row.netWgt) }));
      await this.persist("trade", () => this.db.tradeObservation.createMany({ data: observations.map((observation) => ({ provider: "UN Comtrade", reporterCode: observation.reporterCode, partnerCode: observation.partnerCode, flowCode: observation.flowCode, commodityCode: observation.commodityCode, period: observation.period, valueUsd: observation.valueUsd, netWeightKg: observation.netWeightKg })), skipDuplicates: true }));
      return { observations, provenance: { provider: "UN Comtrade API", retrievedAt: new Date().toISOString(), sourceUrl: url, period, reporter, partner, flow } };
    });
  }

  async relationship(a: string, b: string) {
    const [entityA, entityB, events] = await Promise.all([this.entity(a), this.entity(b), this.conflicts(365)]);
    const relevant = events.filter((event) => {
      const parties = `${event.sideA} ${event.sideB} ${event.dyad}`.toLowerCase();
      return parties.includes(entityA.name.toLowerCase()) && parties.includes(entityB.name.toLowerCase());
    });
    let tradeSummary = "UN Comtrade did not return a bilateral observation for the requested period.";
    try {
      const trade = await this.trade(entityA.id, entityB.id);
      const total = trade.observations.reduce((sum, observation) => sum + observation.valueUsd, 0);
      if (trade.observations.length) tradeSummary = `${trade.observations.length} UN Comtrade flow records; reported primary value ${total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}.`;
    } catch { tradeSummary = "UN Comtrade is currently unavailable for this pair; no substitute value was generated."; }
    return {
      slugs: [entityA.slug, entityB.slug], status: relevant.length ? "UCDP-recorded conflict relationship in loaded period" : "No direct UCDP event found in loaded period",
      summary: `Source-backed relationship view for ${entityA.name} and ${entityB.name}.`,
      emphasis: ["World Bank country metadata", "UCDP organized-violence events", "UN Comtrade bilateral flows"], trade: tradeSummary,
      developments: relevant.slice(-5).reverse().map((event) => `${event.dateEnd.slice(0, 10)} — ${event.location || event.country}: ${event.dyad}`),
      timeline: relevant.slice().sort((left, right) => left.dateEnd.localeCompare(right.dateEnd)).map((event) => ({ id: event.id, date: event.dateEnd.slice(0, 10), kind: "Conflict", title: event.location || event.country, detail: `${event.dyad}; UCDP best estimate ${event.fatalities.best} fatalities.` })),
    };
  }

  async geography() {
    return this.cached("natural-earth:file", 24 * 60 * 60_000, async () => {
      try { return JSON.parse(await readFile(GEOGRAPHY_FILE, "utf8")); }
      catch { throw new ServiceUnavailableException("Natural Earth layers have not been imported. Run `pnpm data:geography`; no schematic replacement was used."); }
    });
  }

  async search(query: string) {
    const normalized = this.slug(query);
    if (!normalized) return [];
    const [entities, regions, topics] = await Promise.all([this.entities(), this.regions(), this.topics()]);
    return [
      ...entities.filter((item) => this.slug(`${item.name} ${item.officialName} ${item.region}`).includes(normalized)).map((item) => ({ type: "Country", slug: item.slug, name: item.name, meta: `${item.region} · live country record`, href: `/country/${item.slug}` })),
      ...regions.filter((item) => this.slug(`${item.name} ${item.continent}`).includes(normalized)).map((item) => ({ type: "Region", slug: item.slug, name: item.name, meta: `${item.continent} · ${item.entitySlugs.length} entities`, href: `/region/${item.slug}` })),
      ...topics.filter((item) => this.slug(`${item.name} ${item.actors.map((actor) => actor.name).join(" ")}`).includes(normalized)).map((item) => ({ type: "Conflict", slug: item.slug, name: item.name, meta: item.status, href: `/topic/${item.slug}` })),
    ].slice(0, 20);
  }
}
