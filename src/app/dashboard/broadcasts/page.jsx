"use client"

import { useState } from "react"
import { Mail, AlertTriangle, Send, Loader2 } from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

export default function BroadcastsPage() {
  const [activeTab, setActiveTab] = useState("marketing") // marketing, security
  const [loading, setLoading] = useState(false)
  
  const [marketingForm, setMarketingForm] = useState({
    subject: "",
    content: "",
    recipientRole: "" // "" = all, "CLIENT" = clients, "PROVIDER" = providers
  })

  const [securityForm, setSecurityForm] = useState({
    issueDetails: "",
    recipientRole: ""
  })

  const handleMarketingSubmit = async (e) => {
    e.preventDefault()
    if (!marketingForm.subject.trim() || !marketingForm.content.trim()) {
      return toast.error("Subject and content are required")
    }

    try {
      setLoading(true)
      const res = await dashboardService.sendBroadcastEmail(marketingForm)
      toast.success(res.data?.message || "Broadcast sent successfully!")
      setMarketingForm({ subject: "", content: "", recipientRole: "" })
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send broadcast")
    } finally {
      setLoading(false)
    }
  }

  const handleSecuritySubmit = async (e) => {
    e.preventDefault()
    if (!securityForm.issueDetails.trim()) {
      return toast.error("Issue details are required")
    }

    try {
      setLoading(true)
      const res = await dashboardService.sendSecurityAlert(securityForm)
      toast.success(res.data?.message || "Security alert sent successfully!")
      setSecurityForm({ issueDetails: "", recipientRole: "" })
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send security alert")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Email Broadcasts</h2>
        <p className="text-slate-500">Send mass marketing emails or urgent security alerts to users.</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "marketing" ? "border-[#0D9488] text-[#0D9488]" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("marketing")}
        >
          <Mail className="w-4 h-4" />
          Marketing Broadcast
        </button>
        <button
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "security" ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("security")}
        >
          <AlertTriangle className="w-4 h-4" />
          Security Alert
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === "marketing" ? (
          <form onSubmit={handleMarketingSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience</label>
                <select 
                  value={marketingForm.recipientRole}
                  onChange={(e) => setMarketingForm({...marketingForm, recipientRole: e.target.value})}
                  className="w-full h-11 border border-slate-300 rounded-lg px-4 bg-white outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                >
                  <option value="">All Users (Clients & Providers)</option>
                  <option value="CLIENT">Clients Only</option>
                  <option value="PROVIDER">Providers Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Subject</label>
                <input 
                  type="text"
                  placeholder="e.g. Huge Discounts on Fixam this Weekend!"
                  value={marketingForm.subject}
                  onChange={(e) => setMarketingForm({...marketingForm, subject: e.target.value})}
                  className="w-full h-11 border border-slate-300 rounded-lg px-4 bg-white outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Content (HTML supported)</label>
                <textarea 
                  rows={8}
                  placeholder="<p>Write your amazing marketing copy here...</p>"
                  value={marketingForm.content}
                  onChange={(e) => setMarketingForm({...marketingForm, content: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-4 bg-white outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                />
                <p className="text-xs text-slate-500 mt-2">The content is wrapped in a nicely designed Fixam template. You can use standard HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;br&gt;.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex items-center gap-2 bg-[#0D9488] hover:bg-[#0F766E] transition-colors text-white px-6 py-2.5 rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Marketing Broadcast
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSecuritySubmit} className="p-6 space-y-6">
            <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-100 flex gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-900">Important Warning</h4>
                <p className="text-sm mt-1">Security alerts are wrapped in an urgent warning template. Use this strictly for data breaches, critical policy changes, or urgent security actions. Avoid using this for marketing.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience</label>
                <select 
                  value={securityForm.recipientRole}
                  onChange={(e) => setSecurityForm({...securityForm, recipientRole: e.target.value})}
                  className="w-full h-11 border border-slate-300 rounded-lg px-4 bg-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                >
                  <option value="">All Users (Clients & Providers)</option>
                  <option value="CLIENT">Clients Only</option>
                  <option value="PROVIDER">Providers Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Security Issue Details</label>
                <textarea 
                  rows={6}
                  placeholder="Describe the security issue or mandatory instructions..."
                  value={securityForm.issueDetails}
                  onChange={(e) => setSecurityForm({...securityForm, issueDetails: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-4 bg-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 transition-colors text-white px-6 py-2.5 rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                Send Security Alert
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
