import { RelationshipExperience } from "@/components/relationship/relationship-experience";
export default async function RelationshipPage({params}:{params:Promise<{a:string;b:string}>}){const {a,b}=await params;return <RelationshipExperience a={a} b={b}/>}
