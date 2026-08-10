// client/src/pages/admin/projects/ProjectDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import PhaseManager from './PhaseManager'
import AgreementEditor from './AgreementEditor'
import {
  ArrowLeft, Plus, CheckCircle, Clock, Circle,
  Truck, Edit2, Trash2, ChevronDown, ChevronUp,
  AlertCircle, CreditCard
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_STYLE = {
  pending_payment: 'badge-amber',
  active: 'badge-blue', on_hold: 'badge-gray',
  delivered: 'badge-green', in_maintenance: 'badge-rose',
  completed: 'badge-green',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [project,   setProject]   = useState(null)
  const [revisions, setRevisions] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('milestones')

  // Milestone form state
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [milestoneForm,     setMilestoneForm]     = useState({ title: '', description: '', due_date: '' })
  const [savingMilestone,   setSavingMilestone]   = useState(false)

  // Complete milestone state
  const [completingId,  setCompletingId]  = useState(null)
  const [completeNote,  setCompleteNote]  = useState('')

  // Project status update
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchProject = () => {
    api.get(`/projects/${id}`)
      .then(r => setProject(r.data.data))
      .catch(() => toast.error('Failed to load project.'))
      .finally(() => setLoading(false))
  }

  const fetchRevisions = () => {
    api.get(`/projects/${id}/revisions`)
      .then(r => setRevisions(r.data.data || []))
      .catch(() => {})
  }

  useEffect(() => { fetchProject(); fetchRevisions() }, [id])

  // ── Add milestone ──────────────────────────
  const handleAddMilestone = async e => {
    e.preventDefault()
    if (!milestoneForm.title) return toast.error('Title required.')
    setSavingMilestone(true)
    try {
      await api.post(`/projects/${id}/milestones`, milestoneForm)
      toast.success('Milestone added.')
      setShowMilestoneForm(false)
      setMilestoneForm({ title: '', description: '', due_date: '' })
      fetchProject()
    } catch {
      toast.error('Failed to add milestone.')
    } finally {
      setSavingMilestone(false)
    }
  }

  // ── Complete milestone ─────────────────────
  const handleComplete = async (milestoneId) => {
    try {
      await api.post(`/projects/${id}/milestones/${milestoneId}/complete`, {
        admin_note: completeNote
      })
      toast.success('Milestone marked complete. Client notified.')
      setCompletingId(null)
      setCompleteNote('')
      fetchProject()
    } catch {
      toast.error('Failed to complete milestone.')
    }
  }

  // ── Delete milestone ───────────────────────
  const handleDeleteMilestone = async (milestoneId) => {
    if (!confirm('Delete this milestone?')) return
    try {
      await api.delete(`/projects/${id}/milestones/${milestoneId}`)
      toast.success('Milestone deleted.')
      fetchProject()
    } catch {
      toast.error('Delete failed.')
    }
  }

  // ── Update project status ──────────────────
  const handleStatusUpdate = async (status) => {
    setUpdatingStatus(true)
    try {
      await api.put(`/projects/${id}`, { status })
      setProject(p => ({ ...p, status }))
      toast.success('Status updated.')
    } catch {
      toast.error('Update failed.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // ── Deliver project ────────────────────────
  const handleDeliver = async () => {
    if (!confirm('Mark project as delivered? This will notify the client and create the final payment request.')) return
    try {
      await api.post(`/projects/${id}/deliver`)
      toast.success('Project delivered! Client notified.')
      fetchProject()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    }
  }

  // ── Respond to revision ────────────────────
  const handleRevisionResponse = async (revisionId, type, status, admin_response) => {
    try {
      await api.put(`/projects/revisions/${revisionId}`, { type, status, admin_response })
      toast.success('Response sent to client.')
      fetchRevisions()
    } catch {
      toast.error('Failed to respond.')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!project) return <div className="text-center py-16"><p className="text-oxford font-syne font-700">Project not found.</p></div>

  const milestones = project.milestones || []
  const payments   = project.payments   || []

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/projects" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="page-title">{project.title}</h1>
            <p className="page-sub">{project.client_name} · Started {project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN') : 'TBD'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {project.status === 'active' && (
            <button onClick={handleDeliver} className="btn-primary">
              <Truck size={15} /> Mark Delivered
            </button>
          )}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">Progress</p>
          <p className="stat-value">{project.progress_percent || 0}%</p>
          <div className="mt-2 h-1.5 bg-cream rounded-full overflow-hidden">
            <div className="h-full bg-oxford rounded-full" style={{ width: `${project.progress_percent || 0}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <p className="stat-label">Milestones</p>
          <p className="stat-value">
            {milestones.filter(m => m.status === 'approved').length}
            <span className="text-lg text-muted font-400"> / {milestones.length}</span>
          </p>
          <p className="text-xs text-muted mt-1">Approved</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Revisions Left</p>
          <p className="stat-value">
            {project.revision_total - project.revision_used}
            <span className="text-lg text-muted font-400"> / {project.revision_total}</span>
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Status</p>
          <div className="mt-2">
            <select
              value={project.status}
              onChange={e => handleStatusUpdate(e.target.value)}
              disabled={updatingStatus}
              className="form-select text-xs py-1.5"
            >
              {['pending_payment','active','on_hold','in_review','delivered','in_maintenance','techcare','completed'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream rounded-xl p-1 w-fit">
        {['milestones', 'phases', 'revisions', 'payments', 'agreement', 'details'].map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === tab ? 'bg-white text-oxford shadow-card' : 'text-muted hover:text-oxford'
            )}
          >
            {tab}
            {tab === 'revisions' && revisions.length > 0 && (
              <span className="ml-1.5 bg-rose text-white text-xs px-1.5 py-0.5 rounded-full">
                {revisions.filter(r => r.status === 'submitted').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── MILESTONES TAB ── */}
      {activeTab === 'milestones' && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-syne font-700 text-oxford">Milestones</h3>
            <button onClick={() => setShowMilestoneForm(p => !p)} className="btn-primary text-xs py-1.5">
              <Plus size={14} /> Add Milestone
            </button>
          </div>

          {/* Add form */}
          {showMilestoneForm && (
            <form onSubmit={handleAddMilestone} className="bg-cream rounded-xl p-4 space-y-3">
              <div>
                <label className="form-label">Milestone Title *</label>
                <input className="form-input" value={milestoneForm.title}
                  onChange={e => setMilestoneForm(p => ({...p, title: e.target.value}))}
                  placeholder="e.g. Design Approval" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={2} value={milestoneForm.description}
                  onChange={e => setMilestoneForm(p => ({...p, description: e.target.value}))}
                  placeholder="What will be delivered in this milestone?" />
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={milestoneForm.due_date}
                  onChange={e => setMilestoneForm(p => ({...p, due_date: e.target.value}))} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowMilestoneForm(false)} className="btn-secondary flex-1 justify-center text-xs py-2">Cancel</button>
                <button type="submit" disabled={savingMilestone} className="btn-primary flex-1 justify-center text-xs py-2">
                  {savingMilestone ? 'Adding...' : 'Add Milestone'}
                </button>
              </div>
            </form>
          )}

          {/* Milestone list */}
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">No milestones yet. Add your first one.</div>
          ) : (
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={m.id} className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    {/* Status icon */}
                    {m.status === 'approved'   && <CheckCircle size={20} className="text-green-500 flex-shrink-0" />}
                    {m.status === 'completed'  && <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />}
                    {m.status === 'in_progress'&& <Clock       size={20} className="text-blue-500  flex-shrink-0" />}
                    {m.status === 'pending'    && <Circle      size={20} className="text-border     flex-shrink-0" />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">{i + 1}.</span>
                        <p className="font-medium text-oxford">{m.title}</p>
                        <span className={clsx('badge text-xs', {
                          'badge-green': m.status === 'approved',
                          'badge-amber': m.status === 'completed',
                          'badge-blue':  m.status === 'in_progress',
                          'badge-gray':  m.status === 'pending',
                        })}>
                          {m.status === 'completed' ? 'Awaiting Approval' :
                           m.status === 'in_progress' ? 'In Progress' :
                           m.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      {m.description && <p className="text-xs text-muted mt-0.5 truncate">{m.description}</p>}
                      {m.due_date && (
                        <p className={clsx('text-xs mt-0.5', new Date(m.due_date) < new Date() && m.status !== 'approved' ? 'text-red-500' : 'text-muted')}>
                          Due: {new Date(m.due_date).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {m.status === 'pending' && (
                        <button
                          onClick={() => setCompletingId(completingId === m.id ? null : m.id)}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Complete form */}
                  {completingId === m.id && (
                    <div className="border-t border-border p-4 bg-cream space-y-3">
                      <label className="form-label">Update note for client (optional)</label>
                      <textarea className="form-textarea" rows={2}
                        value={completeNote}
                        onChange={e => setCompleteNote(e.target.value)}
                        placeholder="e.g. Homepage design is complete and ready for your review..." />
                      <div className="flex gap-2">
                        <button onClick={() => setCompletingId(null)} className="btn-secondary flex-1 justify-center text-xs py-2">Cancel</button>
                        <button onClick={() => handleComplete(m.id)} className="btn-primary flex-1 justify-center text-xs py-2">
                          Complete & Notify Client
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Admin note shown */}
                  {m.admin_note && m.status !== 'pending' && (
                    <div className="border-t border-border px-4 py-2 bg-cream">
                      <p className="text-xs text-muted">Note: {m.admin_note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ── PHASES TAB ── */}
      {activeTab === 'phases' && (
        <div className="card">
          <PhaseManager
            projectId={parseInt(id)}
            proposalPrice={parseFloat(project.price || 0)}
            onUpdate={fetchProject}
          />
        </div>
      )}

      {/* ── REVISIONS TAB ── */}
      {activeTab === 'revisions' && (
        <div className="card space-y-4">
          <h3 className="font-syne font-700 text-oxford">Revision Requests</h3>
          {revisions.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">No revision requests yet.</p>
          ) : revisions.map(r => (
            <RevisionCard key={r.id} revision={r} onRespond={handleRevisionResponse} />
          ))}
        </div>
      )}

      {/* ── PAYMENTS TAB ── */}
      {activeTab === 'payments' && (
        <div className="card space-y-4">
          <h3 className="font-syne font-700 text-oxford">Payments</h3>
          {payments.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div>
                    <p className="font-medium text-oxford capitalize">{p.type.replace(/_/g,' ')} Payment</p>
                    <p className="text-xs text-muted mt-0.5">
                      {p.paid_at ? `Paid on ${new Date(p.paid_at).toLocaleDateString('en-IN')}` : 'Pending'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-syne font-800 text-oxford">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                    <span className={clsx('badge text-xs', p.status === 'paid' ? 'badge-green' : 'badge-amber')}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ── AGREEMENT TAB ── */}
      {activeTab === 'agreement' && (
        <div className="card">
          <AgreementEditor projectId={parseInt(id)} />
        </div>
      )}

      {/* ── DETAILS TAB ── */}
      {activeTab === 'details' && (
        <div className="card">
          <h3 className="font-syne font-700 text-oxford mb-4">Project Details</h3>
          <div className="space-y-3 text-sm">
            {[
              ['Client',           project.client_name],
              ['Email',            project.client_email],
              ['Phone',            project.client_phone],
              ['Start Date',       project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN') : '—'],
              ['Expected Delivery',project.expected_delivery ? new Date(project.expected_delivery).toLocaleDateString('en-IN') : '—'],
              ['Actual Delivery',  project.actual_delivery ? new Date(project.actual_delivery).toLocaleDateString('en-IN') : '—'],
              ['Revisions Used',   `${project.revision_used} / ${project.revision_total}`],
              ['Maintenance Used', `${project.maintenance_used} / ${project.maintenance_total}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-muted">{label}</span>
                <span className="font-medium text-oxford">{value || '—'}</span>
              </div>
            ))}
          </div>
          {project.scope_of_work && (
            <div className="mt-4">
              <p className="form-label mb-2">Scope of Work</p>
              <pre className="text-xs text-oxford whitespace-pre-wrap font-sans leading-relaxed bg-cream rounded-xl p-4">
                {project.scope_of_work}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Revision Card ────────────────────────────
function RevisionCard({ revision, onRespond }) {
  const [open,     setOpen]     = useState(revision.status === 'submitted')
  const [response, setResponse] = useState(revision.admin_response || '')

  const SCOPE_OPTIONS = [
    { value: 'within_scope',   label: 'Within Scope — Fix it (free)' },
    { value: 'out_of_scope',   label: 'Out of Scope — Requires extra charge' },
  ]

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button className="w-full flex items-center justify-between p-4 hover:bg-cream transition-colors"
        onClick={() => setOpen(p => !p)}>
        <div className="flex items-center gap-3">
          <AlertCircle size={16} className={revision.status === 'submitted' ? 'text-amber-500' : 'text-muted'} />
          <div className="text-left">
            <p className="text-sm font-medium text-oxford">{revision.milestone_title || 'General revision'}</p>
            <p className="text-xs text-muted">{revision.client_name} · {new Date(revision.created_at).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx('badge text-xs', {
            'badge-amber': revision.status === 'submitted',
            'badge-blue':  revision.status === 'reviewing',
            'badge-green': revision.status === 'done',
            'badge-red':   revision.status === 'rejected',
            'badge-gray':  !['submitted','reviewing','done','rejected'].includes(revision.status),
          })}>
            {revision.status}
          </span>
          {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-3 bg-cream">
          <div>
            <p className="form-label">Client's request</p>
            <p className="text-sm text-oxford bg-white rounded-xl p-3">{revision.description}</p>
          </div>

          {revision.status === 'submitted' && (
            <>
              <div>
                <label className="form-label">Your response</label>
                <textarea className="form-textarea bg-white" rows={2}
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  placeholder="Explain your decision to the client..." />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onRespond(revision.id, 'within_scope', 'in_progress', response)}
                  className="btn-primary flex-1 justify-center text-xs py-2"
                >
                  Within Scope — Accept & Fix
                </button>
                <button
                  onClick={() => onRespond(revision.id, 'out_of_scope', 'rejected', response)}
                  className="btn-secondary text-rose flex-1 justify-center text-xs py-2"
                >
                  Out of Scope — Flag Cost
                </button>
              </div>
            </>
          )}

          {revision.admin_response && revision.status !== 'submitted' && (
            <div>
              <p className="form-label">Your response</p>
              <p className="text-sm text-oxford">{revision.admin_response}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
