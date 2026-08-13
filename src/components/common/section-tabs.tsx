"use client";

export function SectionTabs({items,active,onChange}:{items:string[];active:string;onChange:(item:string)=>void}){return <div className="tab-row" role="tablist" aria-label="Content sections">{items.map(item=><button key={item} role="tab" aria-selected={active===item} onClick={()=>onChange(item)} className={`tab-button ${active===item?"active":""}`}>{item}</button>)}</div>}
