// client/src/pages/admin/invoices/InvoiceList.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/axios'
import toast from 'react-hot-toast'

import {
  FileText, Plus, Download, CheckCircle,
  Clock, Eye, X, Trash2, Edit2
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_STYLE = {
  draft: 'badge-gray',
  sent: 'badge-blue',
  paid: 'badge-green',
}

const EMPTY_ITEM = { description: '', qty: 1, amount: '' }

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [deletingId, setDeletingId] = useState(null)


  const [form, setForm] = useState({
    project_id: '',
    template: 'indian',
    currency: 'INR',
    tax_percent: 18,
    notes: '',
    due_date: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    client_gstin: '',
    items: [{ ...EMPTY_ITEM }]
  })

  const fetchInvoices = () => {
    api.get('/invoices')
      .then(r => setInvoices(r.data.data || []))
      .catch(() => toast.error('Failed to load invoices.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchInvoices()
    api.get('/projects?limit=100')
      .then(r => setProjects(r.data.data || []))
      .catch(() => { })
  }, [])

  // Auto-fill client info when project selected
  const handleProjectChange = async (projectId) => {
    setForm(p => ({ ...p, project_id: projectId }))
    if (!projectId) return
    try {
      const { data } = await api.get(`/projects/${projectId}`)
      const proj = data.data
      setForm(p => ({
        ...p,
        project_id: projectId,
        client_name: proj.client_name || '',
        client_email: proj.client_email || '',
        client_phone: proj.client_phone || '',
      }))
    } catch { }
  }

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }))
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, field, val) => setForm(p => ({
    ...p,
    items: p.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item)
  }))

  const subtotal = form.items.reduce((a, item) => a + (parseFloat(item.amount || 0) * parseInt(item.qty || 1)), 0)
  const taxAmount = parseFloat(((subtotal * parseFloat(form.tax_percent || 0)) / 100).toFixed(2))
  const total = subtotal + taxAmount

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.project_id) return toast.error('Select a project.')
    if (!form.items.length || !form.items[0].description) return toast.error('Add at least one line item.')
    setSaving(true)
    try {
      if (editingInvoice) {
        await api.put(`/invoices/${editingInvoice}`, form)
        toast.success('Invoice updated.')
      } else {
        await api.post('/invoices', { ...form, tax_percent: parseFloat(form.tax_percent) })
        toast.success('Invoice created.')
      }
      setShowForm(false)
      setEditingInvoice(null)
      fetchInvoices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = (id) => {
    window.open(`${import.meta.env.VITE_API_URL}/invoices/${id}/html`, '_blank')
  }

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/invoices/${id}/mark-paid`)
      toast.success('Invoice marked as paid.')
      fetchInvoices()
    } catch { toast.error('Failed.') }
  }

  const sym = form.template === 'indian' ? '₹' : '$'

  const handleDeleteInvoice = async (id, invoiceNumber) => {
    if (!confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await api.delete(`/invoices/${id}`)
      toast.success('Invoice deleted.')
      fetchInvoices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Paid invoices cannot be deleted.')
    } finally {
      setDeletingId(null)
    }
  }
  const handleEditOpen = (inv) => {
    // Pre-fill the existing form state with invoice data
    setForm({
      project_id: inv.project_id,
      template: inv.template,
      currency: inv.currency,
      tax_percent: inv.tax_percent,
      notes: inv.notes || '',
      due_date: inv.due_date?.split('T')[0] || '',
      client_name: inv.client_name || '',
      client_email: inv.client_email || '',
      client_phone: inv.client_phone || '',
      client_address: inv.client_address || '',
      client_gstin: inv.client_gstin || '',
      items: JSON.parse(inv.items || '[]')
    })
    setEditingInvoice(inv.id)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">

      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-sub">{invoices.length} total invoices</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={15} /> Create Invoice
        </button>
      </div>

      {/* Create invoice modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-syne font-700 text-oxford text-lg">Create Invoice</h3>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-oxford">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Template + Project */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Template</label>
                  <select className="form-select" value={form.template}
                    onChange={e => setForm(p => ({
                      ...p,
                      template: e.target.value,
                      currency: e.target.value === 'indian' ? 'INR' : 'USD'
                    }))}>
                    <option value="indian">Indian (GST, INR)</option>
                    <option value="international">International (USD)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Project *</label>
                  <select className="form-select" value={form.project_id}
                    onChange={e => handleProjectChange(e.target.value)} required>
                    <option value="">Select project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Client Name</label>
                  <input className="form-input" value={form.client_name}
                    onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Client Email</label>
                  <input className="form-input" value={form.client_email}
                    onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))} />
                </div>
              </div>

              {form.template === 'indian' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Client GSTIN (optional)</label>
                    <input className="form-input" value={form.client_gstin}
                      onChange={e => setForm(p => ({ ...p, client_gstin: e.target.value }))}
                      placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className="form-label">Client Address</label>
                    <input className="form-input" value={form.client_address}
                      onChange={e => setForm(p => ({ ...p, client_address: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Line Items *</label>
                  <button type="button" onClick={addItem}
                    className="text-xs text-oxford font-medium hover:text-rose flex items-center gap-1">
                    <Plus size={12} /> Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <input className="form-input text-sm" placeholder="Description"
                          value={item.description}
                          onChange={e => updateItem(i, 'description', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <input className="form-input text-sm" type="number" min="1" placeholder="Qty"
                          value={item.qty}
                          onChange={e => updateItem(i, 'qty', e.target.value)} />
                      </div>
                      <div className="col-span-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">{sym}</span>
                          <input className="form-input text-sm pl-6" type="number" placeholder="Amount"
                            value={item.amount}
                            onChange={e => updateItem(i, 'amount', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)}
                            className="text-muted hover:text-red-500 transition-colors">
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax + Due date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    {form.template === 'indian' ? 'GST %' : 'Tax %'}
                  </label>
                  <input className="form-input" type="number" min="0" max="100"
                    value={form.tax_percent}
                    onChange={e => setForm(p => ({ ...p, tax_percent: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={form.due_date}
                    onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
              </div>

              {/* Totals preview */}
              <div className="bg-cream rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span>{sym}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {parseFloat(form.tax_percent) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{form.template === 'indian' ? 'GST' : 'Tax'} ({form.tax_percent}%)</span>
                    <span>{sym}{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-syne font-800 text-oxford text-lg pt-1 border-t border-border">
                  <span>Total</span>
                  <span>{sym}{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div>
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" rows={2} value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Payment instructions, bank details, or any note..." />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving}
                  className="btn-primary flex-1 justify-center">
                  {saving ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={36} className="text-muted/30 mx-auto mb-3" />
            <p className="font-syne font-700 text-oxford">No invoices yet</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Template</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs font-medium">{inv.invoice_number}</td>
                    <td className="max-w-36 truncate">{inv.project_title}</td>
                    <td className="text-muted">{inv.client_name}</td>
                    <td>
                      <span className="text-xs px-2 py-0.5 bg-cream rounded-full text-muted capitalize">
                        {inv.template}
                      </span>
                    </td>
                    <td className="font-syne font-700 text-oxford">
                      {inv.currency === 'INR' ? '₹' : '$'}
                      {Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_STYLE[inv.status] || 'badge-gray'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-muted text-xs">
                      {new Date(inv.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handlePrint(inv.id)}
                          className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-oxford transition-colors"
                          title="View / Print">
                          <Eye size={14} />
                        </button>
                        {inv.status !== 'paid' && (
                          <button onClick={() => handleMarkPaid(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-muted hover:text-green-600 transition-colors"
                            title="Mark paid">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditOpen(inv)}
                          disabled={inv.status === 'paid'}
                          className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-oxford
             transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={inv.status === 'paid' ? 'Cannot edit paid invoice' : 'Edit'}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoice_number)}
                          disabled={deletingId === inv.id || inv.status === 'paid'}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500
             transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={inv.status === 'paid' ? 'Cannot delete paid invoice' : 'Delete'}
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
