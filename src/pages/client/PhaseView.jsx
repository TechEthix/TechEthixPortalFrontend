// client/src/pages/client/PhaseView.jsx
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import {
  CheckCircle, Clock, Circle, Play,
  ChevronDown, ChevronUp, ThumbsUp
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_LABEL = {
  pending:   'Not started',
  active:    'In Progress',
  completed: 'Ready for Review',
  approved:  'Approved',
}

const STATUS_ICON = {
  approved:  <CheckCircle size={20} className="text-green-500 flex-shrink-0" />,
  completed: <Clock       size={20} className="text-amber-500 flex-shrink-0" />,
  active:    <Play        size={20} className="text-blue-500  flex-shrink-0" />,
  pending:   <Circle      size={20} className="text-border     flex-shrink-0" />,
}

export default function ClientPhaseView({ projectId }) {
  const [phases,    setPhases]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [approving, setApproving] = useState(null)
  const [expandedId,setExpandedId]= useState(null)

  const fetchPhases = () => {
    api.get(`/projects/${projectId}/phases`)
      .then(r => setPhases(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPhases() }, [projectId])

  const handleApprove = async (phaseId) => {
    if (!confirm('Approve this phase? This confirms the work is complete.')) return
    setApproving(phaseId)
    try {
      await api.post(`/projects/${projectId}/phases/${phaseId}/approve`)
      toast.success('Phase approved!')
      fetchPhases()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.')
    } finally {
      setApproving(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-24">
      <div className="w-5 h-5 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (phases.length === 0) return (
    <div className="text-center py-8 text-muted text-sm">
      No phases set up yet. Check back soon.
    </div>
  )

  const approvedCount = phases.filter(p => p.status === 'approved').length
  const progress      = Math.round((approvedCount / phases.length) * 100)

  return (
    <div className="space-y-4">

      {/* Overall progress */}
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted">Overall Progress</span>
        <span className="font-medium text-oxford">{progress}%</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden mb-4">
        <div className="h-full bg-oxford rounded-full transition-all"
          style={{ width: `${progress}%` }} />
      </div>

      {/* Phase list */}
      <div className="space-y-2">
        {phases.map((phase, i) => (
          <div key={phase.id} className={clsx(
            'border rounded-xl overflow-hidden transition-all',
            phase.status === 'completed' ? 'border-amber-300 bg-amber-50/20' :
            phase.status === 'active'    ? 'border-blue-200' :
            phase.status === 'approved'  ? 'border-green-200' : 'border-border'
          )}>
            <button
              className="w-full flex items-center gap-3 p-4 text-left"
              onClick={() => setExpandedId(expandedId === phase.id ? null : phase.id)}
            >
              {STATUS_ICON[phase.status]}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{i + 1}.</span>
                  <p className="font-medium text-oxford">{phase.name}</p>
                </div>
                <p className="text-xs text-muted mt-0.5 ml-5">
                  {STATUS_LABEL[phase.status]}
                  {phase.payment_amount > 0 && (
                    <> · ₹{Number(phase.payment_amount).toLocaleString('en-IN')} ({phase.payment_percent}%)</>
                  )}
                </p>
              </div>

              {phase.status === 'completed' && (
                <button
                  onClick={e => { e.stopPropagation(); handleApprove(phase.id) }}
                  disabled={approving === phase.id}
                  className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
                >
                  <ThumbsUp size={13} />
                  {approving === phase.id ? '...' : 'Approve'}
                </button>
              )}

              {expandedId === phase.id
                ? <ChevronUp   size={15} className="text-muted flex-shrink-0" />
                : <ChevronDown size={15} className="text-muted flex-shrink-0" />
              }
            </button>

            {expandedId === phase.id && (
              <div className="border-t border-border p-4 bg-cream/30 space-y-2">
                {phase.description && (
                  <p className="text-sm text-oxford">{phase.description}</p>
                )}
                {phase.admin_note && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs font-medium text-oxford mb-1">Update from TechEthix</p>
                    <p className="text-sm text-oxford">{phase.admin_note}</p>
                  </div>
                )}
                {phase.status === 'approved' && phase.approved_at && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ Approved on {new Date(phase.approved_at).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
