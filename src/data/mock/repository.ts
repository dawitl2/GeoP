import { continents, entities, news, regions, relationships, statements, topics } from "./catalog";
import type { GeoEntity, NewsArticle, Region, Relationship, SearchResult, Statement, Topic } from "@/types/domain";

const wait = (ms = 110) => new Promise((resolve) => setTimeout(resolve, ms));
const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const mockRepository = {
  async listEntities(): Promise<GeoEntity[]> { await wait(); return entities; },
  async getEntity(slug: string): Promise<GeoEntity | undefined> { await wait(); return entities.find((item) => item.slug === slug); },
  async listTopics(): Promise<Topic[]> { await wait(); return topics; },
  async getTopic(slug: string): Promise<Topic | undefined> { await wait(); return topics.find((item) => item.slug === slug); },
  async listRegions(): Promise<Region[]> { await wait(); return regions; },
  async getRegion(slug: string): Promise<Region | undefined> { await wait(); return regions.find((item) => item.slug === slug); },
  async listNews(): Promise<NewsArticle[]> { await wait(); return news; },
  async listStatements(): Promise<Statement[]> { await wait(); return statements; },
  async getRelationship(a: string, b: string): Promise<Relationship | undefined> {
    await wait();
    return relationships.find((item) => item.slugs.includes(a) && item.slugs.includes(b));
  },
  async search(query: string): Promise<SearchResult[]> {
    await wait(60);
    const q = normalized(query);
    if (!q) return [
      {type:"Country",slug:"ethiopia",name:"Ethiopia",meta:"East Africa · 3 active topics",href:"/country/ethiopia"},
      {type:"Topic",slug:"nile-gerd",name:"Nile / GERD",meta:"Diplomatic · Ongoing",href:"/topic/nile-gerd"},
      {type:"Region",slug:"horn-of-africa",name:"Horn of Africa",meta:"Africa · 3 active topics",href:"/region/horn-of-africa"},
    ];
    const results: SearchResult[] = [];
    entities.filter((item) => normalized(`${item.name} ${item.officialName} ${item.region}`).includes(q)).forEach((item) => results.push({type:"Country",slug:item.slug,name:item.name,meta:`${item.region} · ${item.topicSlugs.length} active topics`,href:`/country/${item.slug}`}));
    regions.filter((item) => normalized(`${item.name} ${item.continent}`).includes(q) || (q === "nile" && item.name === "North Africa")).forEach((item) => results.push({type:"Region",slug:item.slug,name:item.name,meta:`${item.continent} · ${item.topicSlugs.length} active topics`,href:`/region/${item.slug}`}));
    topics.filter((item) => normalized(`${item.name} ${item.themes.join(" ")} ${item.region}`).includes(q)).forEach((item) => results.push({type:item.kind === "Conflict" ? "Conflict" : "Topic",slug:item.slug,name:item.name,meta:`${item.kind} · ${item.status}`,href:`/topic/${item.slug}`}));
    if (q.includes("nile") && !results.some((item) => item.slug === "nile-basin")) results.push({type:"Region",slug:"north-africa",name:"Nile Basin",meta:"Transboundary region",href:"/region/north-africa"});
    return results.slice(0, 9);
  },
  continents,
};

export type GeoRepository = typeof mockRepository;
