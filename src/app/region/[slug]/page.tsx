import { RegionalExperience } from "@/components/geo/regional-experience";
export default async function RegionPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <RegionalExperience type="region" slug={slug}/>}
