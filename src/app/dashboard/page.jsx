"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, Download, CreditCard, Users, Wallet, RefreshCw, ChevronRight, TrendingUp } from "lucide-react"
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { dashboardService } from "@/services/api"

export default function OverviewPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchOverview = async () => {
    try {
      const res = await dashboardService.getStats()
      setStats(res.data?.data || {})
    } catch (error) {
      console.error("Failed to load overview stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      router.replace("/")
      return
    }
    fetchOverview()
    const id = setInterval(fetchOverview, 45000)
    return () => clearInterval(id)
  }, [router])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="font-medium text-slate-500 animate-pulse">Loading system overview...</p>
      </div>
    )
  }

  const cards = [
    { 
      title: "TOTAL REVENUE (SETTLED)", 
      value: `${(stats?.totalRevenue || 0).toLocaleString()} FCFA`, 
      sub: `${stats?.completedJobs || 0} completed tasks`, 
      icon: CreditCard,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    { 
      title: "TOTAL ACCOUNTS", 
      value: String(stats?.totalAccounts || stats?.totalUsers || 0), 
      sub: `${stats?.totalUsers || 0} clients, ${stats?.totalProviders || 0} pros`, 
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    { 
      title: "ACTIVE MONTHLY USERS (MAU)", 
      value: String(stats?.mau || 0), 
      sub: `${stats?.dau || 0} daily active users`, 
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    { 
      title: "MONTHLY REVENUE", 
      value: `${(stats?.monthlyRevenue || 0).toLocaleString()} FCFA`, 
      sub: `${stats?.activeJobs || 0} active jobs in progress`, 
      icon: RefreshCw,
      color: "text-teal-600",
      bg: "bg-teal-50"
    },
  ]

  const chartData = stats?.chartData?.length ? stats.chartData : [
    { name: 'Mon', downloads: stats?.totalAccounts || 0, active: stats?.dau || 0 },
    { name: 'Tue', downloads: stats?.totalAccounts || 0, active: stats?.dau || 0 },
    { name: 'Wed', downloads: stats?.totalAccounts || 0, active: stats?.dau || 0 },
    { name: 'Thu', downloads: stats?.totalAccounts || 0, active: stats?.dau || 0 },
    { name: 'Fri', downloads: stats?.totalAccounts || 0, active: stats?.dau || 0 },
    { name: 'Sat', downloads: stats?.totalAccounts || 0, active: stats?.dau || 0 },
    { name: 'Sun', downloads: stats?.totalAccounts || 0, active: stats?.dau || 0 },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Welcome */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Hi, Admin</h2>
          <p className="text-sm text-slate-500">Welcome to your dashboard overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Overview</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-400">Dashboard</span>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className="rounded-2xl bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{card.title}</span>
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight text-slate-800">{card.value}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">{card.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Middle Grid: Platform Breakdown + Activity Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Platform Users Breakdown */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-slate-700">Platform Users Breakdown</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex items-center justify-center">
              {/* Outer Ring */}
              <div className="h-44 w-44 rounded-full border-[10px] border-slate-50 border-t-[#0D9488] border-r-[#2563EB] border-b-[#0D9488] flex items-center justify-center shadow-inner">
                <div className="text-center">
                  <span className="text-3xl font-black text-slate-800">{(stats?.totalAccounts || stats?.totalUsers || 0)}</span>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Total Users</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 border-t border-slate-100 pt-4">
            <div className="text-center w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">CLIENTS: {stats?.totalUsers || 0}</span>
            </div>
            <div className="text-center w-full border-l border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PROVIDERS: {stats?.totalProviders || 0}</span>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-600" />
              <h3 className="text-[15px] font-bold text-slate-700">App Downloads & Activity</h3>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">DOWNLOADS / USERS</p>
                <p className="text-xl font-bold text-slate-800">{(stats?.downloads || stats?.totalAccounts || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">MAU</p>
                <p className="text-xl font-bold text-slate-800">{(stats?.mau || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">DAU</p>
                <p className="text-xl font-bold text-slate-800">{(stats?.dau || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="downloads" name="Signups / Downloads" stroke="#312E81" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="active" name="Active Users" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
