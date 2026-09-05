"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Send, Users, Toolbox, ShieldAlert, History, CheckCircle2, Clock, CheckCircle, X, ExternalLink, Briefcase, MapPin, User as UserIcon } from "lucide-react"
import { dashboardService } from "@/services/api"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("tasks") // "tasks" | "compose" | "history"
  const [target, setTarget] = useState("all")
  const [sending, setSending] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [pendingJobs, setPendingJobs] = useState([])
  const [loadingPendingJobs, setLoadingPendingJobs] = useState(true)
  const [processingJobId, setProcessingJobId] = useState(null)

  const roleMap = {
    all: "ALL",
    providers: "PROVIDER",
    clients: "CLIENT",
    individual: "INDIVIDUAL"
  }

  const fetchPendingJobs = () => {
    setLoadingPendingJobs(true)
    dashboardService.getPendingJobs?.()
      .then(res => {
        setPendingJobs(res.data?.data || [])
      })
      .catch(() => {})
      .finally(() => setLoadingPendingJobs(false))
  }

  const fetchHistory = () => {
    dashboardService.getBroadcasts?.()
      .then(res => {
        setHistory(res.data.data || [])
        setLoadingHistory(false)
      })
      .catch(() => setLoadingHistory(false))
  }

  useEffect(() => {
    fetchPendingJobs()
    fetchHistory()
    dashboardService.getUsers().then((res) => setUsers(res.data.data || [])).catch(() => {})
  }, [])

  const handleApprove = async (jobId) => {
    try {
      setProcessingJobId(jobId)
      await dashboardService.approveJob(jobId)
      toast.success("Task approved and published!")
      setPendingJobs(prev => prev.filter(j => j.id !== jobId))
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve task")
    } finally {
      setProcessingJobId(null)
    }
  }

  const handleReject = async (jobId) => {
    const reason = window.prompt("Enter rejection reason for client:")
    if (!reason || !reason.trim()) return
    try {
      setProcessingJobId(jobId)
      await dashboardService.rejectJob(jobId, { reason })
      toast.success("Task rejected and client notified.")
      setPendingJobs(prev => prev.filter(j => j.id !== jobId))
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject task")
    } finally {
      setProcessingJobId(null)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    try {
      setSending(true)
      await dashboardService.sendAdminMessage({
        subject,
        content,
        recipientRole: roleMap[target],
        recipientId: target === "individual" ? selectedUser : null
      })
      toast.success("Notification sent")
      setSubject("")
      setContent("")
      setSelectedUser("")
      fetchHistory()
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send notification")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Notifications & Alerts</h2>
          <p className="text-slate-500">Manage client tasks awaiting review, system alerts, and broadcast announcements.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "tasks" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="h-4 w-4 text-amber-400" />
            Tasks Awaiting Review
            {pendingJobs.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingJobs.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("compose")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "compose" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send className="h-4 w-4" />
            Broadcast Center
          </button>
        </div>
      </div>

      {activeTab === "tasks" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  {pendingJobs.length === 1 
                    ? "1 task awaiting administrator review" 
                    : `${pendingJobs.length} tasks awaiting administrator review`}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Tasks require admin approval before becoming visible to verified providers across Cameroon.
                </p>
              </div>
            </div>
            <Link 
              href="/dashboard/jobs/approval" 
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-sm"
            >
              Open Full Queue <ExternalLink size={14} />
            </Link>
          </div>

          {loadingPendingJobs ? (
            <div className="p-12 text-center text-slate-400 animate-pulse font-medium">
              Loading pending tasks from platform...
            </div>
          ) : pendingJobs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                There are currently no tasks waiting for approval. Every posted task is live and available to providers.
              </p>
              <button
                onClick={() => setActiveTab("compose")}
                className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Go to Broadcast Center
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-amber-400 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                        {job.category || "General"}
                      </span>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        ID: {job.id.slice(-8)}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {new Date(job.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{job.description || "No description provided."}</p>

                    <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <UserIcon size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-800">{job.client?.fullName || "Client"}</span>
                        {job.client?.phone && <span className="text-slate-400">({job.client.phone})</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{job.location || "On-site"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={14} className="text-slate-400" />
                        <span>Budget: <strong className="text-slate-900">{formatCurrency(job.budget || 0)}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                    <button
                      onClick={() => handleApprove(job.id)}
                      disabled={processingJobId === job.id}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle size={15} />
                      {processingJobId === job.id ? "Approving..." : "Approve & Publish"}
                    </button>
                    <button
                      onClick={() => handleReject(job.id)}
                      disabled={processingJobId === job.id}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <X size={15} />
                      Reject
                    </button>
                    <Link
                      href="/dashboard/jobs/approval"
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                      title="View Details"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Composer */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                Compose Broadcast
              </h3>
              
              <form onSubmit={handleSend} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { id: "all", label: "All Users", icon: Users },
                      { id: "providers", label: "Providers Only", icon: Toolbox },
                      { id: "clients", label: "Clients Only", icon: ShieldAlert },
                      { id: "individual", label: "Individual", icon: Users },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTarget(item.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          target === item.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-slate-200 text-slate-500"
                        }`}
                      >
                        <item.icon className="h-6 w-6 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {target === "individual" && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Recipient</label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 transition-colors"
                      required
                    >
                      <option value="">Choose a user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.fullName || user.phone} ({user.role})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Notification Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. New Feature Update!" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Message Content</label>
                  <textarea 
                    rows={4} 
                    placeholder="Type your message here..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 transition-colors"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={sending}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {sending ? "Broadcasting..." : "Send Broadcast Now"}
                  {!sending && <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </div>

          {/* Recent History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <History className="h-5 w-5 text-slate-400" />
                Recent Broadcasts
              </h3>

              <div className="space-y-4">
                {loadingHistory ? (
                  <div className="text-center py-4 text-slate-400 text-sm animate-pulse">Loading history...</div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No recent broadcasts found.</div>
                ) : history.map((b, i) => (
                  <div key={b.id || i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">{b.subject}</h4>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        <CheckCircle2 size={10} /> {b.status || "SENT"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-2">
                      <span>To: {b.recipientId ? "Individual" : b.recipientRole === "ALL" ? "All Users" : b.recipientRole}</span>
                      <span>{new Date(b.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                View Full History
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4" />
                Pro Tip
              </h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                Targeted notifications have a 45% higher engagement rate. Use specific audience segments for better results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
