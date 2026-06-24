"use client"

import { useEffect, useState, useRef } from "react"
import { Settings, Shield, Bell, Globe, User, Server, Database, Save, Loader2, Camera } from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"
import Image from "next/image"

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingAvatar(true)
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await dashboardService.uploadProfileImage(formData)
      const avatarUrl = uploadRes.data.url

      await dashboardService.updateProfile({ avatar: avatarUrl })
      
      const updatedUser = { ...adminUser, avatar: avatarUrl }
      setAdminUser(updatedUser)
      localStorage.setItem('admin_user', JSON.stringify(updatedUser))
      toast.success("Profile image updated successfully")
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload image")
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
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

                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-bold text-slate-800">System State</h4>
                  <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-rose-900">App Maintenance Mode</h4>
                        <p className="text-xs text-rose-700 mt-1">If enabled, the mobile app will show a maintenance screen.</p>
                      </div>
                      <button
                        onClick={() => updateSetting('appMaintenanceEnabled', !settings.appMaintenanceEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.appMaintenanceEnabled ? 'bg-rose-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.appMaintenanceEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-rose-100 pt-4">
                      <div>
                        <h4 className="text-sm font-bold text-rose-900">Website Maintenance Mode</h4>
                        <p className="text-xs text-rose-700 mt-1">If enabled, the website will show a maintenance lock screen.</p>
                      </div>
                      <button
                        onClick={() => updateSetting('webMaintenanceEnabled', !settings.webMaintenanceEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.webMaintenanceEnabled ? 'bg-rose-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.webMaintenanceEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {(settings.appMaintenanceEnabled || settings.webMaintenanceEnabled) && (
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-rose-800 uppercase tracking-wider">Maintenance Message</label>
                        <input 
                          type="text" 
                          value={settings.maintenanceMessage || ''} 
                          onChange={(e) => updateSetting('maintenanceMessage', e.target.value)} 
                          className="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-500 text-rose-900" 
                          placeholder="We are improving Fixam for you. Back soon!"
                        />
                      </div>
                    )}
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
                <div className="h-32 w-32 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-slate-300 relative overflow-hidden group">
                  {adminUser?.avatar ? (
                    <img src={adminUser.avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User size={64} />
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    {uploadingAvatar ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
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
