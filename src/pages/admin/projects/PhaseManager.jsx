// client/src/pages/admin/projects/PhaseManager.jsx
import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import {
  Plus, Play, CheckCircle, Circle, Clock,
  Trash2, Edit2, ChevronDown, ChevronUp, Save, X
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLOR = {
  pending:   'badge-gray',
  active:    'badge-blue',
  completed: 'badge-amber',
  approved:  'badge-green',
}

export default function PhaseManager({ projectId, proposalPrice = 0, onUpdate }) {
  const [phases,      setPhases]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editingId,   setEditingId]   = useState(null)
  const [expandedId,  setExpandedId]  = useState(null)
  const [completingId,setCompletingId]= useState(null)
  const [completeNote,setCompleteNote]= useState('')
  const [form, setForm] = useState({ name: '', description: '', payment_percent: '' })

  const fetchPhases = () => {
    api.get(`/projects/${projectId}/phases`)
      .then(r => setPhases(r.data.data || []))
      .catch(() => toast.error('Failed to load phases.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPhases() }, [projectId])

  const totalPercent = phases.reduce((a, p) => a + parseFloat(p.payment_percent || 0), 0)
  const remaining    = 100 - totalPercent

  const handleAdd = async e => {
    e.preventDefault()
    if (!form.name || !form.payment_percent) return toast.error('Name and payment % required.')
    if (parseFloat(form.payment_percent) > remaining) {
      return toast.error(`Only ${remaining}% remaining to allocate.`)
    }
    try {
      await api.post(`/projects/${projectId}/phases`, form)
      toast.success('Phase added.')
      setForm({ name: '', description: '', payment_percent: '' })
      setShowForm(false)
      fetchPhases()
      onUpdate?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    }
  }

  const handleEdit = async (phaseId) => {
    const phase = phases.find(p => p.id === phaseId)
    try {
      await api.put(`/projects/${projectId}/phases/${phaseId}`, {
        name:            phase.name,
        description:     phase.description,
        payment_percent: phase.payment_percent
      })
      toast.success('Phase updated.')
      setEditingId(null)
      fetchPhases()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    }
  }

  const handleDelete = async (phaseId) => {
    if (!confirm('Delete this phase?')) return
    try {
      await api.delete(`/projects/${projectId}/phases/${phaseId}`)
      toast.success('Phase deleted.')
      fetchPhases()
      onUpdate?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    }
  }

  const handleActivate = async (phaseId) => {
    if (!confirm('Activate this phase? A payment request will be created for the client.')) return
    try {
      await api.post(`/projects/${projectId}/phases/${phaseId}/activate`)
      toast.success('Phase activated. Payment request created.')
      fetchPhases()
      onUpdate?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    }
  }

  const handleComplete = async (phaseId) => {
    try {
      await api.post(`/projects/${projectId}/phases/${phaseId}/complete`, {
        admin_note: completeNote
      })
      toast.success('Phase marked complete. Client notified.')
      setCompletingId(null)
      setCompleteNote('')
      fetchPhases()
      onUpdate?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="w-6 h-6 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Header + percent tracker */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-syne font-700 text-oxford">Phases</h3>
          <p className="text-xs text-muted mt-0.5">
            {totalPercent}% allocated · {remaining}% remaining
          </p>
        </div>
        <button onClick={() => setShowForm(p => !p)} className="btn-primary text-sm py-2">
          <Plus size={14} /> Add Phase
        </button>
      </div>

      {/* Percent bar */}
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all',
            totalPercent === 100 ? 'bg-green-500' :
            totalPercent > 100   ? 'bg-red-500'   : 'bg-oxford'
          )}
          style={{ width: `${Math.min(totalPercent, 100)}%` }}
        />
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="card bg-cream space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Phase Name *</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Design & Discovery" />
            </div>
            <div>
              <label className="form-label">Payment % *</label>
              <div className="relative">
                <input className="form-input pr-8" type="number" min="1" max={remaining}
                  value={form.payment_percent}
                  onChange={e => setForm(p => ({ ...p, payment_percent: e.target.value }))}
                  placeholder={`Max ${remaining}%`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
              </div>
              {form.payment_percent && (
                <p className="text-xs text-muted mt-1">
                  = ₹{Number((parseFloat(form.payment_percent || 0) / 100) * proposalPrice).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={2} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What will be delivered in this phase?" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center text-sm py-2">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center text-sm py-2">
              Add Phase
            </button>
          </div>
        </form>
      )}

      {/* Phase list */}
      {phases.length === 0 ? (
        <div className="text-center py-10 text-muted text-sm border-2 border-dashed border-border rounded-xl">
          No phases yet. Add your first phase above.
        </div>
      ) : (
        <div className="space-y-2">
          {phases.map((phase, i) => (
            <div key={phase.id} className="border border-border rounded-xl overflow-hidden">

              {/* Phase row */}
              <button
                className="w-full flex items-center gap-3 p-4 hover:bg-cream/50 transition-colors text-left"
                onClick={() => setExpandedId(expandedId === phase.id ? null : phase.id)}
              >
                {phase.status === 'approved'  && <CheckCircle size={18} className="text-green-500 flex-shrink-0" />}
                {phase.status === 'completed' && <Clock       size={18} className="text-amber-500 flex-shrink-0" />}
                {phase.status === 'active'    && <Play        size={18} className="text-blue-500  flex-shrink-0" />}
                {phase.status === 'pending'   && <Circle      size={18} className="text-border     flex-shrink-0" />}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{i + 1}.</span>
                    {editingId === phase.id ? (
                      <input
                        className="form-input py-1 text-sm flex-1"
                        value={phase.name}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setPhases(prev =>
                          prev.map(p => p.id === phase.id ? { ...p, name: e.target.value } : p)
                        )}
                      />
                    ) : (
                      <p className="font-medium text-oxford">{phase.name}</p>
                    )}
                    <span className={`badge text-xs ${STATUS_COLOR[phase.status] || 'badge-gray'}`}>
                      {phase.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 ml-5">
                    {phase.payment_percent}% · ₹{Number(phase.payment_amount).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {phase.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleActivate(phase.id)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium px-2"
                      >
                        Activate
                      </button>
                      {editingId === phase.id ? (
                        <>
                          <button onClick={() => handleEdit(phase.id)}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                            <Save size={14} />
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setEditingId(phase.id)}
                          className="p-1.5 rounded-lg hover:bg-cream text-muted transition-colors">
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(phase.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  {phase.status === 'active' && (
                    <button
                      onClick={() => setCompletingId(completingId === phase.id ? null : phase.id)}
                      className="p-1.5 rounded-lg bg-oxford text-white text-xs font-medium px-3 hover:bg-rose transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>

                {expandedId === phase.id
                  ? <ChevronUp   size={15} className="text-muted flex-shrink-0" />
                  : <ChevronDown size={15} className="text-muted flex-shrink-0" />
                }
              </button>

              {/* Complete form */}
              {completingId === phase.id && (
                <div className="border-t border-border p-4 bg-cream space-y-3">
                  <label className="form-label">Update note for client (optional)</label>
                  <textarea className="form-textarea bg-white" rows={2}
                    value={completeNote}
                    onChange={e => setCompleteNote(e.target.value)}
                    placeholder="Describe what was delivered in this phase..." />
                  <div className="flex gap-2">
                    <button onClick={() => setCompletingId(null)} className="btn-secondary flex-1 justify-center text-sm py-2">Cancel</button>
                    <button onClick={() => handleComplete(phase.id)} className="btn-primary flex-1 justify-center text-sm py-2">
                      Complete & Notify Client
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded details */}
              {expandedId === phase.id && completingId !== phase.id && (
                <div className="border-t border-border p-4 bg-cream/30 space-y-2">
                  {phase.description && (
                    <p className="text-sm text-oxford">{phase.description}</p>
                  )}
                  {phase.admin_note && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs font-medium text-oxford mb-1">Completion note</p>
                      <p className="text-xs text-muted">{phase.admin_note}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted">
                    {phase.started_at && <span>Started: {new Date(phase.started_at).toLocaleDateString('en-IN')}</span>}
                    {phase.completed_at && <span>Completed: {new Date(phase.completed_at).toLocaleDateString('en-IN')}</span>}
                    {phase.approved_at && <span>Approved: {new Date(phase.approved_at).toLocaleDateString('en-IN')}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
