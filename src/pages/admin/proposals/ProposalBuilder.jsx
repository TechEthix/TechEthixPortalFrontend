// client/src/pages/admin/proposals/ProposalBuilder.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import { Save, Send, Eye, ArrowLeft } from 'lucide-react'

const DEFAULT_SCOPE = `1. Project Discovery & Planning
   - Requirements gathering and sitemap finalization
   - Design direction and reference selection

2. Design Phase
   - Homepage wireframe and visual design
   - Mobile-first responsive layouts
   - Client review and approval

3. Development Phase
   - Frontend development (HTML/CSS/JS or React)
   - CMS integration (if applicable)
   - Contact forms and WhatsApp integration
   - Google Maps integration

4. Testing & Launch
   - Cross-browser and mobile testing
   - Performance optimization
   - Domain connection and go-live
   - Post-launch support briefing`

const DEFAULT_DELIVERABLES = `- Fully functional, mobile-responsive website
- Source files and login credentials
- Google Business Profile setup
- WhatsApp click-to-chat integration
- Basic on-page SEO setup
- 1 month free support post-delivery`

export default function ProposalBuilder() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const leadId        = searchParams.get('lead_id')

  const [lead,    setLead]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)

  const [form, setForm] = useState({
    lead_id:           leadId || '',
    title:             '',
    scope_of_work:     DEFAULT_SCOPE,
    deliverables:      DEFAULT_DELIVERABLES,
    exclusions:        'App development, content writing, photography, paid ad campaigns, third-party API costs',
    price:             8500,
    timeline_days:     10,
    revision_count:    2,
    maintenance_count: 2,
    valid_days:        7,
  })

  // Load lead info if coming from lead detail
  useEffect(() => {
    if (leadId) {
      api.get(`/leads/${leadId}`)
        .then(r => {
          setLead(r.data.data)
          setForm(p => ({
            ...p,
            title: `${r.data.data.service_needed?.replace(/_/g,' ')} — ${r.data.data.business_name || r.data.data.name}`
          }))
        })
        .catch(() => {})
    }
  }, [leadId])

  const f = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const handleSave = async (andSend = false) => {
    if (!form.lead_id || !form.title || !form.price || !form.timeline_days) {
      return toast.error('Please fill in all required fields.')
    }
    setLoading(true)
    try {
      const { data } = await api.post('/proposals', form)
      toast.success('Proposal created.')

      if (andSend) {
        await api.post(`/proposals/${data.data.id}/send`)
        toast.success('Proposal sent to client!')
      }

      navigate('/admin/proposals')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save proposal.')
    } finally {
      setLoading(false)
    }
  }

  const advanceAmt  = (form.price * 0.35).toFixed(0)
  const midpointAmt = (form.price * 0.35).toFixed(0)
  const finalAmt    = (form.price * 0.30).toFixed(0)

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Create Proposal</h1>
            {lead && <p className="page-sub">For {lead.name} · {lead.business_name}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(p => !p)} className="btn-secondary">
            <Eye size={15} /> {preview ? 'Edit' : 'Preview'}
          </button>
          <button onClick={() => handleSave(false)} disabled={loading} className="btn-secondary">
            <Save size={15} /> Save Draft
          </button>
          <button onClick={() => handleSave(true)} disabled={loading} className="btn-primary">
            <Send size={15} /> {loading ? 'Sending...' : 'Save & Send'}
          </button>
        </div>
      </div>

      {preview ? (
        <ProposalPreview form={form} lead={lead} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main form */}
          <div className="lg:col-span-2 space-y-4">

            <div className="card">
              <h3 className="font-syne font-700 text-oxford mb-4">Project Details</h3>

              {!leadId && (
                <div className="mb-4">
                  <label className="form-label">Lead ID *</label>
                  <input className="form-input" type="number" value={form.lead_id}
                    onChange={e => f('lead_id', e.target.value)}
                    placeholder="Enter lead ID to link proposal" />
                </div>
              )}

              <div className="mb-4">
                <label className="form-label">Proposal Title *</label>
                <input className="form-input" value={form.title}
                  onChange={e => f('title', e.target.value)}
                  placeholder="e.g. Business Website — Sharma Traders" />
              </div>

              <div>
                <label className="form-label">Scope of Work *</label>
                <textarea className="form-textarea font-mono text-xs" rows={14}
                  value={form.scope_of_work}
                  onChange={e => f('scope_of_work', e.target.value)} />
              </div>
            </div>

            <div className="card">
              <h3 className="font-syne font-700 text-oxford mb-4">Deliverables & Exclusions</h3>
              <div className="mb-4">
                <label className="form-label">Deliverables (what the client gets)</label>
                <textarea className="form-textarea" rows={7}
                  value={form.deliverables}
                  onChange={e => f('deliverables', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Exclusions (what is NOT included)</label>
                <textarea className="form-textarea" rows={3}
                  value={form.exclusions}
                  onChange={e => f('exclusions', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Pricing */}
            <div className="card">
              <h3 className="font-syne font-700 text-oxford mb-4">Pricing</h3>
              <div className="mb-4">
                <label className="form-label">Total Price (₹) *</label>
                <input className="form-input text-lg font-syne font-700" type="number"
                  value={form.price}
                  onChange={e => f('price', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Advance (35%)</span>
                  <span className="font-medium text-oxford">₹{Number(advanceAmt).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Midpoint (35%)</span>
                  <span className="font-medium text-oxford">₹{Number(midpointAmt).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Final (30%)</span>
                  <span className="font-medium text-oxford">₹{Number(finalAmt).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-syne font-800 text-oxford text-lg">
                    ₹{Number(form.price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <h3 className="font-syne font-700 text-oxford mb-4">Timeline & Terms</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Delivery (days) *</label>
                  <input className="form-input" type="number" min={1}
                    value={form.timeline_days}
                    onChange={e => f('timeline_days', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="form-label">Free Revisions</label>
                  <input className="form-input" type="number" min={0} max={10}
                    value={form.revision_count}
                    onChange={e => f('revision_count', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="form-label">Free Maintenance Requests</label>
                  <input className="form-input" type="number" min={0} max={10}
                    value={form.maintenance_count}
                    onChange={e => f('maintenance_count', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="form-label">Valid For (days)</label>
                  <input className="form-input" type="number" min={1}
                    value={form.valid_days}
                    onChange={e => f('valid_days', parseInt(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="card bg-oxford border-0">
              <h3 className="font-syne font-700 text-white mb-3 text-sm">Proposal Summary</h3>
              <div className="space-y-2 text-sm">
                {[
                  ['Price',       `₹${Number(form.price).toLocaleString('en-IN')}`],
                  ['Timeline',    `${form.timeline_days} days`],
                  ['Revisions',   `${form.revision_count} free`],
                  ['Maintenance', `${form.maintenance_count} requests`],
                  ['Valid for',   `${form.valid_days} days`],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-white/50">{l}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Proposal Preview ────────────────────────
function ProposalPreview({ form, lead }) {
  return (
    <div className="card max-w-3xl mx-auto">
      <div className="text-center border-b border-border pb-6 mb-6">
        <span className="font-syne font-800 text-2xl text-oxford">
          Tech<span className="text-rose">Ethix</span>
        </span>
        <h2 className="font-syne font-800 text-oxford text-2xl mt-4">{form.title}</h2>
        {lead && <p className="text-muted text-sm mt-1">Prepared for {lead.name} · {lead.business_name}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ['Total Price', `₹${Number(form.price).toLocaleString('en-IN')}`],
          ['Timeline',    `${form.timeline_days} working days`],
          ['Valid Until', `${form.valid_days} days from send`],
        ].map(([l, v]) => (
          <div key={l} className="bg-cream rounded-xl p-4 text-center">
            <div className="font-syne font-800 text-oxford text-xl">{v}</div>
            <div className="text-xs text-muted mt-1">{l}</div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="font-syne font-700 text-oxford mb-3">Scope of Work</h3>
        <pre className="text-sm text-oxford whitespace-pre-wrap font-sans leading-relaxed bg-cream rounded-xl p-4">
          {form.scope_of_work}
        </pre>
      </div>

      <div className="mb-6">
        <h3 className="font-syne font-700 text-oxford mb-3">What You Get</h3>
        <pre className="text-sm text-oxford whitespace-pre-wrap font-sans leading-relaxed">
          {form.deliverables}
        </pre>
      </div>

      {form.exclusions && (
        <div className="mb-6 bg-amber-50 rounded-xl p-4 border border-amber-100">
          <h3 className="font-syne font-700 text-amber-800 mb-2 text-sm">Not Included</h3>
          <p className="text-sm text-amber-700">{form.exclusions}</p>
        </div>
      )}

      <div className="border-t border-border pt-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs text-muted mb-1">Advance (35%)</p>
            <p className="font-syne font-800 text-oxford text-xl">
              ₹{Number(form.price * 0.35).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted mt-1">Before project starts</p>
          </div>
          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs text-muted mb-1">Midpoint (35%)</p>
            <p className="font-syne font-800 text-oxford text-xl">
              ₹{Number(form.price * 0.35).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted mt-1">At project midpoint</p>
          </div>
          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs text-muted mb-1">Final (30%)</p>
            <p className="font-syne font-800 text-oxford text-xl">
              ₹{Number(form.price * 0.30).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted mt-1">On final delivery</p>
          </div>
        </div>
        <div className="text-center space-y-3">
          <div className="flex gap-3 justify-center">
            <div className="btn-primary opacity-60 cursor-default">Accept Proposal →</div>
            <div className="btn-secondary opacity-60 cursor-default">Request Changes</div>
          </div>
          <p className="text-xs text-muted">Preview mode — buttons active on actual proposal page</p>
        </div>
      </div>
    </div>
  )
}
