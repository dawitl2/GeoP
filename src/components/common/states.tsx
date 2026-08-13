"use client";

import { AlertTriangle, Database, RotateCcw } from "lucide-react";

export function LoadingState({ label = "Assembling geopolitical context" }: { label?: string }) {
  return <div className="flex min-h-52 items-center justify-center"><div className="w-56"><div className="eyebrow mb-3">{label}</div><div className="h-px overflow-hidden bg-white/10"><div className="h-full w-2/3 animate-pulse bg-[var(--accent)]" /></div></div></div>;
}
export function EmptyState({ title = "No matching intelligence", detail = "Adjust the current filter or return to the broader view." }: { title?: string; detail?: string }) {
  return <div className="border border-dashed border-white/15 p-8 text-center"><Database className="mx-auto mb-4 text-[var(--faint)]" size={22}/><h3 className="text-sm">{title}</h3><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">{detail}</p></div>;
}
export function ErrorState({ retry }: { retry?: () => void }) {
  return <div className="border border-[rgba(184,93,89,.35)] bg-[rgba(184,93,89,.06)] p-6"><AlertTriangle size={20} className="text-[var(--red)]"/><h3 className="mt-3 text-sm">The local dataset could not be read.</h3><p className="mt-2 text-xs text-[var(--muted)]">The prototype is designed with API-style failure handling. Try the request again.</p>{retry && <button onClick={retry} className="mt-4 flex items-center gap-2 text-xs text-[var(--accent)]"><RotateCcw size={13}/> Retry</button>}</div>;
}
