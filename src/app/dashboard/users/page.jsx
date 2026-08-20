"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Search, Filter, Ban, Eye, Download, X, MessageSquare, CheckCircle, ShieldAlert, User, Phone, Mail, Calendar, Coins, MapPin } from "lucide-react"
import { format } from "date-fns"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 25,
        search: debouncedSearch || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      }
      const res = await dashboardService.getUsers(params)
      setUsers(res.data?.data || [])
      setTotalUsersCount(res.data?.meta?.total || 0)
      setTotalPages(res.data?.meta?.totalPages || 1)
    } catch (err) {
      console.error("Failed to load users:", err)
      toast.error("Could not load users list")
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openUser = async (id) => {
    try {
      const res = await dashboardService.getUserDetails(id)
      setSelectedUser(res.data?.data || null)
    } catch (error) {
      toast.error("Could not load user profile details")
    }
  }

  const toggleBlock = async (user) => {
    const reason = user.isBlocked ? "" : window.prompt("Reason for blocking this user?", "Account under review / Terms violation")
    if (!user.isBlocked && reason === null) return
    try {
      setStatusLoading(true)
      await dashboardService.updateUserStatus(user.id, { isBlocked: !user.isBlocked, reason })
      toast.success(user.isBlocked ? "User restored successfully" : "User blocked successfully")
      await fetchUsers()
      if (selectedUser?.id === user.id) await openUser(user.id)
    } catch (error) {
      toast.error("Could not update user status")
    } finally {
      setStatusLoading(false)
    }
  }

  const messageUser = async (user) => {
    try {
      const res = await dashboardService.createConversation({ participantId: user.id })
      const conversation = res.data?.data
      setSelectedUser(null)
      if (conversation?.id) {
        router.push(`/dashboard/messages?conversationId=${conversation.id}`)
      } else {
        router.push(`/dashboard/messages`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start conversation")
    }
  }

  // Export all matching users to CSV
  const handleExportUsers = async () => {
    try {
      setExporting(true)
      toast.info("Preparing users export...")
      const res = await dashboardService.getUsers({
        all: true,
        search: debouncedSearch || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      })
      const exportList = res.data?.data || users

      if (!exportList.length) {
        toast.error("No users to export")
        return
      }

      const headers = ["User ID", "Full Name", "Email", "Phone", "Role", "Country", "Coins Balance", "Status", "Email Verified", "Joined Date"]
      const rows = exportList.map(u => [
        `"${u.id || ''}"`,
        `"${(u.fullName || '').replace(/"/g, '""')}"`,
        `"${u.email || ''}"`,
        `"${u.phone || ''}"`,
        `"${u.role || ''}"`,
        `"${u.country || 'Cameroon'}"`,
        u.wallet?.balance || 0,
        u.isBlocked ? "BLOCKED" : "ACTIVE",
        u.isEmailVerified ? "YES" : "NO",
        u.createdAt ? format(new Date(u.createdAt), 'yyyy-MM-dd HH:mm') : ''
      ])

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `Fixam_Users_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Exported ${exportList.length} users to CSV`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to export users")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500">View, search, filter, and inspect all {totalUsersCount} registered users on Fixam.</p>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] relative">
        {/* Search Field */}
        <div className="flex flex-1 items-center gap-2 max-w-md bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 focus-within:border-[#0D9488] focus-within:ring-1 focus-within:ring-[#0D9488] transition-all">
          <Search className="h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone or email..." 
            className="bg-transparent text-sm outline-none flex-1 text-slate-800 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Export Buttons */}
        <div className="flex items-center gap-3">
          {/* Filter Popover Toggle */}
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border rounded-xl transition-all ${
                roleFilter !== 'ALL' || statusFilter !== 'ALL' 
                  ? 'bg-teal-50 border-[#0D9488] text-[#0D9488]' 
                  : 'hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filter
              {(roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <span className="h-2 w-2 rounded-full bg-[#0D9488]" />
              )}
            </button>

            {/* Filter Dropdown Modal */}
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-30 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Filter Users</span>
                  <button onClick={() => setShowFilterMenu(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">User Role</label>
                  <select 
                    value={roleFilter} 
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 outline-none font-medium text-slate-700"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="CLIENT">Client</option>
                    <option value="PROVIDER">Service Provider</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Account Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 outline-none font-medium text-slate-700"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Accounts</option>
                    <option value="BLOCKED">Blocked Accounts</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <button 
                    onClick={() => { setRoleFilter('ALL'); setStatusFilter('ALL'); setPage(1); setShowFilterMenu(false); }}
                    className="w-full py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Export Users Button */}
          <button 
            onClick={handleExportUsers}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export Users"}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Coins</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium animate-pulse">
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No users match the search and filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-teal-100 text-[#0D9488] font-bold flex items-center justify-center text-sm">
                            {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800">{user.fullName || 'No Name'}</p>
                          <p className="text-xs text-slate-400">{user.email || user.phone || 'No contact'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                        user.role === 'PROVIDER' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : user.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-700 text-sm">
                        {user.wallet?.balance || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                        user.isBlocked ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isBlocked ? 'bg-red-600' : 'bg-emerald-600'}`} />
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => openUser(user.id)} 
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors" 
                          title="View Full Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          disabled={statusLoading} 
                          onClick={() => toggleBlock(user)} 
                          className={`p-2 hover:bg-slate-100 rounded-xl transition-colors ${
                            user.isBlocked ? 'text-emerald-600 hover:text-emerald-800' : 'text-red-500 hover:text-red-700'
                          }`} 
                          title={user.isBlocked ? "Restore User Account" : "Block User Account"}
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Showing <span className="font-bold text-slate-800">{users.length}</span> of <span className="font-bold text-slate-800">{totalUsersCount}</span> total users
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3.5 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-600 px-2">Page {page} of {totalPages || 1}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3.5 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-5">
              <div className="flex items-center gap-4">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="" className="h-16 w-16 rounded-2xl object-cover border" />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-teal-100 text-[#0D9488] font-black text-2xl flex items-center justify-center">
                    {(selectedUser.fullName || selectedUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-800">{selectedUser.fullName || 'No Name'}</h3>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                      selectedUser.role === 'PROVIDER' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {selectedUser.phone || 'No phone'} • {selectedUser.email || 'No email'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Coins Balance</span>
                <p className="text-xl font-black text-slate-800 mt-1">{selectedUser.wallet?.balance || 0} Coins</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Account Status</span>
                <p className={`text-xl font-black mt-1 ${selectedUser.isBlocked ? 'text-red-600' : 'text-emerald-600'}`}>
                  {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Country</span>
                <p className="text-xl font-black text-slate-800 mt-1">{selectedUser.country || 'Cameroon'}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Verified</span>
                <p className="text-xl font-black text-slate-800 mt-1">{selectedUser.isEmailVerified ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-sm">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">Account Overview</span>
                <p className="flex justify-between"><span className="text-slate-500">User ID:</span> <span className="font-semibold text-slate-800 text-xs font-mono">{selectedUser.id}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">Joined:</span> <span className="font-semibold text-slate-800">{selectedUser.createdAt ? format(new Date(selectedUser.createdAt), 'PPpp') : 'N/A'}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">Last Seen:</span> <span className="font-semibold text-slate-800">{selectedUser.lastSeen ? format(new Date(selectedUser.lastSeen), 'PPpp') : 'N/A'}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">Referral Code:</span> <span className="font-semibold text-slate-800">{selectedUser.referralCode || 'None'}</span></p>
              </div>

              {/* Provider Profile Details if applicable */}
              {selectedUser.providerProfile && (
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 space-y-2 text-sm">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-600 block mb-2">Provider Credentials</span>
                  <p className="flex justify-between"><span className="text-slate-500">Verification:</span> <span className="font-bold text-slate-800">{selectedUser.providerProfile.verification}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Base Rate:</span> <span className="font-bold text-slate-800">{selectedUser.providerProfile.rate || 0} FCFA</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Service Area:</span> <span className="font-bold text-slate-800">{selectedUser.providerProfile.serviceArea || 'Not set'}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Skills:</span> <span className="font-bold text-slate-800">{selectedUser.providerProfile.skills?.join(', ') || 'None'}</span></p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex gap-3">
                <button 
                  onClick={() => toggleBlock(selectedUser)} 
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    selectedUser.isBlocked ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {selectedUser.isBlocked ? 'Restore Account' : 'Block Account'}
                </button>
                <button 
                  onClick={() => messageUser(selectedUser)} 
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#0D9488] text-white hover:bg-[#0f766e] transition-all flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" /> Message User
                </button>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
