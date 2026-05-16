"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Toolbox, Briefcase, Download } from "lucide-react"

const REVENUE_DATA = [
  { month: 'Jan', revenue: 450000, users: 400 },
  { month: 'Feb', revenue: 520000, users: 550 },
  { month: 'Mar', revenue: 480000, users: 600 },
  { month: 'Apr', revenue: 610000, users: 800 },
  { month: 'May', revenue: 750000, users: 1100 },
  { month: 'Jun', revenue: 840000, users: 1400 },
];

const SERVICE_STATS = [
  { name: 'Plumbing', value: 400 },
  { name: 'Electrician', value: 300 },
  { name: 'Cleaning', value: 300 },
  { name: 'Babysitting', value: 200 },
  { name: 'Beauty', value: 100 },
];

const COLORS = ['#0F172A', '#1E67D1', '#3B82F6', '#10B981', '#6366F1'];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Platform Analytics</h2>
          <p className="text-slate-500">Deep dive into revenue growth, user activity, and service trends.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
          <Download size={18} />
          Export Reports
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Growth */}
        <div className="lg:col-span-2 bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Revenue & User Growth</h3>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-slate-900" /> Revenue</div>
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-blue-600" /> New Users</div>
            </div>
          </div>
          <div className="h-80 overflow-hidden">
              <AreaChart data={REVENUE_DATA} width={760} height={320}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0F172A" strokeWidth={4} fillOpacity={0.1} fill="#0F172A" />
                <Area type="monotone" dataKey="users" stroke="#1E67D1" strokeWidth={4} fillOpacity={0.1} fill="#1E67D1" />
              </AreaChart>
          </div>
        </div>

        {/* Most Requested Services */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Service Category Split</h3>
          <div className="h-64 overflow-hidden">
              <PieChart width={320} height={256}>
                <Pie
                  data={SERVICE_STATS}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {SERVICE_STATS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
          </div>
          <div className="mt-6 space-y-3">
            {SERVICE_STATS.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-sm font-medium text-slate-600">{s.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{s.value} jobs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Growth Rate", value: "+24.5%", icon: TrendingUp, color: "text-emerald-600" },
          { label: "Active Clients", value: "12,402", icon: Users, color: "text-blue-600" },
          { label: "Avg Job Value", value: "8,500 XAF", icon: Briefcase, color: "text-blue-600" },
          { label: "Retention", value: "88%", icon: Toolbox, color: "text-violet-600" },
        ].map((item, i) => (
          <div key={i} className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
