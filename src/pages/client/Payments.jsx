// client/src/pages/client/Payments.jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import { useCashfree } from '../../hooks/useCashfree'
import toast from 'react-hot-toast'
import {
  CreditCard, CheckCircle, Clock, AlertCircle,
  ShieldCheck, Zap
} from 'lucide-react'
import clsx from 'clsx'

const TYPE_LABEL = {
  advance:          'Advance Payment (50%)',
  final:            'Final Payment (50%)',
  techcare_monthly: 'TechCare Monthly',
}

const TYPE_DESC = {
  advance:  'Required to activate your project and start work.',
  final:    'Due after you approve the final project delivery.',
  techcare_monthly: 'Monthly support and maintenance subscription.',
}

export default function ClientPayments() {
  const [searchParams]        = useSearchParams()
  const [project,  setProject] = useState(null)
  const [payments, setPayments]= useState([])
  const [loading,  setLoading] = useState(true)
  const { initiatePayment, loading: paying } = useCashfree()

  const fetchData = async () => {
    try {
      const { data } = await api.get('/client/my-project')
      if (!data.data) return
      setProject(data.data)
      setPayments(data.data.payments || [])
    } catch {
      toast.error('Failed to load payment info.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Handle return from Cashfree redirect
    const orderId   = searchParams.get('order_id')
    const paymentId = searchParams.get('payment_id')
    if (orderId && paymentId) {
      api.get(`/payments/verify?order_id=${orderId}&payment_id=${paymentId}`)
        .then(r => {
          if (r.data.status === 'paid') {
            toast.success('Payment verified successfully!')
            fetchData()
          } else {
            toast.error('Payment could not be confirmed. Contact us if amount was deducted.')
          }
        })
        .catch(() => toast.error('Verification failed. Please contact us.'))
    }
  }, [])

  const handlePay = (paymentId) => {
    initiatePayment(paymentId, () => {
      fetchData()
    })
  }

  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((a, p) => a + Number(p.amount), 0)
  const totalPending = payments.filter(p => p.status !== 'paid').reduce((a, p) => a + Number(p.amount), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!project) return (
    <div className="card text-center py-16">
      <CreditCard size={36} className="text-muted/30 mx-auto mb-3" />
      <p className="font-syne font-700 text-oxford">No payment information yet</p>
      <p className="text-muted text-sm mt-1">Payments will appear here once your proposal is accepted.</p>
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">

      <div>
        <h1 className="page-title">Payments</h1>
        <p className="page-sub">{project.title}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card border-l-4 border-l-green-400">
          <p className="stat-label">Amount Paid</p>
          <p className="stat-value mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
          <p className="text-xs text-green-600 mt-1 font-medium">✓ Confirmed</p>
        </div>
        <div className="stat-card border-l-4 border-l-amber-400">
          <p className="stat-label">Amount Pending</p>
          <p className="stat-value mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            {totalPending > 0 ? 'Due' : 'All clear'}
          </p>
        </div>
      </div>

      {/* Payment cards */}
      <div className="space-y-4">
        {payments.map(p => (
          <PaymentCard
            key={p.id}
            payment={p}
            onPay={handlePay}
            paying={paying}
            onRefresh={fetchData}
          />
        ))}

        {payments.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-muted text-sm">No payments scheduled yet.</p>
          </div>
        )}
      </div>

      {/* Trust section */}
      <div className="card bg-oxford border-0">
        <h3 className="font-syne font-700 text-white mb-4 text-sm">Payment Security</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, text: 'Secured by Cashfree — RBI regulated payment gateway' },
            { icon: Zap,         text: 'Instant confirmation — project activates on payment' },
            { icon: CreditCard,  text: 'UPI, Cards, Net Banking — all methods accepted' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center text-center gap-2">
              <Icon size={20} className="text-white/60" />
              <p className="text-xs text-white/50 leading-tight">{text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ── Payment Card ─────────────────────────────
function PaymentCard({ payment, onPay, paying, onRefresh }) {
  const isPaid      = payment.status === 'paid'
  const isPending   = payment.status === 'pending'
  const isInitiated = payment.status === 'initiated'

  const TYPE_LABEL = {
    advance:          'Advance Payment (50%)',
    final:            'Final Payment (50%)',
    techcare_monthly: 'TechCare Monthly',
  }

  const TYPE_DESC = {
    advance:          'Required to activate your project and start work.',
    final:            'Due after you approve the final project delivery.',
    techcare_monthly: 'Monthly support and maintenance subscription.',
  }

  return (
    <div className={clsx(
      'card border-2 transition-all',
      isPaid      ? 'border-green-200 bg-green-50/30' :
      isPending   ? 'border-amber-200' :
      isInitiated ? 'border-blue-200' : 'border-border'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Status icon */}
          <div className={clsx(
            'p-3 rounded-xl flex-shrink-0',
            isPaid      ? 'bg-green-50' :
            isPending   ? 'bg-amber-50' : 'bg-blue-50'
          )}>
            {isPaid
              ? <CheckCircle size={22} className="text-green-600" />
              : isPending
              ? <Clock       size={22} className="text-amber-600" />
              : <AlertCircle size={22} className="text-blue-600" />
            }
          </div>

          {/* Info */}
          <div>
            <h3 className="font-syne font-700 text-oxford">
              {TYPE_LABEL[payment.type] || payment.type}
            </h3>
            <p className="text-muted text-sm mt-0.5">
              {TYPE_DESC[payment.type] || ''}
            </p>
            {isPaid && payment.paid_at && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                Paid on {new Date(payment.paid_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            )}
            {(isPending || isInitiated) && (
              <p className="text-xs text-amber-600 mt-1 font-medium">
                {isInitiated ? 'Payment initiated — pending confirmation' : 'Payment due'}
              </p>
            )}
          </div>
        </div>

        {/* Amount + action */}
        <div className="text-right flex-shrink-0">
          <p className="font-syne font-800 text-oxford text-2xl">
            ₹{Number(payment.amount).toLocaleString('en-IN')}
          </p>

          {isPaid ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
              <CheckCircle size={12} /> Paid
            </span>
          ) : (
            <button
              onClick={() => onPay(payment.id)}
              disabled={paying}
              className="btn-primary mt-2 text-sm py-2 px-4"
            >
              {paying ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : 'Pay Now →'}
            </button>
          )}
        </div>
      </div>

      {/* Payment methods + proof upload */}
      {!isPaid && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted">Accepted:</p>
            {['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallets'].map(m => (
              <span key={m} className="text-xs px-2 py-0.5 bg-cream rounded-full text-muted border border-border">
                {m}
              </span>
            ))}
          </div>
          <ProofUpload paymentId={payment.id} onSuccess={onRefresh} />
        </div>
      )}
    </div>
  )
}


// ── Proof Upload ─────────────────────────────
function ProofUpload({ paymentId, onSuccess }) {
  const [file,      setFile]      = useState(null)
  const [note,      setNote]      = useState('')
  const [uploading, setUploading] = useState(false)
  const [show,      setShow]      = useState(false)

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file.')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('proof', file)
      fd.append('payment_id', paymentId)
      fd.append('note', note)
      await api.post('/payments/proof', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Proof submitted! Admin will verify and activate your project.')
      setShow(false)
      onSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  if (!show) return (
    <button onClick={() => setShow(true)}
      className="text-xs text-oxford underline font-medium hover:text-rose transition-colors">
      Paid via UPI/Bank transfer? Upload payment proof →
    </button>
  )

  return (
    <div className="bg-cream rounded-xl p-4 space-y-3">
      <p className="text-xs font-medium text-oxford">Upload Payment Screenshot / Receipt</p>
      <input type="file" accept="image/*,.pdf"
        onChange={e => setFile(e.target.files[0])}
        className="text-xs text-muted w-full" />
      <input className="form-input text-sm" value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="UPI ID / Transaction ID (optional)" />
      <div className="flex gap-2">
        <button onClick={() => setShow(false)} className="btn-secondary flex-1 justify-center text-xs py-2">Cancel</button>
        <button onClick={handleUpload} disabled={uploading || !file}
          className="btn-primary flex-1 justify-center text-xs py-2">
          {uploading ? 'Uploading...' : 'Submit Proof'}
        </button>
      </div>
    </div>
  )
}
