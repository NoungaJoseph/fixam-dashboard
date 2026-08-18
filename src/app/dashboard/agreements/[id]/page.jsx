"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { dashboardService } from "@/services/api"
import { FileText, ArrowLeft, Calendar, User, Download, CheckCircle2, Clock, MapPin, Shield } from "lucide-react"
import { toast } from "sonner"

export default function AgreementDetailPage({ params }) {
  const resolvedParams = use(params)
  const agreementId = resolvedParams.id

  const [agreement, setAgreement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (agreementId) {
      dashboardService.getAgreementDetails(agreementId)
        .then(res => {
          if (res.data?.success) setAgreement(res.data.data)
        })
        .catch(err => {
          toast.error(err.response?.data?.message || "Failed to load agreement details.")
        })
        .finally(() => setLoading(false))
    }
  }, [agreementId])

  if (loading) {
    return <div className="p-8 text-slate-500 font-bold text-xs">Loading contract details...</div>
  }

  if (!agreement) {
    return <div className="p-8 text-rose-500 font-bold text-xs">Agreement not found.</div>
  }

  const terms = agreement.terms || {}
  const client = agreement.client || terms.client || {}
  const provider = agreement.provider || terms.provider || {}
  const schedule = terms.schedule || {}
  const materials = Array.isArray(terms.materialsList) ? terms.materialsList : []
  const clientAcc = agreement.clientAcceptance || { status: 'PENDING' }
  const providerAcc = agreement.providerAcceptance || { status: 'PENDING' }

  const pdfUrl = agreement.pdfReference
    ? (agreement.pdfReference.startsWith('http') ? agreement.pdfReference : `https://api.usefixam.com${agreement.pdfReference}`)
    : `https://api.usefixam.com/api/agreements/${agreement.id}/pdf`

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header Back Link */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/agreements" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Agreements
        </Link>

        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF Contract</span>
        </a>
      </div>

      {/* Case Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Official Contract Document</span>
          <h1 className="text-2xl font-black text-slate-900 font-mono">{agreement.publicAgreementNumber} (v{agreement.version})</h1>
          <p className="text-xs text-slate-500 mt-1">Source: <strong className="text-slate-800">{agreement.sourceType}</strong> • Issued: {new Date(agreement.createdAt).toLocaleString()}</p>
        </div>

        <span className={`px-4 py-1.5 font-bold text-xs rounded-full ${agreement.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          STATUS: {agreement.status}
        </span>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contract Scope & Terms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600" /> Service Scope & Compensation
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
              <p className="font-bold text-slate-900 text-sm">{terms.title || 'Service Title'}</p>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{terms.scopeOfWork || 'Scope as agreed.'}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-teal-50/50 rounded-xl border border-teal-100">
              <div>
                <span className="text-slate-400 block text-[11px] font-bold">Agreed Total</span>
                <span className="font-bold text-teal-700 text-sm">{terms.price ? terms.price.toLocaleString() : '0'} {terms.currency || 'XAF'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-bold">Schedule</span>
                <span className="font-medium text-slate-800">{schedule.date} at {schedule.time}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-bold">Duration / Urgency</span>
                <span className="font-medium text-slate-800">{schedule.duration} ({schedule.urgency})</span>
              </div>
            </div>
          </div>

          {/* Materials Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Materials & Requirements</h3>
            {materials.length > 0 ? (
              <div className="space-y-2">
                {materials.map((m, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-slate-800">• {m.name || m.item} (Qty: {m.quantity || m.qty || 1})</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold rounded text-[11px]">Supplied by: {m.suppliedBy || 'Provider'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No custom materials specified. Standard provider equipment applied.</p>
            )}
          </div>

          {/* Digital Acceptance Audit Records */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" /> Digital Acceptance Audit Log
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Log */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Client Digital Acceptance</span>
                <p className={`font-bold ${clientAcc.status === 'ACCEPTED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {clientAcc.status === 'ACCEPTED' ? '✓ ACCEPTED' : '⏳ PENDING'}
                </p>
                {clientAcc.acceptedAt && <p className="text-slate-500 text-[11px]">Timestamp: {new Date(clientAcc.acceptedAt).toLocaleString()}</p>}
                {clientAcc.ipAddress && <p className="text-slate-400 text-[10px]">IP: {clientAcc.ipAddress}</p>}
              </div>

              {/* Provider Log */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Provider Digital Acceptance</span>
                <p className={`font-bold ${providerAcc.status === 'ACCEPTED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {providerAcc.status === 'ACCEPTED' ? '✓ ACCEPTED' : '⏳ PENDING'}
                </p>
                {providerAcc.acceptedAt && <p className="text-slate-500 text-[11px]">Timestamp: {new Date(providerAcc.acceptedAt).toLocaleString()}</p>}
                {providerAcc.ipAddress && <p className="text-slate-400 text-[10px]">IP: {providerAcc.ipAddress}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Parties Info */}
        <div className="space-y-6 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parties</h3>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Client</span>
              <p className="font-bold text-slate-900">{client.fullName || client.name || 'Client'}</p>
              <p className="text-slate-500 text-[11px]">{client.phone} • {client.email}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Provider</span>
              <p className="font-bold text-slate-900">{provider.fullName || provider.name || 'Provider'}</p>
              <p className="text-slate-500 text-[11px]">{provider.phone} • {provider.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
