// client/src/pages/admin/maintenance/MaintenanceList.jsx
import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import {
  Wrench, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, Shield, Trash2
} from 'lucide-react'
import clsx from 'clsx'


const STATUS_OPTIONS = ['submitted', 'reviewing', 'in_progress', 'done']

const STATUS_STYLE = {
  submitted: 'badge-amber',
  reviewing: 'badge-blue',
  in_progress: 'badge-oxford',
  done: 'badge-green',
}

export default function MaintenanceList() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  

  const fetchRequests = () => {
    const params = filter ? `?status=${filter}` : ''
    api.get(`/maintenance${params}`)
      .then(r => setRequests(r.data.data || []))
      .catch(() => toast.error('Failed to load requests.'))
      .finally(() => setLoading(false))
  }
  // Request-specific delete is handled inside RequestCard

  useEffect(() => { fetchRequests() }, [filter])

  // Summary counts
  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">

      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-sub">{requests.length} total requests across all projects</p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        {[
          { key: '', label: 'All', count: requests.length },
          { key: 'submitted', label: 'Submitted', count: counts.submitted || 0 },
          { key: 'reviewing', label: 'Reviewing', count: counts.reviewing || 0 },
          { key: 'in_progress', label: 'In Progress', count: counts.in_progress || 0 },
          { key: 'done', label: 'Done', count: counts.done || 0 },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              filter === s.key
                ? 'bg-oxford text-white border-oxford'
                : 'bg-white text-muted border-border hover:border-oxford/30'
            )}
          >
            {s.label}
            <span className={clsx(
              'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
              filter === s.key ? 'bg-white/20 text-white' : 'bg-cream text-muted'
            )}>
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-16">
          <Wrench size={36} className="text-muted/30 mx-auto mb-3" />
          <p className="font-syne font-700 text-oxford">No maintenance requests yet</p>
          <p className="text-muted text-sm mt-1">Requests appear after projects are delivered.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <RequestCard
              key={r.id}
              request={r}
              onUpdate={fetchRequests}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Request Card ─────────────────────────────
function RequestCard({ request: r, onUpdate }) {
  const [open, setOpen] = useState(r.status === 'submitted')
  const [note, setNote] = useState(r.admin_note || '')
  const [status, setStatus] = useState(r.status)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/maintenance/${r.id}`, { status, admin_note: note })
      toast.success('Updated.')
      onUpdate()
    } catch {
      toast.error('Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleActivateTechCare = async () => {
    if (!confirm(`Activate TechCare for project "${r.project_title}"? This will create a ₹2,500 monthly payment record.`)) return
    setActivating(true)
    try {
      await api.post('/maintenance/techcare/activate', { project_id: r.project_id })
      toast.success('TechCare activated! Client has been notified.')
      onUpdate()
    } catch {
      toast.error('Activation failed.')
    } finally {
      setActivating(false)
    }
  }

  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this maintenance request?')) return
    setDeleting(true)
    try {
      await api.delete(`/maintenance/${r.id}`)
      toast.success('Request deleted.')
      onUpdate()
    } catch {
      toast.error('Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="card p-0 overflow-hidden">

      {/* Header */}
      <button
        className="w-full flex items-center gap-4 p-4 hover:bg-cream/50 transition-colors text-left"
        onClick={() => setOpen(p => !p)}
      >
        {r.status === 'done'
          ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
          : r.status === 'in_progress'
            ? <Clock size={18} className="text-blue-500  flex-shrink-0" />
            : <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
        }

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-oxford">{r.title}</p>
            {r.techcare_active && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-oxford text-white rounded-full">
                <Shield size={10} /> TechCare
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">
            {r.client_name} · {r.project_title} ·{' '}
            {new Date(r.created_at).toLocaleDateString('en-IN')}
          </p>
        </div>

        <span className={`badge text-xs flex-shrink-0 ${STATUS_STYLE[r.status] || 'badge-gray'}`}>
          {r.status.replace(/_/g, ' ')}
        </span>

        {open
          ? <ChevronUp size={16} className="text-muted flex-shrink-0" />
          : <ChevronDown size={16} className="text-muted flex-shrink-0" />
        }
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border p-4 space-y-4 bg-cream/30">

          {/* Client's description */}
          <div>
            <p className="form-label">Client's description</p>
            <p className="text-sm text-oxford bg-white rounded-xl p-3 mt-1">{r.description}</p>
          </div>

          {/* Admin response */}
          <div>
            <label className="form-label">Your response / update for client</label>
            <textarea
              className="form-textarea mt-1"
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Describe what you fixed or any additional info..."
            />
          </div>

          {/* Status + save */}
          <div className="flex gap-3 flex-wrap">
            <select
              className="form-select w-auto py-2 flex-1"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary py-2 px-5"
            >
              {saving ? 'Saving...' : 'Save & Notify Client'}
            </button>
            <div className="pt-3 border-t border-border">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-ghost text-xs py-1.5 px-3 text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} />
                {deleting ? 'Deleting...' : 'Delete Request'}
              </button>
            </div>

          </div>

          {/* TechCare activation (if not already active) */}
          {!r.techcare_active && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted mb-2">
                Offer TechCare to this client for unlimited ongoing support:
              </p>
              <button
                onClick={handleActivateTechCare}
                disabled={activating}
                className="btn-secondary text-xs py-1.5 px-4"
              >
                <Shield size={13} />
                {activating ? 'Activating...' : 'Activate TechCare — ₹2,500/month'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
