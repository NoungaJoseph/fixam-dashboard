"use client"

import { useEffect, useState } from "react"
import { Settings, Shield, Bell, Globe, User, Server, Database, Save, Loader2 } from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [settings, setSettings] = useState({
    platformName: "",
    supportEmail: "",
    serviceFee: 0,
    defaultLanguage: "English",
    baseCurrency: "XAF",
    apiEndpoint: "https://api.fixam.cm/v1",
    adminSecret: "secret"
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adminUser, setAdminUser] = useState(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        setAdminUser(JSON.parse(localStorage.getItem('admin_user')))
      } catch (e) {}
    }

    dashboardService.getSettings?.()
      .then(res => {
        if (res.data.data) {
          setSettings(res.data.data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false) // Not throwing error if endpoint doesn't exist yet
      })
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await dashboardService.updateSettings(settings)
      toast.success("Settings saved successfully")
    } catch (err) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading platform settings...</div>

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
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Platform Name</label>
                    <input type="text" value={settings.platformName} onChange={(e) => updateSetting('platformName', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Support Email</label>
                    <input type="email" value={settings.supportEmail} onChange={(e) => updateSetting('supportEmail', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Service Fee (%)</label>
                  <input type="number" value={settings.serviceFee} onChange={(e) => updateSetting('serviceFee', parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600" />
                  <p className="text-xs text-slate-400">Commission taken from provider earnings per job.</p>
                </div>
                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-bold text-slate-800">Language & Localization</h4>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Default Language</label>
                      <select value={settings.defaultLanguage} onChange={(e) => updateSetting('defaultLanguage', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600">
                        <option value="English">English</option>
                        <option value="French">French</option>
                      </select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Currency</label>
                      <select value={settings.baseCurrency} onChange={(e) => updateSetting('baseCurrency', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600">
                        <option value="XAF">XAF (CFA Franc)</option>
                        <option value="USD">USD ($)</option>
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
                    <input type="text" value={settings.apiEndpoint} onChange={(e) => updateSetting('apiEndpoint', e.target.value)} className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 text-sm font-mono" />
                    <button className="px-4 py-2 bg-slate-100 border rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">Copy</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Admin Secret Key</label>
                  <div className="flex gap-2">
                    <input type="password" value={settings.adminSecret} onChange={(e) => updateSetting('adminSecret', e.target.value)} className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 text-sm font-mono" />
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
                <h4 className="mt-6 text-xl font-bold text-slate-900">{adminUser?.fullName || 'Admin User'}</h4>
                <p className="text-sm text-slate-500">Super Administrator & Platform Owner</p>
                <div className="mt-8 w-full max-w-sm space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Login Email</label>
                    <p className="text-sm font-bold text-slate-800">{adminUser?.email || 'admin@fixam.cm'}</p>
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
