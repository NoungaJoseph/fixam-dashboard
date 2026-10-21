"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BriefcaseBusiness, Send } from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

const sections = ["description", "responsibilities", "requirements", "skills", "benefits", "applicationNotes"]
const labels = { description: "Job overview", responsibilities: "Responsibilities", requirements: "Requirements", skills: "Skills", benefits: "Benefits", applicationNotes: "Application notes" }

export default function NewExternalJobPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: "", companyName: "", destinationEmail: "", expiryDate: "", category: "General Service", location: "Cameroon", salary: "", isRemote: false, selected: { description: true, requirements: true }, content: { description: "", requirements: "" } })
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    const details = sections.filter(key => form.selected[key] && form.content[key]?.trim()).map(key => ({ key, label: labels[key], content: form.content[key].trim() }))
    if (!form.content.description?.trim()) return toast.error("Add a job overview before publishing.")
    try {
      setSaving(true)
      await dashboardService.createExternalJob({ title: form.title.trim(), companyName: form.companyName.trim(), destinationEmail: form.destinationEmail.trim().toLowerCase(), expiryDate: form.expiryDate, category: form.category, location: form.location.trim(), salary: form.salary.trim() || null, isRemote: form.isRemote, description: form.content.description.trim(), requirements: form.content.requirements?.trim() || null, details })
      toast.success("Job listing published")
      router.push("/dashboard/external-jobs")
    } catch (error) { toast.error(error.response?.data?.message || "Could not create listing") } finally { setSaving(false) }
  }
  return <form onSubmit={submit} className="max-w-5xl p-6 md:p-8 space-y-8">
    <Link href="/dashboard/external-jobs" className="inline-flex items-center gap-2 text-xs font-black text-[#081B3A] hover:text-[#D95E57]"><ArrowLeft className="h-4 w-4" /> Back to listings</Link>
    <header className="border-b border-[#DCE4EE] pb-6"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#D95E57]">External opportunities</p><h1 className="mt-2 text-3xl font-black">Create a job listing</h1><p className="mt-2 text-sm text-slate-500">Publish a structured listing that applicants can read clearly.</p></header>
    <section className="grid gap-5 border-b border-[#DCE4EE] pb-7 md:grid-cols-2"><Field label="Job title *"><input required value={form.title} onChange={e => update("title", e.target.value)} placeholder="Senior Electrician" /></Field><Field label="Company name *"><input required value={form.companyName} onChange={e => update("companyName", e.target.value)} placeholder="Company name" /></Field><Field label="Application email *"><input required type="email" value={form.destinationEmail} onChange={e => update("destinationEmail", e.target.value)} placeholder="careers@company.com" /></Field><Field label="Expiry date *"><input required type="date" value={form.expiryDate} onChange={e => update("expiryDate", e.target.value)} /></Field><Field label="Category"><input value={form.category} onChange={e => update("category", e.target.value)} /></Field><Field label="Location"><input value={form.location} onChange={e => update("location", e.target.value)} /></Field><Field label="Salary (optional)"><input value={form.salary} onChange={e => update("salary", e.target.value)} placeholder="e.g. 250,000 XAF" /></Field><label className="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.isRemote} onChange={e => update("isRemote", e.target.checked)} /> Fully remote role</label></section>
    <section className="space-y-5"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#D95E57]">Applicant-facing details</p><h2 className="mt-1 text-xl font-black">Choose what to show</h2></div><div className="grid gap-2 sm:grid-cols-3">{sections.map(key => <label key={key} className="flex gap-2 rounded-xl border border-[#DCE4EE] bg-white px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(form.selected[key])} disabled={key === "description"} onChange={e => update("selected", { ...form.selected, [key]: e.target.checked })} />{labels[key]}{key === "description" ? " *" : ""}</label>)}</div>{sections.filter(key => form.selected[key]).map(key => <Field key={key} label={labels[key] + (key === "description" ? " *" : "")}><textarea required={key === "description"} rows={key === "description" ? 5 : 3} value={form.content[key] || ""} onChange={e => update("content", { ...form.content, [key]: e.target.value })} placeholder="Use a new line for each point when needed." /></Field>)}</section>
    <div className="flex justify-end border-t border-[#DCE4EE] pt-6"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#081B3A] px-5 py-3 text-sm font-black text-white hover:bg-[#102A51]"><Send className="h-4 w-4" />{saving ? "Publishing…" : "Publish listing"}</button></div>
  </form>
}

function Field({ label, children }) { return <label className="block text-sm font-bold text-slate-700"><span className="mb-2 block">{label}</span>{children}</label> }
