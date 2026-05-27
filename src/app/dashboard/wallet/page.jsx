"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, CheckCircle2, Clock, Loader2, Wallet, XCircle, Plus, Search, User } from "lucide-react"
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
  
  const [showWireModal, setShowWireModal] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [wireAmount, setWireAmount] = useState("")
  const [wireReason, setWireReason] = useState("")
  const [isWiring, setIsWiring] = useState(false)
  const [wireHistory, setWireHistory] = useState([])
  const [searchUser, setSearchUser] = useState("")
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
    dashboardService.getUsers?.().then(res => setUsers(res.data.data || [])).catch(() => {})
    dashboardService.getWireHistory?.().then(res => setWireHistory(res.data.data || [])).catch(() => {})
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

  const filteredUsers = useMemo(() => {
    if (!searchUser) return users.slice(0, 50)
    return users.filter(u => 
      (u.fullName || "").toLowerCase().includes(searchUser.toLowerCase()) || 
      (u.phone || "").includes(searchUser) ||
      (u.email || "").toLowerCase().includes(searchUser.toLowerCase())
    ).slice(0, 50)
  }, [users, searchUser])

  const handleWireCoins = async () => {
    if (!selectedUserId || !wireAmount) {
      toast.error("User and amount are required")
      return
    }
    try {
      setIsWiring(true)
      await dashboardService.wireCoins({ userId: selectedUserId, amount: Number(wireAmount), reason: wireReason })
      toast.success("Coins wired successfully")
      setShowWireModal(false)
      setSelectedUserId("")
      setWireAmount("")
      setWireReason("")
      fetchData()
      dashboardService.getWireHistory?.().then(res => setWireHistory(res.data.data || [])).catch(() => {})
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to wire coins")
    } finally {
      setIsWiring(false)
    }
  }

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Payment Analytics</h2>
          <p className="text-slate-500">Automatic MTN MoMo and Orange Money transactions, revenue, and live payment status.</p>
        </div>
        <button 
          onClick={() => setShowWireModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} />
          Wire Coins
        </button>
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

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm flex flex-col">
          <div className="border-b p-6">
            <h3 className="font-bold text-slate-900">Wire History</h3>
            <p className="text-sm text-slate-500">Manual coin adjustments by admins</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px]">
            {wireHistory.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No manual wire history found.</div>
            ) : (
              <div className="divide-y">
                {wireHistory.map(tx => (
                  <div key={tx.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-slate-800">{tx.wallet?.user?.fullName || tx.wallet?.user?.phone}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{tx.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black ${tx.type === "PURCHASE" ? "text-emerald-600" : "text-red-600"}`}>
                        {tx.type === "PURCHASE" ? "+" : "-"}{tx.amount}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm col-span-1 xl:col-span-2 mt-2">
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

      {showWireModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Wire Coins to Wallet</h3>
              <button onClick={() => setShowWireModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Select User</label>
                <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50">
                  <Search size={16} className="text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name, phone or email..." 
                    className="w-full bg-transparent outline-none text-sm"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>
                <div className="border rounded-xl max-h-[150px] overflow-y-auto mt-2">
                  {filteredUsers.map(u => (
                    <div 
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`px-3 py-2 text-sm cursor-pointer flex justify-between items-center border-b last:border-b-0 ${selectedUserId === u.id ? "bg-slate-900 text-white" : "hover:bg-slate-50"}`}
                    >
                      <span>{u.fullName || "Unknown"}</span>
                      <span className="text-xs opacity-70">{u.phone}</span>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && <div className="p-3 text-center text-sm text-slate-500">No users found</div>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Amount (Coins)</label>
                <input 
                  type="number" 
                  value={wireAmount}
                  onChange={(e) => setWireAmount(e.target.value)}
                  placeholder="e.g. 100 or -50 to deduct"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Reason / Description</label>
                <input 
                  type="text" 
                  value={wireReason}
                  onChange={(e) => setWireReason(e.target.value)}
                  placeholder="e.g. Compensation for failed task"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-slate-400"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowWireModal(false)}
                  className="flex-1 py-3 px-4 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleWireCoins}
                  disabled={isWiring || !selectedUserId || !wireAmount}
                  className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isWiring && <Loader2 size={16} className="animate-spin" />}
                  Confirm Wire
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
