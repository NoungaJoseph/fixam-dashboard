"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { dashboardService } from "@/services/api"
import { FileText, Search, Filter, Calendar, User, Eye, Download } from "lucide-react"
import { toast } from "sonner"

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })

  const fetchAgreements = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 15 }
      if (search.trim()) params.search = search.trim()
      if (statusFilter !== "ALL") params.status = statusFilter

      const res = await dashboardService.getAgreements(params)
      if (res.data?.success) {
        setAgreements(res.data.data || [])
        if (res.data.pagination) setPagination(res.data.pagination)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load agreements.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgreements()
  }, [page, statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchAgreements()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">ACTIVE</span>
      case "PENDING_ACCEPTANCE":
      case "PARTIALLY_ACCEPTED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">PENDING</span>
      case "COMPLETED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">COMPLETED</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800">{status}</span>
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-teal-600" />
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Fixam Service Agreements</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Browse and inspect all digital service contracts generated across bookings and tasks
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Agreement #, Booking ID, Task ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs outline-none w-full text-slate-800"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg p-2 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active (Both Accepted)</option>
              <option value="PENDING_ACCEPTANCE">Pending Acceptance</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agreements Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium text-xs">Loading agreements...</div>
        ) : agreements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium text-xs">No service agreements found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Agreement #</th>
                  <th className="p-4">Source Type</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Agreed Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Issued Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {agreements.map((agreement) => {
                  const terms = agreement.terms || {}
                  return (
                    <tr key={agreement.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {agreement.publicAgreementNumber} (v{agreement.version})
                      </td>
                      <td className="p-4 font-bold text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                          {agreement.sourceType}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {agreement.client?.fullName || terms.client?.name || 'Client'}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {agreement.provider?.fullName || terms.provider?.name || 'Provider'}
                      </td>
                      <td className="p-4 font-bold text-teal-600">
                        {terms.price ? terms.price.toLocaleString() : '0'} {terms.currency || 'XAF'}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(agreement.status)}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(agreement.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/dashboard/agreements/${agreement.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Contract</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total agreements)
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
