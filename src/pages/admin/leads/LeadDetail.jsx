// client/src/pages/admin/leads/LeadDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Phone, Mail, Calendar, Edit2,
  Save, X, UserCheck, Trash2, ExternalLink
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_OPTIONS = ['new','contacted','call_scheduled','quoted','negotiating','won','lost']
const STATUS_STYLE   = {
  new: 'badge-blue', contacted: 'badge-oxford', call_scheduled: 'badge-amber',
  quoted: 'badge-rose', negotiating: 'badge-amber', won: 'badge-green', lost: 'badge-red'
}

export default function LeadDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [lead,    setLead]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({})
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    api.get(`/leads/${id}`)
      .then(r => { setLead(r.data.data); setForm(r.data.data) })
      .catch(() => toast.error('Lead not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.put(`/leads/${id}`, form)
      setLead(data.data)
      setForm(data.data)
      setEditing(false)
      toast.success('Lead updated.')
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    try {
      await api.delete(`/leads/${id}`)
      toast.success('Lead deleted.')
      navigate('/admin/leads')
    } catch {
      toast.error('Delete failed.')
    }
  }

  const handleConvert = async () => {
    if (!confirm('Convert this lead to a client? A user account will be created.')) return
    setConverting(true)
    try {
      const { data } = await api.post(`/leads/${id}/convert`)
      toast.success(`Converted! Temp password: ${data.data?.temp_password || 'Check email'}`)
      setLead(prev => ({ ...prev, status: 'won' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conversion failed.')
    } finally {
      setConverting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!lead) return (
    <div className="text-center py-16">
      <p className="font-syne font-700 text-oxford">Lead not found.</p>
      <Link to="/admin/leads" className="btn-primary mt-4 inline-flex">Back to Leads</Link>
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/leads" className="btn-ghost p-2">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">{lead.name}</h1>
            <p className="page-sub">{lead.business_name || 'No business name'} · Added {new Date(lead.created_at).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {lead.status !== 'won' && (
            <button onClick={handleConvert} disabled={converting}
              className="btn-secondary text-green-600 border-green-200 hover:bg-green-50">
              <UserCheck size={16} />
              {converting ? 'Converting...' : 'Convert to Client'}
            </button>
          )}
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-primary">
              <Edit2 size={15} /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setForm(lead) }} className="btn-secondary">
                <X size={15} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                <Save size={15} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left — main info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Contact info */}
          <div className="card">
            <h3 className="font-syne font-700 text-oxford mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Full Name',      field: 'name',          type: 'text' },
                { label: 'Phone',          field: 'phone',         type: 'tel'  },
                { label: 'Email',          field: 'email',         type: 'email'},
                { label: 'Business Name',  field: 'business_name', type: 'text' },
                { label: 'Business Type',  field: 'business_type', type: 'text' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="form-label">{label}</label>
                  {editing ? (
                    <input type={type} className="form-input"
                      value={form[field] || ''}
                      onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
                  ) : (
                    <p className="text-sm text-oxford py-1">{lead[field] || '—'}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Quick contact buttons */}
            {!editing && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <a href={`tel:${lead.phone}`} className="btn-secondary text-xs py-1.5">
                  <Phone size={13} /> Call
                </a>
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="btn-secondary text-xs py-1.5">
                    <Mail size={13} /> Email
                  </a>
                )}
                <a href={`https://wa.me/91${lead.phone?.replace(/\D/g,'')}`}
                  target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5">
                  <ExternalLink size={13} /> WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Project info */}
          <div className="card">
            <h3 className="font-syne font-700 text-oxford mb-4">Project Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Service Needed</label>
                {editing ? (
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
                ) : (
                  <p className="text-sm capitalize py-1">{lead.service_needed?.replace(/_/g,' ')}</p>
                )}
              </div>
              <div>
                <label className="form-label">Budget Range</label>
                {editing ? (
                  <select className="form-select" value={form.budget_range}
                    onChange={e => setForm(p => ({...p, budget_range: e.target.value}))}>
                    <option value="under_5k">Under ₹5,000</option>
                    <option value="5k_10k">₹5,000–₹10,000</option>
                    <option value="10k_20k">₹10,000–₹20,000</option>
                    <option value="20k_plus">₹20,000+</option>
                    <option value="not_sure">Not sure</option>
                  </select>
                ) : (
                  <p className="text-sm capitalize py-1">{lead.budget_range?.replace(/_/g,' ')}</p>
                )}
              </div>
              <div>
                <label className="form-label">Timeline</label>
                {editing ? (
                  <select className="form-select" value={form.timeline}
                    onChange={e => setForm(p => ({...p, timeline: e.target.value}))}>
                    <option value="asap">ASAP</option>
                    <option value="1_month">Within 1 month</option>
                    <option value="1_3_months">1–3 months</option>
                    <option value="flexible">Flexible</option>
                  </select>
                ) : (
                  <p className="text-sm capitalize py-1">{lead.timeline?.replace(/_/g,' ')}</p>
                )}
              </div>
            </div>

            {lead.message && (
              <div className="mt-4">
                <label className="form-label">Their Message</label>
                <p className="text-sm text-oxford bg-cream rounded-xl p-3">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <h3 className="font-syne font-700 text-oxford mb-4">Internal Notes</h3>
            {editing ? (
              <textarea className="form-textarea" rows={5}
                value={form.notes || ''}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Call notes, observations, anything relevant..." />
            ) : (
              <p className="text-sm text-oxford whitespace-pre-wrap min-h-12">
                {lead.notes || <span className="text-muted">No notes yet. Click Edit to add.</span>}
              </p>
            )}
          </div>
        </div>

        {/* Right — status + meta */}
        <div className="space-y-4">

          {/* Status */}
          <div className="card">
            <h3 className="font-syne font-700 text-oxford mb-4">Pipeline Status</h3>
            <div className="space-y-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    if (!editing) {
                      api.put(`/leads/${id}`, { status: s })
                        .then(() => { setLead(p => ({...p, status: s})); toast.success('Status updated.') })
                        .catch(() => toast.error('Update failed.'))
                    } else {
                      setForm(p => ({...p, status: s}))
                    }
                  }}
                  className={clsx(
                    'w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-all',
                    (editing ? form.status : lead.status) === s
                      ? 'bg-oxford text-white'
                      : 'bg-cream text-muted hover:bg-oxford/5 hover:text-oxford'
                  )}
                >
                  {s.replace(/_/g,' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up date */}
          <div className="card">
            <h3 className="font-syne font-700 text-oxford mb-3">Follow-up Date</h3>
            <input
              type="date"
              className="form-input"
              value={form.next_followup?.split('T')[0] || ''}
              onChange={e => {
                setForm(p => ({...p, next_followup: e.target.value}))
                if (!editing) {
                  api.put(`/leads/${id}`, { next_followup: e.target.value })
                    .then(() => toast.success('Follow-up date saved.'))
                }
              }}
            />
            {lead.next_followup && new Date(lead.next_followup) < new Date() && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <Calendar size={11} /> Overdue!
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="card">
            <h3 className="font-syne font-700 text-oxford mb-3">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Source</span>
                <span className="font-medium capitalize">{lead.source?.replace(/_/g,' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Added</span>
                <span className="font-medium">{new Date(lead.created_at).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Updated</span>
                <span className="font-medium">{new Date(lead.updated_at).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className={`badge ${STATUS_STYLE[lead.status]}`}>{lead.status?.replace(/_/g,' ')}</span>
              </div>
            </div>
          </div>

          {/* Create proposal CTA */}
          {lead.status !== 'lost' && (
            <Link
              to={`/admin/proposals/new?lead_id=${lead.id}`}
              className="btn-primary w-full justify-center py-3"
            >
              Create Proposal →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
