"use client";

import { X } from "lucide-react";
export function DetailDrawer({title,eyebrow,children,onClose}:{title:string;eyebrow:string;children:React.ReactNode;onClose:()=>void}){return <div className="fixed inset-0 z-[80] bg-black/60" onMouseDown={onClose}><aside className="absolute bottom-0 right-0 top-0 w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#0d1013] p-6 shadow-2xl" onMouseDown={e=>e.stopPropagation()}><button onClick={onClose} className="absolute right-4 top-4 p-2 text-[var(--muted)]" aria-label="Close detail"><X size={17}/></button><div className="eyebrow">{eyebrow}</div><h2 className="mt-5 pr-10 text-2xl leading-tight tracking-[-.03em]">{title}</h2><div className="mt-7">{children}</div></aside></div>}
