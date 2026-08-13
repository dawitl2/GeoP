"use client";

import { useState } from "react";
import { AppHeader } from "@/components/navigation/app-header";
import { GeoGlobe } from "@/components/globe/geo-globe";
import { NewsFeed } from "./news-feed";
import { LoadingState, ErrorState } from "@/components/common/states";
import { useNews, useTopics } from "@/lib/queries";

const regions=["Latest","Africa","Middle East","Europe","Asia","Americas"];
export function GlobalNewsExperience(){const [region,setRegion]=useState("Latest");const [activeTopic,setActiveTopic]=useState<string|undefined>();const {data:news=[],isLoading,isError,refetch}=useNews();const {data:topics=[]}=useTopics();const filtered=region==="Latest"?news:news.filter(n=>n.region===region);const topic=topics.find(t=>t.slug===activeTopic)??topics[0];return <div className="app-shell"><AppHeader/><main className="app-main"><div className="relative h-[40vh] min-h-[330px] border-b border-white/10"><GeoGlobe compact controlledTopic={topic?.slug} relatedSlugs={topic?.actorSlugs}/><div className="absolute bottom-8 left-[clamp(18px,6vw,90px)] z-10"><div className="eyebrow">Global news discovery</div><h1 className="mt-3 text-[clamp(3rem,7vw,6rem)] font-medium tracking-[-.065em]">World brief</h1><p className="mt-2 text-xs text-[var(--muted)]">Fictional prototype reporting · grouped by geography and issue</p></div></div><div className="section-pad"><div className="mb-8 flex gap-2 overflow-x-auto">{regions.map(r=><button key={r} onClick={()=>setRegion(r)} className={`shrink-0 border px-4 py-2 text-[10px] ${region===r?"border-[var(--accent)]":"border-white/10 text-[var(--muted)]"}`}>{r}</button>)}</div>{isLoading?<LoadingState/>:isError?<ErrorState retry={()=>refetch()}/>:<div onMouseOver={(e)=>{const target=(e.target as HTMLElement).closest("button");const headline=target?.querySelector("h3")?.textContent;const article=filtered.find(n=>n.headline===headline);if(article)setActiveTopic(article.topicSlug)}}><NewsFeed articles={filtered}/></div>}</div></main></div>}
