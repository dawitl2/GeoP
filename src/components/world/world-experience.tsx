"use client";

import { GeoGlobe } from "@/components/globe/geo-globe";
import { SideNavigation } from "@/components/navigation/side-navigation";
import { EntityPreview } from "@/components/geo/entity-preview";
import { ActivityPanel } from "./activity-panel";

export function WorldExperience(){return <main className="app-main h-screen"><div className="relative h-full"><GeoGlobe/><SideNavigation/><ActivityPanel/><EntityPreview/><div className="pointer-events-none absolute left-1/2 top-10 z-[5] hidden -translate-x-1/2 text-center md:block"><div className="eyebrow">World view · Geopolitical activity</div><h1 className="mt-2 text-lg font-medium tracking-[-.025em]">Explore a connected world</h1></div><div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-center lg:hidden"><div className="panel-surface px-4 py-2 text-[9px] text-[var(--muted)]">Drag to rotate · Pinch to zoom · Tap a rich-profile country</div></div></div></main>}
