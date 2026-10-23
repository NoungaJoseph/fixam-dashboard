"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { dashboardService } from "@/services/api"
import ApplicationQuestionBuilder from "@/components/ApplicationQuestionBuilder"
import { toast } from "sonner"

const sections = ["description", "responsibilities", "requirements", "skills", "benefits", "applicationNotes"]
const labels = { description: "Job overview", responsibilities: "Responsibilities", requirements: "Requirements", skills: "Skills", benefits: "Benefits", applicationNotes: "Application notes" }
const countries = [["Cameroon", "XAF"], ["Nigeria", "NGN"], ["Ivory Coast", "XOF"], ["Ghana", "GHS"], ["Senegal", "XOF"], ["Kenya", "KES"], ["Uganda", "UGX"], ["Tanzania", "TZS"], ["Rwanda", "RWF"], ["South Africa", "ZAR"], ["Egypt", "EGP"]]

export default function EditExternalJobPage() {
  const { id } = useParams()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({ title: "", companyName: "", destinationEmail: "", expiryDate: "", category: "", country: "Cameroon", currency: "XAF", location: "", salary: "", providersNeeded: 1, isRemote: false, selected: { description: true }, content: { description: "" }, applicationQuestions: [] })

  useEffect(() => {
    if (!id) return
    dashboardService.getExternalJobById(id).then(response => {
      const job = response.data?.data
      const detailItems = Array.isArray(job.details) ? job.details : []
      const content = { description: job.description || "", requirements: job.requirements || "", ...Object.fromEntries(detailItems.map(item => [item.key, item.content || ""])) }
      setForm({
        title: job.title || "", companyName: job.companyName || "", destinationEmail: job.destinationEmail || "",
        expiryDate: job.expiryDate ? new Date(job.expiryDate).toISOString().slice(0, 10) : "", category: job.category || "",
        country: job.country || "Cameroon", currency: job.currency || "XAF", location: job.location || "", salary: job.salary || "", providersNeeded: job.providersNeeded || 1, isRemote: Boolean(job.isRemote),
        selected: { description: true, ...(job.requirements ? { requirements: true } : {}), ...Object.fromEntries(detailItems.map(item => [item.key, true])) },
        content, applicationQuestions: Array.isArray(job.applicationQuestions) ? job.applicationQuestions : [],
      })
      setLoaded(true)
    }).catch(() => toast.error("Could not load this listing"))
  }, [id])

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const submit = async event => {
    event.preventDefault()
    const details = sections.filter(key => form.selected[key] && form.content[key]?.trim()).map(key => ({ key, label: labels[key], content: form.content[key].trim() }))
    if (!form.content.description?.trim()) return toast.error("Add a job overview before saving.")
    try {
      setSaving(true)
      await dashboardService.updateExternalJob(id, {
        title: form.title.trim(), companyName: form.companyName.trim(), destinationEmail: form.destinationEmail.trim().toLowerCase(),
        expiryDate: form.expiryDate, category: form.category, country: form.country, currency: form.currency, location: form.isRemote ? "Remote" : form.location.trim(), salary: form.salary.trim() || null,
        providersNeeded: Number(form.providersNeeded) || 1,
        isRemote: form.isRemote, description: form.content.description.trim(), requirements: form.content.requirements?.trim() || null,
        details, applicationQuestions: form.applicationQuestions,
      })
      toast.success("Listing updated")
      router.push(`/dashboard/external-jobs/${id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update listing")
    } finally { setSaving(false) }
  }

  if (!loaded) return <div className="animate-pulse p-8 text-sm text-slate-500">Loading listing…</div>
  return (
    <form onSubmit={submit} className="max-w-5xl space-y-8 p-6 md:p-8">
      <Link href={`/dashboard/external-jobs/${id}`} className="inline-flex items-center gap-2 text-xs font-black text-[#081B3A] hover:text-[#D95E57]"><ArrowLeft className="h-4 w-4" /> Back to listing</Link>
      <header className="border-b border-[#DCE4EE] pb-6"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#D95E57]">External opportunities</p><h1 className="mt-2 text-3xl font-black">Edit job listing</h1></header>
      <section className="grid gap-5 border-b border-[#DCE4EE] pb-7 md:grid-cols-2">
        <Field label="Job title *"><input required value={form.title} onChange={e => update("title", e.target.value)} /></Field>
        <Field label="Company name *"><input required value={form.companyName} onChange={e => update("companyName", e.target.value)} /></Field>
        <Field label="Application email *"><input required type="email" value={form.destinationEmail} onChange={e => update("destinationEmail", e.target.value)} /></Field>
        <Field label="Expiry date *"><input required type="date" value={form.expiryDate} onChange={e => update("expiryDate", e.target.value)} /></Field>
        <Field label="Providers needed *"><input required type="number" min="1" max="100" value={form.providersNeeded} onChange={e => update("providersNeeded", e.target.value)} placeholder="1" /></Field>
        <Field label="Category"><input value={form.category} onChange={e => update("category", e.target.value)} /></Field>
        <Field label="Country *"><select required value={form.country} onChange={e => { const selected = countries.find(([name]) => name === e.target.value); setForm(previous => ({ ...previous, country: e.target.value, currency: selected?.[1] || "XAF" })) }}>{countries.map(([name, currency]) => <option key={name} value={name}>{name} ({currency})</option>)}</select></Field>
        <Field label="Currency"><input value={form.currency} readOnly /></Field>
        <Field label="Location"><input required={!form.isRemote} disabled={form.isRemote} value={form.isRemote ? "Remote" : form.location} onChange={e => update("location", e.target.value)} /></Field>
        <Field label={`Salary (${form.currency})`}><input value={form.salary} onChange={e => update("salary", e.target.value)} /></Field>
        <label className="flex items-end gap-2 pb-2 text-sm font-semibold"><input type="checkbox" checked={form.isRemote} onChange={e => update("isRemote", e.target.checked)} /> Remote — visible in all supported countries</label>
      </section>
      <section className="space-y-5">
        <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#D95E57]">Applicant-facing details</p><h2 className="mt-1 text-xl font-black">Choose what to show</h2></div>
        <div className="grid gap-2 sm:grid-cols-3">{sections.map(key => <label key={key} className="flex gap-2 rounded-xl border border-[#DCE4EE] bg-white px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(form.selected[key])} disabled={key === "description"} onChange={e => update("selected", { ...form.selected, [key]: e.target.checked })} />{labels[key]}{key === "description" ? " *" : ""}</label>)}</div>
        {sections.filter(key => form.selected[key]).map(key => <Field key={key} label={`${labels[key]}${key === "description" ? " *" : ""}`}><textarea required={key === "description"} rows={key === "description" ? 5 : 3} value={form.content[key] || ""} onChange={e => update("content", { ...form.content, [key]: e.target.value })} placeholder="Use a new line for each point when needed." /></Field>)}
      </section>
      <ApplicationQuestionBuilder value={form.applicationQuestions} onChange={applicationQuestions => update("applicationQuestions", applicationQuestions)} />
      <div className="flex justify-end border-t border-[#DCE4EE] pt-6"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#081B3A] px-5 py-3 text-sm font-black text-white"><Save className="h-4 w-4" />{saving ? "Saving…" : "Save changes"}</button></div>
    </form>
  )
}

function Field({ label, children }) {
  return <label className="block text-sm font-bold text-slate-700"><span className="mb-2 block">{label}</span>{children}</label>
}
