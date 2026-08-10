// client/src/pages/admin/projects/AgreementEditor.jsx
import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import {
  FileText, Send, RefreshCw, CheckCircle,
  Edit2, Save, X, AlertCircle
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_STYLE = {
  draft:    'badge-gray',
  sent:     'badge-blue',
  signed:   'badge-green',
  rejected: 'badge-red',
}

export default function AgreementEditor({ projectId }) {
  const [agreement, setAgreement] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [creating,  setCreating]  = useState(false)
  const [sending,   setSending]   = useState(false)
  const [editMode,  setEditMode]  = useState('none') // 'none' | 'brd' | 'agreement'
  const [draft,     setDraft]     = useState({ brd_content: '', agreement_content: '' })
  const [saving,    setSaving]    = useState(false)
  const [activeTab, setActiveTab] = useState('brd')

  const fetch = () => {
    api.get(`/projects/${projectId}/agreement`)
      .then(r => {
        setAgreement(r.data.data)
        if (r.data.data) {
          setDraft({
            brd_content:       r.data.data.brd_content,
            agreement_content: r.data.data.agreement_content
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [projectId])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await api.post(`/projects/${projectId}/agreement`)
      toast.success('Agreement generated from project data.')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate.')
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/projects/${projectId}/agreement`, draft)
      toast.success('Changes saved.')
      setEditMode('none')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async () => {
    if (!confirm('Send this agreement to the client for signing?')) return
    setSending(true)
    try {
      await api.post(`/projects/${projectId}/agreement/send`)
      toast.success('Agreement sent to client.')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="w-6 h-6 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // No agreement yet
  if (!agreement) return (
    <div className="card text-center py-12">
      <FileText size={36} className="text-muted/30 mx-auto mb-3" />
      <h3 className="font-syne font-700 text-oxford mb-2">No agreement yet</h3>
      <p className="text-muted text-sm mb-6 max-w-xs mx-auto">
        Generate a BRD and service agreement pre-filled from this project's proposal data.
        You can edit it before sending to the client.
      </p>
      <button onClick={handleCreate} disabled={creating} className="btn-primary mx-auto">
        {creating ? (
          <span className="flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin" /> Generating...
          </span>
        ) : (
          <><FileText size={15} /> Generate BRD & Agreement</>
        )}
      </button>
    </div>
  )

  const isLocked = agreement.status === 'signed'

  return (
    <div className="space-y-4">

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-syne font-700 text-oxford">BRD & Agreement</h3>
          <span className={`badge ${STATUS_STYLE[agreement.status] || 'badge-gray'}`}>
            {agreement.status}
          </span>
        </div>
        <div className="flex gap-2">
          {!isLocked && editMode === 'none' && (
            <button onClick={() => setEditMode('brd')} className="btn-secondary text-sm py-2">
              <Edit2 size={14} /> Edit
            </button>
          )}
          {editMode !== 'none' && (
            <>
              <button onClick={() => { setEditMode('none'); setDraft({ brd_content: agreement.brd_content, agreement_content: agreement.agreement_content }) }}
                className="btn-secondary text-sm py-2">
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2">
                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
          {agreement.status === 'draft' && editMode === 'none' && (
            <button onClick={handleSend} disabled={sending} className="btn-primary text-sm py-2">
              <Send size={14} /> {sending ? 'Sending...' : 'Send to Client'}
            </button>
          )}
        </div>
      </div>

      {/* Signed confirmation */}
      {agreement.status === 'signed' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Agreement signed</p>
            <p className="text-xs text-green-600 mt-0.5">
              Signed by <strong>{agreement.signature_name}</strong> on{' '}
              {new Date(agreement.signed_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              })} · IP: {agreement.signature_ip}
            </p>
          </div>
        </div>
      )}

      {/* Rejected notice */}
      {agreement.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Agreement rejected by client</p>
            {agreement.rejection_reason && (
              <p className="text-xs text-red-600 mt-0.5">Reason: {agreement.rejection_reason}</p>
            )}
            <button onClick={handleCreate} className="text-xs text-red-700 font-medium underline mt-1">
              Regenerate agreement
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-cream rounded-xl p-1 w-fit">
        {['brd', 'agreement'].map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              activeTab === tab ? 'bg-white text-oxford shadow-card' : 'text-muted hover:text-oxford'
            )}
          >
            {tab === 'brd' ? 'BRD' : 'Agreement'}
          </button>
        ))}
      </div>

      {/* Content editor */}
      <div className="card">
        {editMode !== 'none' ? (
          <textarea
            className="form-textarea font-mono text-xs w-full"
            rows={30}
            value={activeTab === 'brd' ? draft.brd_content : draft.agreement_content}
            onChange={e => setDraft(p => ({
              ...p,
              [activeTab === 'brd' ? 'brd_content' : 'agreement_content']: e.target.value
            }))}
          />
        ) : (
          <pre className="text-sm text-oxford whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
            {activeTab === 'brd' ? agreement.brd_content : agreement.agreement_content}
          </pre>
        )}
      </div>
    </div>
  )
}
