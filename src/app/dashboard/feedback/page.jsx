"use client"

import { useEffect, useState } from "react"
import { Search, MessageSquare, CheckCircle, Clock } from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("ALL")
  const [showBanner, setShowBanner] = useState(true)

  const fetchFeedback = () => {
    dashboardService.getFeedback()
      .then((res) => {
        setFeedback(res.data.data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchFeedback()
    const interval = setInterval(fetchFeedback, 60000)
    return () => clearInterval(interval)
  }, [])

  const updateFeedback = async (id, status) => {
    try {
      await dashboardService.updateFeedbackStatus(id, { status })
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f))
      toast.success("Feedback status updated")
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const newFeedbackCount = feedback.filter(f => f.status === 'NEW').length
  
  const filteredFeedback = feedback
    .filter(f => activeTab === 'ALL' || f.status === activeTab)
    .sort((a, b) => {
      // Sort NEW first
      if (a.status === 'NEW' && b.status !== 'NEW') return -1
      if (b.status === 'NEW' && a.status !== 'NEW') return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading feedback...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {newFeedbackCount > 0 && showBanner && (
        <div className="bg-amber-100 text-amber-800 px-6 py-4 rounded-xl flex justify-between items-center shadow-sm">
          <p className="font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            You have {newFeedbackCount} new feedback submissions requiring attention
          </p>
          <button onClick={() => setShowBanner(false)} className="text-amber-800 hover:text-amber-900 font-bold">Dismiss</button>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">User Feedback</h2>
        <p className="text-slate-500">View and respond to user suggestions, bug reports, and general feedback.</p>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b p-4 flex gap-4">
          {["ALL", "NEW", "READ", "RESOLVED"].map(tab => {
            const count = tab === "ALL" ? feedback.length : feedback.filter(f => f.status === tab).length
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                  activeTab === tab ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab} ({count})
              </button>
            )
          })}
        </div>

        <div className="divide-y">
          {filteredFeedback.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p>No feedback found in this category.</p>
            </div>
          ) : filteredFeedback.map((item) => (
            <div key={item.id} className={`p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50 transition-colors ${
              item.status === 'NEW' ? 'border-l-4 border-l-amber-500' : 
              item.status === 'RESOLVED' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-blue-500'
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-slate-900 text-lg">{item.title}</h4>
                  {item.status === 'NEW' && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">NEW</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                    {item.user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <p className="text-sm text-slate-600 font-medium">{item.user?.fullName || item.user?.phone || 'Unknown user'} • {item.user?.role || 'USER'}</p>
                  <span className="text-slate-300">•</span>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                
                <div className="mt-4 p-4 bg-slate-50 rounded-xl text-slate-700 text-sm border border-slate-100">
                  {item.message}
                </div>
              </div>
              <div className="flex flex-col gap-2 min-w-[140px]">
                <span className={`px-3 py-1.5 text-center rounded-lg text-xs font-bold uppercase tracking-wider ${
                  item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 
                  item.status === 'READ' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {item.status}
                </span>
                
                {item.status === 'NEW' && (
                  <button onClick={() => updateFeedback(item.id, 'READ')} className="px-3 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    Mark as Read
                  </button>
                )}
                {item.status !== 'RESOLVED' && (
                  <button onClick={() => updateFeedback(item.id, 'RESOLVED')} className="px-3 py-2 flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                    <CheckCircle className="h-4 w-4" /> Resolve
                  </button>
                )}
                {item.status === 'RESOLVED' && (
                  <button onClick={() => updateFeedback(item.id, 'READ')} className="px-3 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
