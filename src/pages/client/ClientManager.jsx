// client/src/pages/admin/clients/ClientManager.jsx
// ============================================================
// NEW FILE — complete new page, no existing file to patch
// Add route in App.jsx:
//   import ClientManager from './pages/admin/clients/ClientManager'
//   <Route path="clients" element={<ClientManager />} />
// Add to AdminLayout navItems:
//   { label: 'Clients', icon: Users, to: '/admin/clients' }
// ============================================================

import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import {
  Users, Plus, Edit2, Trash2, RefreshCw,
  Key, X, Save, FolderKanban
} from 'lucide-react'
import clsx from 'clsx'

export default function ClientManager() {
  const [clients,   setClients]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [newCreds,  setNewCreds]  = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  const fetchClients = () => {
    api.get('/clients')
      .then(r => setClients(r.data.data || []))
      .catch(() => toast.error('Failed to load clients.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchClients() }, [])

  const openCreate = () => {
    setForm({ name: '', email: '', phone: '' })
    setEditingId(null)
    setNewCreds(null)
    setShowForm(true)
  }

  const openEdit = (client) => {
    setForm({ name: client.name, email: client.email, phone: client.phone || '' })
    setEditingId(client.id)
    setNewCreds(null)
    setShowForm(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, form)
        toast.success('Client updated.')
        setShowForm(false)
      } else {
        const { data } = await api.post('/clients', form)
        setNewCreds({
          email:    form.email,
          password: data.temp_password
        })
        toast.success('Client created.')
        setShowForm(false)
      }
      fetchClients()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async (id, name) => {
    if (!confirm(`Reset password for ${name}?`)) return
    try {
      const { data } = await api.post(`/clients/${id}/reset-password`)
      setNewCreds({ email: data.client_email, password: data.temp_password })
      toast.success('Password reset.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/clients/${id}`)
      toast.success('Client deleted.')
      fetchClients()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    }
  }

  return (
    <div className="space-y-6">

      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-sub">{clients.length} registered clients</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* New credentials banner */}
      {newCreds && (
        <div className="card border-2 border-green-300 bg-green-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-syne font-700 text-oxford mb-2">
                Client credentials — share these securely
              </p>
              <p className="text-sm text-muted">Email: <strong className="text-oxford">{newCreds.email}</strong></p>
              <p className="text-sm text-muted">Password: <strong className="text-oxford font-mono">{newCreds.password}</strong></p>
              <p className="text-xs text-muted mt-2">
                Client should change password on first login.
              </p>
            </div>
            <button onClick={() => setNewCreds(null)} className="text-muted hover:text-oxford">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-syne font-700 text-oxford text-lg">
                {editingId ? 'Edit Client' : 'Add Client'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-oxford">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Client's full name" required />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="client@example.com" required />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210" />
              </div>
              {!editingId && (
                <p className="text-xs text-muted bg-cream rounded-lg p-3">
                  A temporary password will be generated automatically.
                  You will see it after creating the client.
                </p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving}
                  className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <Users size={36} className="text-muted/30 mx-auto mb-3" />
            <p className="font-syne font-700 text-oxford">No clients yet</p>
            <p className="text-muted text-sm mt-1">
              Clients are created automatically when a proposal is accepted,
              or you can add them manually above.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Projects</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td className="font-medium text-oxford">{c.name}</td>
                    <td className="text-muted">{c.email}</td>
                    <td className="text-muted">{c.phone || '—'}</td>
                    <td>
                      <span className="flex items-center gap-1 text-sm">
                        <FolderKanban size={13} className="text-muted" />
                        {c.project_count || 0}
                      </span>
                    </td>
                    <td className="text-muted text-xs">
                      {new Date(c.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-oxford transition-colors"
                          title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleResetPassword(c.id, c.name)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-muted hover:text-amber-600 transition-colors"
                          title="Reset password">
                          <Key size={14} />
                        </button>
                        <button onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                          title="Delete">
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
