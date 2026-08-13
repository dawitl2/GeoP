"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, CircleDot, Globe2, Layers3, Newspaper, RadioTower } from "lucide-react";
import { geoService } from "@/services/geo-service";
import { useGeoStore } from "@/store/use-geo-store";
import { useTopics } from "@/lib/queries";

export function SideNavigation() {
  const router = useRouter();
  const setFocus = useGeoStore((state) => state.setFocus);
  const setTopic = useGeoStore((state) => state.setTopic);
  const { data: topics = [] } = useTopics();
  const selectContinent = (slug: string) => {
    const continent = geoService.continents.find((item) => item.slug === slug);
    if (continent) { setFocus(continent.coordinates, "continent"); router.push(`/continent/${slug}`); }
  };
  return <aside className="panel-surface absolute bottom-5 left-5 top-5 z-10 hidden w-60 flex-col overflow-hidden lg:flex">
    <div className="border-b border-white/10 p-4"><div className="eyebrow mb-3">Geographic index</div><Link href="/world" className="flex items-center justify-between py-2 text-sm"><span className="flex items-center gap-3"><Globe2 size={15}/>World</span><ChevronRight size={13} className="text-[var(--faint)]"/></Link></div>
    <div className="border-b border-white/10 p-4"><div className="eyebrow mb-2">Continents</div>{geoService.continents.map((continent) => <button key={continent.slug} onClick={() => selectContinent(continent.slug)} className="flex w-full items-center justify-between py-2 text-left text-xs text-[var(--muted)] hover:text-white"><span>{continent.name}</span><span className="mono text-[8px]">{continent.entityCount}</span></button>)}</div>
    <div className="min-h-0 flex-1 overflow-y-auto p-4"><div className="mb-2 flex items-center justify-between"><span className="eyebrow">Active topics</span><Link href="/discover" aria-label="Discover all topics"><Layers3 size={13}/></Link></div>{topics.slice(0, 5).map((topic) => <button key={topic.slug} onClick={() => { setTopic(topic.slug, topic.actorSlugs, topic.coordinates); router.push(`/topic/${topic.slug}`); }} className="group flex w-full gap-3 border-b border-white/[.06] py-3 text-left"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${topic.kind === "Conflict" ? "bg-[var(--red)]" : topic.kind === "Tension" ? "bg-[var(--amber)]" : "bg-[var(--blue)]"}`}/><span><span className="block text-xs group-hover:text-[var(--accent)]">{topic.name}</span><span className="mono mt-1 block text-[8px] uppercase text-[var(--muted)]">{topic.kind} · {topic.status}</span></span></button>)}</div>
    <div className="grid grid-cols-2 border-t border-white/10"><Link href="/discover" className="flex items-center gap-2 border-r border-white/10 p-3 text-[10px] text-[var(--muted)] hover:text-white"><CircleDot size={13}/>Discover</Link><Link href="/news" className="flex items-center gap-2 p-3 text-[10px] text-[var(--muted)] hover:text-white"><Newspaper size={13}/>News</Link></div>
    <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-[9px] text-[var(--faint)]"><RadioTower size={12}/>Live public-source intelligence</div>
  </aside>;
}
