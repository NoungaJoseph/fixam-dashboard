"use client"

import { useEffect, useState } from "react"
import { Search, Filter, MoreHorizontal, Ban, Eye } from "lucide-react"
import { format } from "date-fns"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    dashboardService.getUsers()
      .then(res => {
        setUsers(res.data.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const refreshUsers = () => dashboardService.getUsers().then(res => setUsers(res.data.data || []))

  const openUser = async (id) => {
    try {
      const res = await dashboardService.getUserDetails(id)
      setSelectedUser(res.data.data)
    } catch (error) {
      toast.error("Could not load user profile")
    }
  }

  const toggleBlock = async (user) => {
    const reason = user.isBlocked ? "" : window.prompt("Reason for blocking this user?", "Reported by users")
    if (!user.isBlocked && reason === null) return
    try {
      setStatusLoading(true)
      await dashboardService.updateUserStatus(user.id, { isBlocked: !user.isBlocked, reason })
      toast.success(user.isBlocked ? "User restored" : "User blocked")
      await refreshUsers()
      if (selectedUser?.id === user.id) await openUser(user.id)
    } catch (error) {
      toast.error("Could not update user")
    } finally {
      setStatusLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-slate-500 font-medium">Loading users from marketplace...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h2>
          <p className="text-slate-500">View and manage all registered users on Fixam.</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex flex-1 items-center gap-2 max-w-md bg-slate-100 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone or email..." 
            className="bg-transparent text-sm outline-none flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            Export Users
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.filter(u => u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{user.fullName || 'No Name'}</p>
                    <p className="text-sm text-slate-500">{user.phone}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    user.role === 'PROVIDER' ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-sm ${
                    user.isBlocked ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${user.isBlocked ? 'bg-red-600' : 'bg-emerald-600'}`} />
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openUser(user.id)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="View Profile">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button disabled={statusLoading} onClick={() => toggleBlock(user)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title={user.isBlocked ? "Restore User" : "Block User"}>
                      <Ban className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing {users.length} users</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 text-sm border rounded bg-white hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedUser.fullName || 'No Name'}</h3>
                <p className="text-sm text-slate-500">{selectedUser.phone} • {selectedUser.email || 'No email'}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="px-3 py-1 border rounded-lg text-sm">Close</button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border p-4"><p className="text-xs text-slate-400 font-bold">Role</p><p className="font-bold">{selectedUser.role}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs text-slate-400 font-bold">Coins</p><p className="font-bold">{selectedUser.wallet?.balance || 0}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs text-slate-400 font-bold">Status</p><p className={`font-bold ${selectedUser.isBlocked ? 'text-red-600' : 'text-emerald-600'}`}>{selectedUser.isBlocked ? 'Blocked' : 'Active'}</p></div>
            </div>

            {selectedUser.providerProfile && (
              <div className="rounded-xl border p-4">
                <h4 className="font-bold mb-2">Provider Profile</h4>
                <p className="text-sm text-slate-600">Verification: {selectedUser.providerProfile.verification}</p>
                <p className="text-sm text-slate-600">Skills: {selectedUser.providerProfile.skills?.join(', ') || 'None'}</p>
                <p className="text-sm text-slate-600">Service area: {selectedUser.providerProfile.serviceArea || 'Not set'}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => toggleBlock(selectedUser)} className={`px-4 py-2 rounded-lg text-white font-bold ${selectedUser.isBlocked ? 'bg-emerald-600' : 'bg-red-600'}`}>
                {selectedUser.isBlocked ? 'Restore Account' : 'Block Account'}
              </button>
              <button onClick={() => window.location.href = `/dashboard/notifications?user=${selectedUser.id}`} className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold">Message User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
