-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('NEWS', 'CONFLICT', 'ECONOMY', 'TRADE', 'GEOGRAPHY', 'CONTEXT', 'OFFICIAL', 'DISASTER');

-- CreateEnum
CREATE TYPE "GeoEntityType" AS ENUM ('SOVEREIGN_STATE', 'PARTIALLY_RECOGNIZED_STATE', 'DE_FACTO_STATE', 'DEPENDENCY', 'TERRITORY', 'DISPUTED_TERRITORY', 'SPECIAL_REGION', 'AUTONOMOUS_REGION', 'ORGANIZATION', 'ARMED_GROUP', 'OTHER');

-- CreateTable
CREATE TABLE "DataSource" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "license" TEXT,
    "version" TEXT,
    "requiresKey" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSuccess" TIMESTAMP(3),
    "lastFailure" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoEntity" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "entityType" "GeoEntityType" NOT NULL,
    "isoAlpha2" TEXT,
    "isoAlpha3" TEXT,
    "wikidataId" TEXT,
    "continent" TEXT,
    "region" TEXT,
    "subregion" TEXT,
    "capital" TEXT,
    "population" BIGINT,
    "currencies" JSONB,
    "languages" JSONB,
    "aliases" TEXT[],
    "centroidLng" DOUBLE PRECISION,
    "centroidLat" DOUBLE PRECISION,
    "geometry" JSONB,
    "recognitionInfo" JSONB,
    "boundarySource" TEXT,
    "sourceRefs" JSONB,
    "retrievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sourceName" TEXT,
    "sourceDomain" TEXT NOT NULL,
    "sourceCountry" TEXT,
    "language" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "themes" TEXT[],
    "entitySlugs" TEXT[],
    "locations" JSONB,
    "raw" JSONB,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConflictEvent" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,
    "conflictId" TEXT,
    "conflictName" TEXT NOT NULL,
    "dyadName" TEXT,
    "sideA" TEXT,
    "sideB" TEXT,
    "alliesA" TEXT[],
    "alliesB" TEXT[],
    "country" TEXT,
    "region" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" TEXT,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3) NOT NULL,
    "fatalitiesBest" INTEGER,
    "fatalitiesLow" INTEGER,
    "fatalitiesHigh" INTEGER,
    "civilianDeaths" INTEGER,
    "typeOfViolence" INTEGER,
    "sourceOriginal" TEXT,
    "sourceUrl" TEXT,
    "raw" JSONB,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConflictEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicObservation" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "entityCode" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "indicatorName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "sourceNote" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EconomicObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeObservation" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "reporterCode" TEXT NOT NULL,
    "partnerCode" TEXT NOT NULL,
    "flowCode" TEXT NOT NULL,
    "commodityCode" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "valueUsd" DECIMAL(20,2),
    "netWeightKg" DECIMAL(20,3),
    "raw" JSONB,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoFeature" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "featureType" TEXT NOT NULL,
    "name" TEXT,
    "nameEnglish" TEXT,
    "scaleRank" INTEGER,
    "minZoom" DOUBLE PRECISION,
    "geometry" JSONB NOT NULL,
    "properties" JSONB,
    "sourceVersion" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActorDesignation" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "designatedBy" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "legalBasis" TEXT,
    "effectiveAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "sourceUrl" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActorDesignation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "writeCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "cursor" TEXT,
    "metadata" JSONB,
    "error" TEXT,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_slug_key" ON "DataSource"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GeoEntity_slug_key" ON "GeoEntity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GeoEntity_isoAlpha2_key" ON "GeoEntity"("isoAlpha2");

-- CreateIndex
CREATE UNIQUE INDEX "GeoEntity_isoAlpha3_key" ON "GeoEntity"("isoAlpha3");

-- CreateIndex
CREATE UNIQUE INDEX "GeoEntity_wikidataId_key" ON "GeoEntity"("wikidataId");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "NewsArticle_sourceDomain_idx" ON "NewsArticle"("sourceDomain");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_provider_providerId_key" ON "NewsArticle"("provider", "providerId");

-- CreateIndex
CREATE INDEX "ConflictEvent_dateEnd_idx" ON "ConflictEvent"("dateEnd" DESC);

-- CreateIndex
CREATE INDEX "ConflictEvent_longitude_latitude_idx" ON "ConflictEvent"("longitude", "latitude");

-- CreateIndex
CREATE UNIQUE INDEX "ConflictEvent_provider_providerId_sourceVersion_key" ON "ConflictEvent"("provider", "providerId", "sourceVersion");

-- CreateIndex
CREATE INDEX "EconomicObservation_entityCode_indicator_year_idx" ON "EconomicObservation"("entityCode", "indicator", "year" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "EconomicObservation_provider_entityCode_indicator_year_key" ON "EconomicObservation"("provider", "entityCode", "indicator", "year");

-- CreateIndex
CREATE UNIQUE INDEX "TradeObservation_provider_reporterCode_partnerCode_flowCode_key" ON "TradeObservation"("provider", "reporterCode", "partnerCode", "flowCode", "commodityCode", "period");

-- CreateIndex
CREATE INDEX "GeoFeature_featureType_scaleRank_idx" ON "GeoFeature"("featureType", "scaleRank");

-- CreateIndex
CREATE UNIQUE INDEX "GeoFeature_provider_providerId_sourceVersion_key" ON "GeoFeature"("provider", "providerId", "sourceVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ActorDesignation_actorId_designatedBy_designation_sourceUrl_key" ON "ActorDesignation"("actorId", "designatedBy", "designation", "sourceUrl");

-- CreateIndex
CREATE INDEX "IngestionRun_sourceId_startedAt_idx" ON "IngestionRun"("sourceId", "startedAt" DESC);

-- AddForeignKey
ALTER TABLE "ActorDesignation" ADD CONSTRAINT "ActorDesignation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "GeoEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionRun" ADD CONSTRAINT "IngestionRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
