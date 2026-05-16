"use client"

import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Wallet,
  Globe,
  Bell,
  ArrowUpRight
} from "lucide-react"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts'
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/api"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function OverviewPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [financials, setFinancials] = useState([])
  const [broadcasts, setBroadcasts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOverview = () => {
    Promise.all([
      dashboardService.getStats(),
      dashboardService.getFinancialStats(),
      dashboardService.getBroadcasts(),
      dashboardService.getUsers()
    ]).then(([statsRes, finRes, broadRes, usersRes]) => {
      setStats(statsRes.data.data)
      setFinancials(finRes.data.data)
      setBroadcasts(broadRes.data.data)
      setUsers(usersRes.data.data || [])
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      router.replace('/')
      return
    }
    fetchOverview()
    const id = setInterval(fetchOverview, 15000)
    return () => clearInterval(id)
  }, [router])

  const statCards = [
    { label: "Total Users", value: stats?.users || 0, icon: Users, trend: "Live", color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Jobs", value: stats?.jobs || 0, icon: Briefcase, trend: "Live", color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Completed", value: stats?.completed || 0, icon: CheckCircle2, trend: "Success", color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Reports", value: stats?.reports || 0, icon: AlertTriangle, trend: "Attention", color: "text-red-600", bg: "bg-red-100" },
  ]

  // Map real financial data to chart format
  const chartData = financials.length > 0 
    ? financials.slice(-7).map(f => ({
        name: new Date(f.createdAt).toLocaleDateString([], { weekday: 'short' }),
        revenue: f._sum.amount || 0,
        count: f._count.id || 0
      }))
    : [
        { name: 'Mon', revenue: 0 },
        { name: 'Tue', revenue: 0 },
        { name: 'Wed', revenue: 0 },
        { name: 'Thu', revenue: 0 },
        { name: 'Fri', revenue: 0 },
        { name: 'Sat', revenue: 0 },
        { name: 'Sun', revenue: 0 },
      ];

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoaderPulse />
        <p className="text-slate-500 font-medium animate-pulse">Synchronizing Realtime Data...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">System Overview</h2>
          <p className="text-slate-500">Real-time performance metrics for Fixam Marketplace.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
          <Globe className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-wider">Live Network</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-3 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                stat.label === 'Reports' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Total Revenue Card */}
        <div className="lg:col-span-2 rounded-2xl border bg-slate-900 p-8 shadow-lg text-white overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-2">Total Platform Revenue</p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-5xl font-black">{formatCurrency(stats?.revenue || 0)}</h3>
            </div>
            <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider">
               <ArrowUpRight size={16} />
               +22% growth this month
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent" />
          <Wallet className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 rotate-12" />
        </div>

        {/* Recent Broadcasts */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Bell size={18} className="text-blue-600" />
              Recent Broadcasts
            </h3>
            <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {broadcasts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No recent broadcasts.</p>
            ) : (
              broadcasts.map((b, i) => (
                <div key={i} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{b.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(b.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Monthly Coin Sales & Revenue</h3>
              <p className="text-sm text-slate-500">Analytics tracking across real platform transactions.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="font-medium text-emerald-700">Live Trend</span>
            </div>
          </div>
          <div className="h-80 min-h-[320px] min-w-[1px] w-full">
            <ResponsiveContainer width="100%" height={320} debounce={50}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E293B" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1E293B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0F172A" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Users List */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              Recent Signups
            </h3>
            <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No users found.</p>
            ) : (
              users.slice(0, 6).map((u, i) => (
                <div key={i} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                      {u.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{u.fullName || 'Anonymous'}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">{u.role}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium italic">
                    {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoaderPulse() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="h-16 w-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      <div className="absolute h-10 w-10 rounded-full bg-blue-600/10 animate-ping" />
    </div>
  )
}
