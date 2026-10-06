"use client"

import { useEffect, useState, useMemo } from "react"
import {
  ExternalLink,
  Briefcase,
  Building2,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  Send,
  Users,
  Eye,
  Sliders,
  X,
  FileCheck,
  ShieldAlert,
  MapPin,
  CheckSquare,
  Square
} from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"

export default function ExternalJobsPage() {
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState({
    totalAll: 0,
    activeCount: 0,
    needsRecheckCount: 0,
    expiredCount: 0,
    totalApplicationsCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all") // all, active, needs_recheck, expired, applications
  const [searchTerm, setSearchTerm] = useState("")

  // Modals & drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [selectedJobDetails, setSelectedJobDetails] = useState(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [recheckDays, setRecheckDays] = useState(14)
  const [savingSettings, setSavingSettings] = useState(false)

  // Applications Log
  const [applications, setApplications] = useState([])
  const [loadingApplications, setLoadingApplications] = useState(false)

  // Form State
  const initialFormState = {
    title: "",
    companyName: "",
    destinationEmail: "",
    expiryDate: "",
    category: "General Service",
    location: "Douala, Cameroon",
    isRemote: false,
    salary: "",
    source: "",
    description: "",
    requirements: "",
    checklist: {
      noUpfrontPayment: false,
      legitCompanyPresence: false,
      realisticRoleSalary: false
    }
  }
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load Data
  const loadJobs = async () => {
    try {
      setLoading(true)
      const res = await dashboardService.getExternalJobs({
        search: searchTerm || undefined,
        needsRecheckOnly: activeTab === "needs_recheck" ? "true" : undefined,
        status: activeTab === "active" ? "ACTIVE" : activeTab === "expired" ? "EXPIRED" : undefined
      })
      if (res.data?.success) {
        setJobs(res.data.data || [])
        if (res.data.stats) {
          setStats(res.data.stats)
        }
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || "Failed to load external job listings")
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const res = await dashboardService.getExternalJobSettings()
      if (res.data?.success && res.data.data?.externalJobRecheckDays) {
        setRecheckDays(res.data.data.externalJobRecheckDays)
      }
    } catch (err) {
      console.warn("Could not fetch settings:", err.message)
    }
  }

  const loadApplications = async () => {
    try {
      setLoadingApplications(true)
      const res = await dashboardService.getExternalJobApplications()
      if (res.data?.success) {
        setApplications(res.data.data || [])
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load application logs")
    } finally {
      setLoadingApplications(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (activeTab === "applications") {
      loadApplications()
    } else {
      loadJobs()
    }
  }, [activeTab, searchTerm])

  // Handle Form Submission
  const handleSaveJob = async (e) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.companyName.trim() || !formData.destinationEmail.trim() || !formData.expiryDate) {
      toast.error("Please fill in all required fields (Title, Company, Recruiter Email, and Expiry Date).")
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        title: formData.title,
        companyName: formData.companyName,
        destinationEmail: formData.destinationEmail,
        expiryDate: formData.expiryDate,
        category: formData.category,
        location: formData.location,
        isRemote: formData.isRemote,
        salary: formData.salary,
        source: formData.source,
        description: formData.description,
        requirements: formData.requirements
      }

      if (editingJob) {
        await dashboardService.updateExternalJob(editingJob.id, payload)
        toast.success("External listing updated successfully!")
      } else {
        await dashboardService.createExternalJob(payload)
        toast.success("External job published to feeds successfully!")
      }

      setIsCreateModalOpen(false)
      setEditingJob(null)
      setFormData(initialFormState)
      loadJobs()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save external listing.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 1-Click Re-Verify
  const handleReverify = async (id, jobTitle) => {
    try {
      await dashboardService.reverifyExternalJob(id)
      toast.success(`"${jobTitle}" re-verified! Scheduled for next review in ${recheckDays} days.`)
      loadJobs()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reverify listing")
    }
  }

  // Delete / Remove
  const handleDelete = async (id, jobTitle) => {
    if (!window.confirm(`Are you sure you want to remove "${jobTitle}"? It will immediately stop showing to users.`)) {
      return
    }
    try {
      await dashboardService.deleteExternalJob(id)
      toast.success("Listing removed.")
      loadJobs()
      if (selectedJobDetails?.id === id) setSelectedJobDetails(null)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete listing")
    }
  }

  // Update Re-Check Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      setSavingSettings(true)
      await dashboardService.updateExternalJobSettings({ externalJobRecheckDays: recheckDays })
      toast.success(`Re-verification reminder threshold updated to ${recheckDays} days!`)
      setIsSettingsModalOpen(false)
      loadJobs()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update settings")
    } finally {
      setSavingSettings(false)
    }
  }

  const openEditModal = (job) => {
    setEditingJob(job)
    setFormData({
      title: job.title || "",
      companyName: job.companyName || "",
      destinationEmail: job.destinationEmail || "",
      expiryDate: job.expiryDate ? new Date(job.expiryDate).toISOString().split("T")[0] : "",
      category: job.category || "General Service",
      location: job.location || "",
      isRemote: Boolean(job.isRemote),
      salary: job.salary || "",
      source: job.source || "",
      description: job.description || "",
      requirements: job.requirements || "",
      checklist: {
        noUpfrontPayment: true,
        legitCompanyPresence: true,
        realisticRoleSalary: true
      }
    })
    setIsCreateModalOpen(true)
  }

  // Filtered Jobs in view
  const displayJobs = useMemo(() => {
    if (activeTab === "all") return jobs
    if (activeTab === "active") return jobs.filter(j => j.dynamicStatus === "ACTIVE")
    if (activeTab === "needs_recheck") return jobs.filter(j => j.dynamicStatus === "NEEDS_RECHECK" || j.needsRecheck)
    if (activeTab === "expired") return jobs.filter(j => j.dynamicStatus === "EXPIRED" || j.isPastExpiry)
    return jobs
  }, [jobs, activeTab])

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <ExternalLink className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">External Job Listings</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manual, staff-verified job opportunities from verified companies. Users can apply in 1-tap via Fixam.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
            title="Configure Re-Verification Reminder"
          >
            <Sliders className="h-4 w-4 text-slate-500" />
            <span>Reminder: {recheckDays}d</span>
          </button>

          <button
            onClick={() => {
              setEditingJob(null)
              setFormData(initialFormState)
              setIsCreateModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-500/30"
          >
            <Plus className="h-4 w-4" />
            <span>Create Listing</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Listings</span>
            <Briefcase className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.totalAll}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Live</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{stats.activeCount}</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between ${
          stats.needsRecheckCount > 0 ? "bg-amber-50/60 border-amber-300" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between text-xs font-medium text-amber-700">
            <span>Needs Re-Check</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{stats.needsRecheckCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Expired (Hidden)</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-500">{stats.expiredCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Applications Sent</span>
            <Send className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{stats.totalApplicationsCount}</div>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Listings ({stats.totalAll})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === "active" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Active ({stats.activeCount})
            </button>
            <button
              onClick={() => setActiveTab("needs_recheck")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === "needs_recheck"
                  ? "bg-amber-600 text-white"
                  : stats.needsRecheckCount > 0
                  ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>Needs Re-Check</span>
              {stats.needsRecheckCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/30 text-current">
                  {stats.needsRecheckCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("expired")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === "expired" ? "bg-slate-700 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Expired ({stats.expiredCount})
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === "applications" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Send className="h-3 w-3" />
              <span>Applications Log</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, company, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content Table */}
        {activeTab === "applications" ? (
          /* Applications Log View */
          <div className="overflow-x-auto">
            {loadingApplications ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading applications history...</div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No job applications submitted through Fixam yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Job Title & Company</th>
                    <th className="py-3 px-4">Destination Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">CV File</th>
                    <th className="py-3 px-4">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{app.applicantName}</div>
                        <div className="text-[11px] text-slate-500">{app.applicantEmail}</div>
                        {app.applicantPhone && <div className="text-[10px] text-slate-400">{app.applicantPhone}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{app.job?.title || "Unknown Job"}</div>
                        <div className="text-[11px] text-slate-500">{app.job?.companyName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {app.destinationEmail}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === "SENT" || app.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {app.status}
                        </span>
                        {app.errorMessage && (
                          <div className="text-[10px] text-red-600 mt-0.5 truncate max-w-xs" title={app.errorMessage}>
                            {app.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {app.cvName ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-600">
                            📎 {app.cvName}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(app.sentAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Job Listings Table */
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading external listings...</div>
            ) : displayJobs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No listings found matching your current filter.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
                    <th className="py-3 px-4">Opportunity</th>
                    <th className="py-3 px-4">Destination Email</th>
                    <th className="py-3 px-4">Status & Health</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Staff Verification</th>
                    <th className="py-3 px-4 text-center">Applications</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayJobs.map((job) => {
                    const daysUntilExpiry = Math.ceil((new Date(job.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
                    const daysSinceVerified = Math.floor((new Date() - new Date(job.verifiedAt)) / (1000 * 60 * 60 * 24))

                    return (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <span>{job.title}</span>
                            {job.isRemote && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                Remote
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            <span>{job.companyName}</span>
                            {job.location && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500 text-[11px]">{job.location}</span>
                              </>
                            )}
                          </div>
                          {job.source && (
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs" title={job.source}>
                              Source: {job.source}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span>{job.destinationEmail}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {job.isPastExpiry ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="h-3 w-3" /> Expired (Hidden)
                            </span>
                          ) : job.needsRecheck ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              <AlertTriangle className="h-3 w-3 text-amber-600" /> Needs Re-Check ({daysSinceVerified}d live)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active & Live
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <div className="font-medium text-[11px]">
                            {new Date(job.expiryDate).toLocaleDateString()}
                          </div>
                          <div className={`text-[10px] ${daysUntilExpiry < 3 ? "text-red-500 font-bold" : "text-slate-400"}`}>
                            {daysUntilExpiry <= 0 ? "Expired" : `${daysUntilExpiry} days remaining`}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-700 font-medium text-[11px]">{job.verifiedBy || "Staff Member"}</div>
                          <div className="text-slate-400 text-[10px]">
                            Checked {daysSinceVerified === 0 ? "today" : `${daysSinceVerified}d ago`}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                            {job.applicationsCount || 0}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          {job.needsRecheck && !job.isPastExpiry && (
                            <button
                              onClick={() => handleReverify(job.id, job.title)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded transition shadow-sm inline-flex items-center gap-1"
                              title="Confirm listing is still active and reset reminder"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Re-verify</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedJobDetails(job)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(job)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                            title="Edit Listing"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(job.id, job.title)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete Listing"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <ExternalLink className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingJob ? "Edit External Listing" : "Create Staff-Verified External Listing"}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Electrician / Plumber"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eneo Cameroon SA"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Application Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="recruitment@company.com"
                    value={formData.destinationEmail}
                    onChange={(e) => setFormData({ ...formData, destinationEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Applications sent by users will be delivered here directly.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Listing automatically ceases to show in feeds after this date.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Painting">Painting</option>
                    <option value="AC & Cooling">AC & Cooling</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="IT Support">IT Support</option>
                    <option value="General Service">General Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Douala / Yaoundé"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Compensation / Salary</label>
                  <input
                    type="text"
                    placeholder="e.g. 200,000 - 300,000 XAF"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 py-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isRemote}
                    onChange={(e) => setFormData({ ...formData, isRemote: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>This is a Fully Remote / Online Role</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source / Verification Origin
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official Careers Page: https://company.cm/jobs or LinkedIn"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Comprehensive description of responsibilities and scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Qualifications, certifications, years of experience required..."
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Red-Flag Checklist */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <span>Staff Sanity Pre-Publication Checklist</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Please review these reminders before publishing to ensure candidate safety:
                </p>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.checklist.noUpfrontPayment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checklist: { ...formData.checklist, noUpfrontPayment: e.target.checked }
                        })
                      }
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>No upfront payment or training fee requested from applicants</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.checklist.legitCompanyPresence}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checklist: { ...formData.checklist, legitCompanyPresence: e.target.checked }
                        })
                      }
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Company has a verified, legitimate web presence or physical office</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.checklist.realisticRoleSalary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checklist: { ...formData.checklist, realisticRoleSalary: e.target.checked }
                        })
                      }
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Role expectations and salary range look realistic and fair</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Publishing..." : editingJob ? "Save Changes" : "Publish External Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedJobDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">{selectedJobDetails.title}</h3>
              <button
                onClick={() => setSelectedJobDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Company</span>
                  <span className="text-slate-900 font-semibold">{selectedJobDetails.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination Email</span>
                  <span className="font-mono text-blue-600">{selectedJobDetails.destinationEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Expiry Date</span>
                  <span className="text-slate-800">{new Date(selectedJobDetails.expiryDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Staff Verified By</span>
                  <span className="text-slate-800">{selectedJobDetails.verifiedBy || "Admin Staff"}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Description</h4>
                <div className="text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  {selectedJobDetails.description}
                </div>
              </div>

              {selectedJobDetails.requirements && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Requirements</h4>
                  <div className="text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    {selectedJobDetails.requirements}
                  </div>
                </div>
              )}

              {selectedJobDetails.source && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Source / Verification Link</h4>
                  <div className="text-slate-500 font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100 break-all">
                    {selectedJobDetails.source}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    const j = selectedJobDetails
                    setSelectedJobDetails(null)
                    openEditModal(j)
                  }}
                  className="px-3.5 py-1.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Edit Listing
                </button>
                <button
                  onClick={() => setSelectedJobDetails(null)}
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL (Configurable Threshold) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Re-Verification Reminder Settings</h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                After an external listing has been active for this many days, staff will be alerted with a{" "}
                <span className="font-bold text-amber-700">"Needs Re-Check"</span> badge to verify that the recruiter
                hasn't filled the role before it continues showing to users.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reminder Threshold (Days)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    required
                    value={recheckDays}
                    onChange={(e) => setRecheckDays(parseInt(e.target.value, 10) || 1)}
                    className="w-24 px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-slate-500 font-medium">days after publication or last check</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {[7, 14, 21, 30].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRecheckDays(preset)}
                    className={`px-3 py-1 rounded text-xs font-semibold border transition ${
                      recheckDays === preset
                        ? "bg-blue-50 border-blue-400 text-blue-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {preset} days
                  </button>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
                >
                  {savingSettings ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
