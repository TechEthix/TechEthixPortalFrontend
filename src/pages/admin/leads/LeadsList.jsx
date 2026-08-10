// client/src/pages/admin/leads/LeadsList.jsx
import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import {
  Plus, Search, Filter, ArrowUpRight,
  Phone, Mail, Calendar, RefreshCw
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_OPTIONS = ['new','contacted','call_scheduled','quoted','negotiating','won','lost']

const STATUS_STYLE = {
  new:            'badge-blue',
  contacted:      'badge-oxford',
  call_scheduled: 'badge-amber',
  quoted:         'badge-rose',
  negotiating:    'badge-amber',
  won:            'badge-green',
  lost:           'badge-red',
}

const SOURCE_LABEL = {
  google_maps: 'Google Maps',
  instagram:   'Instagram',
  linkedin:    'LinkedIn',
  referral:    'Referral',
  website:     'Website',
  whatsapp:    'WhatsApp',
  google_ads:  'Google Ads',
  other:       'Other',
}

export default function LeadsList() {
  const navigate = useNavigate()
  const [leads,    setLeads]    = useState([])
  const [pipeline, setPipeline] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [filters,  setFilters]  = useState({ status: '', source: '', search: '' })
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...(filters.status && { status: filters.status }),
        ...(filters.source && { source: filters.source }),
        ...(filters.search && { search: filters.search }),
      })
      const { data } = await api.get(`/leads?${params}`)
      setLeads(data.data)
      setPipeline(data.pipeline || {})
      setPagination(data.pagination)
    } catch {
      toast.error('Failed to load leads.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchLeads(1) }, [fetchLeads])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/leads/${id}`, { status })
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
      setPipeline(prev => {
        const old = leads.find(l => l.id === id)?.status
        return {
          ...prev,
          [old]:    Math.max(0, (prev[old] || 1) - 1),
          [status]: (prev[status] || 0) + 1
        }
      })
      toast.success('Status updated.')
    } catch {
      toast.error('Update failed.')
    }
  }

  const totalLeads = Object.values(pipeline).reduce((a, b) => a + Number(b), 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-sub">{pagination.total} total leads in your pipeline</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/leads/kanban" className="btn-secondary">
            Kanban View
          </Link>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setFilters(p => ({ ...p, status: p.status === s ? '' : s }))}
            className={clsx(
              'card-sm text-left transition-all hover:shadow-lg',
              filters.status === s && 'ring-2 ring-oxford'
            )}
          >
            <p className="font-syne font-800 text-2xl text-oxford">
              {pipeline[s] || 0}
            </p>
            <p className="text-xs text-muted capitalize mt-0.5">
              {s.replace(/_/g, ' ')}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="form-input pl-9 py-2"
              placeholder="Search name, phone, business..."
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
            />
          </div>
          <select className="form-select w-auto py-2"
            value={filters.status}
            onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>
          <select className="form-select w-auto py-2"
            value={filters.source}
            onChange={e => setFilters(p => ({ ...p, source: e.target.value }))}>
            <option value="">All sources</option>
            {Object.entries(SOURCE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          {(filters.status || filters.source || filters.search) && (
            <button
              onClick={() => setFilters({ status: '', source: '', search: '' })}
              className="btn-ghost py-2 text-rose"
            >
              <RefreshCw size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="font-syne font-700 text-oxford text-lg">No leads found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new lead.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Business</th>
                  <th>Service</th>
                  <th>Budget</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-oxford/8 flex items-center
                                        justify-center font-syne font-700 text-oxford text-xs flex-shrink-0">
                          {lead.name.charAt(0)}
                        </div>
                        <span className="font-medium">{lead.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <a href={`tel:${lead.phone}`}
                          className="flex items-center gap-1 text-xs text-muted hover:text-oxford transition-colors">
                          <Phone size={11} /> {lead.phone}
                        </a>
                        {lead.email && (
                          <a href={`mailto:${lead.email}`}
                            className="flex items-center gap-1 text-xs text-muted hover:text-oxford transition-colors">
                            <Mail size={11} /> {lead.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm">{lead.business_name || '—'}</p>
                        {lead.business_type && (
                          <p className="text-xs text-muted">{lead.business_type}</p>
                        )}
                      </div>
                    </td>
                    <td className="capitalize text-sm">
                      {lead.service_needed?.replace(/_/g,' ')}
                    </td>
                    <td className="text-sm text-muted capitalize">
                      {lead.budget_range?.replace(/_/g,' ')}
                    </td>
                    <td className="text-sm text-muted">
                      {SOURCE_LABEL[lead.source] || lead.source}
                    </td>
                    <td>
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        className={clsx(
                          'text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer outline-none',
                          lead.status === 'won'  ? 'bg-green-50 text-green-700' :
                          lead.status === 'lost' ? 'bg-red-50 text-red-600'    :
                          lead.status === 'new'  ? 'bg-blue-50 text-blue-700'  :
                          'bg-amber-50 text-amber-700'
                        )}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {lead.next_followup ? (
                        <div className={clsx(
                          'flex items-center gap-1 text-xs',
                          new Date(lead.next_followup) < new Date() ? 'text-red-500' : 'text-muted'
                        )}>
                          <Calendar size={11} />
                          {new Date(lead.next_followup).toLocaleDateString('en-IN')}
                        </div>
                      ) : <span className="text-xs text-muted">—</span>}
                    </td>
                    <td>
                      <Link to={`/admin/leads/${lead.id}`}
                        className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-oxford transition-colors inline-flex">
                        <ArrowUpRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border">
            <p className="text-xs text-muted">
              Showing {leads.length} of {pagination.total}
            </p>
            <div className="flex gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => fetchLeads(p)}
                  className={clsx(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                    pagination.page === p
                      ? 'bg-oxford text-white'
                      : 'text-muted hover:bg-cream'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchLeads(1) }}
        />
      )}
    </div>
  )
}

// ── Add Lead Modal ──────────────────────────
function AddLeadModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', business_name: '',
    business_type: '', service_needed: 'website',
    budget_range: 'not_sure', source: 'google_maps',
    timeline: 'flexible', message: '', notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.phone) return toast.error('Name and phone required.')
    setLoading(true)
    try {
      await api.post('/leads', form)
      toast.success('Lead added successfully.')
      onSuccess()
    } catch {
      toast.error('Failed to add lead.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-syne font-700 text-oxford text-lg">Add New Lead</h3>
          <button onClick={onClose} className="text-muted hover:text-oxford transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Name *</label>
              <input className="form-input" name="name" value={form.name}
                onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
            </div>
            <div>
              <label className="form-label">Phone *</label>
              <input className="form-input" name="phone" value={form.phone}
                onChange={e => setForm(p => ({...p, phone: e.target.value}))} required />
            </div>
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" value={form.email}
              onChange={e => setForm(p => ({...p, email: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Business Name</label>
              <input className="form-input" value={form.business_name}
                onChange={e => setForm(p => ({...p, business_name: e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Business Type</label>
              <input className="form-input" value={form.business_type}
                onChange={e => setForm(p => ({...p, business_type: e.target.value}))}
                placeholder="Restaurant, Clinic..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Service Needed</label>
              <select className="form-select" value={form.service_needed}
                onChange={e => setForm(p => ({...p, service_needed: e.target.value}))}>
                <option value="website">Website</option>
                <option value="landing_page">Landing Page</option>
                <option value="bundle">Website + WhatsApp Bundle</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="whatsapp_bot">WhatsApp Bot</option>
                <option value="seo">SEO</option>
                <option value="design">Design</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Source</label>
              <select className="form-select" value={form.source}
                onChange={e => setForm(p => ({...p, source: e.target.value}))}>
                <option value="google_maps">Google Maps</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="referral">Referral</option>
                <option value="website">Website</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Notes (internal)</label>
            <textarea className="form-textarea" rows={3} value={form.notes}
              onChange={e => setForm(p => ({...p, notes: e.target.value}))}
              placeholder="Call notes, observations..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
