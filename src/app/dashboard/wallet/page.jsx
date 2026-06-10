"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock, Loader2, Plus, Search, Wallet, XCircle, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/api"

const REASONS = ["Compensation", "Promotion", "Refund", "Welcome Bonus", "Manual Adjustment", "Other"]

export default function WalletPage() {
  const [stats, setStats] = useState({ overview: {}, daily: [], weekly: [], monthly: [], recentTransactions: [] })
  const [users, setUsers] = useState([])
  const [wireHistory, setWireHistory] = useState([])
  const [period, setPeriod] = useState("daily")
  const [loading, setLoading] = useState(true)
  const [wireLoading, setWireLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [coins, setCoins] = useState("")
  const [reason, setReason] = useState("Compensation")
  const [customReason, setCustomReason] = useState("")
  const [banner, setBanner] = useState(null)

  const fetchStats = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true)
      const res = await dashboardService.getWalletStats()
      setStats(res.data.data || { overview: {}, daily: [], weekly: [], monthly: [], recentTransactions: [] })
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load wallet stats")
    } finally {
      setLoading(false)
    }
  }

  const fetchWireHistory = async () => {
    const res = await dashboardService.getWireHistory()
    setWireHistory(res.data.data || [])
  }

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchStats(true)
      dashboardService.getUsers().then((res) => setUsers(res.data.data || [])).catch(() => {})
      fetchWireHistory().catch(() => {})
    }
    loadInitialData()
    const statsId = setInterval(() => fetchStats(false), 60000)
    const txId = setInterval(() => fetchStats(false), 30000)
    return () => {
      clearInterval(statsId)
      clearInterval(txId)
    }
  }, [])

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(id)
  }, [search])

  const overview = stats.overview || {}
  const successRate = overview.totalTransactions
    ? Math.round((overview.successfulTransactions / overview.totalTransactions) * 100)
    : 0

  const chartData = useMemo(() => {
    const rows = stats[period] || []
    return rows.map((item) => ({
      label: item.date || item.week || item.month,
      coinsPurchased: item.coinsPurchased || 0,
      revenueFCFA: item.revenueFCFA || 0
    }))
  }, [stats, period])

  const revenueThisMonth = useMemo(() => {
    const monthlyData = stats.monthly || []
    if (monthlyData.length === 0) return 0
    return monthlyData[monthlyData.length - 1].revenueFCFA || 0
  }, [stats.monthly])

  const filteredUsers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) return []
    return users.filter((user) =>
      (user.fullName || "").toLowerCase().includes(query) ||
      (user.phone || "").toLowerCase().includes(query)
    ).slice(0, 8)
  }, [users, debouncedSearch])

  const coinCount = Math.max(0, Number(coins || 0))
  const currentBalance = selectedUser?.wallet?.balance || 0
  const wireReason = reason === "Other" ? customReason : reason

  const handleWireCoins = async () => {
    if (!selectedUser || coinCount < 1 || coinCount > 10000) {
      setBanner({ type: "error", text: "Select a user and enter 1 to 10000 coins." })
      return
    }
    if (!wireReason?.trim()) {
      setBanner({ type: "error", text: "Reason is required." })
      return
    }
    try {
      setWireLoading(true)
      await dashboardService.wireCoins({ userId: selectedUser.id, amount: coinCount, reason: wireReason })
      setBanner({ type: "success", text: "Coins added successfully." })
      setCoins("")
      setReason("Compensation")
      setCustomReason("")
      await Promise.all([fetchStats(false), fetchWireHistory()])
    } catch (error) {
      setBanner({ type: "error", text: error.response?.data?.message || "Failed to wire coins." })
    } finally {
      setWireLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading wallet statistics...</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Wallet & Coins</h2>
        <p className="text-slate-500">Live coin purchases, wallet revenue, and manual coin adjustments.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Total Revenue" value={formatCurrency(overview.totalRevenueFCFA || 0)} icon={Wallet} tone="teal" />
        <Metric title="Total Coins Issued" value={(overview.totalCoinsIssued || 0).toLocaleString()} icon={Plus} tone="blue" />
        <Metric title="Revenue This Month" value={formatCurrency(revenueThisMonth)} icon={TrendingUp} tone="emerald" />
        <Metric title="Success Rate" value={`${successRate}%`} icon={CheckCircle2} tone="emerald" />
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Coin Purchases & Revenue</h3>
          <div className="flex rounded-xl border bg-slate-50 p-1">
            {["daily", "weekly", "monthly"].map((key) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest ${period === key ? "bg-slate-900 text-white" : "text-slate-500"}`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" stroke="#64748B" fontSize={12} />
              <YAxis yAxisId="left" stroke="#0D9488" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#2563EB" fontSize={12} />
              <Tooltip formatter={(value, name) => name === "revenueFCFA" ? formatCurrency(value) : value} />
              <Bar yAxisId="left" dataKey="coinsPurchased" name="Coins" fill="#0D9488" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="right" dataKey="revenueFCFA" name="Revenue FCFA" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h3 className="font-bold text-slate-900">Recent Transactions</h3>
        </div>
        <Table headers={["User", "Coins", "Amount (FCFA)", "Status", "Date"]}>
          {(stats.recentTransactions || []).map((tx) => (
            <tr key={tx.id} className="border-b last:border-b-0 hover:bg-slate-50">
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-900">{tx.userName || "Unknown user"}</p>
                <p className="text-xs text-slate-500">{tx.userPhone}</p>
              </td>
              <td className="px-5 py-4 font-black text-slate-900">{tx.coins}</td>
              <td className="px-5 py-4 font-bold text-slate-700">{tx.amountFCFA}</td>
              <td className="px-5 py-4"><StatusPill status={tx.status} /></td>
              <td className="px-5 py-4 text-sm text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </Table>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-5 font-bold text-slate-900">Wire Coins</h3>
          {banner && (
            <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-bold ${banner.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {banner.text}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Search User</label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Name or phone" />
              </div>
              {filteredUsers.length > 0 && (
                <div className="mt-2 overflow-hidden rounded-xl border">
                  {filteredUsers.map((user) => (
                    <button key={user.id} onClick={() => setSelectedUser(user)} className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-slate-50">
                      <Avatar user={user} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{user.fullName || "Unknown user"}</p>
                        <p className="text-xs text-slate-500">{user.phone}</p>
                      </div>
                      <span className="text-xs font-black text-slate-600">{user.wallet?.balance || 0} coins</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Number of coins</label>
              <input type="number" min="1" max="10000" value={coins} onChange={(e) => setCoins(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-400" />
              <div className="mt-2 flex gap-2">
                {[10, 50, 100, 500].map((amount) => (
                  <button key={amount} onClick={() => setCoins(String(amount))} className="rounded-lg border px-3 py-1 text-xs font-black text-slate-600 hover:bg-slate-50">{amount}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Reason</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-400">
                {REASONS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            {reason === "Other" && (
              <input value={customReason} onChange={(e) => setCustomReason(e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-400" placeholder="Custom reason" />
            )}
            {selectedUser && coinCount > 0 && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                Adding {coinCount} coins to {selectedUser.fullName || selectedUser.phone}. Balance: {currentBalance} &rarr; {currentBalance + coinCount} coins
              </div>
            )}
            <button onClick={handleWireCoins} disabled={wireLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-50">
              {wireLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Wire Coins
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-6">
            <h3 className="font-bold text-slate-900">Wire History</h3>
          </div>
          <Table headers={["User", "Coins Added", "Reason", "Date"]}>
            {wireHistory.map((tx) => (
              <tr key={tx.id} className="border-b last:border-b-0 hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-bold text-slate-900">{tx.wallet?.user?.fullName || tx.wallet?.user?.phone || "Unknown"}</td>
                <td className="px-5 py-4 font-black text-emerald-600">+{tx.amount}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{tx.description?.replace("Admin wired coins manually: ", "")}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  )
}

function Metric({ title, value, icon: Icon, tone }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
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

function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b bg-slate-50">
            {headers.map((header) => <th key={header} className="px-5 py-3 text-xs font-bold uppercase text-slate-500">{header}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Avatar({ user }) {
  if (user.avatar) {
    return <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
  }
  return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">{(user.fullName || user.phone || "U").charAt(0)}</div>
}

function StatusPill({ status }) {
  const classes = status === "SUCCESS"
    ? "bg-emerald-100 text-emerald-700"
    : status === "FAILED"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700"
  const Icon = status === "SUCCESS" ? CheckCircle2 : status === "FAILED" ? XCircle : Clock
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${classes}`}><Icon size={12} />{status}</span>
}
