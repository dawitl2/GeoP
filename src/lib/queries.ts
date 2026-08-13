import { useQuery } from "@tanstack/react-query";
import { geoService } from "@/services/geo-service";

export const useEntities = () => useQuery({ queryKey: ["entities"], queryFn: geoService.entities, staleTime: Infinity });
export const useEntity = (slug: string) => useQuery({ queryKey: ["entity", slug], queryFn: () => geoService.entity(slug), enabled: Boolean(slug), staleTime: Infinity });
export const useTopics = () => useQuery({ queryKey: ["topics"], queryFn: geoService.topics, staleTime: Infinity });
export const useTopic = (slug: string) => useQuery({ queryKey: ["topic", slug], queryFn: () => geoService.topic(slug), enabled: Boolean(slug), staleTime: Infinity });
export const useRegions = () => useQuery({ queryKey: ["regions"], queryFn: geoService.regions, staleTime: Infinity });
export const useRegion = (slug: string) => useQuery({ queryKey: ["region", slug], queryFn: () => geoService.region(slug), enabled: Boolean(slug), staleTime: Infinity });
export const useNews = () => useQuery({ queryKey: ["news"], queryFn: geoService.news, staleTime: Infinity });
export const useStatements = () => useQuery({ queryKey: ["statements"], queryFn: geoService.statements, staleTime: Infinity });
export const useRelationship = (a: string, b: string) => useQuery({ queryKey: ["relationship", a, b], queryFn: () => geoService.relationship(a,b), staleTime: Infinity });
export const useSearch = (query: string, enabled: boolean) => useQuery({ queryKey: ["search", query], queryFn: () => geoService.search(query), enabled, staleTime: Infinity });
