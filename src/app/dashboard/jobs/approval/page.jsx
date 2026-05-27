"use client"

import { useEffect, useState } from "react"
import { Briefcase, MapPin, Calendar, User, CheckCircle, X, Clock, Search } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/api"

export default function JobApprovalPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  async function fetchPendingJobs() {
    try {
      setLoading(true)
      const res = await dashboardService.getPendingJobs()
      setJobs(res.data.data || [])
    } catch (err) {
      console.error('Error fetching pending jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingJobs()
    const id = setInterval(fetchPendingJobs, 60000)
    return () => clearInterval(id)
  }, [])

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.client?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleApprove = async (jobId) => {
    try {
      setIsSubmitting(true)
      await dashboardService.approveJob(jobId)
      setJobs(jobs.filter(j => j.id !== jobId))
      setSelectedJob(null)
    } catch (err) {
      console.error('Error approving job:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async (jobId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    try {
      setIsSubmitting(true)
      await dashboardService.rejectJob(jobId, { reason: rejectReason })
      setJobs(jobs.filter(j => j.id !== jobId))
      setSelectedJob(null)
      setRejectReason("")
    } catch (err) {
      console.error('Error rejecting job:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading pending tasks...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {filteredJobs.length > 0 && showBanner && (
        <div className="bg-amber-100 text-amber-800 px-6 py-4 rounded-xl flex justify-between items-center shadow-sm">
          <p className="font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            You have {filteredJobs.length} pending task approvals requiring attention
          </p>
          <button onClick={() => setShowBanner(false)} className="text-amber-800 hover:text-amber-900 font-bold">Dismiss</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Task Approval Queue</h2>
          <p className="text-slate-500">Review and approve/reject pending service requests.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border shadow-sm w-full md:w-64">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tasks or clients..." 
              className="bg-transparent text-sm outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Briefcase size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No pending tasks awaiting approval.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="bg-white border-l-4 border-l-amber-500 border-y border-r rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-slate-300 transition-all">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">PENDING APPROVAL</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User size={16} className="text-slate-400" />
                    <span className="font-medium">{job.client?.fullName || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="font-medium truncate max-w-[150px]">{job.location || "On-site"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Briefcase size={16} className="text-slate-400" />
                    <span className="font-medium">{job.category || "General"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
              </div>

              <div className="flex flex-col items-end gap-4 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-8 min-w-[200px]">
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(job.budget)}</p>
                  <p className="text-xs text-slate-500 font-medium">Budget</p>
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleApprove(job.id)}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => setSelectedJob(job.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl transition-colors"
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in">
            <h3 className="text-xl font-bold text-slate-900">Reject Task</h3>
            <p className="text-sm text-slate-600">
              Provide a reason for rejecting this task. The client will be notified.
            </p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (e.g., inappropriate content, incomplete details, etc.)"
              className="w-full p-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none h-24"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedJob(null)
                  setRejectReason("")
                }}
                className="flex-1 px-4 py-2.5 border rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedJob)}
                disabled={!rejectReason.trim() || isSubmitting}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting ? "Rejecting..." : "Reject Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
