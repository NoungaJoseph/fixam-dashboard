"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { dashboardService } from "@/services/api"
import { useEffect, useState } from "react"
import { 
  LayoutDashboard, 
  Users, 
  Toolbox, 
  Briefcase, 
  Wallet, 
  AlertCircle, 
  MessagesSquare,
  Bell, 
  BarChart3, 
  Settings,
  LogOut,
  MessageSquare
} from "lucide-react"

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Users, label: "Users", href: "/dashboard/users" },
  { icon: Toolbox, label: "Providers", href: "/dashboard/providers" },
  { icon: Briefcase, label: "Jobs", href: "/dashboard/jobs" },
  { icon: AlertCircle, label: "Task Approval", href: "/dashboard/jobs/approval" },
  { icon: Wallet, label: "Wallet & Coins", href: "/dashboard/wallet" },
  { icon: MessagesSquare, label: "Messages", href: "/dashboard/messages" },
  { icon: AlertCircle, label: "Reports & Disputes", href: "/dashboard/reports" },
  { icon: MessageSquare, label: "Feedback", href: "/dashboard/feedback" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export function Sidebar({ collapsed = false }) {
  const pathname = usePathname()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [stats, setStats] = useState({})

  useEffect(() => {
    let active = true
    const loadData = () => {
      Promise.all([
        dashboardService.getUnreadMessageCount().catch(() => ({ data: { data: { totalUnread: 0 } } })),
        dashboardService.getStats().catch(() => ({ data: { data: {} } }))
      ]).then(([unreadRes, statsRes]) => {
        if (active) {
          setUnreadMessages(unreadRes.data.data?.totalUnread || 0)
          setStats(statsRes.data.data || {})
        }
      })
    }

    loadData()
    const interval = setInterval(loadData, 60000)
    const onRefresh = () => loadData()
    window.addEventListener("fixam:messages-read", onRefresh)

    return () => {
      active = false
      clearInterval(interval)
      window.removeEventListener("fixam:messages-read", onRefresh)
    }
  }, [])

  return (
    <div className={`${collapsed ? "w-20" : "w-64"} flex h-full flex-col bg-[#0F172A] text-white border-r border-[#1E293B] transition-all duration-200`}>
      <div className="flex h-16 items-center px-5 border-b border-[#1E293B]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-9 w-9 bg-[#0D9488] flex items-center justify-center">
            <Toolbox className="h-5 w-5 text-white" />
          </div>
          {!collapsed && <span className="text-xl font-bold tracking-tight">Fixam <span className="text-[#14B8A6]">Admin</span></span>}
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
        {menuItems.map((item) => {
          let badge = 0
          if (item.label === "Messages") badge = unreadMessages
          if (item.label === "Task Approval") badge = stats?.pendingTaskApprovals || 0
          if (item.label === "Reports & Disputes") badge = stats?.openReports || 0
          if (item.label === "Feedback") badge = stats?.newFeedback || 0
          
          return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-[#1E293B] hover:text-white",
              collapsed && "justify-center",
              pathname === item.href ? "bg-[#0D9488] text-white hover:bg-[#0D9488]" : "text-slate-400"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5" />
            {!collapsed && item.label}
            {!collapsed && badge > 0 && (
              <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        )})}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button className={cn("flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-[#1E293B] hover:text-white", collapsed && "justify-center")}>
          <LogOut className="h-5 w-5" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  )
}
