"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Bell, Search, User, Globe, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useSocket } from "@/hooks/useSocket"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function DashboardLayout({ children }) {
  const [token] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const { isConnected, on } = useSocket(token)

  useEffect(() => {
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
        <header className="flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarCollapsed((value) => !value)} className="p-2 text-slate-500 hover:bg-[#ECFDF5] hover:text-[#0D9488]">
              {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Admin Dashboard</h1>
            <div className="hidden h-9 w-64 items-center gap-2 bg-slate-100 px-3 md:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isConnected ? 'bg-[#ECFDF5] text-[#0D9488]' : 'bg-red-100 text-red-600'
            }`}>
              <Globe className={`h-3 w-3 ${isConnected ? 'animate-pulse' : ''}`} />
              {isConnected ? 'Realtime Live' : 'Offline'}
            </div>

            <button className="relative p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 bg-[#0D9488] border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">Admin Joseph</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
              <div className="h-10 w-10 bg-slate-200 flex items-center justify-center border border-slate-300">
                <User className="h-6 w-6 text-slate-600" />
              </div>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
                className="ml-2 p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
