"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleDot, MapPin, Users } from "lucide-react";
import { AppHeader } from "@/components/navigation/app-header";
import { GeoGlobe } from "@/components/globe/geo-globe";
import { SectionTabs } from "@/components/common/section-tabs";
import { MetricStrip } from "@/components/common/metric-strip";
import { LoadingState, ErrorState } from "@/components/common/states";
import { SectionTitle } from "@/components/geo/country-experience";
import { Timeline } from "@/components/timeline/timeline";
import { NewsFeed } from "@/components/news/news-feed";
import { StatementList } from "@/components/statements/statement-list";
import { CoverageComparison } from "./coverage-comparison";
import { EconomicChart } from "@/components/charts/economic-chart";
import { TradeChart } from "@/components/charts/trade-chart";
import { useEntities, useNews, useStatements, useTopic } from "@/lib/queries";
import { useGeoStore } from "@/store/use-geo-store";
import { entities as allEntities } from "@/data/mock/catalog";
import type { GeoEntity } from "@/types/domain";

const tabs=["Overview","Actors","Map","History","Timeline","News","Coverage","Statements","Economy","Trade","Sources"];
export function TopicExperience({slug}:{slug:string}){const [active,setActive]=useState("Overview");const {data:topic,isLoading,isError,refetch}=useTopic(slug);const {data:entities=allEntities}=useEntities();const {data:news=[]}=useNews();const {data:statements=[]}=useStatements();const router=useRouter();const setTopic=useGeoStore(s=>s.setTopic);const setRelated=useGeoStore(s=>s.setRelated);useEffect(()=>{if(topic)setTopic(topic.slug,topic.actorSlugs,topic.coordinates)},[topic,setTopic]);if(isLoading)return <Shell><LoadingState/></Shell>;if(isError||!topic)return <Shell><div className="section-pad"><ErrorState retry={()=>refetch()}/></div></Shell>;
  const topicNews=news.filter(n=>n.topicSlug===topic.slug);const topicStatements=statements.filter(s=>s.topicSlug===topic.slug);const actorEntities=topic.actorSlugs.map(s=>entities.find(e=>e.slug===s)).filter((item): item is GeoEntity => Boolean(item));const economy=actorEntities.flatMap(e=>e.economy.slice(0,1)).slice(0,3);const trade=actorEntities[0]?.exports??[];
  const selectActor=(actorSlug:string)=>{const e=entities.find(item=>item.slug===actorSlug);if(e){setRelated([actorSlug]);router.push(`/country/${actorSlug}`)}};
  return <Shell><div className="detail-layout"><div className="detail-map"><GeoGlobe compact controlledTopic={topic.slug} relatedSlugs={topic.actorSlugs}/></div><article className="detail-scroll"><header className="border-b border-white/10 px-[clamp(22px,4vw,60px)] pb-0 pt-10"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${topic.kind==="Conflict"?"bg-[var(--red)]":topic.kind==="Tension"?"bg-[var(--amber)]":"bg-[var(--blue)]"}`}/><span className="eyebrow">{topic.kind} · {topic.status}</span></div><h1 className="mt-5 text-[clamp(2.5rem,5vw,5rem)] font-medium leading-none tracking-[-.06em]">{topic.name}</h1><p className="mt-3 text-sm text-[var(--muted)]">{topic.eyebrow} · {topic.region}</p><div className="mt-8"><SectionTabs items={tabs} active={active} onChange={setActive}/></div></header><div className="section-pad fade-in" key={active}><TopicSection active={active} topic={topic} actorEntities={actorEntities} news={topicNews.length?topicNews:news.slice(0,5)} statements={topicStatements.length?topicStatements:statements.slice(0,4)} economy={economy} trade={trade} onActor={selectActor}/></div></article></div></Shell>;
}
function Shell({children}:{children:React.ReactNode}){return <div className="app-shell"><AppHeader/><main className="app-main">{children}</main></div>}
function TopicSection({active,topic,actorEntities,news,statements,economy,trade,onActor}:{active:string;topic:NonNullable<ReturnType<typeof useTopic>["data"]>;actorEntities:Array<NonNullable<ReturnType<typeof useEntities>["data"]>[number]>;news:ReturnType<typeof useNews>["data"] extends infer T?NonNullable<T>:never;statements:ReturnType<typeof useStatements>["data"] extends infer T?NonNullable<T>:never;economy:NonNullable<ReturnType<typeof useEntities>["data"]>[number]["economy"];trade:NonNullable<ReturnType<typeof useEntities>["data"]>[number]["exports"];onActor:(s:string)=>void}){
  if(active==="Overview")return <><MetricStrip metrics={topic.metrics}/><div className="mt-9 grid gap-10 lg:grid-cols-[1fr_250px]"><div><SectionTitle label="What is it?" title={topic.summary}/><div className="mt-8"><div className="eyebrow">Why it matters</div><p className="mt-3 text-sm leading-7 text-[#b9bfbc]">{topic.whyItMatters}</p></div><div className="mt-8"><div className="eyebrow">Current status</div><p className="mt-3 border-l border-[var(--accent)] pl-4 text-sm leading-7 text-[#d0d4d1]">{topic.currentStatus}</p></div></div><div><div className="eyebrow mb-3">Main disagreements</div>{topic.disagreements.map((d,i)=><div key={d} className="flex gap-3 border-t border-white/10 py-4 text-xs"><span className="mono text-[9px] text-[var(--faint)]">0{i+1}</span>{d}</div>)}</div></div></>;
  if(active==="Actors")return <><SectionTitle label="Actor model" title="States, organizations, and other participants"/><div className="grid gap-px bg-white/10 sm:grid-cols-2">{topic.actors.map(actor=><button key={actor.slug} onClick={()=>onActor(actor.slug)} className="group bg-[#0b0e11] p-5 text-left hover:bg-[#111519]"><Users size={15} className="text-[var(--accent)]"/><h3 className="mt-4 text-sm group-hover:text-[var(--accent)]">{actor.name}</h3><p className="mt-1 text-[10px] text-[var(--muted)]">{actor.role}</p></button>)}</div></>;
  if(active==="Map")return <><SectionTitle label="Spatial view" title="Geography of the topic"/><div className="h-[55vh] min-h-[390px] border border-white/10"><GeoGlobe compact controlledTopic={topic.slug} relatedSlugs={topic.actorSlugs}/></div><p className="mt-3 text-[10px] text-[var(--muted)]">Highlighted entities are connected by illustrative relationship arcs. Unrelated geography is visually reduced.</p></>;
  if(active==="History")return <><SectionTitle label="Structured history" title="How the issue developed"/><Timeline events={topic.timeline} filterable={false}/></>;
  if(active==="Timeline")return <><SectionTitle label="Interactive chronology" title="Filter significant developments"/><Timeline events={topic.timeline}/></>;
  if(active==="News")return <><SectionTitle label="Topic reporting" title={`Reports connected to ${topic.name}`}/><NewsFeed articles={news}/></>;
  if(active==="Coverage")return <><SectionTitle label="Media perspective" title={`How ${topic.name} is being covered`}/><CoverageComparison groups={topic.coverage}/></>;
  if(active==="Statements")return <><SectionTitle label="Official positions" title="Statements by involved actors"/><StatementList statements={statements}/></>;
  if(active==="Economy")return <><SectionTitle label="Economic context" title="Relevant indicators, without implied causality"/><MetricStrip metrics={topic.metrics}/>{economy.length>0&&<div className="mt-7"><EconomicChart series={economy}/></div>}</>;
  if(active==="Trade")return <><SectionTitle label="Trade context" title="Commercial relationships among involved actors"/><TradeChart partners={trade} label="Illustrative partner flows" onSelect={onActor}/></>;
  return <><SectionTitle label="Provenance" title="Sources and methodological boundaries"/><div className="space-y-4"><SourceLine icon={<MapPin size={14}/>} title="Geography" detail="Natural Earth-derived local world geometry; topic connections are illustrative."/><SourceLine icon={<CircleDot size={14}/>} title="Topic context" detail="Fictional structured geoP Level 1 content; no external API calls."/><SourceLine icon={<Users size={14}/>} title="Coverage analysis" detail="Observable mock framing only; no truth, bias, or propaganda labels."/></div></>;
}
function SourceLine({icon,title,detail}:{icon:React.ReactNode;title:string;detail:string}){return <div className="grid gap-3 border-b border-white/10 pb-4 sm:grid-cols-[24px_130px_1fr]"><span className="text-[var(--accent)]">{icon}</span><span className="text-xs">{title}</span><span className="text-xs leading-5 text-[var(--muted)]">{detail}</span></div>}
