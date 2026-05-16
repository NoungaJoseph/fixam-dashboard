"use client"

import { useState } from "react"
import { Settings, Shield, Bell, Globe, User, Server, Database, Save } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Platform Settings</h2>
        <p className="text-slate-500">Configure global preferences, security protocols, and system APIs.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation */}
        <div className="lg:w-64 space-y-1">
          {[
            { id: "general", label: "General", icon: Settings },
            { id: "profile", label: "Admin Profile", icon: User },
            { id: "security", label: "Security", icon: Shield },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "api", label: "API & System", icon: Server },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Area */}
        <div className="flex-1 space-y-6">
          <div className="bg-white border rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900 capitalize">{activeTab} Settings</h3>
              <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                <Save size={16} />
                Save Changes
              </button>
            </div>

            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Platform Name</label>
                    <input type="text" defaultValue="Fixam Marketplace" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Support Email</label>
                    <input type="email" defaultValue="support@fixam.cm" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Service Fee (%)</label>
                  <input type="number" defaultValue="10" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600" />
                  <p className="text-xs text-slate-400">Commission taken from provider earnings per job.</p>
                </div>
                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-bold text-slate-800">Language & Localization</h4>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Default Language</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600">
                        <option>English</option>
                        <option>French</option>
                      </select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Currency</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600">
                        <option>XAF (CFA Franc)</option>
                        <option>USD ($)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-6">
                <div className="p-6 bg-slate-900 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400">
                        <Database size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Prisma Client Status</h4>
                        <p className="text-xs text-slate-500">Connected to Supabase PostgreSQL</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      ACTIVE
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">API Endpoint URL</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly defaultValue="https://api.fixam.cm/v1" className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 text-sm font-mono" />
                    <button className="px-4 py-2 bg-slate-100 border rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">Copy</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Admin Secret Key</label>
                  <div className="flex gap-2">
                    <input type="password" readOnly defaultValue="••••••••••••••••" className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 text-sm font-mono" />
                    <button className="px-4 py-2 bg-slate-100 border rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">Reveal</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="flex flex-col items-center py-8">
                <div className="h-32 w-32 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-slate-300 relative">
                  <User size={64} />
                  <button className="absolute bottom-0 right-0 h-10 w-10 bg-blue-600 rounded-full border-4 border-white text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
                    <Save size={16} />
                  </button>
                </div>
                <h4 className="mt-6 text-xl font-bold text-slate-900">Admin Joseph</h4>
                <p className="text-sm text-slate-500">Super Administrator & Platform Owner</p>
                <div className="mt-8 w-full max-w-sm space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Login Email</label>
                    <p className="text-sm font-bold text-slate-800">admin@fixam.cm</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Access Level</label>
                    <p className="text-sm font-bold text-slate-800">All Modules (Read/Write)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
