// client/src/pages/admin/proposals/ProposalsList.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import { Plus, Send, Eye, Copy, ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'

const STATUS_STYLE = {
  draft:    'badge-gray',
  sent:     'badge-blue',
  viewed:   'badge-amber',
  accepted: 'badge-green',
  rejected: 'badge-red',
  expired:  'badge-gray',
}

export default function ProposalsList() {
  const [proposals, setProposals] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('')

  useEffect(() => {
    api.get('/proposals')
      .then(r => setProposals(r.data.data || []))
      .catch(() => toast.error('Failed to load proposals.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSend = async (id) => {
    try {
      await api.post(`/proposals/${id}/send`)
      setProposals(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'sent' } : p
      ))
      toast.success('Proposal sent!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed.')
    }
  }

  const copyLink = (token) => {
    const url = `${window.location.origin}/proposal/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  const filtered = filter
    ? proposals.filter(p => p.status === filter)
    : proposals

  // Summary counts
  const counts = proposals.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">

      <div className="page-header">
        <div>
          <h1 className="page-title">Proposals</h1>
          <p className="page-sub">{proposals.length} total proposals</p>
        </div>
        <Link to="/admin/proposals/new" className="btn-primary">
          <Plus size={16} /> New Proposal
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {['draft','sent','viewed','accepted','rejected','expired'].map(s => (
          <button key={s}
            onClick={() => setFilter(f => f === s ? '' : s)}
            className={clsx('card-sm text-left transition-all',
              filter === s && 'ring-2 ring-oxford'
            )}>
            <p className="font-syne font-800 text-2xl text-oxford">{counts[s] || 0}</p>
            <p className="text-xs text-muted capitalize mt-0.5">{s}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="font-syne font-700 text-oxford text-lg">No proposals yet</p>
            <p className="text-sm mt-1">Create a proposal from a lead's detail page.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Price</th>
                  <th>Timeline</th>
                  <th>Status</th>
                  <th>Valid Until</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium max-w-48 truncate">{p.title}</td>
                    <td>
                      <div>
                        <p className="text-sm">{p.lead_name || p.client_name}</p>
                        <p className="text-xs text-muted">{p.business_name}</p>
                      </div>
                    </td>
                    <td className="font-syne font-700 text-oxford">
                      ₹{Number(p.price).toLocaleString('en-IN')}
                    </td>
                    <td className="text-muted text-sm">{p.timeline_days} days</td>
                    <td>
                      <span className={`badge ${STATUS_STYLE[p.status] || 'badge-gray'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-sm text-muted">
                      {p.valid_until
                        ? new Date(p.valid_until).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {p.status === 'draft' && (
                          <button onClick={() => handleSend(p.id)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Send to client">
                            <Send size={14} />
                          </button>
                        )}
                        {['sent','viewed'].includes(p.status) && (
                          <button onClick={() => copyLink(p.unique_token)}
                            className="p-1.5 rounded-lg hover:bg-cream text-muted transition-colors"
                            title="Copy proposal link">
                            <Copy size={14} />
                          </button>
                        )}
                        <a href={`/proposal/${p.unique_token}`} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-cream text-muted transition-colors"
                          title="Preview proposal">
                          <Eye size={14} />
                        </a>
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
