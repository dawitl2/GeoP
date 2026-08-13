import { CountryExperience } from "@/components/geo/country-experience";
export default async function CountryPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <CountryExperience slug={slug}/>}
