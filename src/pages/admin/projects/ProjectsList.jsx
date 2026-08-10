// client/src/pages/admin/projects/ProjectsList.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import { ArrowUpRight, FolderKanban } from 'lucide-react'
import clsx from 'clsx'

const STATUS_STYLE = {
  pending_payment: 'badge-amber',
  active:          'badge-blue',
  on_hold:         'badge-gray',
  in_review:       'badge-oxford',
  delivered:       'badge-green',
  in_maintenance:  'badge-rose',
  techcare:        'badge-green',
  completed:       'badge-green',
}

const STATUS_LABEL = {
  pending_payment: 'Pending Payment',
  active:          'Active',
  on_hold:         'On Hold',
  in_review:       'In Review',
  delivered:       'Delivered',
  in_maintenance:  'Maintenance',
  techcare:        'TechCare',
  completed:       'Completed',
}

export default function ProjectsList() {
  const [projects, setProjects] = useState([])
  const [counts,   setCounts]   = useState({})
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('')

  useEffect(() => {
    const params = filter ? `?status=${filter}` : ''
    api.get(`/projects${params}`)
      .then(r => { setProjects(r.data.data || []); setCounts(r.data.counts || {}) })
      .catch(() => toast.error('Failed to load projects.'))
      .finally(() => setLoading(false))
  }, [filter])

  const totalRevenue = projects.reduce((a, p) => a + (parseFloat(p.paid_amount) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">{projects.length} projects · ₹{totalRevenue.toLocaleString('en-IN')} collected</p>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '',               label: 'All' },
          { key: 'active',         label: 'Active' },
          { key: 'pending_payment',label: 'Pending Payment' },
          { key: 'delivered',      label: 'Delivered' },
          { key: 'in_maintenance', label: 'Maintenance' },
          { key: 'completed',      label: 'Completed' },
        ].map(s => (
          <button key={s.key}
            onClick={() => setFilter(s.key)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
              filter === s.key
                ? 'bg-oxford text-white border-oxford'
                : 'bg-white text-muted border-border hover:border-oxford/30'
            )}
          >
            {s.label}
            {s.key && counts[s.key] ? ` (${counts[s.key]})` : ''}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban size={36} className="text-muted/30 mx-auto mb-3" />
          <p className="font-syne font-700 text-oxford">No projects yet</p>
          <p className="text-muted text-sm mt-1">Projects are created automatically when a proposal is accepted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map(project => (
            <Link key={project.id} to={`/admin/projects/${project.id}`}
              className="card hover:shadow-lg hover:-translate-y-0.5 transition-all group">

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-syne font-700 text-oxford truncate">{project.title}</h3>
                  <p className="text-sm text-muted mt-0.5">{project.client_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${STATUS_STYLE[project.status] || 'badge-gray'}`}>
                    {STATUS_LABEL[project.status] || project.status}
                  </span>
                  <ArrowUpRight size={16} className="text-muted group-hover:text-oxford transition-colors flex-shrink-0" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted mb-1.5">
                  <span>Progress</span>
                  <span className="font-medium text-oxford">{project.progress_percent || 0}%</span>
                </div>
                <div className="h-2 bg-cream rounded-full overflow-hidden">
                  <div
                    className="h-full bg-oxford rounded-full transition-all"
                    style={{ width: `${project.progress_percent || 0}%` }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-cream rounded-xl p-3 text-center">
                  <p className="font-syne font-800 text-oxford text-lg">
                    {project.approved_count}/{project.milestone_count}
                  </p>
                  <p className="text-xs text-muted mt-0.5">Milestones</p>
                </div>
                <div className="bg-cream rounded-xl p-3 text-center">
                  <p className="font-syne font-800 text-oxford text-lg">
                    {project.paid_amount
                      ? `₹${Number(project.paid_amount).toLocaleString('en-IN')}`
                      : '₹0'}
                  </p>
                  <p className="text-xs text-muted mt-0.5">Collected</p>
                </div>
                <div className="bg-cream rounded-xl p-3 text-center">
                  <p className="font-syne font-800 text-oxford text-lg">
                    {project.expected_delivery
                      ? new Date(project.expected_delivery).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
                      : '—'}
                  </p>
                  <p className="text-xs text-muted mt-0.5">Deadline</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
