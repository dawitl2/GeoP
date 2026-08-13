"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, Search, X } from "lucide-react";
import { useSearch } from "@/lib/queries";
import { useGeoStore } from "@/store/use-geo-store";
import { geoService } from "@/services/geo-service";

export function SearchPalette() {
  const [open,setOpen] = useState(false); const [query,setQuery] = useState(""); const [active,setActive] = useState(0); const router = useRouter(); const wrapper = useRef<HTMLDivElement>(null);
  const {data = [],isFetching} = useSearch(query,open); const setEntity = useGeoStore((s) => s.setEntity); const setTopic = useGeoStore((s) => s.setTopic); const setFocus = useGeoStore((s) => s.setFocus);
  useEffect(() => { const close = (e: MouseEvent) => { if (!wrapper.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown",close); return () => document.removeEventListener("mousedown",close); },[]);
  useEffect(() => { setActive(0); },[query]);
  const choose = (index: number) => { const item = data[index]; if (!item) return; if (item.type === "Country") geoService.entity(item.slug).then((entity) => entity && setEntity(item.slug,entity.coordinates)); else if (item.type === "Topic" || item.type === "Conflict") geoService.topic(item.slug).then((topic) => topic && setTopic(item.slug,topic.actorSlugs,topic.coordinates)); else geoService.region(item.slug).then((region) => region && setFocus(region.coordinates,"region")); setOpen(false); setQuery(""); router.push(item.href); };
  return <div className="relative" ref={wrapper}>
    <div className={`flex h-9 items-center border px-3 transition-colors ${open ? "border-white/25 bg-[#111519]" : "border-white/10 bg-white/[.025]"}`}><Search size={14} className="mr-2 text-[var(--muted)]"/><input value={query} onFocus={() => setOpen(true)} onChange={(e) => {setQuery(e.target.value);setOpen(true)}} onKeyDown={(e) => {if(e.key==="ArrowDown"){e.preventDefault();setActive((n)=>Math.min(n+1,data.length-1))}if(e.key==="ArrowUp"){e.preventDefault();setActive((n)=>Math.max(n-1,0))}if(e.key==="Enter"){e.preventDefault();choose(active)}if(e.key==="Escape")setOpen(false)}} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--faint)]" placeholder="Search places, regions, topics…" aria-label="Search geoP" role="combobox" aria-expanded={open}/>{query ? <button onClick={() => setQuery("")} aria-label="Clear search"><X size={13}/></button> : <span className="mono hidden text-[9px] text-[var(--faint)] sm:block">⌘ K</span>}</div>
    {open && <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[70] border border-white/12 bg-[#0e1215] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 px-3 py-2"><span className="eyebrow">{query ? "Search results" : "Explore geoP"}</span><span className="text-[9px] text-[var(--faint)]">↑↓ select · ↵ open</span></div>{isFetching && <div className="h-px animate-pulse bg-[var(--accent)]"/>}<div className="max-h-[55vh] overflow-y-auto p-1">{data.map((item,index) => <button key={`${item.type}-${item.slug}`} onMouseEnter={()=>setActive(index)} onClick={()=>choose(index)} className={`flex w-full items-center gap-3 px-3 py-3 text-left ${active===index?"bg-white/[.07]":"hover:bg-white/[.04]"}`}><span className="mono w-16 text-[8px] uppercase text-[var(--accent)]">{item.type}</span><span className="min-w-0"><span className="block truncate text-xs">{item.name}</span><span className="mt-1 block truncate text-[10px] text-[var(--muted)]">{item.meta}</span></span></button>)}{!isFetching && data.length===0 && <div className="px-4 py-8 text-center text-xs text-[var(--muted)]">No matching countries, regions, or topics.</div>}</div><div className="flex items-center gap-2 border-t border-white/10 px-3 py-2 text-[9px] text-[var(--faint)]"><Command size={10}/> Prototype search · local structured dataset</div></div>}
  </div>;
}
