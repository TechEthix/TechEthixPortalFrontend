// client/src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) {
      return toast.error('Please fill in all fields.')
    }
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      navigate(user.role === 'admin' ? '/admin' : '/portal', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-1/2 bg-oxford flex-col justify-between p-12 relative overflow-hidden">

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-rose/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="relative z-10">
          <span className="font-syne font-800 text-2xl text-white">
            Tech<span className="text-rose">Ethix</span>
          </span>
          <p className="text-white/40 text-sm mt-1">Client Management Portal</p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { val: '100%',  lbl: 'Transparency' },
            { val: '0',     lbl: 'Hidden charges' },
            { val: '7',     lbl: 'Avg days delivery' },
            { val: '24/7',  lbl: 'Portal access' },
          ].map(s => (
            <div key={s.lbl} className="bg-white/8 rounded-2xl p-5 border border-white/10">
              <div className="font-syne text-3xl font-800 text-white">{s.val}</div>
              <div className="text-white/40 text-xs mt-1 uppercase tracking-wide">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            "Every project tracked. Every milestone visible. Every rupee accounted for."
          </p>
          <p className="text-white/30 text-xs mt-3">— TechEthix</p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="font-syne font-800 text-2xl text-oxford">
              Tech<span className="text-rose">Ethix</span>
            </span>
          </div>

          <div className="card">
            <div className="mb-8">
              <h1 className="font-syne text-2xl font-800 text-oxford">Welcome back</h1>
              <p className="text-muted text-sm mt-1">Sign in to your portal account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="form-label">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="form-input pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    name="password"
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="form-input pl-10 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-oxford transition-colors"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in <ArrowRight size={16} />
                  </span>
                )}
              </button>

            </form>

            {/* Help text */}
            <p className="text-center text-xs text-muted mt-6">
              Don't have access?{' '}
              <a
                href="https://wa.me/916262326939"
                target="_blank"
                rel="noreferrer"
                className="text-oxford font-medium hover:text-rose transition-colors"
              >
                Contact TechEthix on WhatsApp
              </a>
            </p>
          </div>

          <p className="text-center text-xs text-muted/60 mt-6">
            © {new Date().getFullYear()} TechEthix · Indore, India
          </p>
        </div>
      </div>
    </div>
  )
}
