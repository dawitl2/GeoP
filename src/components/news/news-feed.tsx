"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { NewsArticle } from "@/types/domain";
import { DetailDrawer } from "@/components/common/detail-drawer";
import { EmptyState } from "@/components/common/states";
import { useMediaSearch } from "@/lib/queries";

export function NewsFeed({ articles, showFilters = true }: { articles: NewsArticle[]; showFilters?: boolean }) {
  const categories = ["Latest", ...new Set(articles.map((article) => article.category))];
  const [filter, setFilter] = useState("Latest");
  const [selected, setSelected] = useState<NewsArticle | null>(null);
  const shown = filter === "Latest" ? articles : articles.filter((article) => article.category === filter);
  return <div>
    {showFilters ? <div className="mb-4 flex gap-2 overflow-x-auto">{categories.map((category) => <button key={category} onClick={() => setFilter(category)} className={`shrink-0 border px-3 py-1.5 text-[9px] ${filter === category ? "border-[var(--accent)]" : "border-white/10 text-[var(--muted)]"}`}>{category}</button>)}</div> : null}
    {!shown.length ? <EmptyState/> : <div className="border-t border-white/10">{shown.map((article, index) => <button key={article.id} onClick={() => setSelected(article)} className="group grid w-full grid-cols-[112px_1fr_auto] gap-4 border-b border-white/10 py-4 text-left max-sm:grid-cols-[88px_1fr_auto]"><NewsThumbnail article={article} enabled={index < 18}/><div className="min-w-0 py-1"><div className="mono text-[8px] uppercase text-[var(--accent)]">{article.category} · {article.publishedAt.slice(0, 10)}</div><h3 className="mt-2 text-sm leading-5 group-hover:text-[var(--accent)]">{article.headline}</h3><div className="mt-2 truncate text-[10px] text-[var(--muted)]">{article.source} · {article.sourceCountry}</div></div><ArrowUpRight size={13} className="mt-2 text-[var(--faint)] group-hover:text-white"/></button>)}</div>}
    {selected ? <NewsDetail article={selected} onClose={() => setSelected(null)}/> : null}
  </div>;
}

function NewsThumbnail({ article, enabled }: { article: NewsArticle; enabled: boolean }) {
  const mediaQuery = article.sourceCountry !== "Global" ? article.sourceCountry : article.headline.split(/\s+/).slice(0, 7).join(" ");
  const { data: media = [] } = useMediaSearch(mediaQuery, enabled && !article.imageUrl);
  const imageUrl = article.imageUrl ?? media[0]?.imageUrl;
  return <div className="relative h-20 overflow-hidden border border-white/10 bg-gradient-to-br from-[#173a43] to-[#0a151a]">{imageUrl ? <Image src={imageUrl} alt="" fill sizes="112px" className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" unoptimized/> : <div className="grid h-full place-items-center"><span className="mono text-[7px] uppercase tracking-[.18em] text-white/35">{article.sourceCountry}</span></div>}</div>;
}

function NewsDetail({ article, onClose }: { article: NewsArticle; onClose: () => void }) {
  const mediaQuery = article.sourceCountry !== "Global" ? article.sourceCountry : article.headline.split(/\s+/).slice(0, 7).join(" ");
  const { data: media = [] } = useMediaSearch(mediaQuery, !article.imageUrl);
  const imageUrl = article.imageUrl ?? media[0]?.imageUrl;
  const imageMeta = media[0];
  return <DetailDrawer title={article.headline} eyebrow={`${article.source} · ${article.sourceCountry}`} onClose={onClose}>
    {imageUrl ? <div className="relative -mx-6 -mt-6 mb-6 h-56 overflow-hidden bg-white/5"><Image src={imageUrl} alt="" fill sizes="420px" className="object-cover" unoptimized/></div> : null}
    <div className="flex flex-wrap gap-2"><span className="border border-white/10 px-2 py-1 text-[9px] text-[var(--accent)]">{article.category}</span><span className="border border-white/10 px-2 py-1 text-[9px] text-[var(--muted)]">{article.publishedAt}</span></div>
    <p className="mt-6 text-sm leading-7 text-[#c4c9c7]">{article.summary}</p>
    {article.originalUrl ? <a href={article.originalUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs text-[var(--accent)]">Open original report <ArrowUpRight size={13}/></a> : null}
    {imageMeta ? <p className="mt-5 text-[9px] leading-4 text-[var(--faint)]">Image enrichment: {imageMeta.provider}{imageMeta.artist ? ` · ${imageMeta.artist}` : ""}{imageMeta.license ? ` · ${imageMeta.license}` : ""}</p> : null}
  </DetailDrawer>;
}
