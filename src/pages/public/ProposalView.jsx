// client/src/pages/public/ProposalView.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock, Shield, RefreshCw } from 'lucide-react'

export default function ProposalView() {
  const { token } = useParams()
  const [proposal,  setProposal]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [done,      setDone]      = useState(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason,   setRejectReason]   = useState('')

  useEffect(() => {
    api.get(`/proposals/view/${token}`)
      .then(r => setProposal(r.data.data))
      .catch(() => toast.error('Proposal not found or link expired.'))
      .finally(() => setLoading(false))
  }, [token])

  const handleAccept = async () => {
    if (!confirm('By accepting this proposal you agree to the scope and payment terms. Proceed?')) return
    setAccepting(true)
    try {
      await api.post(`/proposals/accept/${token}`)
      setDone('accepted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setAccepting(false)
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      await api.post(`/proposals/reject/${token}`, { reason: rejectReason })
      setDone('rejected')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setRejecting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!proposal) return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="card max-w-md text-center">
        <XCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h2 className="font-syne font-800 text-oxford text-xl mb-2">Proposal not found</h2>
        <p className="text-muted text-sm">This link may have expired or is invalid.</p>
        <a href="https://wa.me/916262326939" target="_blank" rel="noreferrer" className="btn-primary mt-4 mx-auto w-fit">Contact TechEthix</a>
      </div>
    </div>
  )

  if (done === 'accepted') return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="card max-w-md text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={36} className="text-green-500" />
        </div>
        <h2 className="font-syne font-800 text-oxford text-2xl mb-2">Proposal Accepted!</h2>
        <p className="text-muted text-sm mb-4">Check your email for portal login credentials. We will be in touch about the advance payment shortly.</p>
        <a href="/portal" className="btn-primary mx-auto w-fit">Open Client Portal</a>
      </div>
    </div>
  )

  if (done === 'rejected') return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="card max-w-md text-center">
        <h2 className="font-syne font-800 text-oxford text-xl mb-2">Noted, thank you.</h2>
        <p className="text-muted text-sm mb-4">We have recorded your response. Message us on WhatsApp to discuss further.</p>
        <a href="https://wa.me/916262326939" target="_blank" rel="noreferrer" className="btn-primary mx-auto w-fit">Discuss on WhatsApp</a>
      </div>
    </div>
  )

  const isExpired  = new Date(proposal.valid_until) < new Date()
  const isAccepted = proposal.status === 'accepted'
  const isRejected = proposal.status === 'rejected'
  const locked     = isExpired || isAccepted || isRejected

  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <span className="font-syne font-800 text-2xl text-oxford">Tech<span className="text-rose">Ethix</span></span>
          <h1 className="font-syne font-800 text-oxford text-3xl mt-4 mb-1">{proposal.title}</h1>
          <p className="text-muted text-sm">Prepared for {proposal.lead_name}{proposal.business_name && ` · ${proposal.business_name}`}</p>
        </div>

        {isExpired && !isAccepted && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600 text-sm font-medium">This proposal has expired. Contact us to get a new one.</p>
          </div>
        )}
        {isAccepted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-600 text-sm font-medium">This proposal has been accepted.</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Project Price', val: `Rs.${Number(proposal.price).toLocaleString('en-IN')}` },
            { label: 'Delivery Time', val: `${proposal.timeline_days} days` },
            { label: 'Valid Until',   val: new Date(proposal.valid_until).toLocaleDateString('en-IN') },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className="font-syne font-800 text-oxford text-xl">{s.val}</div>
              <div className="text-xs text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="font-syne font-700 text-oxford text-lg mb-4">Scope of Work</h2>
          <pre className="text-sm text-oxford whitespace-pre-wrap font-sans leading-relaxed">{proposal.scope_of_work}</pre>
        </div>

        <div className="card">
          <h2 className="font-syne font-700 text-oxford text-lg mb-4">What You Will Receive</h2>
          <pre className="text-sm text-oxford whitespace-pre-wrap font-sans leading-relaxed">{proposal.deliverables}</pre>
        </div>

        {proposal.exclusions && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <h2 className="font-syne font-700 text-amber-800 mb-2">Not Included</h2>
            <p className="text-sm text-amber-700">{proposal.exclusions}</p>
          </div>
        )}

        <div className="card">
          <h2 className="font-syne font-700 text-oxford text-lg mb-4">Payment Terms</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cream rounded-xl p-4">
              <p className="text-xs text-muted mb-1">Advance (50%) due now</p>
              <p className="font-syne font-800 text-oxford text-2xl">Rs.{Number(proposal.advance_amount).toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted mt-1">Required to start</p>
            </div>
            <div className="bg-cream rounded-xl p-4">
              <p className="text-xs text-muted mb-1">Final (50%) on delivery</p>
              <p className="font-syne font-800 text-oxford text-2xl">Rs.{Number(proposal.final_amount).toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted mt-1">After final approval</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex gap-3 p-3 bg-green-50 rounded-xl">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">{proposal.revision_count} Free Revisions</p>
                <p className="text-xs text-green-600">Changes within project scope</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-green-50 rounded-xl">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">{proposal.maintenance_count} Maintenance Requests</p>
                <p className="text-xs text-green-600">Post-delivery support</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Shield,    text: 'No hidden charges' },
            { icon: Clock,     text: 'On-time delivery' },
            { icon: RefreshCw, text: 'Free revisions included' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="card-sm flex flex-col items-center text-center gap-2">
              <Icon size={20} className="text-oxford" />
              <p className="text-xs text-muted">{text}</p>
            </div>
          ))}
        </div>

        {!locked && (
          <div className="card">
            {!showRejectForm ? (
              <div className="space-y-3">
                <button onClick={handleAccept} disabled={accepting} className="btn-primary w-full justify-center py-4 text-base">
                  {accepting ? 'Processing...' : 'Accept This Proposal'}
                </button>
                <button onClick={() => setShowRejectForm(true)} className="btn-secondary w-full justify-center py-3 text-rose border-rose/30">
                  Request Changes or Decline
                </button>
                <p className="text-center text-xs text-muted">By accepting, you agree to the scope and payment terms above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-syne font-700 text-oxford">Tell us what you would like to change</h3>
                <textarea className="form-textarea" rows={4} value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="What concerns do you have? What would you like to change?" />
                <div className="flex gap-3">
                  <button onClick={() => setShowRejectForm(false)} className="btn-secondary flex-1 justify-center">Back</button>
                  <button onClick={handleReject} disabled={rejecting} className="btn-danger flex-1 justify-center">
                    {rejecting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted pb-6">
          Questions? <a href="https://wa.me/916262326939" target="_blank" rel="noreferrer" className="text-oxford font-medium">WhatsApp us</a>
        </p>
      </div>
    </div>
  )
}
