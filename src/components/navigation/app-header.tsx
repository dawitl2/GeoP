"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, Menu, Radio, X } from "lucide-react";
import { SearchPalette } from "./search-palette";
import { useGeoStore } from "@/store/use-geo-store";

const links = [["/world","World"],["/discover","Topics"],["/news","News"]];

export function AppHeader() {
  const pathname = usePathname();
  const mobileNavOpen = useGeoStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useGeoStore((s) => s.setMobileNavOpen);
  return <>
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-white/10 bg-[rgba(8,10,12,.9)] px-4 backdrop-blur-xl md:px-6">
      <Link href="/" className="mr-5 flex min-w-fit items-baseline gap-2" aria-label="geoP home"><span className="text-[21px] font-semibold tracking-[-.05em]">geoP</span><span className="mono hidden text-[8px] text-[var(--muted)] lg:block">GLOBAL INTELLIGENCE</span></Link>
      <nav className="hidden items-center gap-5 border-l border-white/10 pl-5 md:flex" aria-label="Primary navigation">{links.map(([href,label]) => <Link key={href} href={href} className={`text-xs transition-colors ${pathname === href ? "text-white" : "text-[var(--muted)] hover:text-white"}`}>{label}</Link>)}</nav>
      <div className="mx-auto w-full max-w-xl px-3 md:px-8"><SearchPalette /></div>
      <div className="hidden min-w-fit items-center gap-3 md:flex"><div className="flex items-center gap-2 border-l border-white/10 pl-4"><span className="status-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]"/><span className="eyebrow">Demo dataset</span></div><button className="p-2 text-[var(--muted)] hover:text-white" aria-label="Activity status"><Radio size={17}/></button></div>
      <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="p-2 md:hidden" aria-label="Toggle navigation">{mobileNavOpen ? <X size={19}/> : <Menu size={19}/>}</button>
    </header>
    {mobileNavOpen && <div className="fixed inset-x-0 top-14 z-40 border-b border-white/10 bg-[#0c0f12] p-4 md:hidden"><div className="grid grid-cols-3 gap-px bg-white/10">{links.map(([href,label]) => <Link onClick={() => setMobileNavOpen(false)} key={href} href={href} className="bg-[#0c0f12] p-4 text-center text-xs">{label}</Link>)}</div><div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--muted)]"><Globe2 size={13}/> Interactive world prototype · local data</div></div>}
  </>;
}
