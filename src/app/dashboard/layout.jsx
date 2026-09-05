"use client"

import Link from "next/link"
import { Sidebar } from "@/components/layout/Sidebar"
import { Bell, Search, User, Globe, LogOut, PanelLeftClose, PanelLeftOpen, MessagesSquare, AlertCircle, Settings } from "lucide-react"
import { useSocket } from "@/hooks/useSocket"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { dashboardService } from "@/services/api"

export default function DashboardLayout({ children }) {
  const [token] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [appMaintenance, setAppMaintenance] = useState(false)
  const [webMaintenance, setWebMaintenance] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState(0)

  const { isConnected, on } = useSocket(token)

  useEffect(() => {
    // Check maintenance mode and pending approvals count on load
    dashboardService.getSettings?.()
      .then(res => {
        if (res.data?.data) {
          if (res.data.data.appMaintenanceEnabled) setAppMaintenance(true)
          if (res.data.data.webMaintenanceEnabled) setWebMaintenance(true)
        }
      })
      .catch(() => {})

    dashboardService.getStats?.()
      .then(res => {
        if (res.data?.data) {
          setPendingApprovals(res.data.data.pendingTaskApprovals || res.data.data.pendingApprovals || 0)
        }
      })
      .catch(() => {})

    if (isConnected) {
      console.log("Realtime Dashboard Connected")
    }

    // Global Listeners for Admin
    const offNewUser = on('notification:admin', (data) => {
      if (data.type === 'JOB_PENDING_APPROVAL') {
        setPendingApprovals(prev => prev + 1)
      }
      toast.info(data.message || "New System Update", {
        description: data.body,
        duration: 6000,
        action: data.type === 'JOB_PENDING_APPROVAL' ? {
          label: 'Review Task',
          onClick: () => { window.location.href = '/dashboard/jobs/approval' }
        } : undefined
      })
    })

    const offJobPending = on('job:pending-approval', (data) => {
      setPendingApprovals(prev => prev + 1)
      toast.warning(data.title ? `New Task Awaiting Approval: ${data.title}` : "New Task Awaiting Approval", {
        description: `Client: ${data.clientName || 'Client'}. Review required before publishing.`,
        duration: 8000,
        action: {
          label: 'Review Task',
          onClick: () => { window.location.href = '/dashboard/jobs/approval' }
        }
      })
    })

    return () => {
      offNewUser?.()
      offJobPending?.()
    }
  }, [isConnected, on])

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex flex-col bg-white">
          {appMaintenance && (
            <div className="bg-rose-600 text-white text-xs font-bold text-center py-1.5 px-4 animate-pulse">
              ⚠️ APP MAINTENANCE MODE IS ACTIVE — Mobile users cannot access the app
            </div>
          )}
          {webMaintenance && (
            <div className="bg-orange-600 text-white text-xs font-bold text-center py-1.5 px-4 animate-pulse">
              ⚠️ WEBSITE MAINTENANCE MODE IS ACTIVE — The website is locked
            </div>
          )}
          <div className="flex h-[72px] items-center justify-between px-6 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => setSidebarCollapsed((value) => !value)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <PanelLeftOpen className="h-5 w-5" />
              </button>
              
              <div className="hidden h-10 w-96 items-center gap-3 rounded-lg bg-slate-100/80 px-4 md:flex border border-slate-200">
                <Search className="h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search enterprise-wide data..." 
                  className="bg-transparent text-[13px] w-full outline-none placeholder:text-slate-500 font-medium text-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/messages" 
                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Support & User Messages"
              >
                <MessagesSquare className="h-[20px] w-[20px]" />
              </Link>
              <Link 
                href="/dashboard/jobs/approval" 
                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title={pendingApprovals > 0 ? `${pendingApprovals} task(s) awaiting approval` : "Pending Task Approvals"}
              >
                <Bell className="h-[20px] w-[20px]" />
                {pendingApprovals > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                    {pendingApprovals > 99 ? '99+' : pendingApprovals}
                  </span>
                )}
              </Link>
              <Link 
                href="/dashboard/disputes" 
                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Disputes Management"
              >
                <AlertCircle className="h-[20px] w-[20px]" />
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="System Settings"
              >
                <Settings className="h-[20px] w-[20px]" />
              </Link>
              
              <div className="h-6 w-px bg-slate-200 mx-2"></div>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-black tracking-widest text-slate-900 uppercase">Fixam OS Core</p>
                  <p className="text-[10px] text-slate-500 font-medium tracking-wide">SERVER: EST-US-01 <span className="text-[#0D9488]">(ACTIVE)</span></p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  )
}
