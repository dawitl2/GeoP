"use client";

import { useState } from "react";
import type { CoverageGroup } from "@/types/domain";

export function CoverageComparison({ groups }: { groups: CoverageGroup[] }) {
  const [active, setActive] = useState(groups[0]?.name ?? "");
  const group = groups.find((item) => item.name === active) ?? groups[0];
  if (!group) return null;
  return <div><div className="mb-5 flex gap-2 overflow-x-auto">{groups.map((item) => <button key={item.name} onClick={() => setActive(item.name)} className={`shrink-0 border px-3 py-2 text-[9px] ${active === item.name ? "border-[var(--accent)] bg-white/[.05]" : "border-white/10 text-[var(--muted)]"}`}>{item.name}</button>)}</div><div className="grid gap-px bg-white/10 lg:grid-cols-[1.15fr_1fr]"><div className="bg-[#0b0e11] p-6"><div className="eyebrow">Observable framing</div><h3 className="mt-3 text-xl">{group.name} coverage</h3><p className="mt-4 text-sm leading-6 text-[#b9bfbc]">{group.framing}</p><div className="mt-7"><div className="flex items-center justify-between text-[10px]"><span className="text-[var(--muted)]">Relative coverage volume</span><span className="mono">{group.volume}/100</span></div><div className="mt-2 h-1 bg-white/10"><div className="h-full bg-[var(--blue)]" style={{ width: `${group.volume}%` }}/></div></div></div><div className="grid gap-px bg-white/10 sm:grid-cols-2"><CoverageList label="Common terms" items={group.terms}/><CoverageList label="Themes emphasized" items={group.themes}/><CoverageList label="Frequent people" items={group.people}/><CoverageList label="Organizations" items={group.organizations}/></div></div><p className="mt-4 border-l border-white/15 pl-4 text-[10px] leading-5 text-[var(--muted)]">Comparison describes observable emphasis in the available source corpus. It does not rate truthfulness, bias, or propaganda.</p></div>;
}

function CoverageList({ label, items }: { label: string; items: string[] }) {
  return <div className="bg-[#0d1013] p-4"><div className="eyebrow mb-3">{label}</div><div className="flex flex-wrap gap-2">{items.map((item) => <span key={item} className="border border-white/10 px-2 py-1 text-[9px] text-[#bcc2bf]">{item}</span>)}</div></div>;
}
