"use client"

import { useEffect, useState } from "react"
import { Search, Filter, ShieldCheck, XCircle, MoreVertical, Star, FileText } from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

export default function ProvidersPage() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  const fetchProviders = () => {
    setLoading(true)
    dashboardService.getProviders()
      .then(res => {
        setProviders(res.data.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    const id = setTimeout(fetchProviders, 0)
    return () => clearTimeout(id)
  }, [])

  const handleVerify = async (id, status) => {
    try {
      let reason = "";
      if (status === 'REJECTED') {
        const choice = window.prompt(
          "Rejection reason:\n1. Face selfie not matching or not clear\n2. ID document is not clear\n3. Other reason\n\nType 1, 2, or your custom reason:"
        );
        if (!choice) return;
        reason = choice === '1'
          ? 'Face selfie is not matching the document or the selfie is not clear.'
          : choice === '2'
            ? 'ID document is not clear. Please upload a sharper photo with all corners visible.'
            : choice === '3'
              ? (window.prompt('Enter rejection reason:') || 'Verification requirements were not met.')
              : choice;
      }
      await dashboardService.verifyProvider({ providerId: id, status, reason });
      toast.success(`Provider ${status === 'VERIFIED' ? 'Verified' : 'Rejected'} Successfully`);
      fetchProviders();
    } catch (error) {
      toast.error("Action failed");
    }
  }

  if (loading) return <div className="p-8 text-slate-500 font-medium">Loading professional profiles...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Provider Verification</h2>
          <p className="text-slate-500">Approve or reject professional service provider applications.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-200 w-fit rounded-xl">
        {["all", "pending", "verified", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Providers Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {providers.filter(p => activeTab === 'all' || p.verification.toLowerCase() === activeTab).map((provider) => (
          <div key={provider.id} className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center border text-slate-400">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{provider.user?.fullName || 'No Name'}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {provider.skills?.map(s => (
                      <span key={s} className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                provider.verification === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 
                provider.verification === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
              }`}>
                {provider.verification}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold">{provider.rating}</span>
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Average Rating</p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-bold">{provider.documents?.length || 0} Files</span>
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Pending Docs</p>
              </div>
            </div>

            {provider.documents?.length > 0 && (
              <div className="mt-5 rounded-xl border bg-blue-50 p-3">
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-blue-700">Submitted documents</p>
                <div className="space-y-2">
                  {provider.documents.map((doc) => (
                    <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-700">
                      <span>{doc.type}</span>
                      <FileText className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => handleVerify(provider.id, 'VERIFIED')}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Verify
              </button>
              <button 
                onClick={() => handleVerify(provider.id, 'REJECTED')}
                className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button className="p-2.5 border rounded-xl hover:bg-slate-50 transition-colors">
                <MoreVertical className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
