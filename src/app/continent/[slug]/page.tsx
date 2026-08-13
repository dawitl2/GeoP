import { RegionalExperience } from "@/components/geo/regional-experience";
export default async function ContinentPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <RegionalExperience type="continent" slug={slug}/>}
