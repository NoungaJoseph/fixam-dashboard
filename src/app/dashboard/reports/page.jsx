"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, MessageSquare, Flag, ShieldAlert, CheckCircle, Search, MessageCircle } from "lucide-react"
import { dashboardService } from "@/services/api"

export default function ReportsPage() {
  const [showBanner, setShowBanner] = useState(true)

  const fetchReports = () => {
    dashboardService.getReports()
      .then((reportRes) => {
        setReports(reportRes.data.data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchReports()
    const id = setInterval(fetchReports, 60000)
    return () => clearInterval(id)
  }, [])

  const openDisputes = reports.filter(r => r.status === 'PENDING' || r.status === 'OPEN').length;
  const inProgress = reports.filter(r => r.status === 'IN_PROGRESS').length;
  const resolved = reports.filter(r => r.status === 'RESOLVED').length;

  const updateReport = async (id, status) => {
    await dashboardService.updateReportStatus(id, { status })
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const sortedReports = [...reports].sort((a, b) => {
    const isPendingA = a.status === 'PENDING' || a.status === 'OPEN'
    const isPendingB = b.status === 'PENDING' || b.status === 'OPEN'
    if (isPendingA && !isPendingB) return -1
    if (!isPendingA && isPendingB) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading all platform reports...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {openDisputes > 0 && showBanner && (
        <div className="bg-amber-100 text-amber-800 px-6 py-4 rounded-xl flex justify-between items-center shadow-sm">
          <p className="font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            You have {openDisputes} pending reports requiring attention
          </p>
          <button onClick={() => setShowBanner(false)} className="text-amber-800 hover:text-amber-900 font-bold">Dismiss</button>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Reports & Disputes</h2>
        <p className="text-slate-500">Manage user complaints, fraud alerts, and resolve marketplace disputes.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{openDisputes}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Disputes</p>
          </div>
        </div>
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{inProgress}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
          </div>
        </div>
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{resolved}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Cases</p>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Recent Incidents</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 border">
              <Search className="h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search report ID..." className="bg-transparent text-sm outline-none" />
            </div>
          </div>
        </div>

        <div className="divide-y">
          {reports.length === 0 ? (
            <div className="p-20 text-center text-slate-400">
              <MessageSquare size={40} className="mx-auto mb-4 opacity-20" />
              <p>No platform incidents reported.</p>
            </div>
          ) : (
            sortedReports.map((report) => (
              <div key={report.id} className={`p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                (report.status === 'PENDING' || report.status === 'OPEN') ? 'border-l-4 border-l-amber-500 bg-amber-50/30' : 
                report.status === 'RESOLVED' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-blue-500'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center bg-red-100 text-red-600`}>
                    <Flag size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900">{report.reason}</h4>
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{report.id.slice(-6)}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="font-semibold text-slate-800">{report.reporter?.fullName}</span> reported <span className="font-semibold text-slate-800">{report.target?.fullName}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(report.createdAt).toLocaleDateString()} &bull; Severity: High</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    report.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 
                    report.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {report.status}
                  </span>
                  <div className="h-8 w-px bg-slate-200" />
                  <button onClick={() => updateReport(report.id, report.status === 'RESOLVED' ? 'PENDING' : 'RESOLVED')} className="text-sm font-bold text-blue-600 hover:text-blue-700">
                    {report.status === 'RESOLVED' ? 'Reopen' : 'Resolve'}
                  </button>
                  <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400"><MessageCircle size={18}/></button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 bg-slate-50 text-center border-t">
          <button className="text-sm font-bold text-slate-600 hover:underline">View All Historical Reports</button>
        </div>
      </div>
    </div>
  )
}
