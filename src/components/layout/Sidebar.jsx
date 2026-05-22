"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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
  LogOut
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
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export function Sidebar({ collapsed = false }) {
  const pathname = usePathname()

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
        {menuItems.map((item) => (
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
          </Link>
        ))}
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
