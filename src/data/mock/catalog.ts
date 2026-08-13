import type { CoverageGroup, EconomicSeries, GeoEntity, Metric, NewsArticle, Region, Relationship, Statement, TimelineEvent, Topic, TradePartner } from "@/types/domain";

const coords: Record<string, [number, number]> = {
  ethiopia: [40.49, 9.15], egypt: [30.8, 26.82], sudan: [30.22, 15.5], somalia: [46.2, 5.15], eritrea: [39.78, 15.18], kenya: [37.91, 0.02],
  ukraine: [31.17, 48.38], russia: [90, 61], china: [104.2, 35.9], taiwan: [120.96, 23.7], iran: [53.69, 32.43], israel: [34.85, 31.05],
  "united-states": [-98.58, 39.83], "united-kingdom": [-3.44, 55.38], france: [2.21, 46.23], germany: [10.45, 51.17], "saudi-arabia": [45.08, 23.89],
  "united-arab-emirates": [53.85, 23.42], turkey: [35.24, 38.96], india: [78.96, 20.59], japan: [138.25, 36.2], brazil: [-51.93, -14.24], "south-africa": [22.94, -30.56],
};

const profiles: Array<[string, string, string, string, string, string, string, string, string[]]> = [
  ["ethiopia","Ethiopia","Federal Democratic Republic of Ethiopia","Africa","East Africa","Addis Ababa","128.7M","Ethiopian birr","Afaan Oromo, Amharic, Somali, Tigrinya".split(", ")],
  ["egypt","Egypt","Arab Republic of Egypt","Africa","North Africa","Cairo","114.5M","Egyptian pound",["Arabic"]],
  ["sudan","Sudan","Republic of the Sudan","Africa","North-East Africa","Khartoum","49.4M","Sudanese pound",["Arabic","English"]],
  ["somalia","Somalia","Federal Republic of Somalia","Africa","Horn of Africa","Mogadishu","18.4M","Somali shilling",["Somali","Arabic"]],
  ["eritrea","Eritrea","State of Eritrea","Africa","Horn of Africa","Asmara","3.7M","Nakfa",["Tigrinya","Arabic","English"]],
  ["kenya","Kenya","Republic of Kenya","Africa","East Africa","Nairobi","55.1M","Kenyan shilling",["Swahili","English"]],
  ["ukraine","Ukraine","Ukraine","Europe","Eastern Europe","Kyiv","37.7M","Hryvnia",["Ukrainian"]],
  ["russia","Russia","Russian Federation","Europe / Asia","Eastern Europe","Moscow","143.8M","Russian ruble",["Russian"]],
  ["china","China","People's Republic of China","Asia","East Asia","Beijing","1.41B","Renminbi",["Mandarin Chinese"]],
  ["taiwan","Taiwan","Taiwan","Asia","East Asia","Taipei","23.4M","New Taiwan dollar",["Mandarin Chinese"]],
  ["iran","Iran","Islamic Republic of Iran","Asia","Middle East","Tehran","89.2M","Iranian rial",["Persian"]],
  ["israel","Israel","State of Israel","Asia","Middle East","Jerusalem","9.8M","New shekel",["Hebrew","Arabic"]],
  ["united-states","United States","United States of America","Americas","North America","Washington, D.C.","341.8M","US dollar",["English"]],
  ["united-kingdom","United Kingdom","United Kingdom of Great Britain and Northern Ireland","Europe","Northern Europe","London","68.4M","Pound sterling",["English"]],
  ["france","France","French Republic","Europe","Western Europe","Paris","66.5M","Euro",["French"]],
  ["germany","Germany","Federal Republic of Germany","Europe","Central Europe","Berlin","84.5M","Euro",["German"]],
  ["saudi-arabia","Saudi Arabia","Kingdom of Saudi Arabia","Asia","Middle East","Riyadh","36.9M","Saudi riyal",["Arabic"]],
  ["united-arab-emirates","United Arab Emirates","United Arab Emirates","Asia","Middle East","Abu Dhabi","10.7M","UAE dirham",["Arabic"]],
  ["turkey","Türkiye","Republic of Türkiye","Asia / Europe","Anatolia","Ankara","87.5M","Turkish lira",["Turkish"]],
  ["india","India","Republic of India","Asia","South Asia","New Delhi","1.43B","Indian rupee",["Hindi","English"]],
  ["japan","Japan","Japan","Asia","East Asia","Tokyo","123.7M","Japanese yen",["Japanese"]],
  ["brazil","Brazil","Federative Republic of Brazil","Americas","South America","Brasília","211.1M","Brazilian real",["Portuguese"]],
  ["south-africa","South Africa","Republic of South Africa","Africa","Southern Africa","Pretoria","63.2M","South African rand",["Zulu","Xhosa","Afrikaans","English"]],
];

const topicLinks: Record<string, string[]> = {
  ethiopia: ["nile-gerd","horn-of-africa-relations","red-sea-security"], egypt: ["nile-gerd","red-sea-security"], sudan: ["nile-gerd","sudan-conflict","red-sea-security"],
  somalia: ["horn-of-africa-relations","red-sea-security"], eritrea: ["horn-of-africa-relations","red-sea-security"], kenya: ["horn-of-africa-relations"],
  ukraine: ["russia-ukraine"], russia: ["russia-ukraine"], china: ["taiwan-strait"], taiwan: ["taiwan-strait"], iran: ["iran-israel"], israel: ["iran-israel"],
  "united-states": ["russia-ukraine","taiwan-strait","iran-israel"], japan: ["taiwan-strait"], "saudi-arabia": ["red-sea-security"], "united-arab-emirates": ["red-sea-security"],
};

const relationLinks: Record<string, string[]> = {
  ethiopia: ["egypt","sudan","somalia","eritrea","kenya","china","united-states"], egypt: ["ethiopia","sudan","saudi-arabia","united-states"],
  somalia: ["ethiopia","kenya","eritrea"], ukraine: ["russia","united-states","germany","france"], china: ["taiwan","united-states","ethiopia","japan","india"],
  taiwan: ["china","united-states","japan"], iran: ["israel","saudi-arabia","united-states"], israel: ["iran","united-states","egypt"],
};

const chart = (offset: number): EconomicSeries[] => [
  { name: "GDP growth", unit: "%", color: "#68b897", points: [2018,2019,2020,2021,2022,2023,2024,2025].map((year,i) => ({ year, value: Number((3.1 + Math.sin(i + offset) * 2.4).toFixed(1)) })) },
  { name: "Inflation", unit: "%", color: "#d7a65d", points: [2018,2019,2020,2021,2022,2023,2024,2025].map((year,i) => ({ year, value: Number((5.7 + Math.cos(i * .8 + offset) * 3.2 + offset).toFixed(1)) })) },
];
const trade = (seed: number): TradePartner[] => [
  ["china","China"],["united-arab-emirates","United Arab Emirates"],["united-states","United States"],["saudi-arabia","Saudi Arabia"],["india","India"],["germany","European partners"]
].slice(seed % 2, 5 + seed % 2).map(([slug,name],i) => ({ slug, name, value: 6200 - i * 890 + seed * 75, share: 26 - i * 4 }));

export const entities: GeoEntity[] = profiles.map((p, index) => {
  const [slug,name,officialName,continent,region,capital,population,currency,languages] = p;
  const [lng,lat] = coords[slug];
  const topics = topicLinks[slug] ?? [];
  return {
    id: `entity-${index + 1}`, slug, name, officialName, kind: slug === "taiwan" ? "territory" : "country", continent, region, capital, population, currency, languages,
    government: index % 3 === 0 ? "Federal republic" : index % 3 === 1 ? "Unitary republic" : "Parliamentary system",
    coordinates: { lng, lat, zoom: continent === "Europe / Asia" ? 2.2 : 3.2 },
    summary: `${name} is a central actor in ${region}, with regional relationships shaped by security, trade, diplomacy, and domestic priorities.`,
    context: `${name}'s current geopolitical position reflects its location, economic links, institutional memberships, and evolving relations with neighboring and global powers. This prototype presents concise contextual synthesis rather than live reporting.`,
    topicSlugs: topics, relationSlugs: relationLinks[slug] ?? [], memberships: continent.includes("Africa") ? ["African Union","United Nations","Regional institutions"] : ["United Nations","Regional institutions","Multilateral forums"],
    securityIssues: topics.length ? ["Regional stability","Economic resilience","Diplomatic coordination"] : ["Economic security","Regional cooperation"],
    metrics: [{label:"GDP",value:`$${(45 + index * 71.3).toFixed(0)}B`,detail:"2025 demo estimate"},{label:"Growth",value:`${(2.1 + index % 6 * .7).toFixed(1)}%`,detail:"Annual change"},{label:"Population",value:population,detail:"2025 demo estimate"},{label:"Inflation",value:`${(3.4 + index % 7 * 1.8).toFixed(1)}%`,detail:"Annual average"}],
    economy: chart(index / 3), exports: trade(index), imports: trade(index + 1).reverse(), products: { exports: ["Agricultural goods","Manufactured products","Minerals","Services"], imports: ["Machinery","Fuel","Electronics","Chemicals"] }
  };
});

const tl = (prefix: string): TimelineEvent[] => [
  {id:`${prefix}-1`,date:"2011",kind:"Economic",title:"Project and policy phase begins",detail:"A new phase reshapes regional calculations and investment priorities."},
  {id:`${prefix}-2`,date:"2015",kind:"Agreements",title:"Framework principles discussed",detail:"Actors outline areas of cooperation while core differences remain."},
  {id:`${prefix}-3`,date:"2020",kind:"Diplomacy",title:"High-level negotiations intensify",detail:"Regional and international institutions support renewed dialogue."},
  {id:`${prefix}-4`,date:"2023",kind:"Statements",title:"Official positions restated",detail:"Public statements emphasize sovereignty, security, and negotiated outcomes."},
  {id:`${prefix}-5`,date:"2025",kind:"Diplomacy",title:"Technical consultations resume",detail:"Working-level discussions focus on practical coordination mechanisms."},
  {id:`${prefix}-6`,date:"Present",kind:"Conflict",title:"Issue remains active",detail:"No comprehensive settlement; diplomatic channels remain open."},
];
const coverage = (a: string, b: string, c = "Regional"): CoverageGroup[] => [
  {name:"International",volume:86,terms:["negotiations","security","regional"],people:["heads of government","diplomats"],organizations:["United Nations","regional bodies"],themes:["stability","international diplomacy"],framing:"Process, regional risk, and diplomatic movement"},
  {name:a,volume:74,terms:["sovereignty","development","rights"],people:["national officials"],organizations:["foreign ministry"],themes:["national interest","domestic priorities"],framing:"Sovereignty and national development"},
  {name:b,volume:68,terms:["security","rights","agreement"],people:["government ministers"],organizations:["cabinet","regional partners"],themes:["national security","legal position"],framing:"Security implications and negotiated guarantees"},
  {name:c,volume:51,terms:["cooperation","mediation","region"],people:["regional mediators"],organizations:["regional unions"],themes:["coordination","spillover effects"],framing:"Regional effects and mediation"},
];

export const topics: Topic[] = [
  {slug:"nile-gerd",name:"Nile / GERD",eyebrow:"Water · Energy · Diplomacy",kind:"Diplomatic",status:"Ongoing",region:"Nile Basin",coordinates:{lng:34.8,lat:18,zoom:3.1},actorSlugs:["ethiopia","egypt","sudan"],actors:[{slug:"ethiopia",name:"Ethiopia",role:"Primary actor"},{slug:"egypt",name:"Egypt",role:"Primary actor"},{slug:"sudan",name:"Sudan",role:"Affected / participating actor"},{slug:"african-union",name:"African Union",role:"Mediator",coordinates:{lng:38.75,lat:9.03,zoom:3.5}}],themes:["water","energy","diplomacy","regional security","development"],summary:"A long-running regional issue concerning the operation of the Grand Ethiopian Renaissance Dam and management of Nile waters.",whyItMatters:"The issue connects electricity generation, water security, development planning, and regional diplomacy across the eastern Nile basin.",disagreements:["Drought-period coordination","Operational data exchange","Binding dispute mechanisms"],currentStatus:"Technical channels remain active while a comprehensive agreement has not been reached.",timeline:tl("gerd"),coverage:coverage("Ethiopian","Egyptian","Sudanese"),metrics:[{label:"Installed capacity",value:"5.15 GW",detail:"Demo context"},{label:"Basin population",value:"280M+",detail:"Illustrative"},{label:"Actors",value:"3 + AU",detail:"Primary framework"},{label:"Status",value:"Ongoing",detail:"Diplomatic track"}]},
  {slug:"russia-ukraine",name:"Russia–Ukraine",eyebrow:"Armed conflict · Security",kind:"Conflict",status:"Active",region:"Eastern Europe",coordinates:{lng:35,lat:49,zoom:3},actorSlugs:["ukraine","russia","united-states","germany","france"],actors:[{slug:"ukraine",name:"Ukraine",role:"Primary actor"},{slug:"russia",name:"Russia",role:"Primary actor"},{slug:"united-states",name:"United States",role:"Security supporter"},{slug:"nato",name:"NATO",role:"Alliance",coordinates:{lng:4.4,lat:50.8,zoom:3}},{slug:"eu",name:"European Union",role:"Regional organization",coordinates:{lng:4.35,lat:50.85,zoom:3}}],themes:["security","territory","sanctions","energy","humanitarian impact"],summary:"An active interstate conflict with major consequences for European security, energy markets, trade, and international institutions.",whyItMatters:"The conflict affects regional security architecture, global commodity flows, displacement, and relations among major powers.",disagreements:["Territorial control","Security arrangements","Sanctions and accountability"],currentStatus:"Active conflict and parallel diplomatic initiatives continue.",timeline:tl("ru"),coverage:coverage("Ukrainian","Russian","European"),metrics:[{label:"Status",value:"Active",detail:"Conflict"},{label:"Core actors",value:"2",detail:"Plus external actors"},{label:"Coverage",value:"Very high",detail:"Demo index"},{label:"Region",value:"Europe",detail:"Global effects"}]},
  {slug:"taiwan-strait",name:"Taiwan Strait",eyebrow:"Geopolitical tension · Maritime",kind:"Tension",status:"Heightened",region:"East Asia",coordinates:{lng:121,lat:25,zoom:4},actorSlugs:["china","taiwan","united-states","japan"],actors:[{slug:"china",name:"China",role:"Primary actor"},{slug:"taiwan",name:"Taiwan",role:"Primary actor"},{slug:"united-states",name:"United States",role:"External actor"},{slug:"japan",name:"Japan",role:"Regional actor"}],themes:["deterrence","maritime security","trade","technology"],summary:"A strategic cross-strait relationship shaped by political status, military signaling, economic integration, and external partnerships.",whyItMatters:"The strait is central to East Asian security and globally important technology supply chains.",disagreements:["Political status","Military activity","External security relationships"],currentStatus:"Heightened signaling continues alongside deep economic connections.",timeline:tl("ts"),coverage:coverage("Mainland Chinese","Taiwanese","Regional"),metrics:[{label:"Status",value:"Heightened",detail:"Tension"},{label:"Trade route",value:"Global",detail:"High importance"},{label:"Actors",value:"4+",detail:"Core set"},{label:"Coverage",value:"Rising",detail:"Demo trend"}]},
  {slug:"iran-israel",name:"Iran–Israel",eyebrow:"Regional security · Tension",kind:"Conflict",status:"Volatile",region:"Middle East",coordinates:{lng:44,lat:31,zoom:3.2},actorSlugs:["iran","israel","united-states","saudi-arabia"],actors:[{slug:"iran",name:"Iran",role:"Primary actor"},{slug:"israel",name:"Israel",role:"Primary actor"},{slug:"united-states",name:"United States",role:"External actor"},{slug:"saudi-arabia",name:"Saudi Arabia",role:"Regional actor"}],themes:["security","deterrence","regional alliances","nuclear policy"],summary:"A volatile regional rivalry involving direct and indirect security dynamics, diplomacy, and wider alliance structures.",whyItMatters:"Escalation can affect regional security, energy routes, diplomacy, and civilian populations across the Middle East.",disagreements:["Regional security posture","Nuclear policy","Aligned armed groups"],currentStatus:"High tension with active diplomatic efforts to contain escalation.",timeline:tl("ii"),coverage:coverage("Iranian","Israeli","Regional"),metrics:[{label:"Status",value:"Volatile",detail:"Security"},{label:"Actors",value:"4+",detail:"Regional network"},{label:"Risk",value:"Elevated",detail:"Descriptive"},{label:"Region",value:"Middle East",detail:"Wider effects"}]},
  {slug:"sudan-conflict",name:"Sudan Conflict",eyebrow:"Armed conflict · Humanitarian",kind:"Conflict",status:"Active",region:"North-East Africa",coordinates:{lng:30,lat:15,zoom:4},actorSlugs:["sudan","egypt","ethiopia"],actors:[{slug:"sudan",name:"Sudanese government institutions",role:"State actor"},{slug:"armed-groups",name:"Armed groups",role:"Non-state actors",coordinates:{lng:30,lat:15,zoom:4}},{slug:"egypt",name:"Egypt",role:"Neighboring country"},{slug:"ethiopia",name:"Ethiopia",role:"Neighboring country"},{slug:"un",name:"United Nations",role:"International organization",coordinates:{lng:0,lat:0,zoom:1}}],themes:["armed conflict","humanitarian access","displacement","mediation"],summary:"A complex internal armed conflict involving state and non-state actors, with major humanitarian and regional consequences.",whyItMatters:"The conflict affects civilians, neighboring states, Red Sea security, and regional diplomatic capacity.",disagreements:["Political authority","Security sector control","Ceasefire implementation"],currentStatus:"Active conflict with fragmented mediation tracks.",timeline:tl("sc"),coverage:coverage("Sudanese civic","Government-aligned","Regional"),metrics:[{label:"Status",value:"Active",detail:"Conflict"},{label:"Actors",value:"Multiple",detail:"State and non-state"},{label:"Impact",value:"Regional",detail:"Humanitarian"},{label:"Track",value:"Mediation",detail:"Fragmented"}]},
  {slug:"red-sea-security",name:"Red Sea Security",eyebrow:"Maritime · Trade · Security",kind:"Developing",status:"Developing",region:"Red Sea",coordinates:{lng:39,lat:20,zoom:3.2},actorSlugs:["egypt","sudan","eritrea","saudi-arabia","united-arab-emirates","somalia"],actors:[{slug:"egypt",name:"Egypt",role:"Littoral state"},{slug:"sudan",name:"Sudan",role:"Littoral state"},{slug:"eritrea",name:"Eritrea",role:"Littoral state"},{slug:"saudi-arabia",name:"Saudi Arabia",role:"Littoral state"},{slug:"united-arab-emirates",name:"United Arab Emirates",role:"Regional actor"},{slug:"somalia",name:"Somalia",role:"Regional actor"}],themes:["shipping","ports","security","trade routes"],summary:"A regional security topic connecting maritime trade, ports, political instability, and competing strategic interests.",whyItMatters:"The Red Sea links European and Asian trade while bordering multiple active geopolitical theatres.",disagreements:["Maritime security burden","Port access","Regional influence"],currentStatus:"Commercial and security actors are adapting to a changing risk environment.",timeline:tl("rs"),coverage:coverage("Littoral states","Gulf media","African regional"),metrics:[{label:"Trade corridor",value:"Global",detail:"Major route"},{label:"Littoral actors",value:"8+",detail:"Diverse interests"},{label:"Status",value:"Developing",detail:"Security"},{label:"Focus",value:"Shipping",detail:"And ports"}]},
  {slug:"horn-of-africa-relations",name:"Horn of Africa Relations",eyebrow:"Regional relationships",kind:"Diplomatic",status:"Evolving",region:"Horn of Africa",coordinates:{lng:42,lat:8,zoom:3.4},actorSlugs:["ethiopia","somalia","eritrea","kenya","sudan"],actors:[{slug:"ethiopia",name:"Ethiopia",role:"Regional actor"},{slug:"somalia",name:"Somalia",role:"Regional actor"},{slug:"eritrea",name:"Eritrea",role:"Regional actor"},{slug:"kenya",name:"Kenya",role:"Regional actor"},{slug:"sudan",name:"Sudan",role:"Neighboring actor"}],themes:["diplomacy","ports","security","regional trade"],summary:"A broad regional topic spanning bilateral relations, maritime access, security cooperation, trade corridors, and mediation.",whyItMatters:"Dense cross-border relationships make local developments consequential across the wider region.",disagreements:["Access and corridors","Border and security issues","Regional alignment"],currentStatus:"Relations are evolving across several bilateral and multilateral tracks.",timeline:tl("hoa"),coverage:coverage("Ethiopian","Somali","Horn regional"),metrics:[{label:"Core entities",value:"5",detail:"Demo set"},{label:"Status",value:"Evolving",detail:"Diplomatic"},{label:"Topics",value:"7",detail:"Interlinked"},{label:"Region",value:"Horn",detail:"Africa"}]},
];

export const regions: Region[] = [
  ["horn-of-africa","Horn of Africa","Africa",43,8,["ethiopia","somalia","eritrea","sudan"],["horn-of-africa-relations","red-sea-security","nile-gerd"]],
  ["east-africa","East Africa","Africa",37,1,["ethiopia","kenya","somalia"],["horn-of-africa-relations","nile-gerd"]],
  ["north-africa","North Africa","Africa",17,27,["egypt","sudan"],["nile-gerd","sudan-conflict"]],
  ["middle-east","Middle East","Asia",44,29,["iran","israel","saudi-arabia","united-arab-emirates","turkey"],["iran-israel","red-sea-security"]],
  ["red-sea","Red Sea","Africa / Asia",39,20,["egypt","sudan","eritrea","saudi-arabia","somalia"],["red-sea-security","sudan-conflict"]],
  ["east-asia","East Asia","Asia",117,31,["china","taiwan","japan"],["taiwan-strait"]],
  ["eastern-europe","Eastern Europe","Europe",35,51,["ukraine","russia"],["russia-ukraine"]],
  ["european-union","European Union region","Europe",10,50,["france","germany"],["russia-ukraine"]],
  ["sahel","Sahel","Africa",8,15,["sudan"],["sudan-conflict"]],
  ["great-lakes","Great Lakes","Africa",29,-2,["kenya"],["horn-of-africa-relations"]],
  ["south-asia","South Asia","Asia",79,23,["india"],["red-sea-security"]],
].map(([slug,name,continent,lng,lat,entitySlugs,topicSlugs]) => ({slug,name,continent,coordinates:{lng,lat,zoom:3},entitySlugs,topicSlugs,summary:`${name} is presented as an interconnected geopolitical region shaped by cross-border security, trade, diplomacy, and shared infrastructure.`,metrics:[{label:"Entities",value:`${(entitySlugs as string[]).length}`,detail:"Rich demo profiles"},{label:"Topics",value:`${(topicSlugs as string[]).length}`,detail:"Active in prototype"},{label:"Coverage",value:"Regional",detail:"Multi-source framing"},{label:"Dataset",value:"Demo",detail:"Level 1"}]} as Region));

const headlineRows = [
  ["Technical dialogue returns to the regional agenda","Reuters","United Kingdom","Diplomacy","nile-gerd",["ethiopia","egypt","sudan"],"Africa"],
  ["Horn leaders outline a new corridor consultation","Addis Standard","Ethiopia","Diplomacy","horn-of-africa-relations",["ethiopia","somalia"],"Africa"],
  ["Shipping operators reassess Red Sea routing","Al Jazeera","Qatar","Trade","red-sea-security",["egypt","saudi-arabia"],"Middle East"],
  ["Regional mediators renew Sudan ceasefire contacts","BBC","United Kingdom","Conflict","sudan-conflict",["sudan","egypt","ethiopia"],"Africa"],
  ["European partners announce coordinated security package","DW","Germany","Security","russia-ukraine",["ukraine","germany","france"],"Europe"],
  ["Cross-strait trade debate returns to legislative agenda","Nikkei Asia","Japan","Economy","taiwan-strait",["taiwan","china","japan"],"Asia"],
  ["Foreign ministers meet as regional tensions remain elevated","France 24","France","Diplomacy","iran-israel",["iran","israel"],"Middle East"],
  ["African markets track new regional infrastructure plans","The Africa Report","France","Economy","horn-of-africa-relations",["ethiopia","kenya"],"Africa"],
  ["Ports and logistics investment reshapes regional links","The National","UAE","Trade","red-sea-security",["united-arab-emirates","somalia"],"Middle East"],
  ["Energy and agriculture frame latest Nile discussions","Ahram Online","Egypt","Economy","nile-gerd",["egypt","ethiopia","sudan"],"Africa"],
] as const;
export const news: NewsArticle[] = headlineRows.map((r,i) => ({id:`news-${i+1}`,headline:r[0],source:r[1],sourceCountry:r[2],publishedAt:`2026-08-${String(13 - Math.floor(i/2)).padStart(2,"0")} · ${12-i}:2${i}`,category:r[3],topicSlug:r[4],entitySlugs:[...r[5]],region:r[6],summary:`This original demonstration summary shows how geoP will provide concise context, named actors, provenance, and links without reproducing source articles. The item is fictional and exists only to exercise the Level 1 interface.`}));

export const statements: Statement[] = [
  {id:"st-1",actorSlug:"ethiopia",speaker:"Office of the Prime Minister",role:"Prime Minister",organization:"Government of Ethiopia",date:"2026-08-10",topicSlug:"nile-gerd",summary:"Reiterated support for regional development, predictable coordination, and continued technical dialogue.",sourceType:"Official release"},
  {id:"st-2",actorSlug:"egypt",speaker:"Foreign Ministry Spokesperson",role:"Spokesperson",organization:"Ministry of Foreign Affairs",date:"2026-08-09",topicSlug:"nile-gerd",summary:"Emphasized water security, a durable agreement, and clear drought-management provisions.",sourceType:"Briefing"},
  {id:"st-3",actorSlug:"sudan",speaker:"Transitional administration representative",role:"Senior official",organization:"Sudanese public institution",date:"2026-08-07",topicSlug:"sudan-conflict",summary:"Called for humanitarian access, protection of civilians, and a coordinated mediation track.",sourceType:"Address"},
  {id:"st-4",actorSlug:"taiwan",speaker:"Mainland Affairs representative",role:"Senior official",organization:"Public administration",date:"2026-08-06",topicSlug:"taiwan-strait",summary:"Called for stability, practical communication, and the protection of commercial links.",sourceType:"Briefing"},
  {id:"st-5",actorSlug:"ukraine",speaker:"Office of the President",role:"President",organization:"Government of Ukraine",date:"2026-08-04",topicSlug:"russia-ukraine",summary:"Restated security priorities and the importance of coordinated international support.",sourceType:"Official release"},
  {id:"st-6",actorSlug:"iran",speaker:"Foreign Ministry representative",role:"Spokesperson",organization:"Ministry of Foreign Affairs",date:"2026-08-02",topicSlug:"iran-israel",summary:"Outlined the government's regional security position and response to diplomatic initiatives.",sourceType:"Briefing"},
];

export const relationships: Relationship[] = [
  {slugs:["ethiopia","egypt"],status:"Strategic and contested",summary:"A consequential regional relationship shaped by Nile diplomacy, African institutions, trade, and wider security interests.",emphasis:["Nile / GERD","Diplomatic engagement","Regional security"],trade:"Modest bilateral trade with wider regional economic significance.",developments:["Technical consultations resumed","Ministerial contacts continued","Regional mediation remains active"],timeline:tl("et-eg")},
  {slugs:["ethiopia","china"],status:"Broad strategic partnership",summary:"A relationship emphasizing infrastructure, trade, investment, multilateral diplomacy, and long-term development cooperation.",emphasis:["Trade","Infrastructure","Investment","Diplomacy"],trade:"China is presented as a major import partner and infrastructure investor in the demo dataset.",developments:["Investment forum convened","Logistics agreement reviewed","Export access discussed"],timeline:tl("et-cn")},
  {slugs:["ethiopia","somalia"],status:"Interdependent and sensitive",summary:"A neighboring relationship shaped by security, borders, regional organizations, commercial access, and public diplomacy.",emphasis:["Border security","Maritime access","Regional institutions"],trade:"Cross-border commerce is significant but incompletely captured in formal statistics.",developments:["Leaders met regionally","Security contacts continued","Commercial corridor talks opened"],timeline:tl("et-so")},
  {slugs:["china","taiwan"],status:"Deeply connected and contested",summary:"Extensive economic ties coexist with fundamental political disagreement and recurring security tension.",emphasis:["Political status","Trade","Technology","Security"],trade:"Dense cross-strait supply chains remain important to regional production.",developments:["Trade measures reviewed","Maritime activity increased","Dialogue proposals restated"],timeline:tl("cn-tw")},
  {slugs:["russia","ukraine"],status:"Active conflict",summary:"An interstate relationship defined by active war, contested territory, security arrangements, and international diplomacy.",emphasis:["Conflict","Territory","Security","Sanctions"],trade:"Direct commercial ties have contracted sharply in the conflict context.",developments:["Military activity continued","Diplomatic initiatives circulated","Humanitarian access discussed"],timeline:tl("ru-ua")},
];

export const continents = [
  {slug:"africa",name:"Africa",coordinates:{lng:20,lat:3,zoom:2.2},regions:["North Africa","West Africa","East Africa","Central Africa","Southern Africa"],entityCount:"54+"},
  {slug:"asia",name:"Asia",coordinates:{lng:90,lat:28,zoom:1.8},regions:["East Asia","South Asia","Southeast Asia","Central Asia","Middle East"],entityCount:"49+"},
  {slug:"europe",name:"Europe",coordinates:{lng:15,lat:51,zoom:2.6},regions:["Northern Europe","Western Europe","Eastern Europe","Southern Europe"],entityCount:"44+"},
  {slug:"americas",name:"Americas",coordinates:{lng:-80,lat:15,zoom:1.6},regions:["North America","Central America","Caribbean","South America"],entityCount:"35+"},
  {slug:"oceania",name:"Oceania",coordinates:{lng:145,lat:-22,zoom:2},regions:["Australasia","Melanesia","Micronesia","Polynesia"],entityCount:"14+"},
];
