import { mockRepository, type GeoRepository } from "@/data/mock/repository";

// Swap this single binding for a NestJS-backed repository in the next phase.
const repository: GeoRepository = mockRepository;

export const geoService = {
  entities: () => repository.listEntities(),
  entity: (slug: string) => repository.getEntity(slug),
  topics: () => repository.listTopics(),
  topic: (slug: string) => repository.getTopic(slug),
  regions: () => repository.listRegions(),
  region: (slug: string) => repository.getRegion(slug),
  news: () => repository.listNews(),
  statements: () => repository.listStatements(),
  relationship: (a: string, b: string) => repository.getRelationship(a, b),
  search: (query: string) => repository.search(query),
  continents: repository.continents,
};
