"use client"

import { useEffect, useState, useMemo } from "react"
import { Briefcase, MapPin, Calendar, User, CheckCircle, Clock, Search, Filter, Hammer, X, TrendingUp, MessageSquare } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/api"

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("All")
  
  const [viewingConversation, setViewingConversation] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [loadingConversation, setLoadingConversation] = useState(false)

  const handleReadConversation = async () => {
    if (!selectedJob) return;
    const client = selectedJob.client;
    const providerAssignment = selectedJob.assignments?.[0];
    if (!client || !providerAssignment) {
      alert("Missing client or provider information for this job.");
      return;
    }
    const clientId = client.id;
    const providerId = providerAssignment.provider?.user?.id;
    if (!providerId) {
      alert("Provider not assigned to this job yet.");
      return;
    }

    setLoadingConversation(true);
    setViewingConversation(true);
    try {
      const res = await dashboardService.getConversationBetweenUsers(clientId, providerId);
      setConversation(res.data.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load conversation.");
    } finally {
      setLoadingConversation(false);
    }
  };

  useEffect(() => {
    Promise.allSettled([
      dashboardService.getJobs(),
      dashboardService.getBookings()
    ]).then(([jobsRes, bookingsRes]) => {
      let combined = [];
      if (jobsRes.status === 'fulfilled') {
        const jobsData = jobsRes.value.data?.data;
        combined = [...combined, ...(jobsData?.items || jobsData || [])];
      }
      if (bookingsRes.status === 'fulfilled') {
        const bookings = bookingsRes.value.data?.data || [];
        const mappedBookings = bookings.map(b => ({
          ...b,
          isBooking: true,
          category: 'Service Booking',
          title: b.notes || 'Service Booking',
          budget: b.budget || b.totalAmount || 0,
          description: b.notes,
          assignments: b.provider ? [{ provider: { user: b.provider } }] : []
        }));
        combined = [...combined, ...mappedBookings];
      }
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setJobs(combined);
      setLoading(false);
    });
  }, [])

  // Calculate Stats
  const stats = useMemo(() => {
    let total = jobs.length
    let live = 0
    let completed = 0
    let pending = 0

    jobs.forEach(j => {
      if (j.status === 'IN_PROGRESS' || j.status === 'ASSIGNED') live++
      else if (j.status === 'COMPLETED') completed++
      else if (j.status === 'PENDING') pending++
    })

    return { total, live, completed, pending }
  }, [jobs])

  // Chart Data: Jobs created last 7 days
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return { dateStr: d.toLocaleDateString(), label: d.toLocaleDateString('en-US', { weekday: 'short' }), jobs: 0 }
    })

    jobs.forEach(j => {
      const jDate = new Date(j.createdAt).toLocaleDateString()
      const day = last7Days.find(d => d.dateStr === jDate)
      if (day) day.jobs++
    })

    return last7Days
  }, [jobs])

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.client?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    if (activeTab === "Live") return j.status === "IN_PROGRESS" || j.status === "ASSIGNED"
    if (activeTab === "Completed") return j.status === "COMPLETED"
    if (activeTab === "Pending") return j.status === "PENDING"
    if (activeTab === "Cancelled") return j.status === "CANCELLED"
    return true
  })

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading all platform jobs...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Job Management</h2>
          <p className="text-slate-500">Monitor all service requests, track live jobs, and view completion stats.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Total Jobs" value={stats.total} icon={Briefcase} tone="blue" />
        <Metric title="Live Jobs" value={stats.live} icon={TrendingUp} tone="amber" />
        <Metric title="Completed" value={stats.completed} icon={CheckCircle} tone="emerald" />
        <Metric title="Pending" value={stats.pending} icon={Clock} tone="teal" />
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="mb-5 font-bold text-slate-900">Jobs Created (Last 7 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#0D9488" fontSize={12} allowDecimals={false} />
              <Tooltip cursor={{fill: '#F1F5F9'}} />
              <Bar dataKey="jobs" name="Jobs" fill="#0D9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50">
          <div className="flex gap-2 bg-white p-1 rounded-xl border flex-wrap">
            {["All", "Pending", "Live", "Completed", "Cancelled"].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border w-full md:w-64">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search jobs..." 
              className="bg-transparent text-sm outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <Briefcase size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} jobs found.</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div key={job.id} className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{job.id.slice(-8)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User size={16} className="text-slate-400" />
                        <span className="font-medium">{job.client?.fullName || "Unknown Client"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Hammer size={16} className="text-slate-400" />
                        <span className="font-medium">{job.assignments?.[0]?.provider?.user?.fullName || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={16} className="text-slate-400" />
                        <span className="font-medium truncate max-w-[150px]">{job.location || "On-site"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6 min-w-[180px]">
                    <div className="text-right w-full">
                      <p className="text-2xl font-black text-slate-900">{formatCurrency(job.budget || 0)}</p>
                      <div className={`mt-1 flex items-center justify-end gap-1.5 text-xs font-bold uppercase ${
                        job.status === 'COMPLETED' ? 'text-emerald-600' : 
                        (job.status === 'IN_PROGRESS' || job.status === 'ASSIGNED') ? 'text-blue-600' : 
                        job.status === 'CANCELLED' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {job.status === 'COMPLETED' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                        {job.status.replace('_', ' ')}
                      </div>
                    </div>
                    
                    <div className="flex w-full gap-2 mt-2">
                      <button 
                        onClick={() => setSelectedJob(job)}
                        className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all text-center"
                      >
                        Details
                      </button>
                      <button 
                        className="flex-1 bg-slate-900 text-white py-2 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-md text-center"
                      >
                        Track Action
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Job Details</h3>
              <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={24}/>
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Client</p>
                  <p className="text-lg font-bold text-slate-900">{selectedJob.client?.fullName}</p>
                  <p className="text-sm text-slate-500">{selectedJob.client?.email}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Budget</p>
                  <p className="text-3xl font-black text-slate-900">{formatCurrency(selectedJob.budget)}</p>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
                <p className="text-slate-700 leading-relaxed">{selectedJob.description || "No description provided."}</p>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-4 border-t">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className="text-sm font-bold text-blue-600">{selectedJob.status?.replace('_', ' ') || 'PENDING'}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Category</p>
                  <span className="text-sm font-bold text-slate-700">{selectedJob.category}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Created</p>
                  <span className="text-sm font-bold text-slate-700">{new Date(selectedJob.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setSelectedJob(null)} className="px-6 py-2.5 font-bold text-slate-600 hover:text-slate-900">Close</button>
              <button onClick={handleReadConversation} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                <MessageSquare size={18} />
                Read Conversation
              </button>
              <button onClick={() => window.location.href = '/dashboard/reports'} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Support Dispute</button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Modal */}
      {viewingConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Conversation Logs</h3>
              <button onClick={() => { setViewingConversation(false); setConversation(null); }} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={24}/>
              </button>
            </div>
            <div className="p-6 bg-slate-100 h-[60vh] overflow-y-auto space-y-4">
              {loadingConversation ? (
                <div className="text-center py-10 text-slate-500 font-medium animate-pulse">Loading messages...</div>
              ) : conversation && conversation.messages && conversation.messages.length > 0 ? (
                conversation.messages.map((msg, i) => {
                  const client = selectedJob?.client;
                  const isClient = msg.senderId === client?.id;
                  
                  return (
                    <div key={msg.id || i} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl p-4 ${isClient ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm shadow-sm'}`}>
                        <div className="text-xs font-bold mb-1 opacity-70">
                          {isClient ? 'Client' : 'Provider'}
                        </div>
                        {msg.type === 'IMAGE' ? (
                          <div className="text-sm italic opacity-80">[Image Attachment]</div>
                        ) : msg.type === 'AUDIO' ? (
                          <div className="text-sm italic opacity-80">[Voice Message]</div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                        <div className="text-[10px] mt-2 opacity-60 text-right">
                          {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 text-slate-500 font-medium">No conversation found between the client and the assigned provider.</div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => { setViewingConversation(false); setConversation(null); }} className="px-6 py-2.5 font-bold text-slate-600 hover:text-slate-900">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ title, value, icon: Icon, tone }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  }
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}
