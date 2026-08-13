import { create } from "zustand";
import type { Coordinates } from "@/types/domain";

type MapMode = "world" | "continent" | "region" | "entity" | "topic" | "news";
interface GeoState {
  selectedEntity: string | null;
  selectedTopic: string | null;
  mapMode: MapMode;
  focus: Coordinates;
  relatedSlugs: string[];
  previewOpen: boolean;
  mobileNavOpen: boolean;
  legendOpen: boolean;
  selectedTimeRange: string;
  setEntity: (slug: string | null, focus?: Coordinates) => void;
  setTopic: (slug: string | null, actors?: string[], focus?: Coordinates) => void;
  setFocus: (focus: Coordinates, mode?: MapMode) => void;
  clearSelection: () => void;
  setRelated: (slugs: string[]) => void;
  setPreviewOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleLegend: () => void;
  setTimeRange: (range: string) => void;
}

export const worldFocus: Coordinates = { lng: 18, lat: 15, zoom: 1.05 };

export const useGeoStore = create<GeoState>((set) => ({
  selectedEntity: null, selectedTopic: null, mapMode: "world", focus: worldFocus, relatedSlugs: [], previewOpen: false, mobileNavOpen: false, legendOpen: false, selectedTimeRange: "7 days",
  setEntity: (slug, focus) => set({ selectedEntity: slug, selectedTopic: null, mapMode: slug ? "entity" : "world", previewOpen: Boolean(slug), relatedSlugs: slug ? [slug] : [], ...(focus ? {focus} : {}) }),
  setTopic: (slug, actors = [], focus) => set({ selectedTopic: slug, selectedEntity: null, mapMode: slug ? "topic" : "world", previewOpen: false, relatedSlugs: actors, ...(focus ? {focus} : {}) }),
  setFocus: (focus, mapMode = "world") => set({ focus, mapMode, selectedEntity: null, selectedTopic: null, previewOpen: false, relatedSlugs: [] }),
  clearSelection: () => set({ selectedEntity: null, selectedTopic: null, mapMode: "world", focus: worldFocus, previewOpen: false, relatedSlugs: [] }),
  setRelated: (relatedSlugs) => set({ relatedSlugs }), setPreviewOpen: (previewOpen) => set({previewOpen}), setMobileNavOpen: (mobileNavOpen) => set({mobileNavOpen}),
  toggleLegend: () => set((state) => ({legendOpen: !state.legendOpen})), setTimeRange: (selectedTimeRange) => set({selectedTimeRange}),
}));
