"use client"

import { useEffect, useState } from "react"
import { Globe2, Eye, Map, ArrowUpRight, ShieldCheck, Clock, Smartphone, Laptop, CheckCircle, XCircle } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { dashboardService } from "@/services/api"

export default function WebAnalyticsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getWebAnalytics()
        setStats(response.data?.stats || {})
      } catch (error) {
        console.error("Failed to load web analytics", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 45000)
    return () => clearInterval(interval)
  }, [])

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "< 10s"
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const remSecs = seconds % 60
    return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`
  }

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading Web Analytics & SEO...</div>

  const cookies = stats?.cookies || { totalResponses: 0, acceptAll: 0, refuseEssential: 0, acceptRate: 0 }
  const totalCookieCount = (cookies.acceptAll + cookies.refuseEssential) || 1
  const acceptAllPercent = Math.round((cookies.acceptAll / totalCookieCount) * 100)
  const refusePercent = 100 - acceptAllPercent

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Globe2 className="h-6 w-6 text-[#0D9488]" /> Web Analytics & SEO
          </h2>
          <p className="text-sm text-slate-500 mt-1">Live traffic, visitor engagement, cookie choices, and SEO performance for usefixam.com</p>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Views */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Page Views</span>
            <div className="p-2.5 rounded-xl bg-teal-50">
              <Eye className="h-4 w-4 text-[#0D9488]" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800">{(stats?.totalViews || 0).toLocaleString()}</p>
            <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> All-time website visits
            </p>
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Unique Visitors</span>
            <div className="p-2.5 rounded-xl bg-blue-50">
              <Globe2 className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800">{(stats?.uniqueVisitors || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Unique IP & browser sessions</p>
          </div>
        </div>

        {/* Visitor Stay Duration */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Avg. Guest Stay Time</span>
            <div className="p-2.5 rounded-xl bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800">{formatDuration(stats?.avgGuestStayDuration)}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Guests only (logged-in exempt)</p>
          </div>
        </div>

        {/* Cookie Consent Rate */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Cookie Consent Rate</span>
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800">{cookies.acceptRate}%</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{cookies.totalResponses} user decisions recorded</p>
          </div>
        </div>
      </div>

      {/* Middle Row: Cookie Consent Breakdown & Traffic Trends */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cookie Consent Algorithm Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0D9488]" /> Cookie Choices Algorithm
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">User consent tracking breakdown from the website cookie banner choices.</p>

            <div className="space-y-5">
              {/* Accept All Cookies */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5 font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Accept All Cookies
                  </span>
                  <span className="text-slate-700">{cookies.acceptAll} ({cookies.totalResponses > 0 ? acceptAllPercent : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-700" 
                    style={{ width: `${cookies.totalResponses > 0 ? acceptAllPercent : 0}%` }}
                  />
                </div>
              </div>

              {/* Refuse Non-Essential */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5 font-bold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <XCircle className="h-4 w-4 text-slate-400" /> Refuse Non-Essential
                  </span>
                  <span className="text-slate-700">{cookies.refuseEssential} ({cookies.totalResponses > 0 ? refusePercent : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-slate-400 h-3 rounded-full transition-all duration-700" 
                    style={{ width: `${cookies.totalResponses > 0 ? refusePercent : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Privacy Rule: Active</span>
            <span className="font-semibold text-emerald-600">GDPR & Session Compliant</span>
          </div>
        </div>

        {/* Traffic Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Traffic & Unique Visitors (Last 14 Days)</h3>
              <p className="text-xs text-slate-500">Daily web impressions and distinct visitor sessions</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.dailyTraffic || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="views" name="Page Views" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Table: Top Performing Pages */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-slate-500" />
            <h3 className="text-base font-bold text-slate-800">Top Performing Pages (SEO & Traffic Heatmap)</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">Ranked by Total Hits</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Page Path</th>
                <th className="py-3.5 px-6 text-right">Total Hits</th>
                <th className="py-3.5 px-6 text-right">Avg Guest Stay</th>
                <th className="py-3.5 px-6 text-right">Traffic Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.topPages?.map((page, index) => {
                const totalViews = stats?.totalViews || 1
                const sharePercent = Math.min(100, Math.round((page.views / totalViews) * 100))
                return (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-slate-800 font-semibold">{page.path}</td>
                    <td className="py-4 px-6 text-slate-600 text-right font-bold">{page.views.toLocaleString()}</td>
                    <td className="py-4 px-6 text-slate-600 text-right font-medium">{formatDuration(page.avgDuration)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-xs font-bold text-slate-500">{sharePercent}%</span>
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-[#0D9488] h-2 rounded-full" style={{ width: `${sharePercent}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!stats?.topPages?.length && (
                <tr>
                  <td colSpan={4} className="py-12 px-6 text-center text-slate-500 font-medium">
                    No web analytics traffic data collected yet. Live visitor interactions will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
