"use client";

import dynamic from "next/dynamic";
import type { EconomicSeries } from "@/types/domain";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false, loading: () => <div className="h-72 animate-pulse bg-white/[.025]"/> });

export function EconomicChart({ series }: { series: EconomicSeries[] }) {
  const years = series[0]?.points.map((point) => String(point.year)) ?? [];
  return <div className="border border-white/10 bg-white/[.015] p-4"><div className="mb-2 flex items-center justify-between"><div><div className="eyebrow">Economic movement</div><div className="mt-1 text-xs text-[var(--muted)]">World Bank indicator history</div></div><div className="flex gap-3">{series.map((item) => <span key={item.name} className="flex items-center gap-1 text-[9px] text-[var(--muted)]"><i className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }}/>{item.name}</span>)}</div></div><ReactECharts style={{ height: 280 }} option={{ backgroundColor: "transparent", grid: { left: 35, right: 18, top: 34, bottom: 28 }, tooltip: { trigger: "axis", backgroundColor: "#101418", borderColor: "rgba(255,255,255,.12)", textStyle: { color: "#ecece7", fontSize: 10 } }, xAxis: { type: "category", data: years, boundaryGap: false, axisLine: { lineStyle: { color: "rgba(255,255,255,.12)" } }, axisLabel: { color: "#747d82", fontSize: 9 } }, yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(255,255,255,.05)" } }, axisLabel: { color: "#747d82", fontSize: 9 } }, series: series.map((item) => ({ name: item.name, type: "line", smooth: true, showSymbol: false, data: item.points.map((point) => point.value), lineStyle: { color: item.color, width: 1.5 }, areaStyle: { color: item.color, opacity: .04 }, itemStyle: { color: item.color } })) }}/></div>;
}
