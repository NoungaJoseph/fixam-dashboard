"use client"

import { useEffect, useState } from "react"
import { Bell, Send, Users, Toolbox, ShieldAlert, History, CheckCircle2 } from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

export default function NotificationsPage() {
  const [target, setTarget] = useState("all")
  const [sending, setSending] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")

  useEffect(() => {
    dashboardService.getUsers().then((res) => setUsers(res.data.data || [])).catch(() => {})
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    try {
      setSending(true)
      const roleMap = { providers: "PROVIDER", clients: "CLIENT", all: "ALL", individual: "ALL" }
      await dashboardService.sendAdminMessage({
        subject,
        content,
        recipientRole: roleMap[target],
        recipientId: target === "individual" ? selectedUser : null
      })
      toast.success("Notification sent")
      setSubject("")
      setContent("")
      setSelectedUser("")
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send notification")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Notifications Center</h2>
        <p className="text-slate-500">Broadcast announcements and push notifications to Fixam users.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Composer */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Compose Broadcast
            </h3>
            
            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: "all", label: "All Users", icon: Users },
                    { id: "providers", label: "Providers Only", icon: Toolbox },
                    { id: "clients", label: "Clients Only", icon: ShieldAlert },
                    { id: "individual", label: "Individual", icon: Users },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTarget(item.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        target === item.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-slate-200 text-slate-500"
                      }`}
                    >
                      <item.icon className="h-6 w-6 mb-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {target === "individual" && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Recipient</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 transition-colors"
                    required
                  >
                    <option value="">Choose a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.fullName || user.phone} ({user.role})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notification Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. New Feature Update!" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Message Content</label>
                <textarea 
                  rows={4} 
                  placeholder="Type your message here..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 transition-colors"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={sending}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {sending ? "Broadcasting..." : "Send Broadcast Now"}
                {!sending && <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* Recent History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400" />
              Recent Broadcasts
            </h3>

            <div className="space-y-4">
              {[
                { title: "System Maintenance", target: "All", date: "2 hours ago", status: "Sent" },
                { title: "Promo: 20% Off Coins", target: "Providers", date: "Yesterday", status: "Sent" },
                { title: "Welcome to Fixam!", target: "Clients", date: "3 days ago", status: "Sent" },
              ].map((b, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-sm">{b.title}</h4>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                      <CheckCircle2 size={10} /> {b.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>To: {b.target}</span>
                    <span>{b.date}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
              View Full History
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4" />
              Pro Tip
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              Targeted notifications have a 45% higher engagement rate. Use specific audience segments for better results.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
