"use client";

import { useState } from "react";
import type { Statement } from "@/types/domain";
import { DetailDrawer } from "@/components/common/detail-drawer";

export function StatementList({ statements }: { statements: Statement[] }) {
  const [selected, setSelected] = useState<Statement | null>(null);
  return <div className="grid gap-px bg-white/10 sm:grid-cols-2">{statements.map((statement) => <button key={statement.id} onClick={() => setSelected(statement)} className="bg-[#0b0e11] p-5 text-left hover:bg-[#111519]"><div className="flex items-center justify-between"><span className="eyebrow text-[var(--accent)]">{statement.sourceType}</span><span className="mono text-[8px] text-[var(--faint)]">{statement.date}</span></div><h3 className="mt-4 text-sm">{statement.speaker}</h3><p className="mt-1 text-[10px] text-[var(--muted)]">{statement.role} · {statement.organization}</p><p className="mt-4 line-clamp-3 text-xs leading-5 text-[#aeb4b2]">{statement.summary}</p></button>)}
    {selected && <DetailDrawer title={selected.speaker} eyebrow={`${selected.sourceType} · ${selected.date}`} onClose={() => setSelected(null)}><div className="text-xs text-[var(--muted)]">{selected.role}<br/>{selected.organization}</div><blockquote className="mt-7 border-l border-[var(--blue)] pl-5 text-base leading-7 text-[#d6d9d5]">{selected.summary}</blockquote><div className="mt-7 text-[10px] text-[var(--faint)]">Public-source statement summary</div></DetailDrawer>}
  </div>;
}
