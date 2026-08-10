// client/src/pages/client/Agreement.jsx
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  FileText, CheckCircle, AlertCircle, Shield, Clock
} from 'lucide-react'
import clsx from 'clsx'

export default function ClientAgreement() {
  const { user }    = useAuth()
  const [agreement, setAgreement] = useState(null)
  const [projectId, setProjectId] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('brd')
  const [sigName,   setSigName]   = useState('')
  const [accepted,  setAccepted]  = useState(false)
  const [signing,   setSigning]   = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showReject,setShowReject]= useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [done, setDone] = useState(null)

  useEffect(() => {
    api.get('/client/my-project')
      .then(r => {
        if (!r.data.data) return
        setProjectId(r.data.data.id)
        return api.get(`/projects/${r.data.data.id}/agreement`)
      })
      .then(r => r && setAgreement(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSign = async () => {
    if (!sigName.trim()) return toast.error('Please type your full name to sign.')
    if (!accepted) return toast.error('Please confirm you have read and agree to the terms.')
    setSigning(true)
    try {
      await api.post(`/projects/${projectId}/agreement/sign`, { signature_name: sigName })
      setDone('signed')
      toast.success('Agreement signed successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signing failed.')
    } finally {
      setSigning(false)
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      await api.post(`/projects/${projectId}/agreement/reject`, { rejection_reason: rejectReason })
      setDone('rejected')
    } catch {
      toast.error('Failed to submit.')
    } finally {
      setRejecting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!agreement) return (
    <div className="card text-center py-16 max-w-lg">
      <Clock size={36} className="text-muted/30 mx-auto mb-3" />
      <h3 className="font-syne font-700 text-oxford">Agreement not ready yet</h3>
      <p className="text-muted text-sm mt-1">
        Your BRD and service agreement will appear here once TechEthix prepares and sends them.
      </p>
    </div>
  )

  if (done === 'signed' || agreement.status === 'signed') return (
    <div className="card text-center py-16 max-w-lg">
      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={36} className="text-green-500" />
      </div>
      <h3 className="font-syne font-800 text-oxford text-xl mb-2">Agreement Signed</h3>
      <p className="text-muted text-sm mb-2">
        Signed by <strong>{agreement.signature_name || sigName}</strong>
      </p>
      {agreement.signed_at && (
        <p className="text-xs text-muted">
          {new Date(agreement.signed_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      )}
      <p className="text-xs text-muted mt-4">
        TechEthix has been notified. Work will begin once the advance payment is received.
      </p>
    </div>
  )

  if (done === 'rejected') return (
    <div className="card text-center py-16 max-w-lg">
      <h3 className="font-syne font-700 text-oxford mb-2">Feedback submitted</h3>
      <p className="text-muted text-sm">TechEthix will review your concerns and get back to you shortly.</p>
      <a href="https://wa.me/916262326939" target="_blank" rel="noreferrer"
        className="btn-primary mt-4 mx-auto w-fit">
        Discuss on WhatsApp
      </a>
    </div>
  )

  const canSign = agreement.status === 'sent'

  return (
    <div className="space-y-6 max-w-3xl">

      <div>
        <h1 className="page-title">BRD & Agreement</h1>
        <p className="page-sub">Review and sign your project documents</p>
      </div>

      {/* Status */}
      {agreement.status === 'draft' && (
        <div className="callout amber flex gap-3 items-start bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            TechEthix is preparing your agreement. You will be notified when it is ready to sign.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-cream rounded-xl p-1 w-fit">
        {[
          { key: 'brd',       label: 'Business Requirements' },
          { key: 'agreement', label: 'Service Agreement' },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key ? 'bg-white text-oxford shadow-card' : 'text-muted hover:text-oxford'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Document */}
      <div className="card">
        <pre className="text-sm text-oxford whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
          {activeTab === 'brd' ? agreement.brd_content : agreement.agreement_content}
        </pre>
      </div>

      {/* Sign section */}
      {canSign && !showReject && (
        <div className="card border-2 border-oxford/20">
          <div className="flex items-start gap-3 mb-5">
            <Shield size={20} className="text-oxford flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-syne font-700 text-oxford">Digital Signature</h3>
              <p className="text-muted text-sm mt-0.5">
                By signing, you confirm you have read and agree to both the BRD and Service Agreement above.
                Your signature is legally binding.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">Type your full legal name *</label>
              <input
                className="form-input font-medium text-oxford"
                value={sigName}
                onChange={e => setSigName(e.target.value)}
                placeholder={user?.name}
              />
              <p className="text-xs text-muted mt-1">This acts as your digital signature</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="mt-1 accent-oxford"
              />
              <span className="text-sm text-oxford">
                I have read and understood the BRD and Service Agreement. I agree to the scope,
                payment terms, and all conditions stated above.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={handleSign}
                disabled={signing || !sigName.trim() || !accepted}
                className="btn-primary flex-1 justify-center py-3"
              >
                {signing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing...
                  </span>
                ) : '✓ Sign Agreement'}
              </button>
              <button
                onClick={() => setShowReject(true)}
                className="btn-secondary text-rose border-rose/30 py-3 px-5"
              >
                Request Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject form */}
      {showReject && (
        <div className="card space-y-3">
          <h3 className="font-syne font-700 text-oxford">Request Changes</h3>
          <textarea
            className="form-textarea" rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Describe what you'd like changed in the BRD or agreement..."
          />
          <div className="flex gap-3">
            <button onClick={() => setShowReject(false)} className="btn-secondary flex-1 justify-center">
              Back
            </button>
            <button onClick={handleReject} disabled={rejecting} className="btn-danger flex-1 justify-center">
              {rejecting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
