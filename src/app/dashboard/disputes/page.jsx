"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { dashboardService } from "@/services/api"
import { ShieldAlert, Search, Filter, Calendar, User, Eye, ChevronRight } from "lucide-react"
import { toast } from "sonner"

export default function DisputesPage() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })

  const fetchDisputes = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 15 }
      if (search.trim()) params.search = search.trim()
      if (statusFilter !== "ALL") params.status = statusFilter
      if (categoryFilter !== "ALL") params.category = categoryFilter

      const res = await dashboardService.getDisputes(params)
      if (res.data?.success) {
        setDisputes(res.data.data || [])
        if (res.data.pagination) setPagination(res.data.pagination)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load disputes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisputes()
  }, [page, statusFilter, categoryFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchDisputes()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "OPEN":
      case "AWAITING_PROVIDER_RESPONSE":
      case "AWAITING_CLIENT_RESPONSE":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">AWAITING RESPONSE</span>
      case "UNDER_REVIEW":
      case "AWAITING_MORE_EVIDENCE":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800">UNDER REVIEW</span>
      case "CORRECTION_REQUESTED":
      case "CORRECTION_COMPLETED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">CORRECTION</span>
      case "RESOLVED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">RESOLVED</span>
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
            <ShieldAlert className="h-6 w-6 text-red-600" />
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Dispute & Resolution Center</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">Review active booking disputes, inspect evidence, and issue official resolutions</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Dispute ID, Booking ID, User..."
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
              <option value="AWAITING_PROVIDER_RESPONSE">Awaiting Provider Response</option>
              <option value="AWAITING_CLIENT_RESPONSE">Awaiting Client Response</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CORRECTION_REQUESTED">Correction Requested</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium text-xs">Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium text-xs">No disputes found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Dispute ID</th>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {disputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      DSP-{dispute.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      #{dispute.bookingId?.substring(0, 8)}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {dispute.client?.fullName || 'Client'}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {dispute.provider?.fullName || 'Provider'}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {dispute.category?.replace(/_/g, ' ')}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(dispute.status)}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/dashboard/disputes/${dispute.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Case Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total cases)
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
