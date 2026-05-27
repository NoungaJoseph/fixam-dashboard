"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, CheckCircle2, Clock, Loader2, Wallet, XCircle } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/api"
import { useSocket } from "@/hooks/useSocket"

const COLORS = ["#0D9488", "#14B8A6", "#2563EB", "#EF4444"]

export default function WalletPage() {
  const [payments, setPayments] = useState([])
  const [reportData, setReportData] = useState({ daily: [], weekly: [], monthly: [] })
  const [widgets, setWidgets] = useState({
    totalRevenue: 0,
    activePayments: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
  })
  const [methodStats, setMethodStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportPeriod, setReportPeriod] = useState("monthly")
  const [txFilter, setTxFilter] = useState("ALL")
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
  const { on } = useSocket(token)

  const fetchData = async () => {
    try {
      const financialRes = await dashboardService.getFinancialStats()
      const data = financialRes.data.data || {}
      setPayments(data.transactions || [])
      setReportData({
        daily: data.daily || [],
        weekly: data.weekly || [],
        monthly: data.monthly || [],
      })
      setWidgets(data.widgets || {})
      setMethodStats(data.methodStats || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load payment analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const off = on("admin:payment:update", () => fetchData())
    return () => off?.()
  }, [on])

  const successVsFailed = useMemo(() => [
    { name: "Successful", value: widgets.successfulTransactions || 0 },
    { name: "Pending", value: widgets.pendingTransactions || 0 },
    { name: "Failed", value: widgets.failedTransactions || 0 },
  ], [widgets])

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0D9488]" />
        <p className="font-medium text-slate-500">Loading automated payment analytics...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Payment Analytics</h2>
        <p className="text-slate-500">Automatic MTN MoMo and Orange Money transactions, revenue, and live payment status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric title="Total revenue" value={formatCurrency(widgets.totalRevenue || 0)} icon={Wallet} tone="teal" />
        <Metric title="Active payments" value={widgets.activePayments || 0} icon={Activity} tone="blue" />
        <Metric title="Successful" value={widgets.successfulTransactions || 0} icon={CheckCircle2} tone="emerald" />
        <Metric title="Pending" value={widgets.pendingTransactions || 0} icon={Clock} tone="amber" />
        <Metric title="Failed" value={widgets.failedTransactions || 0} icon={XCircle} tone="red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Revenue</h3>
            <div className="flex gap-2">
              {["daily", "weekly", "monthly"].map(p => (
                <button
                  key={p}
                  onClick={() => setReportPeriod(p)}
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${reportPeriod === p ? "bg-[#0D9488]/10 text-[#0D9488]" : "text-slate-400 hover:bg-slate-50"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData[reportPeriod]}>
                <defs>
                  <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="period" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#0D9488" strokeWidth={3} fill="url(#revenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-5 font-bold text-slate-900">Payment Method Statistics</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methodStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="method" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip formatter={(value, name) => name === "revenue" ? formatCurrency(value) : value} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {methodStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-5 font-bold text-slate-900">Successful vs Failed Payments</h3>
          <div className="space-y-4">
            {successVsFailed.map((item, index) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <span className="font-black text-slate-900">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, item.value * 8)}%`, backgroundColor: COLORS[index] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Live Transactions Feed</h3>
              <p className="text-sm text-slate-500">The list updates when payment webhooks credit wallets.</p>
            </div>
            <div className="flex gap-2">
              {["ALL", "SUCCESS", "PENDING", "FAILED"].map(s => (
                <button
                  key={s}
                  onClick={() => setTxFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${txFilter === s ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Customer</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Method</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Amount</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Coins</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.slice().reverse().filter(p => txFilter === "ALL" || p.status === txFilter).slice(0, 20).map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{payment.user?.fullName || payment.user?.phone || "Customer"}</p>
                      <p className="text-xs text-slate-500">{payment.phoneNumber}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700">{payment.paymentMethod?.replace("_", " ")}</td>
                    <td className="px-5 py-4 font-black text-slate-900">{formatCurrency(payment.amount)}</td>
                    <td className="px-5 py-4 font-black text-[#0D9488]">{payment.coins}</td>
                    <td className="px-5 py-4"><StatusPill status={payment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ title, value, icon: Icon, tone }) {
  const tones = {
    teal: "bg-[#0D9488]/10 text-[#0D9488]",
    blue: "bg-[#2563EB]/10 text-[#2563EB]",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  }
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function StatusPill({ status }) {
  const classes = status === "SUCCESS"
    ? "bg-emerald-100 text-emerald-700"
    : status === "FAILED"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700"
  return <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${classes}`}>{status}</span>
}
