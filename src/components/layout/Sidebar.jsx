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
  MessageSquare,
  Mail,
  ShieldCheck,
  LogOut
} from "lucide-react"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Users", href: "/dashboard/users" },
  { icon: Toolbox, label: "Providers", href: "/dashboard/providers" },
  { icon: ShieldCheck, label: "Verifications", href: "/dashboard/verifications" },
  { icon: Briefcase, label: "Jobs", href: "/dashboard/jobs" },
  { icon: AlertCircle, label: "Task Approval", href: "/dashboard/jobs/approval" },
  { icon: Wallet, label: "Wallet & Coins", href: "/dashboard/wallet" },
  { icon: MessagesSquare, label: "Messages", href: "/dashboard/messages" },
  { icon: Mail, label: "Broadcasts", href: "/dashboard/broadcasts" },
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
    <div className={`${collapsed ? "w-20" : "w-[260px]"} flex h-full flex-col bg-[#F8FAFC] text-slate-700 border-r border-[#E2E8F0] transition-all duration-200`}>
      <div className="flex h-[72px] items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-8 w-8 bg-slate-200 rounded flex items-center justify-center">
            <span className="text-slate-700 font-black text-sm">C</span>
          </div>
          {!collapsed && <span className="text-[15px] font-bold tracking-wide text-slate-800">FIXAM OS</span>}
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          let badge = 0
          if (item.label === "Messages") badge = unreadMessages
          if (item.label === "Task Approval") badge = stats?.pendingTaskApprovals || 0
          if (item.label === "Verifications") badge = stats?.pendingVerifications || 0
          if (item.label === "Reports & Disputes") badge = stats?.openReports || 0
          if (item.label === "Feedback") badge = stats?.newFeedback || 0
          
          let isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");
          if (item.href === "/dashboard/jobs" && pathname.startsWith("/dashboard/jobs/approval")) {
            isActive = false;
          }

          return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-[10px] rounded-lg text-[13px] font-medium transition-all",
              collapsed && "justify-center",
              isActive 
                ? "bg-[#1E293B] text-white shadow-sm" 
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : "text-slate-500")} strokeWidth={isActive ? 2.5 : 2} />
            {!collapsed && <span className="tracking-wide uppercase">{item.label}</span>}
            {!collapsed && badge > 0 && (
              <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold", isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-600")}>
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        )})}
      </div>

      <div className="p-4 mt-auto">
        <div className={cn("flex items-center gap-3 p-3 rounded-xl transition-colors", collapsed && "justify-center")}>
          <div className="h-9 w-9 bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
            FC
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-slate-900 truncate tracking-wide">FIXAM CEO</p>
              <p className="text-[11px] text-slate-500 truncate uppercase tracking-widest mt-0.5">CEO@FIXAM.COM</p>
            </div>
          )}
          {!collapsed && (
            <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors shrink-0" onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}>
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
