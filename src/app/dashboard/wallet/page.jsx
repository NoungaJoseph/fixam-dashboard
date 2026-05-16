"use client"

import { useEffect, useState } from "react"
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Clock as ClockIcon,
  Loader2
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

export default function WalletPage() {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ monthlySales: 0, totalRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState(null)
  const [lookupId, setLookupId] = useState("")
  const [lookupTx, setLookupTx] = useState(null)
  const [approvingId, setApprovingId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [txRes, statsRes] = await Promise.all([
        dashboardService.getPendingTransactions(),
        dashboardService.getStats()
      ]);
      setTransactions(txRes.data.data);
      setStats({
        monthlySales: statsRes.data.data.revenue / 1500, // Assuming 1 coin = 1500 FCFA
        totalRevenue: statsRes.data.data.revenue
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        toast.error("Unauthorized. Please login again.");
        // Optional: window.location.href = "/login"
      } else {
        toast.error("Failed to load financial data");
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = setTimeout(fetchData, 0)
    return () => clearTimeout(id)
  }, [])

  const handleApprove = async (id, status) => {
    if (approvingId) return

    try {
      setApprovingId(id)
      await dashboardService.approveTransaction({ transactionId: id, status });
      toast.success(`Transaction ${status === 'SUCCESS' ? 'Approved' : 'Rejected'}`);
      setSelectedTx(null);
      setLookupTx((current) => current?.id === id ? null : current);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setApprovingId(null)
    }
  }

  const handleGenerateLookup = () => {
    const term = lookupId.trim().toLowerCase()
    if (!term) {
      toast.error("Enter a transaction ID first")
      return
    }

    const found = transactions.find((tx) =>
      tx.id.toLowerCase().includes(term) ||
      tx.reference?.toLowerCase().includes(term)
    )

    if (!found) {
      setLookupTx(null)
      toast.error("No pending transaction found for that ID")
      return
    }

    setLookupTx(found)
    setSelectedTx(found)
  }

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <p className="text-slate-500 font-medium">Loading financial records...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Wallet & Coins</h2>
        <p className="text-slate-500">Monitor coin purchases and approve manual payment verifications.</p>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-medium">Pending Approvals</p>
            <h3 className="text-3xl font-bold mt-2">{formatCurrency(transactions.reduce((acc, curr) => acc + curr.amount, 0))}</h3>
            <div className="mt-4 flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-wider">
              <ClockIcon size={14} />
              {transactions.length} Transactions Waiting
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] text-slate-800 opacity-20">
            <Wallet size={120} />
          </div>
        </div>
        
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Monthly Coin Sales</p>
          <h3 className="text-3xl font-bold mt-2 text-slate-900">{Math.floor(stats.monthlySales)} <span className="text-sm font-normal text-slate-400">Coins</span></h3>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <ArrowUpRight size={14} />
            Realtime data
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Total Platform Revenue</p>
          <h3 className="text-3xl font-bold mt-2 text-slate-900">{formatCurrency(stats.totalRevenue)}</h3>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <ArrowUpRight size={14} />
            Verified growth
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between flex-wrap gap-4">
          <h3 className="font-bold text-slate-800">Transaction History</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 border">
              <Search className="h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search ID or User..." className="bg-transparent text-sm outline-none" />
            </div>
            <button className="p-2 border rounded-lg hover:bg-slate-50 text-slate-600"><Filter size={20}/></button>
          </div>
        </div>

        <div className="border-b bg-blue-50/60 p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-700">Credit coins by transaction ID</p>
              <p className="mt-1 text-sm text-slate-600">
                Enter the transaction ID from the app receipt, click Generate, review the requested coins and receipt, then confirm.
              </p>
              <input
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Paste transaction ID or PAY reference"
                className="mt-3 h-11 w-full rounded-xl border bg-white px-4 text-sm font-mono outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleGenerateLookup}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700"
            >
              Generate
            </button>
          </div>
          {lookupTx && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4 text-sm">
              <div className="grid gap-3 md:grid-cols-4">
                <div><p className="text-slate-400 font-bold">User</p><p className="font-semibold">{lookupTx.wallet?.user?.fullName || lookupTx.payerName || 'Unknown'}</p></div>
                <div><p className="text-slate-400 font-bold">Requested Coins</p><p className="font-black">{lookupTx.amount}</p></div>
                <div><p className="text-slate-400 font-bold">Paid</p><p className="font-semibold">{lookupTx.paidPrice || 'Manual transfer'}</p></div>
                <div className="flex items-end">
                  <button
                    onClick={() => handleApprove(lookupTx.id, 'SUCCESS')}
                    disabled={approvingId === lookupTx.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                  >
                    {approvingId === lookupTx.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Confirm Credit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-20 text-center text-slate-400">
              <Wallet size={40} className="mx-auto mb-4 opacity-20" />
              <p>No pending purchase requests.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Coins</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 truncate max-w-[100px]">{tx.id.slice(-8)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{tx.wallet?.user?.fullName || 'No Name'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded ${
                        tx.type === 'PURCHASE' ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {tx.type === 'PURCHASE' ? <ArrowDownLeft size={12}/> : <ArrowUpRight size={12}/>}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{tx.paidPrice || tx.description?.match(/(\d[\d,.\s]*\s*FCFA)/)?.[1] || 'Manual'}</td>
                    <td className="px-6 py-4 text-center font-black text-slate-700">{Math.abs(tx.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        tx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 
                        tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {tx.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleApprove(tx.id, 'SUCCESS')}
                            disabled={approvingId === tx.id}
                            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200" 
                            title="Approve"
                          >
                            {approvingId === tx.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18}/>}
                          </button>
                          <button 
                            onClick={() => handleApprove(tx.id, 'FAILED')}
                            disabled={approvingId === tx.id}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" 
                            title="Reject"
                          >
                            <XCircle size={18}/>
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setSelectedTx(tx)} className="text-sm font-bold text-blue-600 hover:underline">View Details</button>
                      )}
                      {tx.status === 'PENDING' && (
                        <button onClick={() => setSelectedTx(tx)} className="ml-3 text-sm font-bold text-blue-600 hover:underline">Details</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Payment Request Details</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedTx.reference || selectedTx.id}</p>
              </div>
              <button onClick={() => setSelectedTx(null)} className="px-3 py-1 border rounded-lg text-sm">Close</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-400 font-bold">Transaction ID</p><p className="font-mono break-all">{selectedTx.id}</p></div>
              <div><p className="text-slate-400 font-bold">Payment Reference</p><p className="font-mono break-all">{selectedTx.reference || 'N/A'}</p></div>
              <div><p className="text-slate-400 font-bold">User</p><p>{selectedTx.wallet?.user?.fullName || selectedTx.payerName || 'Unknown'}</p></div>
              <div><p className="text-slate-400 font-bold">Phone</p><p>{selectedTx.payerPhone || selectedTx.wallet?.user?.phone || 'N/A'}</p></div>
              <div><p className="text-slate-400 font-bold">Email</p><p>{selectedTx.payerEmail || selectedTx.wallet?.user?.email || 'N/A'}</p></div>
              <div><p className="text-slate-400 font-bold">Coins</p><p>{selectedTx.amount}</p></div>
              <div><p className="text-slate-400 font-bold">Amount paid</p><p>{selectedTx.paidPrice || 'Manual transfer'}</p></div>
              <div><p className="text-slate-400 font-bold">Status</p><p>{selectedTx.status}</p></div>
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedTx.receiptUrl && (
                <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://192.168.1.185:5000'}${selectedTx.receiptUrl}`} target="_blank" className="inline-flex px-4 py-2 rounded-lg bg-slate-900 text-white font-bold">
                  Open Receipt
                </a>
              )}
              {selectedTx.status === 'PENDING' && (
                <>
                  <button disabled={approvingId === selectedTx.id} onClick={() => handleApprove(selectedTx.id, 'SUCCESS')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold disabled:opacity-60">
                    {approvingId === selectedTx.id && <Loader2 size={16} className="animate-spin" />}
                    Confirm Credit {selectedTx.amount} Coins
                  </button>
                  <button disabled={approvingId === selectedTx.id} onClick={() => handleApprove(selectedTx.id, 'FAILED')} className="inline-flex px-4 py-2 rounded-lg bg-red-100 text-red-700 font-bold disabled:opacity-60">
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
