"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Bell, Briefcase, CheckCircle2, Globe, TrendingUp, Users, Wallet } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/api"

const timeAgo = (value) => {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function OverviewPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchOverview = async () => {
    try {
      const res = await dashboardService.getStats()
      setStats(res.data.data || {})
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      router.replace("/")
      return
    }
    const loadInitialData = async () => {
      await fetchOverview()
    }
    loadInitialData()
    const id = setInterval(fetchOverview, 60000)
    return () => clearInterval(id)
  }, [router])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoaderPulse />
          <p className="font-medium text-slate-500 animate-pulse">Loading platform overview...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Providers", value: stats?.totalProviders || 0, icon: Briefcase, color: "text-violet-600", bg: "bg-violet-100" },
    { label: "Total Jobs", value: stats?.totalJobs || 0, icon: Briefcase, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Active Jobs", value: stats?.activeJobs || 0, icon: TrendingUp, color: "text-cyan-700", bg: "bg-cyan-100" },
    { label: "Completed Jobs", value: stats?.completedJobs || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Pending Approvals", value: stats?.pendingApprovals || 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Open Reports", value: stats?.openReports || 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    { label: "Total Revenue", value: formatCurrency(stats?.totalRevenue || 0), icon: Wallet, color: "text-teal-700", bg: "bg-teal-100" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">System Overview</h2>
          <p className="text-slate-500">Real-time performance metrics for Fixam Marketplace.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-emerald-700">
          <Globe className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-wider">Live Network</span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Live</span>
            </div>
            <h3 className="mt-4 text-sm font-medium text-slate-500">{stat.label}</h3>
            <p className="mt-1 text-2xl font-black text-slate-900">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Monthly Coin Sales</h3>
              <p className="text-sm text-slate-500">Coins purchased and revenue for the last six months.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.monthlyCoinSales || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip formatter={(value, name) => name === "revenueFCFA" ? formatCurrency(value) : value} />
                <Bar yAxisId="left" dataKey="coinsPurchased" name="Coins" fill="#0D9488" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenueFCFA" name="Revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Panel title="Recent Broadcasts" icon={Bell} action={() => router.push("/dashboard/notifications")}>
          {(stats?.recentBroadcasts || []).length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No recent broadcasts</p>
          ) : (
            stats.recentBroadcasts.map((item) => (
              <div key={item.id} className="border-b pb-4 last:border-0 last:pb-0">
                <p className="line-clamp-1 text-sm font-bold text-slate-900">{item.subject}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.recipientRole || "ALL"}</span>
                  <span>{timeAgo(item.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </Panel>
      </div>

      <Panel title="Recent Signups" icon={Users}>
        {(stats?.recentSignups || []).length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No recent signups</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {stats.recentSignups.map((user) => (
              <div key={user.id} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar user={user} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{user.fullName || "Unnamed user"}</p>
                    <p className="truncate text-xs text-slate-500">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{user.role}</span>
                  <span className="text-xs font-semibold text-slate-400">{timeAgo(user.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

function Panel({ title, icon: Icon, action, children }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-slate-800">
          <Icon size={18} className="text-blue-600" />
          {title}
        </h3>
        {action && <button onClick={action} className="text-xs font-bold text-blue-600 hover:underline">View All</button>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Avatar({ user }) {
  if (user.avatar) {
    return <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
  }
  return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-500">{(user.fullName || "U").charAt(0)}</div>
}

function LoaderPulse() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      <div className="absolute h-10 w-10 animate-ping rounded-full bg-blue-600/10" />
    </div>
  )
}
