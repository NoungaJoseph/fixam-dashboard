"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Building2, CalendarDays, Mail, MapPin, Pencil, Users } from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

export default function ExternalJobDetailsPage() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  useEffect(() => { if (id) dashboardService.getExternalJobById(id).then(r => setJob(r.data?.data)).catch(() => toast.error("Could not load this listing")) }, [id])
  if (!job) return <div className="p-8 text-sm text-slate-500 animate-pulse">Loading listing…</div>
  const sections = Array.isArray(job.details) ? job.details.filter(item => item?.content) : []
  return <main className="max-w-6xl p-6 md:p-8 space-y-8">
    <div className="flex items-center justify-between gap-4"><Link href="/dashboard/external-jobs" className="inline-flex items-center gap-2 text-xs font-black text-[#081B3A] hover:text-[#D95E57]"><ArrowLeft className="h-4 w-4" /> Back to listings</Link><Link href={`/dashboard/external-jobs/${job.id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-[#081B3A] px-4 py-2.5 text-xs font-black text-white"><Pencil className="h-4 w-4" /> Edit listing</Link></div>
    <header className="border-b border-[#DCE4EE] pb-7"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#D95E57]">External job listing</p><h1 className="mt-2 text-3xl font-black text-[#081B3A]">{job.title}</h1><p className="mt-2 text-sm text-slate-500">{job.companyName} · {job.category || "General service"}</p></header>
    <section className="grid grid-cols-2 border-y border-[#DCE4EE] md:grid-cols-4">{[[Building2, "Company", job.companyName], [Mail, "Application email", job.destinationEmail], [MapPin, "Location", job.isRemote ? "Remote" : job.location || "Not set"], [CalendarDays, "Expires", job.expiryDate ? new Date(job.expiryDate).toLocaleDateString() : "Not set"]].map(([Icon, label, value], index) => <div key={label} className={`p-5 ${index < 3 ? "border-r border-[#DCE4EE]" : ""}`}><Icon className="h-4 w-4 text-[#D95E57]" /><p className="mt-4 text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 break-all text-sm font-black text-[#081B3A]">{value}</p></div>)}</section>
    <section className="grid gap-8 lg:grid-cols-[1fr_300px]"><div className="space-y-7"><Content title="Job overview" value={job.description} />{job.requirements && !sections.some(s => s.key === "requirements") && <Content title="Requirements" value={job.requirements} />}{sections.filter(s => s.key !== "description").map(section => <Content key={section.key} title={section.label || section.key} value={section.content} />)}</div><aside className="border-t border-[#DCE4EE] pt-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#D95E57]">Listing activity</p><div className="mt-4 flex items-center gap-3"><Users className="h-5 w-5 text-[#D95E57]" /><div><p className="text-2xl font-black text-[#081B3A]">{job.applications?.length || 0}</p><p className="text-xs text-slate-500">Applications received</p></div></div></aside></section>
  </main>
}
function Content({ title, value }) { return <section className="border-t border-[#DCE4EE] pt-4"><h2 className="text-lg font-black text-[#081B3A]">{title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{value}</p></section> }
