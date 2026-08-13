"use client";
import { ErrorState } from "@/components/common/states";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="min-h-screen bg-[#080a0c] p-8 text-white"><ErrorState retry={reset}/></div>}
