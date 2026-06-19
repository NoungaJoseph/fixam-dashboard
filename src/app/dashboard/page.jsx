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
    fetchOverview()
    const id = setInterval(fetchOverview, 60000)
    return () => clearInterval(id)
  }, [router])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="font-medium text-slate-500 animate-pulse">Loading system data...</p>
      </div>
    )
  }

  // Map backend stats to the design structure
  const cards = [
    { 
      title: "TOTAL REVENUE (SETTLED)", 
      value: `${(stats?.totalRevenue || 0).toLocaleString()} FCFA`, 
      sub: `${stats?.completedJobs || 0} transactions`, 
      icon: CreditCard,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    { 
      title: "APPROVED EXPENSES", 
      value: "0 FCFA", 
      sub: "0 claims", 
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    { 
      title: "ACTIVE EMPLOYEES", 
      value: String(stats?.totalProviders || 0), 
      sub: "0 suspended", 
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    { 
      title: "PENDING TRANSACTIONS", 
      value: `${(stats?.monthlyRevenue || 0).toLocaleString()} FCFA`, 
      sub: `${stats?.activeJobs || 0} awaiting`, 
      icon: RefreshCw,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
  ]

  const chartData = [
    { name: 'Jan', downloads: 400, active: 240 },
    { name: 'Feb', downloads: 300, active: 139 },
    { name: 'Mar', downloads: 200, active: 980 },
    { name: 'Apr', downloads: 278, active: 390 },
    { name: 'May', downloads: 189, active: 480 },
    { name: 'Jun', downloads: 239, active: 380 },
    { name: 'Jul', downloads: 349, active: 430 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#1E293B]">Enterprise Command Center</h2>
          <p className="text-[15px] text-slate-600 mt-1">Welcome back, <span className="font-bold text-slate-800">FIXAM CEO</span>. System status is nominal.</p>
        </div>
        <button className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-[13px] font-bold tracking-wide text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
          <Download className="h-4 w-4 text-slate-500" />
          EXPORT EXECUTIVE REPORT
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => (
          <div key={i} className="rounded-2xl bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col">
            <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center mb-6`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">{card.title}</h3>
            <div className="flex items-baseline gap-1 mt-auto">
              <span className="text-3xl font-bold text-slate-800">{card.value.split(' ')[0]}</span>
              {card.value.split(' ')[1] && <span className="text-xl font-bold text-slate-800">{card.value.split(' ')[1]}</span>}
            </div>
            <p className="mt-2 text-[12px] font-medium text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Health Score */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <Activity className="h-5 w-5 text-slate-600" />
            <h3 className="text-[15px] font-bold text-slate-700">FIXAM Health Score</h3>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="relative h-48 w-48">
              {/* Circular Progress SVG */}
              <svg className="h-full w-full" viewBox="0 0 100 100">
                <circle 
                  className="text-slate-100 stroke-current" 
                  strokeWidth="8" 
                  cx="50" cy="50" r="40" 
                  fill="transparent" 
                />
                <circle 
                  className="text-[#312E81] stroke-current" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  cx="50" cy="50" r="40" 
                  fill="transparent" 
                  strokeDasharray="251.2" 
                  strokeDashoffset="37.68" 
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-[#1E293B]">85</span>
                <span className="text-[11px] font-bold text-slate-400 tracking-widest">/ 100</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 border-t border-slate-100 pt-4">
            <div className="text-center w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">USERS</span>
            </div>
            <div className="text-center w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">REVENUE</span>
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
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">DOWNLOADS</p>
                <p className="text-xl font-bold text-slate-800">1,955</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">MAU</p>
                <p className="text-xl font-bold text-slate-800">12,156</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">DAU</p>
                <p className="text-xl font-bold text-slate-800">434</p>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="downloads" stroke="#312E81" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="active" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
