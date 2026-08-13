import { TopicExperience } from "@/components/topics/topic-experience";
export default async function TopicPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <TopicExperience slug={slug}/>}
