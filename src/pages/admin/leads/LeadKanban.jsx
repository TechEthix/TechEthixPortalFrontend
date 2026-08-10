// client/src/pages/admin/leads/LeadKanban.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import { Phone, ArrowUpRight, Plus } from 'lucide-react'
import clsx from 'clsx'

const COLUMNS = [
  { key: 'new',            label: 'New',            color: 'bg-blue-500' },
  { key: 'contacted',      label: 'Contacted',       color: 'bg-oxford' },
  { key: 'call_scheduled', label: 'Call Scheduled',  color: 'bg-amber-500' },
  { key: 'quoted',         label: 'Quoted',          color: 'bg-rose' },
  { key: 'negotiating',    label: 'Negotiating',     color: 'bg-purple-500' },
  { key: 'won',            label: 'Won ✓',           color: 'bg-green-500' },
  { key: 'lost',           label: 'Lost',            color: 'bg-red-400' },
]

export default function LeadKanban() {
  const [leads,   setLeads]   = useState([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  useEffect(() => {
    api.get('/leads?limit=200')
      .then(r => setLeads(r.data.data || []))
      .catch(() => toast.error('Failed to load leads.'))
      .finally(() => setLoading(false))
  }, [])

  const byStatus = status => leads.filter(l => l.status === status)

  const handleDragStart = (e, lead) => {
    setDragging(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    if (!dragging || dragging.status === newStatus) {
      setDragging(null); setDragOver(null); return
    }
    const oldStatus = dragging.status
    // Optimistic update
    setLeads(prev => prev.map(l =>
      l.id === dragging.id ? { ...l, status: newStatus } : l
    ))
    setDragging(null); setDragOver(null)
    try {
      await api.put(`/leads/${dragging.id}`, { status: newStatus })
      toast.success(`Moved to ${newStatus.replace(/_/g,' ')}`)
    } catch {
      // Revert
      setLeads(prev => prev.map(l =>
        l.id === dragging.id ? { ...l, status: oldStatus } : l
      ))
      toast.error('Failed to update status.')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lead Pipeline</h1>
          <p className="page-sub">Drag leads between stages to update status</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/leads" className="btn-secondary">Table View</Link>
          <Link to="/admin/leads" className="btn-primary">
            <Plus size={16} /> Add Lead
          </Link>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {COLUMNS.map(col => (
          <div key={col.key} className="flex items-center gap-2 bg-white border border-border
                                        rounded-xl px-3 py-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${col.color}`} />
            <span className="text-xs text-muted">{col.label}</span>
            <span className="font-syne font-700 text-oxford text-sm">
              {byStatus(col.key).length}
            </span>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-96">
        {COLUMNS.map(col => (
          <div
            key={col.key}
            className={clsx(
              'flex-shrink-0 w-64 bg-cream rounded-2xl p-3 transition-all',
              dragOver === col.key && 'ring-2 ring-oxford bg-oxford/5'
            )}
            onDragOver={e => { e.preventDefault(); setDragOver(col.key) }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, col.key)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <span className="font-syne font-700 text-oxford text-sm">{col.label}</span>
              </div>
              <span className="font-syne font-800 text-oxford text-lg">
                {byStatus(col.key).length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {byStatus(col.key).map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={e => handleDragStart(e, lead)}
                  className={clsx(
                    'bg-white border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing',
                    'hover:shadow-lg hover:-translate-y-0.5 transition-all',
                    dragging?.id === lead.id && 'opacity-40'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-oxford/8 flex items-center
                                      justify-center font-syne font-700 text-oxford text-xs flex-shrink-0">
                        {lead.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-oxford truncate">{lead.name}</p>
                        {lead.business_name && (
                          <p className="text-xs text-muted truncate">{lead.business_name}</p>
                        )}
                      </div>
                    </div>
                    <Link to={`/admin/leads/${lead.id}`}
                      className="text-muted hover:text-oxford transition-colors flex-shrink-0">
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted capitalize">
                      {lead.service_needed?.replace(/_/g,' ')}
                    </span>
                    <a href={`tel:${lead.phone}`}
                      className="text-muted hover:text-oxford transition-colors">
                      <Phone size={13} />
                    </a>
                  </div>

                  {lead.next_followup && (
                    <div className={clsx(
                      'mt-2 text-xs px-2 py-1 rounded-lg',
                      new Date(lead.next_followup) < new Date()
                        ? 'bg-red-50 text-red-500'
                        : 'bg-cream text-muted'
                    )}>
                      Follow-up: {new Date(lead.next_followup).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>
              ))}

              {byStatus(col.key).length === 0 && (
                <div className={clsx(
                  'border-2 border-dashed rounded-xl p-4 text-center text-xs text-muted',
                  dragOver === col.key ? 'border-oxford' : 'border-border'
                )}>
                  Drop leads here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
