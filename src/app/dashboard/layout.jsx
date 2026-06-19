"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Bell, Search, User, Globe, LogOut, PanelLeftClose, PanelLeftOpen, MessagesSquare, AlertCircle, Settings } from "lucide-react"
import { useSocket } from "@/hooks/useSocket"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { dashboardService } from "@/services/api"

export default function DashboardLayout({ children }) {
  const [token] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMaintenance, setIsMaintenance] = useState(false)

  const { isConnected, on } = useSocket(token)

  useEffect(() => {
    // Check maintenance mode on load
    dashboardService.getSettings?.()
      .then(res => {
        if (res.data?.data?.maintenanceEnabled) {
          setIsMaintenance(true)
        }
      })
      .catch(() => {})

    if (isConnected) {
      console.log("Realtime Dashboard Connected")
    }

    // Global Listeners for Admin
    const offNewUser = on('notification:admin', (data) => {
      toast.info(data.message || "New System Update", {
        description: data.body,
        duration: 5000,
      })
    })

    return () => {
      offNewUser?.()
    }
  }, [isConnected, on])

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex flex-col bg-white">
          {isMaintenance && (
            <div className="bg-rose-600 text-white text-xs font-bold text-center py-1.5 px-4 animate-pulse">
              ⚠️ MAINTENANCE MODE IS ACTIVE — Users cannot access the app
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
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <MessagesSquare className="h-[20px] w-[20px]" />
              </button>
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Bell className="h-[20px] w-[20px]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
              </button>
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <AlertCircle className="h-[20px] w-[20px]" />
              </button>
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Settings className="h-[20px] w-[20px]" />
              </button>
              
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
