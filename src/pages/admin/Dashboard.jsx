// client/src/pages/admin/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import {
  Users, FolderKanban, CreditCard, TrendingUp,
  ArrowUpRight, AlertCircle, CheckCircle,
  Clock, Wrench, Shield, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const PIE_COLORS = ['#002147','#654345','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#002147', padding:'8px 12px', borderRadius:10, fontSize:12, color:'#fff' }}>
      <p style={{ fontWeight:600, marginBottom:2 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i}>
          {p.name}: {p.name === 'revenue' || p.name === 'Revenue'
            ? 'Rs.' + Number(p.value).toLocaleString('en-IN')
            : p.value}
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const { data } = await api.get('/notifications/dashboard')
      setStats(data.data)
    } catch {
      try {
        const { data } = await api.get('/leads/stats')
        setStats({
          revenue:  { this_month: data.data?.revenueThisMonth, pending: data.data?.pendingPayments, monthly: [] },
          leads:    { total: data.data?.totalLeads, new: data.data?.newLeads, pipeline: {}, won: 0 },
          projects: { active: data.data?.activeProjects, techcare_clients: 0, pending_payment: 0, delivered_month: 0 },
          actions:  {}
        })
      } catch {}
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const r = stats?.revenue  || {}
  const l = stats?.leads    || {}
  const p = stats?.projects || {}
  const a = stats?.actions  || {}

  const statCards = [
    {
      label: 'Revenue This Month',
      value: r.this_month ? 'Rs.' + Number(r.this_month).toLocaleString('en-IN') : 'Rs.0',
      sub:   r.growth_percent != null ? (r.growth_percent >= 0 ? '+' : '') + r.growth_percent + '% vs last month' : 'No data yet',
      change: r.growth_percent,
      icon:  CreditCard,
      color: 'bg-green-50 text-green-600',
      link:  '/admin/payments',
    },
    {
      label: 'Total Leads',
      value: l.total ?? 0,
      sub:   (l.new || 0) + ' new this week',
      icon:  Users,
      color: 'bg-blue-50 text-blue-600',
      link:  '/admin/leads',
    },
    {
      label: 'Active Projects',
      value: p.active ?? 0,
      sub:   (p.delivered_month || 0) + ' delivered this month',
      icon:  FolderKanban,
      color: 'bg-oxford/8 text-oxford',
      link:  '/admin/projects',
    },
    {
      label: 'Pending Revenue',
      value: r.pending ? 'Rs.' + Number(r.pending).toLocaleString('en-IN') : 'Rs.0',
      sub:   (r.pending_count || 0) + ' invoices outstanding',
      icon:  TrendingUp,
      color: 'bg-amber-50 text-amber-600',
      link:  '/admin/payments',
    },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const monthlyData = r.monthly?.length
    ? r.monthly.map(m => ({ month: m.month.split(' ')[0], revenue: Number(m.revenue) }))
    : [{ month: 'Now', revenue: 0 }]

  const sourceData = (stats?.lead_sources || []).slice(0, 6)
    .map(s => ({ name: (s.source || 'other').replace(/_/g,' '), value: parseInt(s.count) }))

  const pipelineOrder = ['new','contacted','call_scheduled','quoted','negotiating','won','lost']
  const pipelineData  = pipelineOrder.map(s => ({
    status: s.replace(/_/g,' '),
    count:  l.pipeline?.[s] || 0,
  }))

  return (
    <div className="space-y-6">

      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Live overview of TechEthix</p>
        </div>
        <button onClick={() => fetchStats(true)} disabled={refreshing} className="btn-secondary text-sm">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Link key={s.label} to={s.link}
            className="stat-card hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">{s.label}</p>
                <p className="stat-value mt-1">{s.value}</p>
                <p className={['text-xs mt-1', s.change > 0 ? 'text-green-600' : s.change < 0 ? 'text-red-500' : 'text-muted'].join(' ')}>
                  {s.sub}
                </p>
              </div>
              <div className={['p-2.5 rounded-xl group-hover:scale-110 transition-transform', s.color].join(' ')}>
                <s.icon size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Action needed */}
      {(a.overdue_followups > 0 || a.pending_approvals > 0 || a.pending_revisions > 0) && (
        <div className="card border-l-4 border-l-amber-400 bg-amber-50/30">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-syne font-700 text-oxford text-sm mb-2">Action needed</h4>
              <div className="flex flex-wrap gap-3">
                {a.overdue_followups > 0 && (
                  <Link to="/admin/leads" className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium">
                    <Clock size={14} /> {a.overdue_followups} overdue follow-up{a.overdue_followups > 1 ? 's' : ''}
                  </Link>
                )}
                {a.pending_approvals > 0 && (
                  <Link to="/admin/projects" className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium">
                    <CheckCircle size={14} /> {a.pending_approvals} milestone{a.pending_approvals > 1 ? 's' : ''} awaiting approval
                  </Link>
                )}
                {a.pending_revisions > 0 && (
                  <Link to="/admin/projects" className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium">
                    <Wrench size={14} /> {a.pending_revisions} revision{a.pending_revisions > 1 ? 's' : ''} to review
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue chart + sources */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-syne font-700 text-oxford">Revenue</h3>
              <p className="text-xs text-muted mt-0.5">Last 6 months</p>
            </div>
            <div className="text-right">
              <p className="font-syne font-800 text-oxford text-lg">
                Rs.{Number(r.total || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted">All time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#002147" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#002147" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'#6B6762' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#6B6762' }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? 'Rs.0' : 'Rs.' + (v/1000).toFixed(0) + 'k'} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#002147"
                strokeWidth={2.5} fill="url(#revGrad)" dot={false}
                activeDot={{ r:5, fill:'#002147' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-syne font-700 text-oxford mb-1">Lead Sources</h3>
          <p className="text-xs text-muted mb-3">Where leads come from</p>
          {sourceData.length === 0 ? (
            <div className="flex items-center justify-center h-36 text-muted text-sm">No leads yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%"
                    innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background:'#002147', border:'none', borderRadius:10, color:'#fff', fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {sourceData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted capitalize">{s.name}</span>
                    </div>
                    <span className="font-medium text-oxford">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pipeline bar + quick stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <h3 className="font-syne font-700 text-oxford mb-1">Lead Pipeline</h3>
          <p className="text-xs text-muted mb-4">Leads by stage</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pipelineData} barSize={28}>
              <XAxis dataKey="status" tick={{ fontSize:10, fill:'#6B6762' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#6B6762' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Leads" fill="#002147" radius={[6,6,0,0]}>
                {pipelineData.map((entry, i) => (
                  <Cell key={i}
                    fill={entry.status==='won' ? '#10B981' : entry.status==='lost' ? '#EF4444' : entry.status==='new' ? '#3B82F6' : '#002147'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <div className="card-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide">Won Leads</p>
                <p className="font-syne font-800 text-oxford text-2xl mt-0.5">{l.won || 0}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-xl">
                <CheckCircle size={18} className="text-green-600" />
              </div>
            </div>
            <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full"
                style={{ width: (l.total ? Math.min(100, Math.round(((l.won||0)/l.total)*100)) : 0) + '%' }} />
            </div>
            <p className="text-xs text-muted mt-1">
              {l.total ? Math.round(((l.won||0)/l.total)*100) : 0}% conversion rate
            </p>
          </div>

          <div className="card-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide">TechCare Clients</p>
                <p className="font-syne font-800 text-oxford text-2xl mt-0.5">{p.techcare_clients || 0}</p>
              </div>
              <div className="p-2 bg-oxford/8 rounded-xl">
                <Shield size={18} className="text-oxford" />
              </div>
            </div>
            <p className="text-xs text-muted mt-2">
              Rs.{Number((p.techcare_clients||0)*2500).toLocaleString('en-IN')}/month recurring
            </p>
          </div>

          <div className="card-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide">Pending Payment</p>
                <p className="font-syne font-800 text-oxford text-2xl mt-0.5">{p.pending_payment || 0}</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl">
                <Clock size={18} className="text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted mt-2">Projects waiting for advance</p>
          </div>
        </div>
      </div>

    </div>
  )
}
