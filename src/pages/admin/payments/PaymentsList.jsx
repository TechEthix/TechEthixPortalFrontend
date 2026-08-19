// client/src/pages/admin/payments/PaymentsList.jsx
import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import {
  CreditCard, TrendingUp, Clock, CheckCircle,
  RefreshCw, Download, Plus, Trash2, Edit2, X
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_STYLE = {
  pending:   'badge-amber',
  initiated: 'badge-blue',
  paid:      'badge-green',
  failed:    'badge-red',
  refunded:  'badge-gray',
}

const TYPE_LABEL = {
  advance:         'Advance (35%)',
  midpoint:        'Midpoint (35%)',
  final:           'Final (30%)',
  techcare_monthly:'TechCare Monthly',
}

export default function PaymentsList() {
  const [payments, setPayments]  = useState([])
  const [summary,  setSummary]   = useState({})
  const [loading,  setLoading]   = useState(true)
  const [filters,  setFilters]   = useState({ status: '', type: '' })
  const [markingId, setMarkingId]= useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating,   setCreating]  = useState(false)
  const [editingId,  setEditingId] = useState(null)
  const [editForm,   setEditForm]  = useState({ amount: '', status: '', note: '' })
  const [projects,   setProjects]  = useState([])
  const [createForm, setCreateForm] = useState({
    project_id: '', type: 'advance', amount: '', status: 'pending', note: ''
  })

  const openCreate = async () => {
    setShowCreate(true)
    try {
      const { data } = await api.get('/projects?limit=100')
      setProjects(data.data || [])
    } catch {}
  }

  const handleCreate = async e => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/payments/manual', createForm)
      toast.success('Payment record created.')
      setShowCreate(false)
      setCreateForm({ project_id: '', type: 'advance', amount: '', status: 'pending', note: '' })
      fetchPayments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async (paymentId) => {
    try {
      await api.put(`/payments/${paymentId}`, editForm)
      toast.success('Payment updated.')
      setEditingId(null)
      fetchPayments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    }
  }

  const handleDelete = async (paymentId) => {
    if (!confirm('Delete this payment record?')) return
    try {
      await api.delete(`/payments/${paymentId}`)
      toast.success('Payment deleted.')
      fetchPayments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed — paid payments cannot be deleted.')
    }
  }

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(filters.status && { status: filters.status }),
        ...(filters.type   && { type:   filters.type }),
        limit: 50
      })
      const { data } = await api.get(`/payments?${params}`)
      setPayments(data.data || [])
      setSummary(data.summary || {})
    } catch {
      toast.error('Failed to load payments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayments() }, [filters])

  const handleMarkPaid = async (paymentId, projectTitle) => {
    const note = prompt(`Mark as paid manually?\nNote (e.g. "UPI - 9876543210"):\n`)
    if (note === null) return
    setMarkingId(paymentId)
    try {
      await api.post('/payments/mark-paid', { payment_id: paymentId, note: note || 'manual' })
      toast.success('Payment marked as paid.')
      fetchPayments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setMarkingId(null)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Project', 'Client', 'Type', 'Amount', 'Status', 'Date'].join(','),
      ...payments.map(p => [
        `"${p.project_title}"`,
        `"${p.client_name}"`,
        TYPE_LABEL[p.type] || p.type,
        p.amount,
        p.status,
        p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-IN') : ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `techethix-payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-sub">All transactions across projects</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary">
          <Download size={15} /> Export CSV
        </button>
        <button onClick={openCreate} className="btn-secondary text-sm">
          <Plus size={14} /> Add Payment
        </button>
      </div>

      {/* Revenue stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border-l-4 border-l-green-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Total Collected</p>
              <p className="stat-value mt-1">
                ₹{Number(summary.total_collected || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted mt-1">All time paid</p>
            </div>
            <div className="p-2.5 rounded-xl bg-green-50">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-oxford">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">This Month</p>
              <p className="stat-value mt-1">
                ₹{Number(summary.this_month || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted mt-1">Revenue this month</p>
            </div>
            <div className="p-2.5 rounded-xl bg-oxford/8">
              <TrendingUp size={20} className="text-oxford" />
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-amber-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Pending</p>
              <p className="stat-value mt-1">
                ₹{Number(summary.total_pending || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted mt-1">Outstanding invoices</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50">
              <Clock size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="form-select w-auto py-2"
          value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="initiated">Initiated</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
        <select className="form-select w-auto py-2"
          value={filters.type}
          onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
          <option value="">All types</option>
          <option value="advance">Advance (35%)</option>
          <option value="midpoint">Midpoint (35%)</option>
          <option value="final">Final (30%)</option>
          <option value="techcare_monthly">TechCare</option>
        </select>
        {(filters.status || filters.type) && (
          <button
            onClick={() => setFilters({ status: '', type: '' })}
            className="btn-ghost py-2 text-rose text-sm">
            <RefreshCw size={14} /> Clear
          </button>
        )}
      </div>

      {/* Payments table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard size={36} className="text-muted/30 mx-auto mb-3" />
            <p className="font-syne font-700 text-oxford">No payments yet</p>
            <p className="text-muted text-sm mt-1">Payments appear when proposals are accepted.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Ref</th>
                  <th>Proof</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium max-w-36 truncate">{p.project_title}</td>
                    <td className="text-muted">{p.client_name}</td>
                    <td>
                      <span className={clsx('badge text-xs',
                        p.type === 'advance'  ? 'badge-oxford' :
                        p.type === 'midpoint' ? 'badge-blue'   :
                        p.type === 'final'    ? 'badge-green'  : 'badge-gray'
                      )}>
                        {TYPE_LABEL[p.type] || p.type}
                      </span>
                    </td>
                    <td className="font-syne font-700 text-oxford">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_STYLE[p.status] || 'badge-gray'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {p.paid_at
                        ? new Date(p.paid_at).toLocaleDateString('en-IN')
                        : <span className="text-amber-500 text-xs">Pending</span>}
                    </td>
                    <td className="text-xs text-muted font-mono max-w-24 truncate">
                      {p.cashfree_payment_id || p.cashfree_order_id || '—'}
                    </td>
                    <td>
                      {p.proof_file ? (
                        <a
                          href={`${import.meta.env.VITE_API_URL?.replace('/api','')}/uploads/${p.proof_file}`}
                          target="_blank" rel="noreferrer"
                          className="text-xs text-oxford underline font-medium hover:text-rose"
                        >
                          View proof
                        </a>
                      ) : p.submitted_at ? (
                        <span className="text-xs text-amber-600">Proof pending</span>
                      ) : <span className="text-xs text-muted">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {p.status !== 'paid' && (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(p.id)
                                setEditForm({ amount: p.amount, status: p.status, note: p.cashfree_payment_id || '' })
                              }}
                              className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-oxford transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleMarkPaid(p.id, p.project_title)}
                              disabled={markingId === p.id}
                              className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600
                                     hover:bg-green-100 transition-colors font-medium"
                            >
                              {markingId === p.id ? '...' : 'Mark Paid'}
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                      {/* Inline edit form */}
                      {editingId === p.id && (
                        <div className="mt-2 p-3 bg-cream rounded-xl space-y-2 min-w-64">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-muted">Amount (₹)</label>
                              <input type="number" className="form-input text-sm py-1.5"
                                value={editForm.amount}
                                onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                            </div>
                            <div>
                              <label className="text-xs text-muted">Status</label>
                              <select className="form-select text-sm py-1.5" value={editForm.status}
                                onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                                <option value="pending">pending</option>
                                <option value="initiated">initiated</option>
                                <option value="paid">paid</option>
                                <option value="failed">failed</option>
                              </select>
                            </div>
                          </div>
                          <input className="form-input text-sm py-1.5" value={editForm.note}
                            onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))}
                            placeholder="Reference / note (optional)" />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingId(null)}
                              className="btn-secondary flex-1 justify-center text-xs py-1.5">Cancel</button>
                            <button onClick={() => handleEdit(p.id)}
                              className="btn-primary flex-1 justify-center text-xs py-1.5">Save</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create payment modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-syne font-700 text-oxford text-lg">Add Payment Record</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted hover:text-oxford">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="form-label">Project *</label>
                <select className="form-select" value={createForm.project_id}
                  onChange={e => setCreateForm(p => ({ ...p, project_id: e.target.value }))} required>
                  <option value="">Select project</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-select" value={createForm.type}
                    onChange={e => setCreateForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="advance">Advance (35%)</option>
                    <option value="midpoint">Midpoint (35%)</option>
                    <option value="final">Final (30%)</option>
                    <option value="techcare_monthly">TechCare Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={createForm.status}
                    onChange={e => setCreateForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Amount (₹) *</label>
                <input type="number" className="form-input" value={createForm.amount}
                  onChange={e => setCreateForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="17500" min="1" required />
              </div>
              <div>
                <label className="form-label">Note / Reference</label>
                <input className="form-input" value={createForm.note}
                  onChange={e => setCreateForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="UPI / cash / manual note" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={creating}
                  className="btn-primary flex-1 justify-center">
                  {creating ? 'Creating...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}