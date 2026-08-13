"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Map as MapLibreMap, type GeoJSONSource, type MapLayerMouseEvent, type MapMouseEvent, type StyleSpecification } from "maplibre-gl";
import { feature } from "topojson-client";
import worldTopology from "world-atlas/countries-110m.json";
import type { FeatureCollection, GeoJsonProperties, Geometry, LineString, MultiLineString, Point } from "geojson";
import { Compass, Info, Minus, Plus, RotateCcw } from "lucide-react";
import { useEntities, useTopics } from "@/lib/queries";
import { useGeoStore, worldFocus } from "@/store/use-geo-store";
import { slugifyCountryName } from "@/lib/text";

type GlobeProps = { compact?: boolean; controlledEntity?: string; controlledTopic?: string; relatedSlugs?: string[]; };
const baseStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "ocean",
      type: "background",
      paint: { "background-color": "#102a33" },
    },
  ],
  sky: {
    "sky-color": "#020507",
    "sky-horizon-blend": 0.2,
    "horizon-color": "#517987",
    "horizon-fog-blend": 0.08,
    "fog-color": "#183943",
    "fog-ground-blend": 0.55,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.86, 6, 0.18],
  },
};

const graticule: FeatureCollection<MultiLineString> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiLineString",
        coordinates: [
          ...[-60, -30, 0, 30, 60].map((lat) =>
            Array.from({ length: 73 }, (_, index) => [-180 + index * 5, lat]),
          ),
          ...[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lng) =>
            Array.from({ length: 33 }, (_, index) => [lng, -80 + index * 5]),
          ),
        ],
      },
    },
  ],
};

function arc(a:[number,number],b:[number,number]) {
  const coords:number[][]=[]; for(let i=0;i<=48;i++){const t=i/48;let lng=a[0]+(b[0]-a[0])*t;if(Math.abs(b[0]-a[0])>180)lng=a[0]+((b[0]>a[0]?b[0]-360:b[0]+360)-a[0])*t;coords.push([lng,a[1]+(b[1]-a[1])*t+Math.sin(Math.PI*t)*8]);} return coords;
}

export function GeoGlobe({ compact=false, controlledEntity, controlledTopic, relatedSlugs }: GlobeProps) {
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<MapLibreMap|null>(null); const [ready,setReady]=useState(false); const [hover,setHover]=useState<string|null>(null); const [coordsReadout,setCoordsReadout]=useState("15°N · 18°E");
  const {data: entities=[]}=useEntities(); const {data: topics=[]}=useTopics();
  const storeFocus=useGeoStore((s)=>s.focus); const storeEntity=useGeoStore((s)=>s.selectedEntity); const storeTopic=useGeoStore((s)=>s.selectedTopic); const storeRelated=useGeoStore((s)=>s.relatedSlugs); const legendOpen=useGeoStore((s)=>s.legendOpen);
  const setEntity=useGeoStore((s)=>s.setEntity); const clearSelection=useGeoStore((s)=>s.clearSelection); const toggleLegend=useGeoStore((s)=>s.toggleLegend);
  const activeEntity=controlledEntity ?? storeEntity; const activeTopic=controlledTopic ?? storeTopic; const activeRelated=relatedSlugs ?? storeRelated; const focus=controlledEntity ? entities.find(e=>e.slug===controlledEntity)?.coordinates ?? storeFocus : controlledTopic ? topics.find(t=>t.slug===controlledTopic)?.coordinates ?? storeFocus : storeFocus;
  const entityByMapName=useMemo(()=>new Map(entities.map((e)=>[slugifyCountryName(e.name),e])),[entities]);

  const countryGeo=useMemo(()=>{const topology=worldTopology as {objects:{countries:unknown}}; const coll=feature(worldTopology as never,topology.objects.countries as never) as unknown as FeatureCollection<Geometry,GeoJsonProperties>; coll.features.forEach((f)=>{const name=String(f.properties?.name??"");const slug=slugifyCountryName(name);f.properties={...f.properties,name,slug,rich:entityByMapName.has(slug)?1:0};});return coll;},[entityByMapName]);
  const updateLayers=useCallback(()=>{const map=mapRef.current;if(!map||!ready||!map.isStyleLoaded()||!map.getLayer("country-selected"))return; const selected=[activeEntity,...activeRelated].filter(Boolean) as string[]; map.setFilter("country-selected",["in",["get","slug"],["literal",selected]]); map.setPaintProperty("country-fill","fill-opacity",activeTopic ? ["case",["in",["get","slug"],["literal",selected]],.9,.28] : ["case",["boolean",["feature-state","hover"],false],.9,["==",["get","rich"],1],.82,.7]);
    const active=topics.find(t=>t.slug===activeTopic); const actorCoords=(active?.actorSlugs??[]).map(slug=>entities.find(e=>e.slug===slug)).filter(Boolean); const lines: FeatureCollection<LineString>={type:"FeatureCollection",features:[]}; if(actorCoords.length>1){for(let i=1;i<actorCoords.length;i++)lines.features.push({type:"Feature",properties:{},geometry:{type:"LineString",coordinates:arc([actorCoords[0]!.coordinates.lng,actorCoords[0]!.coordinates.lat],[actorCoords[i]!.coordinates.lng,actorCoords[i]!.coordinates.lat])}})} (map.getSource("relationships") as GeoJSONSource)?.setData(lines);
    const hotspots:FeatureCollection<Point>={type:"FeatureCollection",features:topics.filter(t=>t.kind==="Conflict"||t.kind==="Tension").map(t=>({type:"Feature",properties:{name:t.name,kind:t.kind},geometry:{type:"Point",coordinates:[t.coordinates.lng,t.coordinates.lat]}}))}; (map.getSource("hotspots") as GeoJSONSource)?.setData(hotspots);
  },[activeEntity,activeRelated,activeTopic,entities,ready,topics]);

  useEffect(()=>{if(!container.current||mapRef.current)return; const map=new MapLibreMap({container:container.current,style:baseStyle,center:[focus.lng,focus.lat],zoom:focus.zoom,attributionControl:{compact:true},dragRotate:true,pitchWithRotate:false}); mapRef.current=map; map.on("style.load",()=>{map.setProjection({type:"globe"});map.addSource("graticule",{type:"geojson",data:graticule});map.addLayer({id:"graticule",type:"line",source:"graticule",paint:{"line-color":"#8eb0b7","line-width":.45,"line-opacity":.16}});map.addSource("countries",{type:"geojson",data:countryGeo,promoteId:"slug"});map.addLayer({id:"country-fill",type:"fill",source:"countries",paint:{"fill-color":["case",["==",["get","rich"],1],"#60796f","#40534f"],"fill-opacity":["case",["==",["get","rich"],1],.82,.7]}});map.addLayer({id:"country-selected",type:"fill",source:"countries",filter:["in",["get","slug"],["literal",[]]],paint:{"fill-color":"#d4e4dc","fill-opacity":.9}});map.addLayer({id:"country-borders",type:"line",source:"countries",paint:{"line-color":"#b5c5c2","line-width":["interpolate",["linear"],["zoom"],1,.5,5,1],"line-opacity":.55}});map.addSource("relationships",{type:"geojson",data:{type:"FeatureCollection",features:[]}});map.addLayer({id:"relationship-glow",type:"line",source:"relationships",paint:{"line-color":"#d6e8e0","line-width":4,"line-opacity":.08}});map.addLayer({id:"relationship-lines",type:"line",source:"relationships",paint:{"line-color":"#d6e8e0","line-width":1.2,"line-dasharray":[2,2],"line-opacity":.8}});map.addSource("hotspots",{type:"geojson",data:{type:"FeatureCollection",features:[]}});map.addLayer({id:"hotspot-pulse",type:"circle",source:"hotspots",paint:{"circle-radius":12,"circle-color":["match",["get","kind"],"Conflict","#b85d59","#c09457"],"circle-opacity":.12,"circle-stroke-width":0}});map.addLayer({id:"hotspots",type:"circle",source:"hotspots",paint:{"circle-radius":4,"circle-color":["match",["get","kind"],"Conflict","#cf7069","#d7a65d"],"circle-stroke-width":1,"circle-stroke-color":"#101417"}});setReady(true);}); map.on("sourcedata",(event)=>{const element=container.current;if(element){element.dataset.lastSource=event.sourceId??"none";element.dataset.sourceLoaded=String(event.isSourceLoaded);}}); map.on("idle",()=>{const element=container.current;if(element){element.dataset.idle="true";if(map.getSource("countries")){element.dataset.sourceFeatures=String(map.querySourceFeatures("countries").length);element.dataset.renderedFeatures=String(map.queryRenderedFeatures({layers:["country-fill"]}).length);}}});
    let hovered:string|null=null; map.on("mousemove","country-fill",(e:MapLayerMouseEvent)=>{const feat=e.features?.[0];if(!feat)return;const slug=String(feat.properties?.slug??"");if(hovered&&hovered!==slug)map.setFeatureState({source:"countries",id:hovered},{hover:false});hovered=slug;map.setFeatureState({source:"countries",id:slug},{hover:true});map.getCanvas().style.cursor="pointer";setHover(slug);});map.on("mouseleave","country-fill",()=>{if(hovered)map.setFeatureState({source:"countries",id:hovered},{hover:false});hovered=null;map.getCanvas().style.cursor="";setHover(null);});map.on("mousemove",(e:MapMouseEvent)=>setCoordsReadout(`${Math.abs(e.lngLat.lat).toFixed(1)}°${e.lngLat.lat>=0?"N":"S"} · ${Math.abs(e.lngLat.lng).toFixed(1)}°${e.lngLat.lng>=0?"E":"W"}`));
    map.on("click","country-fill",(e:MapLayerMouseEvent)=>{const feat=e.features?.[0];if(!feat)return;const slug=String(feat.properties?.slug??"");const entity=entityByMapName.get(slug);if(entity){setEntity(entity.slug,entity.coordinates);}else{const c=e.lngLat;map.flyTo({center:[c.lng,c.lat],zoom:3,duration:1000,essential:true});}}); map.on("click",(e:MapMouseEvent)=>{if(!e.defaultPrevented&&map.queryRenderedFeatures(e.point,{layers:["country-fill"]}).length===0)clearSelection();}); return()=>{map.remove();mapRef.current=null;};
  },[countryGeo,entityByMapName]);
  useEffect(()=>{if(ready) mapRef.current?.flyTo({center:[focus.lng,focus.lat],zoom:focus.zoom,duration:1250,essential:true});},[focus.lng,focus.lat,focus.zoom,ready]); useEffect(updateLayers,[updateLayers]);
  const hoverEntity=entities.find(e=>e.slug===hover); const control=(action:"in"|"out"|"reset")=>{const map=mapRef.current;if(!map)return;if(action==="in")map.zoomIn({duration:500});if(action==="out")map.zoomOut({duration:500});if(action==="reset"){clearSelection();map.flyTo({center:[worldFocus.lng,worldFocus.lat],zoom:worldFocus.zoom,duration:1000});}};
  return <div className="relative h-full min-h-[280px] w-full overflow-hidden bg-[#020507]" aria-label="Interactive rotatable globe showing the world"><div ref={container} className="geo-globe-canvas"/>
    {!ready&&<div className="absolute inset-0 grid place-items-center bg-[#080a0c]"><div className="text-center"><Globe2Icon/><div className="eyebrow mt-3">Rendering world geometry</div></div></div>}
    <div className={`absolute ${compact?"bottom-4 right-4":"bottom-5 right-5"} flex flex-col border border-white/10 bg-[#0c1013]/90`}><button onClick={()=>control("in")} className="border-b border-white/10 p-2.5 hover:bg-white/5" aria-label="Zoom in"><Plus size={15}/></button><button onClick={()=>control("out")} className="border-b border-white/10 p-2.5 hover:bg-white/5" aria-label="Zoom out"><Minus size={15}/></button><button onClick={()=>control("reset")} className="p-2.5 hover:bg-white/5" aria-label="Return to world"><RotateCcw size={14}/></button></div>
    {!compact&&<><button onClick={toggleLegend} className="absolute bottom-5 left-5 flex items-center gap-2 border border-white/10 bg-[#0c1013]/90 px-3 py-2 text-[10px] text-[var(--muted)] lg:left-[280px]"><Info size={12}/>Legend</button>{legendOpen&&<div className="panel-surface absolute bottom-16 left-5 z-20 w-44 p-3 text-[10px] lg:left-[280px]"><div className="eyebrow mb-3">Map language</div>{[["bg-[var(--red)]","Conflict"],["bg-[var(--amber)]","Tension"],["bg-[var(--blue)]","Diplomatic"],["bg-[var(--accent)]","Selected"]].map(([c,l])=><div key={l} className="mb-2 flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${c}`}/>{l}</div>)}<div className="flex items-center gap-2"><span className="h-px w-4 border-t border-dashed border-[var(--accent)]"/>Relationship</div></div>}</>}
    {hover&&<div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 border border-white/10 bg-[#0c1013]/92 px-4 py-2 text-center"><div className="text-xs font-medium">{hoverEntity?.name ?? hover.replaceAll("-"," ").toUpperCase()}</div><div className="mono mt-1 text-[8px] uppercase text-[var(--muted)]">{hoverEntity ? `${hoverEntity.region} · ${hoverEntity.topicSlugs.length} active topics` : "Global entity · Selectable geometry"}</div></div>}
    {!compact&&<><div className="absolute right-5 top-5 flex items-center gap-2 text-[9px] text-[#9eb4b7]"><Compass size={11}/>{coordsReadout}</div><div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 border border-white/10 bg-[#071014]/85 px-4 py-2 text-[10px] text-[#becac8]">Drag the globe to rotate · Scroll to zoom</div></>}
  </div>;
}
function Globe2Icon(){return <div className="mx-auto h-12 w-12 rounded-full border border-[var(--accent)]/50 shadow-[inset_-10px_-4px_20px_rgba(169,200,189,.1)]"/>}
