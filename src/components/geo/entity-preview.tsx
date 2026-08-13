"use client";

import Link from "next/link";
import { ArrowRight, Building2, MapPin, Users, X } from "lucide-react";
import { useEntity, useTopics } from "@/lib/queries";
import { useGeoStore } from "@/store/use-geo-store";
import { LoadingState } from "@/components/common/states";

export function EntityPreview() {
  const slug=useGeoStore((s)=>s.selectedEntity); const open=useGeoStore((s)=>s.previewOpen); const setOpen=useGeoStore((s)=>s.setPreviewOpen); const setTopic=useGeoStore((s)=>s.setTopic); const {data:entity,isLoading}=useEntity(slug??""); const {data:topics=[]}=useTopics();
  if(!slug||!open)return null;
  return <aside className="panel-surface absolute bottom-5 right-5 top-5 z-20 w-[370px] overflow-y-auto max-lg:left-5 max-lg:right-5 max-lg:top-auto max-lg:w-auto max-lg:max-h-[58vh] max-sm:bottom-0 max-sm:left-0 max-sm:right-0" aria-label="Country preview">
    <button onClick={()=>setOpen(false)} className="absolute right-3 top-3 z-10 p-2 text-[var(--muted)] hover:text-white" aria-label="Close preview"><X size={16}/></button>
    {isLoading||!entity?<LoadingState/>:<div className="fade-in"><div className="border-b border-white/10 p-6"><div className="eyebrow">Country preview</div><h2 className="mt-4 text-3xl font-medium tracking-[-.035em]">{entity.name}</h2><p className="mt-2 text-xs text-[var(--muted)]">{entity.officialName}</p><div className="mt-5 flex items-center gap-2 text-[10px] text-[var(--accent)]"><MapPin size={12}/>{entity.region} · {entity.continent}</div></div>
      <div className="grid grid-cols-3 border-b border-white/10"><Mini icon={<Building2 size={13}/>} label="Capital" value={entity.capital}/><Mini icon={<Users size={13}/>} label="Population" value={entity.population}/><Mini icon={<MapPin size={13}/>} label="Topics" value={String(entity.topicSlugs.length)}/></div>
      <div className="p-6"><p className="text-sm leading-6 text-[#c3c7c5]">{entity.summary}</p><div className="mt-7"><div className="eyebrow mb-2">Active topics</div>{entity.topicSlugs.map((topicSlug)=>{const t=topics.find(item=>item.slug===topicSlug);return t?<button key={t.slug} onClick={()=>setTopic(t.slug,t.actorSlugs,t.coordinates)} className="flex w-full items-center justify-between border-b border-white/[.07] py-3 text-left text-xs hover:text-[var(--accent)]"><span>{t.name}</span><span className="mono text-[8px] uppercase text-[var(--muted)]">{t.kind}</span></button>:null})}</div>
      <Link href={`/country/${entity.slug}`} className="mt-7 flex w-full items-center justify-between bg-[#d8ddd8] px-4 py-3 text-xs font-medium text-[#111415] hover:bg-white"><span>Explore {entity.name}</span><ArrowRight size={14}/></Link></div></div>}
  </aside>;
}
function Mini({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="border-r border-white/10 p-3 last:border-r-0"><div className="flex items-center gap-1.5 text-[var(--faint)]">{icon}<span className="eyebrow text-[8px]">{label}</span></div><div className="mt-2 truncate text-[10px]">{value}</div></div>}
