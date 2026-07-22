"use client"

import { useEffect, useState } from "react"
import { GraduationCap, Users, BookOpen, Trophy } from "lucide-react"
import { dashboardService } from "@/services/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function CareerpathAdminPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getCareerpathStats()
        setStats(response.data.stats || {})
      } catch (error) {
        console.error("Failed to load careerpath stats", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading Careerpath Data...</div>

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-[#0D9488]" /> Careerpath Hub
          </h2>
          <p className="text-slate-500 mt-2">Manage course enrollments, module completion rates, and smart exams.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Enrollments */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Enrollments</h3>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <div className="text-4xl font-bold text-slate-800">{stats?.enrollments || 0}</div>
        </div>

        {/* Modules Completed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Modules Completed</h3>
            <BookOpen className="h-5 w-5 text-slate-400" />
          </div>
          <div className="text-4xl font-bold text-slate-800">{stats?.completedModules || 0}</div>
        </div>
        
        {/* Certificates Issued */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Certificates Issued</h3>
            <Trophy className="h-5 w-5 text-slate-400" />
          </div>
          <div className="text-4xl font-bold text-slate-800">{stats?.certificatesIssued || 0}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Popular Courses (Enrollments)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.popularCourses || [
                { name: 'Electrical', enrollments: 45 },
                { name: 'Plumbing', enrollments: 32 },
                { name: 'Carpentry', enrollments: 28 },
                { name: 'Appliance', enrollments: 20 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '8px', border: '1px solid #E2E8F0'}} />
                <Bar dataKey="enrollments" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Recent Enrollments</h3>
          </div>
          <div className="overflow-x-auto h-64 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0">
                <tr>
                  <th className="py-3 px-6 font-medium">User ID</th>
                  <th className="py-3 px-6 font-medium">Skill Group</th>
                  <th className="py-3 px-6 font-medium">Progress</th>
                  <th className="py-3 px-6 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentEnrollments?.map((enrollment, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 text-slate-800 font-medium">User #{enrollment.userId}</td>
                    <td className="py-3 px-6 text-slate-600 capitalize">{enrollment.categoryKey || enrollment.skillGroupId}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px]">
                          <div className="bg-[#0D9488] h-2 rounded-full" style={{ width: `${enrollment.progressPercent || 0}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500">{enrollment.progressPercent || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${enrollment.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {enrollment.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!stats?.recentEnrollments?.length && (
                  <tr>
                    <td colSpan={4} className="py-12 px-6 text-center text-slate-500 font-medium">No enrollments yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
