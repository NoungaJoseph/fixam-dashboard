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
  { icon: AlertCircle, label: "Reports & Disputes", href: "/dashboard/reports" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white border-r border-slate-800">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Toolbox className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Fixam <span className="text-blue-600">Admin</span></span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white",
              pathname === item.href ? "bg-blue-600 text-white hover:bg-blue-600" : "text-slate-400"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
