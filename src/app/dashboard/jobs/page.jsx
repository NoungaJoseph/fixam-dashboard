"use client"

import { useEffect, useState } from "react"
import { Briefcase, MapPin, Calendar, User, CheckCircle, Clock, Search, Filter, Hammer, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/api"

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    dashboardService.getJobs()
      .then(res => {
        setJobs(res.data.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.client?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading all platform jobs...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Job Management</h2>
          <p className="text-slate-500">Monitor all service requests and track live job status.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border shadow-sm w-full md:w-64">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search jobs or clients..." 
              className="bg-transparent text-sm outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-white border rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm"><Filter size={20}/></button>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Briefcase size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No jobs found matching your criteria.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-slate-300 transition-all">
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
                    <span className="font-medium">{job.client?.fullName || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Hammer size={16} className="text-slate-400" />
                    <span className="font-medium">{job.assignments?.[0]?.provider?.user?.fullName || "Searching..."}</span>
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

              <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-8">
                <div className="text-right min-w-[120px]">
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(job.budget || 0)}</p>
                  <div className={`mt-1 flex items-center justify-end gap-1.5 text-xs font-bold uppercase ${
                    job.status === 'COMPLETED' ? 'text-emerald-600' : 
                    job.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {job.status === 'COMPLETED' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                    {job.status.replace('_', ' ')}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedJob(job)}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-md"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
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
                  <span className="text-sm font-bold text-blue-600">{selectedJob.status}</span>
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
              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Support Dispute</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
