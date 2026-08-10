// client/src/pages/client/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import ClientPhaseView from './PhaseView'
import {
  CheckCircle, Clock, CreditCard, Wrench, Calendar,
  ArrowUpRight, AlertCircle, Circle
} from 'lucide-react'

const STATUS_LABEL = {
  pending_payment: { label: 'Pending Payment',   color: 'badge-amber' },
  active:          { label: 'In Progress',        color: 'badge-blue' },
  on_hold:         { label: 'On Hold',            color: 'badge-gray' },
  in_review:       { label: 'In Review',          color: 'badge-oxford' },
  delivered:       { label: 'Delivered',          color: 'badge-green' },
  in_maintenance:  { label: 'In Maintenance',     color: 'badge-rose' },
  techcare:        { label: 'TechCare Active',    color: 'badge-green' },
  completed:       { label: 'Completed',          color: 'badge-green' },
}

export default function ClientDashboard() {
  const { user }    = useAuth()
  const [project,   setProject]  = useState(null)
  const [loading,   setLoading]  = useState(true)
  const [nextMeeting, setNextMeeting] = useState(null)

  useEffect(() => {
    api.get('/client/project')
      .then(r => setProject(r.data.data))
      .catch(() => setProject(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Good day, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-sub">Here's an overview of your project with TechEthix.</p>
      </div>

      {!project ? (
        <div className="card text-center py-16">
          <Clock size={36} className="text-muted/30 mx-auto mb-4" />
          <p className="font-syne font-700 text-oxford">No active project yet</p>
          <p className="text-muted text-sm mt-1 max-w-xs mx-auto">
            Once your proposal is accepted and payment is made, your project will appear here.
          </p>
          <a
            href="https://wa.me/916262326939"
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-6 mx-auto w-fit"
          >
            Contact TechEthix
          </a>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="stat-label">Progress</p>
              <p className="stat-value">{project.progress_percent ?? 0}%</p>
              <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-oxford rounded-full transition-all"
                  style={{ width: `${project.progress_percent ?? 0}%` }}
                />
              </div>
            </div>
            <div className="stat-card">
              <p className="stat-label">Revisions Left</p>
              <p className="stat-value">
                {(project.revision_total - project.revision_used)}
                <span className="text-lg text-muted font-400"> / {project.revision_total}</span>
              </p>
              <p className="text-xs text-muted mt-1">Free revisions</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Maintenance</p>
              <p className="stat-value">
                {(project.maintenance_total - project.maintenance_used)}
                <span className="text-lg text-muted font-400"> / {project.maintenance_total}</span>
              </p>
              <p className="text-xs text-muted mt-1">Requests left</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Status</p>
              <div className="mt-2">
                <span className={`badge ${STATUS_LABEL[project.status]?.color || 'badge-gray'} text-sm px-3 py-1`}>
                  {STATUS_LABEL[project.status]?.label || project.status}
                </span>
              </div>
            </div>
          </div>

          {/* Project card */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-syne font-700 text-oxford text-lg">{project.title}</h3>
                <p className="text-muted text-sm mt-0.5">{project.description}</p>
              </div>
              <Link to="/portal/project" className="btn-ghost text-xs">
                Full view <ArrowUpRight size={14} />
              </Link>
            </div>

            {/* Phase or Milestone preview */}
            {project.project_mode === 'phases' ? (
              <div className="mt-4">
                <ClientPhaseView projectId={project.id} />
              </div>
            ) : (
            <div className="space-y-2 mt-4">
              {(project.milestones || []).slice(0, 4).map((m, i) => (
                <div key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border">
                  {m.status === 'approved' ? (
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                  ) : m.status === 'completed' ? (
                    <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                  ) : m.status === 'in_progress' ? (
                    <Clock size={18} className="text-blue-500 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-border flex-shrink-0" />
                  )}
                  <span className="text-sm text-oxford flex-1">{m.title}</span>
                  <span className={`badge text-xs ${
                    m.status === 'approved'    ? 'badge-green' :
                    m.status === 'completed'   ? 'badge-amber' :
                    m.status === 'in_progress' ? 'badge-blue'  : 'badge-gray'
                  }`}>
                    {m.status === 'in_progress' ? 'In Progress' :
                     m.status === 'completed'   ? 'Awaiting Approval' :
                     m.status === 'approved'    ? 'Approved' : 'Pending'}
                  </span>
                </div>
              ))}
              {(project.milestones?.length || 0) > 4 && (
                <Link to="/portal/project"
                  className="block text-center text-xs text-muted hover:text-oxford py-2 transition-colors">
                  +{project.milestones.length - 4} more milestones →
                </Link>
              )}
            </div>
            )}
          </div>


          {/* Upcoming meeting */}
          {nextMeeting && (
            <Link to="/portal/meetings"
              className="card-sm flex items-center gap-3 hover:shadow-lg transition-all group">
              <div className="p-2.5 rounded-xl bg-oxford flex-shrink-0">
                <Calendar size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted uppercase tracking-wide">Next Meeting</p>
                <p className="font-medium text-oxford text-sm truncate mt-0.5">{nextMeeting.title}</p>
                <p className="text-xs text-muted">
                  {new Date(nextMeeting.meeting_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  {' · '}
                  {(() => {
                    const [h,m] = nextMeeting.meeting_time.split(':')
                    const hr = parseInt(h)
                    return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`
                  })()}
                </p>
              </div>
            </Link>
          )}

          {/* Delivery dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-oxford/8">
                <Clock size={20} className="text-oxford" />
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide">Expected Delivery</p>
                <p className="font-syne font-700 text-oxford mt-0.5">
                  {project.expected_delivery
                    ? new Date(project.expected_delivery).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
                    : 'TBD'}
                </p>
              </div>
            </div>
            <Link to="/portal/payments" className="card-sm flex items-center gap-4 hover:shadow-lg transition-all group">
              <div className="p-3 rounded-xl bg-green-50">
                <CreditCard size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide">Payments</p>
                <p className="font-syne font-700 text-oxford mt-0.5 group-hover:text-rose transition-colors">
                  View & Pay →
                </p>
              </div>
            </Link>
          </div>

          {/* TechCare upsell if maintenance exhausted */}
          {project.maintenance_used >= project.maintenance_total && !project.techcare_active && (
            <div className="card bg-oxford text-white border-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-syne font-700 text-white">Your free maintenance is complete</h4>
                  <p className="text-white/60 text-sm mt-1">
                    Continue getting support with TechCare — ₹2,500/month for ongoing updates, backups, and priority support.
                  </p>
                </div>
                <a
                  href="https://wa.me/916262326939?text=I want to subscribe to TechCare"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0 bg-white text-oxford px-4 py-2 rounded-xl text-sm font-medium hover:bg-cream transition-colors whitespace-nowrap"
                >
                  Upgrade →
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
