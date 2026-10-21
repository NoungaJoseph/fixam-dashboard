"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Activity, CreditCard, Users, RefreshCw, ChevronRight, TrendingUp, Clock, ArrowUpRight } from "lucide-react"
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
    <div className="max-w-[1440px] mx-auto p-5 md:p-8 space-y-6 animate-in fade-in duration-500">
      <section className="grid gap-8 border-b border-[#DCE4EE] pb-8 lg:grid-cols-[1fr_250px] lg:items-start">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D95E57]">Admin workspace</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.055em] text-[#081B3A] md:text-5xl">Protect every move.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#597297]">Manage activity, review marketplace quality, and keep the Fixam community moving safely.</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/dashboard/jobs/approval" className="inline-flex items-center gap-2 text-xs font-black text-[#081B3A] hover:text-[#D95E57]">Review pending work <ArrowUpRight className="h-4 w-4" /></Link>
            <Link href="/dashboard/external-jobs" className="inline-flex items-center gap-2 text-xs font-black text-[#081B3A] hover:text-[#D95E57]">Manage job listings <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <div className="flex items-center gap-4 lg:justify-end">
          <div className="grid h-24 w-24 place-items-center rounded-full border-[7px] border-[#F57B72] bg-white text-center shadow-[0_14px_32px_-22px_rgba(8,27,58,0.6)]"><span className="text-2xl font-black text-[#081B3A]">{stats?.activeJobs || 0}</span></div>
          <div><p className="text-xs font-black text-[#597297]">Active jobs</p><p className="mt-1 text-xs leading-5 text-slate-500">under marketplace review</p></div>
        </div>
      </section>
 
      {/* Pending Task Approvals Alert Banner */}
      {Number(stats?.pendingTaskApprovals || stats?.pendingApprovals || 0) > 0 && (
        <div className="bg-[#FFF7E7] border border-[#F4D9A5] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 text-base">
                  {stats.pendingTaskApprovals || stats.pendingApprovals} New Task{(stats.pendingTaskApprovals || stats.pendingApprovals) > 1 ? 's' : ''} Awaiting Admin Approval
                </h4>
                <span className="bg-white/80 text-[#A95D00] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Clients have posted new service requests that require your review and approval before going live to providers.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/jobs/approval"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#081B3A] hover:bg-[#102A51] text-white font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-center shrink-0 cursor-pointer"
          >
            <span>Review & Approve Tasks</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div className="grid border-y border-[#DCE4EE] sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className="min-h-[150px] p-5 first:pl-0 sm:border-r sm:border-[#DCE4EE] last:border-r-0 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{card.title}</span>
                <div className={`p-2 ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black tracking-[-0.04em] text-[#081B3A]">{card.value}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">{card.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Middle Grid: Platform Breakdown + Activity Chart */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
        {/* Left Column: Platform Users Breakdown */}
        <div className="border-t border-[#DCE4EE] pt-5 flex flex-col justify-between">
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
        <div className="border-t border-[#DCE4EE] pt-5">
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
