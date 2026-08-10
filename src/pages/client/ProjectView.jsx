// client/src/pages/client/ProjectView.jsx
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import ClientPhaseView from './PhaseView'
import {
  CheckCircle, Clock, Circle, AlertCircle,
  ThumbsUp, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react'
import clsx from 'clsx'

export default function ClientProjectView() {
  const [project,  setProject]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [revisionForm, setRevisionForm] = useState({ open: false, milestoneId: null, text: '' })
  const [submitting,   setSubmitting]   = useState(false)
  const [approving,    setApproving]    = useState(null)
  const [expandedId,   setExpandedId]   = useState(null)

  const fetchProject = () => {
    api.get('/client/my-project')
      .then(r => setProject(r.data.data))
      .catch(() => toast.error('Failed to load project.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProject() }, [])

  const handleApprove = async (milestoneId) => {
    if (!confirm('Approve this milestone? This confirms the work is complete and acceptable.')) return
    setApproving(milestoneId)
    try {
      await api.post(`/projects/${project.id}/milestones/${milestoneId}/approve`)
      toast.success('Milestone approved!')
      fetchProject()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.')
    } finally {
      setApproving(null)
    }
  }

  const handleRevisionSubmit = async e => {
    e.preventDefault()
    if (!revisionForm.text.trim()) return toast.error('Please describe the revision needed.')
    setSubmitting(true)
    try {
      await api.post('/projects/revisions', {
        project_id:   project.id,
        milestone_id: revisionForm.milestoneId,
        description:  revisionForm.text
      })
      toast.success('Revision request submitted. We\'ll review and respond shortly.')
      setRevisionForm({ open: false, milestoneId: null, text: '' })
      fetchProject()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!project) return (
    <div className="card text-center py-16">
      <Clock size={36} className="text-muted/30 mx-auto mb-4" />
      <p className="font-syne font-700 text-oxford">No active project</p>
      <p className="text-muted text-sm mt-1">Your project will appear here once the proposal is accepted and payment is made.</p>
    </div>
  )

  const milestones = project.milestones || []
  const approvedCount = milestones.filter(m => m.status === 'approved').length

  return (
    <div className="space-y-6 max-w-3xl">

      <div>
        <h1 className="page-title">{project.title}</h1>
        <p className="page-sub">{project.description}</p>
      </div>

      {/* Stats */}
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
            {approvedCount}
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
          <p className="stat-label">Deadline</p>
          <p className="font-syne font-700 text-oxford text-lg mt-1">
            {project.expected_delivery
              ? new Date(project.expected_delivery).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
              : 'TBD'}
          </p>
        </div>
      </div>


      {/* Phase or Milestone view based on project mode */}
      {project.project_mode === 'phases' ? (
        <div className="card">
          <h3 className="font-syne font-700 text-oxford mb-4">Project Phases</h3>
          <ClientPhaseView projectId={project.id} />
        </div>
      ) : (
      <div className="card">
        <h3 className="font-syne font-700 text-oxford mb-4">Project Milestones</h3>
        {milestones.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">No milestones set yet. We'll update this soon.</p>
        ) : (
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={m.id} className="border border-border rounded-xl overflow-hidden">

                {/* Milestone row */}
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-cream/50 transition-colors text-left"
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                >
                  {m.status === 'approved'   && <CheckCircle size={20} className="text-green-500 flex-shrink-0" />}
                  {m.status === 'completed'  && <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />}
                  {m.status === 'in_progress'&& <Clock       size={20} className="text-blue-500  flex-shrink-0" />}
                  {m.status === 'pending'    && <Circle      size={20} className="text-border     flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">{i + 1}.</span>
                      <p className="font-medium text-oxford">{m.title}</p>
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted mt-0.5 truncate">{m.description}</p>
                    )}
                  </div>

                  <span className={clsx('badge text-xs flex-shrink-0', {
                    'badge-green': m.status === 'approved',
                    'badge-amber': m.status === 'completed',
                    'badge-blue':  m.status === 'in_progress',
                    'badge-gray':  m.status === 'pending',
                  })}>
                    {m.status === 'completed'   ? 'Review Needed' :
                     m.status === 'in_progress' ? 'In Progress'   :
                     m.status === 'approved'    ? 'Approved'      : 'Pending'}
                  </span>

                  {expandedId === m.id
                    ? <ChevronUp size={16} className="text-muted flex-shrink-0" />
                    : <ChevronDown size={16} className="text-muted flex-shrink-0" />
                  }
                </button>

                {/* Expanded content */}
                {expandedId === m.id && (
                  <div className="border-t border-border p-4 bg-cream/50 space-y-3">

                    {/* Admin note */}
                    {m.admin_note && (
                      <div className="bg-white rounded-xl p-3">
                        <p className="text-xs font-medium text-oxford mb-1">Update from TechEthix</p>
                        <p className="text-sm text-oxford">{m.admin_note}</p>
                      </div>
                    )}

                    {/* Action buttons for completed milestones */}
                    {m.status === 'completed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(m.id)}
                          disabled={approving === m.id}
                          className="btn-primary flex-1 justify-center py-2.5"
                        >
                          <ThumbsUp size={15} />
                          {approving === m.id ? 'Approving...' : 'Approve Milestone'}
                        </button>
                        <button
                          onClick={() => setRevisionForm({ open: true, milestoneId: m.id, text: '' })}
                          className="btn-secondary flex-1 justify-center py-2.5"
                        >
                          <MessageSquare size={15} />
                          Request Changes
                        </button>
                      </div>
                    )}

                    {m.status === 'approved' && (
                      <p className="text-center text-xs text-green-600 font-medium py-1">
                        ✓ You approved this milestone on {m.approved_at ? new Date(m.approved_at).toLocaleDateString('en-IN') : '—'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}
      {/* Revision request form */}
      {revisionForm.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-syne font-700 text-oxford mb-1">Request a Change</h3>
            <p className="text-muted text-xs mb-4">
              You have {project.revision_total - project.revision_used} free revision(s) remaining.
              Describe what you'd like changed.
            </p>
            <form onSubmit={handleRevisionSubmit} className="space-y-3">
              <textarea
                className="form-textarea"
                rows={4}
                value={revisionForm.text}
                onChange={e => setRevisionForm(p => ({...p, text: e.target.value}))}
                placeholder="Describe exactly what needs to be changed and why..."
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button"
                  onClick={() => setRevisionForm({ open: false, milestoneId: null, text: '' })}
                  className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      

      {/* Delivery notice */}
      {project.status === 'delivered' && (
        <div className="card bg-oxford border-0">
          <h4 className="font-syne font-700 text-white mb-2">Your project is ready! 🎉</h4>
          <p className="text-white/60 text-sm mb-4">
            All milestones are complete. Please review and approve the final delivery.
            The final payment of ₹{Number(project.final_amount || 0).toLocaleString('en-IN')} will be due after approval.
          </p>
          <a href="https://wa.me/916262326939?text=I am ready to approve the final delivery"
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white text-oxford px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-cream transition-colors">
            Confirm Final Approval →
          </a>
        </div>
      )}
    </div>
  )
}
