"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { useNews, useTopics } from "@/lib/queries";
import { useGeoStore } from "@/store/use-geo-store";

export function ActivityPanel(){const {data:news=[]}=useNews();const {data:topics=[]}=useTopics();const router=useRouter();const setTopic=useGeoStore(s=>s.setTopic);return <div className="panel-surface absolute bottom-5 right-5 z-10 hidden w-72 xl:block"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><span className="eyebrow">Global activity</span><Clock3 size={13} className="text-[var(--muted)]"/></div>{news.slice(0,4).map((item,i)=>{const topic=topics.find(t=>t.slug===item.topicSlug);return <button key={item.id} onClick={()=>{if(topic){setTopic(topic.slug,topic.actorSlugs,topic.coordinates);router.push(`/topic/${topic.slug}`)}}} className="group flex w-full gap-3 border-b border-white/[.07] px-4 py-3 text-left last:border-0"><span className="mono w-9 shrink-0 text-[8px] text-[var(--faint)]">{["12:42","12:21","11:57","11:30"][i]}</span><span className="min-w-0 flex-1"><span className="mono text-[8px] uppercase text-[var(--accent)]">{item.category}</span><span className="mt-1 block truncate text-[10px] text-[var(--muted)]">{topic?.name}</span></span><ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100"/></button>})}</div>}
