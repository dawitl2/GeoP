import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { IntelligenceService } from "./intelligence.service";

@ApiTags("intelligence")
@Controller()
export class IntelligenceController {
  constructor(private readonly intelligence: IntelligenceService) {}

  @Get("health")
  @ApiOperation({ summary: "Provider and persistence status" })
  health() { return this.intelligence.health(); }

  @Get("sources")
  sources() { return this.intelligence.sources(); }

  @Get("entities")
  entities() { return this.intelligence.entities(); }

  @Get("entities/:slug")
  entity(@Param("slug") slug: string) { return this.intelligence.entity(slug); }

  @Get("regions")
  regions() { return this.intelligence.regions(); }

  @Get("regions/:slug")
  region(@Param("slug") slug: string) { return this.intelligence.region(slug); }

  @Get("news")
  news(@Query("query") query?: string, @Query("limit") limit?: string) {
    return this.intelligence.news(query, Number(limit ?? 100));
  }

  @Get("media/search")
  media(@Query("q") query = "", @Query("limit") limit?: string) {
    return this.intelligence.media(query, Number(limit ?? 3));
  }

  @Get("conflicts")
  conflicts(@Query("days") days?: string) { return this.intelligence.conflicts(Number(days ?? 180)); }

  @Get("topics")
  topics() { return this.intelligence.topics(); }

  @Get("topics/:slug")
  topic(@Param("slug") slug: string) { return this.intelligence.topic(slug); }

  @Get("economy/:code")
  economy(@Param("code") code: string, @Query("indicator") indicator?: string) {
    return this.intelligence.economy(code, indicator);
  }

  @Get("trade/:reporter")
  trade(@Param("reporter") reporter: string, @Query("partner") partner?: string, @Query("period") period?: string, @Query("flow") flow?: string) {
    return this.intelligence.trade(reporter, partner, period, flow);
  }

  @Get("relationships/:a/:b")
  relationship(@Param("a") a: string, @Param("b") b: string) {
    return this.intelligence.relationship(a, b);
  }

  @Get("map/geography")
  geography() { return this.intelligence.geography(); }

  @Get("statements")
  statements() { return []; }

  @Get("search")
  search(@Query("q") query = "") { return this.intelligence.search(query); }
}
