// client/src/pages/admin/projects/ProjectsList.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import { ArrowUpRight, FolderKanban } from 'lucide-react'
import { Plus, Trash2, X } from 'lucide-react'
import clsx from 'clsx'

const STATUS_STYLE = {
  pending_payment: 'badge-amber',
  active: 'badge-blue',
  on_hold: 'badge-gray',
  in_review: 'badge-oxford',
  delivered: 'badge-green',
  in_maintenance: 'badge-rose',
  techcare: 'badge-green',
  completed: 'badge-green',
}

const STATUS_LABEL = {
  pending_payment: 'Pending Payment',
  active: 'Active',
  on_hold: 'On Hold',
  in_review: 'In Review',
  delivered: 'Delivered',
  in_maintenance: 'Maintenance',
  techcare: 'TechCare',
  completed: 'Completed',
}

export default function ProjectsList() {
  const [projects, setProjects] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [clients, setClients] = useState([])
  const [form, setForm] = useState({
    client_id: '', title: '', description: '',
    price: '', project_mode: 'milestones', deadline: ''
  })

  useEffect(() => {
    const params = filter ? `?status=${filter}` : ''
    api.get(`/projects${params}`)
      .then(r => { setProjects(r.data.data || []); setCounts(r.data.counts || {}) })
      .catch(() => toast.error('Failed to load projects.'))
      .finally(() => setLoading(false))
  }, [filter])

  const totalRevenue = projects.reduce((a, p) => a + (parseFloat(p.paid_amount) || 0), 0)

  const openCreate = async () => {
    setShowCreate(true)
    try {
      const { data } = await api.get('/clients')
      setClients(data.data || [])
    } catch { }
  }
  const handleCreate = async e => {
    e.preventDefault()
    if (!form.client_id || !form.title || !form.price) {
      return toast.error('Client, title, and price are required.')
    }
    setCreating(true)
    try {
      await api.post('/projects/manual', form)
      toast.success('Project created with 35/35/30 payment schedule.')
      setShowCreate(false)
      setForm({ client_id: '', title: '', description: '', price: '', project_mode: 'milestones', deadline: '' })
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setCreating(false)
    }
  }

  // STEP 5 — Delete handler:
  const handleDelete = async (id, title) => {
    if (!confirm(`Delete project "${title}"? All data including milestones and payments will be removed.`)) return
    setDeletingId(id)
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted.')
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setDeletingId(null)
    }
  }



  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">{projects.length} projects · ₹{totalRevenue.toLocaleString('en-IN')} collected</p>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} /> New Project
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'pending_payment', label: 'Pending Payment' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'in_maintenance', label: 'Maintenance' },
          { key: 'completed', label: 'Completed' },
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
                      ? new Date(project.expected_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                  <p className="text-xs text-muted mt-0.5">Deadline</p>
                </div>
                <button
                  onClick={e => { e.preventDefault(); handleDelete(project.id, project.title) }}
                  disabled={deletingId === project.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                  title="Delete project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-syne font-700 text-oxford text-lg">Create Project</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted hover:text-oxford">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="form-label">Client *</label>
                <select className="form-select" value={form.client_id}
                  onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} required>
                  <option value="">Select client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Project Title *</label>
                <input className="form-input" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. E-commerce Website for Sharma Traders" required />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={2} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Total Price (₹) *</label>
                  <input type="number" className="form-input" value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="50000" min="1" required />
                  {form.price && (
                    <div className="mt-1 text-xs text-muted space-y-0.5">
                      <p>Advance (35%): ₹{Math.round(form.price * 0.35).toLocaleString('en-IN')}</p>
                      <p>Midpoint (35%): ₹{Math.round(form.price * 0.35).toLocaleString('en-IN')}</p>
                      <p>Final (30%): ₹{Math.round(form.price * 0.30).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">Mode</label>
                  <select className="form-select" value={form.project_mode}
                    onChange={e => setForm(p => ({ ...p, project_mode: e.target.value }))}>
                    <option value="milestones">Milestones</option>
                    <option value="phases">Phases</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Deadline</label>
                <input type="date" className="form-input" value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={creating}
                  className="btn-primary flex-1 justify-center">
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
