// client/src/pages/public/LeadForm.jsx
import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Send, CheckCircle } from 'lucide-react'

const SERVICES = [
  { value: 'website',       label: 'Business Website' },
  { value: 'landing_page',  label: 'Landing Page' },
  { value: 'bundle',        label: 'Website + WhatsApp Bot Bundle' },
  { value: 'ecommerce',     label: 'E-Commerce Website' },
  { value: 'whatsapp_bot',  label: 'WhatsApp Automation Bot' },
  { value: 'seo',           label: 'SEO & Google Presence' },
  { value: 'design',        label: 'Graphic Design / Branding' },
  { value: 'other',         label: 'Something else' },
]

const BUDGETS = [
  { value: 'under_5k',  label: 'Under ₹5,000' },
  { value: '5k_10k',    label: '₹5,000 – ₹10,000' },
  { value: '10k_20k',   label: '₹10,000 – ₹20,000' },
  { value: '20k_plus',  label: '₹20,000+' },
  { value: 'not_sure',  label: 'Not sure yet' },
]

const TIMELINES = [
  { value: 'asap',        label: 'As soon as possible' },
  { value: '1_month',     label: 'Within 1 month' },
  { value: '1_3_months',  label: '1–3 months' },
  { value: 'flexible',    label: 'Flexible' },
]

export default function LeadForm() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', business_name: '',
    business_type: '', service_needed: 'website',
    budget_range: 'not_sure', timeline: 'flexible', message: ''
  })
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      return toast.error('Name and phone number are required.')
    }
    setLoading(true)
    try {
      await api.post('/leads', { ...form, source: 'website' })
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Try WhatsApp instead.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="card max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="font-syne font-800 text-oxford text-2xl mb-2">We got your inquiry!</h2>
        <p className="text-muted text-sm mb-6">
          We'll reach out within 2 hours on WhatsApp. In the meantime, feel free to message us directly.
        </p>
        <a
          href="https://wa.me/916262326939?text=Hi, I just filled the inquiry form on TechEthix"
          target="_blank"
          rel="noreferrer"
          className="btn-primary w-full justify-center py-3"
        >
          Chat on WhatsApp
        </a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="font-syne font-800 text-2xl text-oxford">
            Tech<span className="text-rose">Ethix</span>
          </span>
          <h1 className="font-syne font-800 text-3xl text-oxford mt-4 mb-2">
            Tell us about your project
          </h1>
          <p className="text-muted text-sm">
            Free consultation. No commitment. We reply within 2 hours.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Your name *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  className="form-input" placeholder="Rahul Sharma" required />
              </div>
              <div>
                <label className="form-label">WhatsApp number *</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="form-input" placeholder="+91 98765 43210" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="form-input" placeholder="rahul@yourbusiness.com" />
            </div>

            {/* Business */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Business name</label>
                <input name="business_name" value={form.business_name} onChange={handleChange}
                  className="form-input" placeholder="Sharma Traders" />
              </div>
              <div>
                <label className="form-label">Type of business</label>
                <input name="business_type" value={form.business_type} onChange={handleChange}
                  className="form-input" placeholder="Restaurant / Clinic / Retail..." />
              </div>
            </div>

            {/* Service */}
            <div>
              <label className="form-label">What do you need? *</label>
              <select name="service_needed" value={form.service_needed}
                onChange={handleChange} className="form-select">
                {SERVICES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Budget + Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Budget range</label>
                <select name="budget_range" value={form.budget_range}
                  onChange={handleChange} className="form-select">
                  {BUDGETS.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Timeline</label>
                <select name="timeline" value={form.timeline}
                  onChange={handleChange} className="form-select">
                  {TIMELINES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="form-label">Anything else we should know?</label>
              <textarea name="message" value={form.message} onChange={handleChange}
                className="form-textarea" rows={4}
                placeholder="Tell us more about your business, goals, or any specific requirements..." />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send Inquiry <Send size={16} />
                </span>
              )}
            </button>

            <p className="text-center text-xs text-muted">
              Or message us directly on{' '}
              <a href="https://wa.me/916262326939" target="_blank" rel="noreferrer"
                className="text-oxford font-medium hover:text-rose transition-colors">
                WhatsApp
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
