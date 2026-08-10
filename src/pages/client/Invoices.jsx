// client/src/pages/client/Invoices.jsx
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { FileText, Download, Eye } from 'lucide-react'
import clsx from 'clsx'

const STATUS_STYLE = {
  draft: 'badge-gray',
  sent:  'badge-blue',
  paid:  'badge-green',
}

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/invoices/my')
      .then(r => setInvoices(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleView = (id) => {
    window.open(`${import.meta.env.VITE_API_URL}/invoices/${id}/html`, '_blank')
  }

  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + Number(i.total), 0)
  const totalPending = invoices.filter(i => i.status !== 'paid').reduce((a, i) => a + Number(i.total), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Invoices</h1>
        <p className="page-sub">Your billing documents from TechEthix</p>
      </div>

      {/* Summary */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card border-l-4 border-l-green-400">
            <p className="stat-label">Total Paid</p>
            <p className="stat-value mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="stat-card border-l-4 border-l-amber-400">
            <p className="stat-label">Total Pending</p>
            <p className="stat-value mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Invoice cards */}
      {invoices.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={36} className="text-muted/30 mx-auto mb-3" />
          <p className="font-syne font-700 text-oxford">No invoices yet</p>
          <p className="text-muted text-sm mt-1">Invoices will appear here as your project progresses.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-oxford/8 rounded-xl flex-shrink-0">
                  <FileText size={20} className="text-oxford" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium text-oxford">{inv.invoice_number}</p>
                    <span className={`badge text-xs ${STATUS_STYLE[inv.status] || 'badge-gray'}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(inv.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                    {inv.due_date && ` · Due: ${new Date(inv.due_date).toLocaleDateString('en-IN')}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="font-syne font-800 text-oxford">
                    {inv.currency === 'INR' ? '₹' : '$'}
                    {Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted capitalize">{inv.template}</p>
                </div>
                <button
                  onClick={() => handleView(inv.id)}
                  className="btn-secondary text-sm py-2 px-3"
                  title="View & Print"
                >
                  <Eye size={15} /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
