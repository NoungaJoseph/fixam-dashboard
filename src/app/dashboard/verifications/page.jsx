"use client"

import { useEffect, useState } from "react"
import { Search, Filter, ShieldCheck, XCircle, FileText, User } from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

export default function VerificationsPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectProviderId, setRejectProviderId] = useState(null)
  const [rejectReason, setRejectReason] = useState("The uploaded document is blurry or unreadable.")
  const [customReason, setCustomReason] = useState("")

  const predefinedReasons = [
    "The uploaded document is blurry or unreadable.",
    "The selfie does not match the person in the ID document.",
    "The ID document appears to be expired.",
    "The submitted document is not an accepted form of ID.",
    "Other"
  ]

  const fetchVerifications = () => {
    setLoading(true)
    // We fetch all providers/profiles, then filter in the UI. 
    // Both clients and providers get a ProviderProfile when they verify documents.
    dashboardService.getProviders()
      .then(res => {
        // Filter out UNVERIFIED users from this list if we only want people who submitted documents.
        // Actually, let's keep all, or just people who have submitted documents or are verified.
        const verificationProfiles = res.data.data.filter(p => p.verification !== 'UNVERIFIED' || (p.documents && p.documents.length > 0));
        setProfiles(verificationProfiles)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    const id = setTimeout(fetchVerifications, 0)
    return () => clearTimeout(id)
  }, [])

  const handleVerify = async (id, status, reason = "") => {
    try {
      if (status === 'REJECTED' && !reason) {
        // Open modal instead of processing directly
        setRejectProviderId(id);
        setRejectModalOpen(true);
        return;
      }
      
      const finalReason = reason;
      
      await dashboardService.verifyProvider({ providerId: id, status, reason: finalReason });
      toast.success(`Identity ${status === 'VERIFIED' ? 'Verified' : 'Rejected'} Successfully`);
      fetchVerifications();
      
      if (status === 'REJECTED') {
        setRejectModalOpen(false);
        setRejectProviderId(null);
        setRejectReason(predefinedReasons[0]);
        setCustomReason("");
      }
    } catch (error) {
      toast.error("Action failed");
    }
  }

  const submitRejection = () => {
    const finalReason = rejectReason === "Other" ? customReason : rejectReason;
    if (!finalReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    handleVerify(rejectProviderId, 'REJECTED', finalReason);
  }

  if (loading) return <div className="p-8 text-slate-500 font-medium">Loading verification requests...</div>

  // Filter logic
  const filteredProfiles = profiles.filter(p => activeTab === 'all' || p.verification.toLowerCase() === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Identity Verification</h2>
          <p className="text-slate-500">Review, approve, or reject identity documents for both Clients and Providers.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-200 w-fit rounded-xl">
        {["pending", "verified", "rejected", "all"].map((tab) => (
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

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProfiles.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white rounded-2xl border border-dashed">
            No verification requests found in this category.
          </div>
        )}
        {filteredProfiles.map((provider) => {
          const isClient = provider.profileMode === 'CLIENT';

          return (
            <div key={provider.id} className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border ${isClient ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                    {isClient ? <User className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{provider.user?.fullName || 'No Name'}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider ${isClient ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isClient ? 'Client' : 'Provider'}
                      </span>
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

              {/* Documents */}
              <div className="mt-5 rounded-xl border bg-slate-50 p-3">
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500 flex justify-between items-center">
                  <span>Submitted documents</span>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{provider.documents?.length || 0}</span>
                </p>
                <div className="space-y-2">
                  {provider.documents && provider.documents.length > 0 ? (
                    provider.documents.map((doc) => (
                      <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-700 shadow-sm border border-slate-100">
                        <span className="truncate">{doc.type.replace('_', ' ').toUpperCase()}</span>
                        <FileText className="h-4 w-4 shrink-0 ml-2" />
                      </a>
                    ))
                  ) : (
                    <div className="text-center text-sm text-slate-400 py-2">No documents uploaded</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {provider.verification !== 'VERIFIED' && (
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => handleVerify(provider.id, 'VERIFIED')}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Approve
                  </button>
                  <button 
                    onClick={() => handleVerify(provider.id, 'REJECTED')}
                    className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Reject Verification
              </h3>
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Please select the reason for rejection. This will be sent to the user via email.
              </p>
              
              <div className="space-y-3">
                {predefinedReasons.map((reason, index) => (
                  <label key={index} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="rejectReason" 
                      value={reason}
                      checked={rejectReason === reason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mt-0.5 h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300"
                    />
                    <span className="text-sm text-slate-700 font-medium">{reason}</span>
                  </label>
                ))}
              </div>

              {rejectReason === "Other" && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Custom Reason
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter specific reason here..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none h-24 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors flex items-center gap-2"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
