// client/src/pages/client/Maintenance.jsx
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import {
  Wrench, CheckCircle, Clock, AlertCircle,
  Plus, X, Zap, Shield
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_STYLE = {
  submitted:   'badge-amber',
  reviewing:   'badge-blue',
  in_progress: 'badge-oxford',
  done:        'badge-green',
}

const STATUS_LABEL = {
  submitted:   'Submitted',
  reviewing:   'Under Review',
  in_progress: 'In Progress',
  done:        'Done',
}

export default function ClientMaintenance() {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form,       setForm]       = useState({ title: '', description: '' })

  const fetchData = () => {
    api.get('/maintenance/my')
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load maintenance info.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error('Please fill in both fields.')
    }
    setSubmitting(true)
    try {
      await api.post('/maintenance', {
        project_id:  data.id,
        title:       form.title,
        description: form.description
      })
      toast.success('Request submitted! We will get back to you shortly.')
      setForm({ title: '', description: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed.'
      toast.error(msg)
      if (err.response?.data?.upgrade_required) {
        setShowForm(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="card text-center py-16">
      <Wrench size={36} className="text-muted/30 mx-auto mb-3" />
      <p className="font-syne font-700 text-oxford">No active project</p>
      <p className="text-muted text-sm mt-1">
        Maintenance becomes available after your project is delivered.
      </p>
    </div>
  )

  const exhausted  = !data.techcare_active && data.maintenance_used >= data.maintenance_total
  const inMaint    = ['in_maintenance', 'techcare', 'delivered'].includes(data.status)
  const requests   = data.requests || []

  return (
    <div className="space-y-6 max-w-3xl">

      <div>
        <h1 className="page-title">Maintenance</h1>
        <p className="page-sub">{data.title}</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="stat-label">Requests Used</p>
          <p className="stat-value mt-1">
            {data.techcare_active ? '∞' : data.maintenance_used}
            {!data.techcare_active && (
              <span className="text-lg text-muted font-400"> / {data.maintenance_total}</span>
            )}
          </p>
          <p className="text-xs text-muted mt-1">
            {data.techcare_active ? 'Unlimited (TechCare)' : 'Free requests'}
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Remaining</p>
          <p className={clsx('stat-value mt-1',
            data.techcare_active ? 'text-green-600' :
            data.remaining === 0 ? 'text-red-500' :
            data.remaining === 1 ? 'text-amber-500' : 'text-oxford'
          )}>
            {data.techcare_active ? '∞' : data.remaining}
          </p>
          <p className="text-xs text-muted mt-1">
            {data.techcare_active ? 'No limit' : 'Free left'}
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Total Requests</p>
          <p className="stat-value mt-1">{requests.length}</p>
          <p className="text-xs text-muted mt-1">
            {requests.filter(r => r.status === 'done').length} completed
          </p>
        </div>
      </div>

      {/* TechCare active badge */}
      {data.techcare_active && (
        <div className="card bg-oxford border-0">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-syne font-700 text-white">TechCare Active</h3>
              <p className="text-white/60 text-sm mt-0.5">
                Unlimited maintenance requests · Priority support · Active since{' '}
                {data.techcare_since
                  ? new Date(data.techcare_since).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                  : 'recently'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exhausted — TechCare upsell */}
      {exhausted && (
        <div className="card border-2 border-rose/30 bg-rose/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-rose/10 flex-shrink-0">
              <Zap size={22} className="text-rose" />
            </div>
            <div className="flex-1">
              <h3 className="font-syne font-700 text-oxford">Free maintenance requests used</h3>
              <p className="text-muted text-sm mt-1 mb-4">
                You have used all {data.maintenance_total} free maintenance requests.
                Upgrade to TechCare at ₹2,500/month for unlimited requests, priority support, monthly backups, and performance monitoring.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  'Unlimited maintenance requests',
                  'Priority 24-hour response',
                  'Monthly performance report',
                  'Automatic backups',
                  'Security monitoring',
                  'Minor content updates',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-oxford">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <a
                href="https://wa.me/916262326939?text=Hi, I want to upgrade to TechCare for my project"
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-fit"
              >
                Upgrade to TechCare — ₹2,500/month →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Submit form */}
      {inMaint && !exhausted && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-700 text-oxford">Submit a Request</h3>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2">
                <Plus size={15} /> New Request
              </button>
            )}
          </div>

          {!data.techcare_active && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-cream rounded-xl">
              <div className="flex gap-1">
                {Array.from({ length: data.maintenance_total }).map((_, i) => (
                  <div key={i} className={clsx(
                    'w-8 h-2 rounded-full transition-colors',
                    i < data.maintenance_used ? 'bg-rose' : 'bg-border'
                  )} />
                ))}
              </div>
              <p className="text-xs text-muted ml-2">
                {data.remaining} of {data.maintenance_total} free requests remaining
              </p>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">What needs to be fixed or changed? *</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Contact form not sending emails"
                  required
                />
              </div>
              <div>
                <label className="form-label">Describe the issue in detail *</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What exactly is the problem? When did it start? What should it do instead?"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm({ title: '', description: '' }) }}
                  className="btn-secondary flex-1 justify-center"
                >
                  <X size={15} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 justify-center"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : 'Submit Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Request history */}
      <div className="card">
        <h3 className="font-syne font-700 text-oxford mb-4">Request History</h3>
        {requests.length === 0 ? (
          <div className="text-center py-10">
            <Wrench size={28} className="text-muted/30 mx-auto mb-3" />
            <p className="text-muted text-sm">No maintenance requests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {r.status === 'done'
                      ? <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                      : r.status === 'in_progress'
                      ? <Clock       size={18} className="text-blue-500  flex-shrink-0 mt-0.5" />
                      : <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    }
                    <div className="min-w-0">
                      <p className="font-medium text-oxford">{r.title}</p>
                      <p className="text-sm text-muted mt-0.5 line-clamp-2">{r.description}</p>
                      {r.admin_note && (
                        <div className="mt-2 p-2.5 bg-cream rounded-lg">
                          <p className="text-xs font-medium text-oxford mb-0.5">Response from TechEthix</p>
                          <p className="text-xs text-muted">{r.admin_note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`badge text-xs ${STATUS_STYLE[r.status] || 'badge-gray'}`}>
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                    <p className="text-xs text-muted">
                      {new Date(r.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
