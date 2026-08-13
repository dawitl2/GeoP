"use client";

import { GeoGlobe } from "@/components/globe/geo-globe";
export function WorldExperience() {
  return (
    <main className="app-main h-screen">
      <div className="relative h-full">
        <GeoGlobe />
        <div className="pointer-events-none absolute left-1/2 top-8 z-[5] -translate-x-1/2 text-center">
          <div className="eyebrow">geoP · World</div>
          <h1 className="mt-2 text-lg font-medium tracking-[-.025em]">
            Rotate the Earth
          </h1>
        </div>
      </div>
    </main>
  );
}
