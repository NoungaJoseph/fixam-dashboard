"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock, Loader2, Plus, Search, Wallet, XCircle, TrendingUp, AlertCircle, Check, X, ShieldCheck } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/api"

const REASONS = ["Compensation", "Promotion", "Refund", "Welcome Bonus", "Manual Adjustment", "Other"]

export default function WalletPage() {
  const [stats, setStats] = useState({ overview: {}, daily: [], weekly: [], monthly: [], recentTransactions: [] })
  const [pendingTransactions, setPendingTransactions] = useState([])
  const [users, setUsers] = useState([])
  const [wireHistory, setWireHistory] = useState([])
  const [period, setPeriod] = useState("daily")
  const [loading, setLoading] = useState(true)
  const [wireLoading, setWireLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedUsers, setSelectedUsers] = useState([])
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

  const fetchPendingTransactions = async () => {
    try {
      const res = await dashboardService.getPendingTransactions()
      setPendingTransactions(res.data.data || [])
    } catch (error) {
      console.error("Failed to load pending transactions:", error)
    }
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchStats(false),
        fetchPendingTransactions(),
        fetchWireHistory()
      ])
      toast.success("Payment requests and wallet stats updated!")
    } catch (error) {
      toast.error("Failed to refresh requests")
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const fetchWireHistory = async () => {
    try {
      const res = await dashboardService.getWireHistory()
      setWireHistory(res.data.data || [])
    } catch (_) {}
  }

  const loadAllData = async (showLoader = false) => {
    await Promise.allSettled([
      fetchStats(showLoader),
      fetchPendingTransactions(),
      fetchWireHistory(),
      dashboardService.getUsers().then((res) => setUsers(res.data.data || []))
    ])
  }

  useEffect(() => {
    loadAllData(true)
    const statsId = setInterval(() => {
      fetchStats(false)
      fetchPendingTransactions()
    }, 15000)
    return () => clearInterval(statsId)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(id)
  }, [search])

  const handleApproveTransaction = async (transactionId) => {
    setActionLoadingId(transactionId)
    try {
      const res = await dashboardService.approveTransaction({ transactionId, status: 'SUCCESS' })
      if (res.data?.success) {
        toast.success("Payment request approved! Coins credited to user wallet.")
        await Promise.all([fetchStats(false), fetchPendingTransactions()])
      } else {
        toast.error(res.data?.message || "Failed to approve transaction")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve transaction")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectTransaction = async (transactionId) => {
    if (!confirm("Are you sure you want to reject this payment request?")) return
    setActionLoadingId(transactionId)
    try {
      const res = await dashboardService.approveTransaction({ transactionId, status: 'FAILED' })
      if (res.data?.success) {
        toast.success("Payment request marked as rejected.")
        await Promise.all([fetchStats(false), fetchPendingTransactions()])
      } else {
        toast.error(res.data?.message || "Failed to reject transaction")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject transaction")
    } finally {
      setActionLoadingId(null)
    }
  }

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
      !selectedUsers.some(su => su.id === user.id) &&
      ((user.fullName || "").toLowerCase().includes(query) ||
      (user.phone || "").toLowerCase().includes(query))
    ).slice(0, 8)
  }, [users, debouncedSearch, selectedUsers])

  const coinCount = Math.max(0, Number(coins || 0))
  const wireReason = reason === "Other" ? customReason : reason

  const handleWireCoins = async () => {
    if (selectedUsers.length === 0 || coinCount < 1 || coinCount > 10000) {
      setBanner({ type: "error", text: "Select at least one user and enter 1 to 10000 coins." })
      return
    }
    if (!wireReason?.trim()) {
      setBanner({ type: "error", text: "Reason is required." })
      return
    }
    try {
      setWireLoading(true)
      await Promise.all(
        selectedUsers.map(user => 
          dashboardService.wireCoins({ userId: user.id, amount: coinCount, reason: wireReason })
        )
      )
      setBanner({ type: "success", text: `Coins added successfully to ${selectedUsers.length} user(s).` })
      setCoins("")
      setReason("Compensation")
      setCustomReason("")
      setSelectedUsers([])
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px]">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Wallet & Coin Transactions</h2>
        <p className="text-slate-500">Live payment requests, coin purchases, and administrative wallet operations.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Total Revenue" value={formatCurrency(overview.totalRevenueFCFA || 0)} icon={Wallet} tone="teal" />
        <Metric title="Total Coins Issued" value={(overview.totalCoinsIssued || 0).toLocaleString()} icon={Plus} tone="blue" />
        <Metric title="Revenue This Month" value={formatCurrency(revenueThisMonth)} icon={TrendingUp} tone="emerald" />
        <Metric title="Pending Requests" value={String(pendingTransactions.length)} icon={AlertCircle} tone="amber" />
      </div>

      {/* PENDING PAYMENT REQUESTS (NEW / ACTIONABLE) */}
      <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
        <div className="border-b border-amber-200/60 bg-amber-100/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Pending Payment Requests</h3>
                {pendingTransactions.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse">
                    {pendingTransactions.length} Action Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Review submitted Mobile Money payment requests from website & mobile app.
              </p>
            </div>
          </div>
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-2 disabled:opacity-60"
          >
            <Loader2 size={14} className={isRefreshing ? "animate-spin text-teal-600" : "text-slate-400"} />
            {isRefreshing ? "Refreshing..." : "Refresh Requests"}
          </button>
        </div>

        {pendingTransactions.length === 0 ? (
          <div className="p-12 text-center bg-white">
            <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h4 className="text-sm font-bold text-slate-800">All caught up!</h4>
            <p className="text-xs text-slate-500 mt-1">There are currently no pending coin payment requests awaiting approval.</p>
          </div>
        ) : (
          <div className="bg-white divide-y divide-slate-100">
            {pendingTransactions.map((tx) => {
              const userName = tx.wallet?.user?.fullName || tx.payerName || "Anonymous User";
              const userPhone = tx.payerPhone || tx.wallet?.user?.phone || "N/A";
              const userEmail = tx.payerEmail || tx.wallet?.user?.email || "";
              const isLoading = actionLoadingId === tx.id;

              return (
                <div key={tx.id} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-slate-50/80 transition">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border">
                        Ref: {tx.reference || tx.id.substring(0, 10)}
                      </span>
                      <span className="text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md uppercase">
                        PENDING VERIFICATION
                      </span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h4 className="text-base font-bold text-slate-900">{userName}</h4>
                      <span className="text-xs text-slate-500">📞 {userPhone}</span>
                      {userEmail && <span className="text-xs text-slate-400">✉️ {userEmail}</span>}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {tx.description || `Coin Purchase Request: ${tx.amount} coins`}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>📅 {new Date(tx.createdAt).toLocaleString()}</span>
                      <span>💰 Expected: <strong className="text-slate-800 font-bold">{tx.paidPrice || "XAF"}</strong></span>
                    </div>
                  </div>

                  {/* Coin Amount & Action Buttons */}
                  <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    <div className="text-right px-4">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Coins</span>
                      <span className="text-2xl font-black text-teal-600">+{tx.amount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveTransaction(tx.id)}
                        disabled={isLoading}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Approve & Credit
                      </button>
                      <button
                        onClick={() => handleRejectTransaction(tx.id)}
                        disabled={isLoading}
                        className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart Section */}
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="coinsPurchased" fill="#0f172a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wire Coins & Wire History */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">Directly Wire Coins to Users</h3>
          <p className="mt-1 text-sm text-slate-500">Manually issue coins directly to client or provider accounts.</p>

          {banner && (
            <div className={`mt-4 rounded-xl p-3 text-sm font-semibold ${banner.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {banner.text}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Search users</label>
              <div className="relative mt-2">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by full name or phone number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border bg-slate-50 pl-11 pr-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              {filteredUsers.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border bg-white p-2 shadow-lg">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUsers((prev) => [...prev, user])
                        setSearch("")
                      }}
                      className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{user.fullName || "Anonymous"}</p>
                        <p className="text-xs text-slate-500">{user.phone} • {user.role}</p>
                      </div>
                      <span className="text-xs font-black text-slate-600">{user.wallet?.balance || 0} coins</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedUsers.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 rounded-xl border bg-slate-50 px-3 py-2">
                      <div className="h-8 w-8 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs">
                        {(user.fullName || "U").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{user.fullName || "Unknown user"}</p>
                        <p className="text-xs text-slate-500">{user.phone}</p>
                      </div>
                      <button onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))} className="p-2 text-slate-400 hover:text-red-500">
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Number of coins</label>
              <input type="number" min="1" max="10000" value={coins} onChange={(e) => setCoins(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-400" placeholder="e.g. 50" />
              <div className="mt-2 flex gap-2">
                {[10, 50, 100, 500].map((amount) => (
                  <button key={amount} onClick={() => setCoins(String(amount))} className="rounded-lg border px-3 py-1 text-xs font-black text-slate-600 hover:bg-slate-50">+{amount}</button>
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

            {selectedUsers.length > 0 && coinCount > 0 && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                Adding {coinCount} coins to {selectedUsers.length} user(s). Total: {coinCount * selectedUsers.length} coins
              </div>
            )}

            <button onClick={handleWireCoins} disabled={wireLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-50 hover:bg-slate-800 transition">
              {wireLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Wire Coins Now
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-6">
            <h3 className="font-bold text-slate-900">Wire History</h3>
          </div>
          <Table headers={["User", "Coins Added", "Reason", "Date"]}>
            {wireHistory.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-xs text-slate-400">No wire history records found.</td></tr>
            ) : (
              wireHistory.map((tx) => (
                <tr key={tx.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-bold text-slate-900">{tx.wallet?.user?.fullName || tx.wallet?.user?.phone || "Unknown"}</td>
                  <td className="px-5 py-4 font-black text-emerald-600">+{tx.amount}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{tx.description?.replace("Admin wired coins manually: ", "")}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </Table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h3 className="font-bold text-slate-900">All Recent Transactions</h3>
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

function StatusPill({ status }) {
  const styles = {
    SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    FAILED: "bg-rose-50 text-rose-700 border-rose-200"
  }
  return (
    <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-extrabold uppercase ${styles[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  )
}
