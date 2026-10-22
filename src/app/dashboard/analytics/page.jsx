"use client"

import { useEffect, useState } from "react"
import { Activity, Briefcase, Download, Star, Users } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/api"

const COLORS = ["#0D9488", "#2563EB", "#F59E0B", "#EF4444", "#7C3AED"]

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const res = await dashboardService.getAnalytics()
      setData(res.data.data || {})
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchAnalytics()
    }
    loadInitialData()
  }, [])

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading analytics...</div>

  const providerVerification = [
    { name: "Verified", value: data?.providerStats?.totalVerified || 0 },
    { name: "Pending", value: data?.providerStats?.totalPending || 0 },
    { name: "Unverified", value: data?.providerStats?.totalUnverified || 0 },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Platform Analytics</h2>
          <p className="text-slate-500">Revenue growth, user activity, jobs, categories, and provider health.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800">
          <Download size={18} />
          Export Reports
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="User Growth">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="newUsers" name="Total Users" stroke="#0D9488" strokeWidth={3} />
              <Line type="monotone" dataKey="newProviders" name="New Providers" stroke="#2563EB" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Job Activity">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.jobStats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="posted" fill="#2563EB" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" fill="#0D9488" radius={[6, 6, 0, 0]} />
              <Bar dataKey="cancelled" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <ChartCard title="Revenue">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.revenueStats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Area type="monotone" dataKey="revenueFCFA" name="Revenue FCFA" stroke="#0F172A" fill="#0F172A" fillOpacity={0.12} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Provider Verification">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={providerVerification} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                {providerVerification.map((entry, index) => <Cell key={entry.name} fill={COLORS[index]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-bold text-slate-900">Top Job Categories</h3>
          <div className="space-y-4">
            {(data?.topCategories || []).map((item, index) => (
              <div key={item.category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-bold text-slate-700">{item.category}</span>
                  <span className="font-black text-slate-900">{item.count} jobs</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-bold text-slate-900">Provider Leaderboard</h3>
          <div className="space-y-4">
            {(data?.providerStats?.topRanked || []).map((provider, index) => (
              <div key={`${provider.name}-${index}`} className="flex items-center gap-3 border-b pb-4 last:border-0 last:pb-0">
                <Avatar user={provider} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{provider.name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{provider.skillRank}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-500">
                    <Star size={13} fill="currentColor" />
                    {provider.rating || 0}
                    <span className="ml-2 text-slate-400">{provider.completedJobs} completed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <HealthCard label="Job completion rate" value={`${data?.platformHealth?.avgJobCompletionRate || 0}%`} icon={Briefcase} />
        <HealthCard label="Active users (7 days)" value={data?.platformHealth?.totalActiveUsers || 0} icon={Users} />
        <HealthCard label="Avg provider response" value={data?.platformHealth?.avgProviderResponseTime || "N/A"} icon={Activity} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Users and providers by country">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.countryStats || []} margin={{ bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} height={70} fontSize={11} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="clients" name="Clients" stackId="users" fill="#0D9488" />
              <Bar dataKey="providers" name="Providers" stackId="users" fill="#2563EB" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Jobs by country">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.countryStats || []} margin={{ bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} height={70} fontSize={11} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="jobsPosted" name="Posted" fill="#F59E0B" radius={[5, 5, 0, 0]} />
              <Bar dataKey="jobsCompleted" name="Completed" fill="#0D9488" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Revenue by country</h3>
        <p className="mb-5 text-sm text-slate-500">Amounts are shown in each market’s local currency and are not foreign-exchange normalized.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.countryStats || []).map(row => <div key={row.country} className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{row.label}</p><p className="mt-2 text-xl font-black text-slate-900">{Number(row.revenue || 0).toLocaleString()} <span className="text-xs text-slate-500">{row.currency}</span></p><p className="mt-1 text-xs text-slate-500">{Number(row.coins || 0).toLocaleString()} coins credited</p></div>)}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-900">Users by country</h3>
          <p className="text-sm text-slate-500">Registered clients and providers across Fixam markets.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b text-xs uppercase tracking-wide text-slate-400"><th className="py-3">Country</th><th className="py-3 text-right">Total users</th><th className="py-3 text-right">Clients</th><th className="py-3 text-right">Providers</th><th className="py-3 text-right">Verified</th><th className="py-3 text-right">Jobs</th><th className="py-3 text-right">Completed</th><th className="py-3 text-right">Revenue</th></tr></thead>
            <tbody>{(data?.countryStats || []).map(row => <tr key={row.country} className="border-b last:border-0"><td className="py-4 font-bold text-slate-900">{row.label}</td><td className="py-4 text-right font-black">{row.totalUsers}</td><td className="py-4 text-right">{row.clients}</td><td className="py-4 text-right">{row.providers}</td><td className="py-4 text-right">{row.verifiedProviders}</td><td className="py-4 text-right">{row.jobsPosted}</td><td className="py-4 text-right">{row.jobsCompleted}</td><td className="whitespace-nowrap py-4 text-right font-bold">{Number(row.revenue || 0).toLocaleString()} {row.currency}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-bold text-slate-900">{title}</h3>
      <div className="h-80">{children}</div>
    </div>
  )
}

function HealthCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-blue-600" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function Avatar({ user }) {
  if (user.avatar) {
    return <img src={user.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
  }
  return <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-500">{(user.name || "P").charAt(0)}</div>
}
