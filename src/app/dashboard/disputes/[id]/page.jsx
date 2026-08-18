"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { dashboardService } from "@/services/api"
import { ShieldAlert, ArrowLeft, Calendar, User, FileText, CheckCircle2, AlertTriangle, Clock, Send } from "lucide-react"
import { toast } from "sonner"

export default function DisputeDetailPage({ params }) {
  const resolvedParams = use(params)
  const disputeId = resolvedParams.id

  const [dispute, setDispute] = useState(null)
  const [loading, setLoading] = useState(true)

  // Modals
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false)
  const [resolutionOutcome, setResolutionOutcome] = useState("CORRECTION_REQUIRED")
  const [resolutionReason, setResolutionReason] = useState("")
  const [requestTarget, setRequestTarget] = useState("PROVIDER")
  const [requestNote, setRequestNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchDisputeDetails = async () => {
    try {
      setLoading(true)
      const res = await dashboardService.getDisputeDetails(disputeId)
      if (res.data?.success) {
        setDispute(res.data.data)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load dispute details.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (disputeId) fetchDisputeDetails()
  }, [disputeId])

  const handleResolve = async (e) => {
    e.preventDefault()
    if (!resolutionReason.trim()) {
      toast.error("Please enter a resolution reason.")
      return
    }

    setSubmitting(true)
    try {
      const res = await dashboardService.resolveDispute(disputeId, {
        resolution: resolutionOutcome,
        resolutionReason: resolutionReason.trim()
      })

      if (res.data?.success) {
        toast.success("Dispute resolved successfully.")
        setResolveModalOpen(false)
        fetchDisputeDetails()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve dispute.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestEvidence = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await dashboardService.requestDisputeEvidence(disputeId, {
        targetRole: requestTarget,
        note: requestNote.trim()
      })

      if (res.data?.success) {
        toast.success("Evidence request sent.")
        setEvidenceModalOpen(false)
        fetchDisputeDetails()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request evidence.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-bold text-xs">Loading case file...</div>
  }

  if (!dispute) {
    return <div className="p-8 text-rose-500 font-bold text-xs">Dispute not found.</div>
  }

  const booking = dispute.booking || {}
  const client = dispute.client || {}
  const provider = dispute.provider || {}
  const clientEvidence = Array.isArray(dispute.clientEvidence) ? dispute.clientEvidence : []
  const providerEvidence = Array.isArray(dispute.providerEvidence) ? dispute.providerEvidence : []
  const events = Array.isArray(dispute.events) ? dispute.events : []

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/disputes" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Disputes List
        </Link>

        {dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED' && (
          <div className="flex gap-3">
            <button
              onClick={() => setEvidenceModalOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              Request Evidence
            </button>
            <button
              onClick={() => setResolveModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
            >
              Resolve Dispute
            </button>
          </div>
        )}
      </div>

      {/* Case Overview Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Case File</span>
          <h1 className="text-2xl font-black text-slate-900">DSP-{dispute.id.substring(0, 8).toUpperCase()}</h1>
          <p className="text-xs text-slate-500 mt-1">Category: <strong className="text-slate-800">{dispute.category?.replace(/_/g, ' ')}</strong></p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full mt-0.5">
              {dispute.status}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Case Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking & Service Agreement Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600" /> Booking & Original Agreement
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-bold">Booking ID</span>
                <span className="font-mono font-bold text-slate-800">#{booking.id?.substring(0, 8)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-bold">Budget / Amount</span>
                <span className="font-bold text-teal-600">XAF {booking.budget?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-bold">Scheduled Date</span>
                <span className="font-medium text-slate-800">{new Date(booking.bookingDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-bold">Location</span>
                <span className="font-medium text-slate-800 truncate block">{booking.location}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {booking.id && (
                <a
                  href={`https://api.usefixam.com/api/bookings/${booking.id}/contract-pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
                >
                  📄 Download Service Contract (PDF)
                </a>
              )}
            </div>

            {/* Preserved Agreements Snapshot */}
            {booking.agreements && booking.agreements.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">Preserved Agreement Amendments History:</span>
                {booking.agreements.map((ag) => (
                  <div key={ag.id} className="p-3 bg-slate-50 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">Version #{ag.version}</span> - <span className="text-slate-600">{ag.type} ({ag.status})</span>
                      {ag.notes && <p className="text-slate-500 text-[11px] mt-0.5">{ag.notes}</p>}
                    </div>
                    <span className="text-slate-400 text-[10px]">{new Date(ag.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Complaint Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Client Complaint & Evidence
            </h3>

            <div className="bg-rose-50/50 p-4 rounded-xl text-xs space-y-2 border border-rose-100">
              <p className="font-semibold text-slate-800 whitespace-pre-wrap">{dispute.description}</p>
            </div>

            {clientEvidence.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Client Evidence Files:</span>
                <div className="flex flex-wrap gap-2">
                  {clientEvidence.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 text-teal-600 font-bold text-xs rounded-lg hover:bg-slate-200 transition"
                    >
                      📎 {item.name || `Client File #${idx + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Provider Response Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-sky-600" /> Provider Response & Evidence
            </h3>

            {dispute.providerResponse ? (
              <div className="bg-sky-50/50 p-4 rounded-xl text-xs space-y-2 border border-sky-100">
                <p className="font-semibold text-slate-800 whitespace-pre-wrap">{dispute.providerResponse}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No response submitted by provider yet.</p>
            )}

            {providerEvidence.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Provider Evidence Files:</span>
                <div className="flex flex-wrap gap-2">
                  {providerEvidence.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 text-teal-600 font-bold text-xs rounded-lg hover:bg-slate-200 transition"
                    >
                      📎 {item.name || `Provider File #${idx + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Official Resolution Card (if resolved) */}
          {dispute.resolution && (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Official Resolution Outcome: {dispute.resolution}
              </h3>
              <p className="text-xs font-medium text-emerald-800 whitespace-pre-wrap">{dispute.resolutionReason}</p>
              <p className="text-[10px] text-emerald-600 pt-2 border-t border-emerald-200">
                Resolved by Admin #{dispute.assignedAdminId?.substring(0, 8)} on {new Date(dispute.resolvedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Parties & Audit Timeline */}
        <div className="space-y-6">
          {/* Parties Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Involved Parties</h3>

            {/* Client */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Client</span>
              <p className="font-bold text-slate-900">{client.fullName || 'Anonymous'}</p>
              <p className="text-slate-500 text-[11px]">{client.phone} • {client.email}</p>
            </div>

            {/* Provider */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Provider</span>
              <p className="font-bold text-slate-900">{provider.fullName || 'Anonymous'}</p>
              <p className="text-slate-500 text-[11px]">{provider.phone} • {provider.email}</p>
            </div>
          </div>

          {/* Audit Trail Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" /> Complete Audit Timeline ({events.length})
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {events.map((evt) => (
                <div key={evt.id} className="text-xs border-l-2 border-teal-500 pl-3 py-1 space-y-0.5">
                  <p className="font-bold text-slate-800">{evt.eventType}</p>
                  <p className="text-slate-600 text-[11px]">{evt.description}</p>
                  <p className="text-slate-400 text-[10px]">{new Date(evt.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RESOLVE DISPUTE MODAL */}
      {resolveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Resolve Dispute Case</h3>
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Resolution Outcome *</label>
                <select
                  value={resolutionOutcome}
                  onChange={(e) => setResolutionOutcome(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none"
                >
                  <option value="CORRECTION_REQUIRED">Provider Must Correct Work</option>
                  <option value="COMPLAINT_REJECTED">Complaint Rejected / Service Satisfactory</option>
                  <option value="MUTUAL_SETTLEMENT">Mutual Settlement Reached</option>
                  <option value="PARTIAL_SETTLEMENT">Partial Settlement Granted</option>
                  <option value="BOOKING_CANCELLED">Booking Cancelled</option>
                  <option value="OTHER">Other Resolution Policy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mandatory Resolution Reason *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain the admin decision and rationale clearly..."
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                >
                  {submitting ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST EVIDENCE MODAL */}
      {evidenceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Request Additional Evidence</h3>
            <form onSubmit={handleRequestEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Party *</label>
                <select
                  value={requestTarget}
                  onChange={(e) => setRequestTarget(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none"
                >
                  <option value="PROVIDER">Provider</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Request Note</label>
                <textarea
                  rows={3}
                  placeholder="Specify what additional proof or documents are needed..."
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
