"use client"

import { useEffect, useState } from "react"
import { Globe2, Eye, Map, ArrowUpRight } from "lucide-react"
import { dashboardService } from "@/services/api"

export default function WebAnalyticsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getWebAnalytics()
        setStats(response.data.stats || {})
      } catch (error) {
        console.error("Failed to load web analytics", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading Web Analytics...</div>

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Globe2 className="h-8 w-8 text-[#0D9488]" /> Web Analytics & SEO
          </h2>
          <p className="text-slate-500 mt-2">Monitor usefixam.com traffic, page views, and engagement metrics.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Global Website Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Views</h3>
            <Eye className="h-5 w-5 text-slate-400" />
          </div>
          <div className="text-4xl font-bold text-slate-800">{stats?.totalViews || 0}</div>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> All time traffic
          </p>
        </div>
      </div>

      {/* Heatmap / Top Pages */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Map className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-bold text-slate-800">Top Performing Pages (Heatmap)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 px-6 font-medium">Page Path</th>
                <th className="py-3 px-6 font-medium text-right">Total Views</th>
                <th className="py-3 px-6 font-medium text-right">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.topPages?.map((page, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-slate-800 font-medium">{page.path}</td>
                  <td className="py-4 px-6 text-slate-600 text-right">{page._count.path}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 max-w-[100px] ml-auto">
                      <div className="bg-[#0D9488] h-2.5 rounded-full" style={{ width: `${Math.min(100, (page._count.path / (stats.totalViews || 1)) * 100)}%` }}></div>
                    </div>
                  </td>
                </tr>
              ))}
              {!stats?.topPages?.length && (
                <tr>
                  <td colSpan={3} className="py-12 px-6 text-center text-slate-500 font-medium">No analytics data gathered yet. Ensure the tracker is deployed on the main website.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
