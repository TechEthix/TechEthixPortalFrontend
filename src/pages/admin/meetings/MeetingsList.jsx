// client/src/pages/admin/meetings/MeetingsList.jsx
import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import {
  Calendar, Plus, Video, Phone, MapPin,
  Clock, CheckCircle, X, Edit2, Trash2
} from 'lucide-react'
import clsx from 'clsx'

const TYPE_ICON = { video: Video, call: Phone, in_person: MapPin }
const TYPE_LABEL = { video: 'Video Call', call: 'Phone Call', in_person: 'In Person' }

const STATUS_STYLE = {
  scheduled:  'badge-blue',
  completed:  'badge-green',
  cancelled:  'badge-red',
}

export default function MeetingsList() {
  const [meetings,  setMeetings]  = useState([])
  const [projects,  setProjects]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [filter,    setFilter]    = useState('upcoming')

  const emptyForm = {
    project_id: '', title: '', description: '',
    meeting_date: '', meeting_time: '10:00',
    duration_mins: 30, type: 'video',
    link: '', location: ''
  }
  const [form, setForm] = useState(emptyForm)

  const fetchMeetings = () => {
    const params = filter === 'upcoming' ? '?upcoming=true' : filter !== 'all' ? `?status=${filter}` : ''
    api.get(`/meetings${params}`)
      .then(r => setMeetings(r.data.data || []))
      .catch(() => toast.error('Failed to load meetings.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMeetings() }, [filter])

  useEffect(() => {
    api.get('/projects?limit=100')
      .then(r => setProjects(r.data.data || []))
      .catch(() => {})
  }, [])

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.project_id || !form.title || !form.meeting_date || !form.meeting_time) {
      return toast.error('Project, title, date and time are required.')
    }
    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/meetings/${editingId}`, form)
        toast.success('Meeting updated.')
      } else {
        await api.post('/meetings', form)
        toast.success('Meeting scheduled. Client notified.')
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      fetchMeetings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (meeting) => {
    setForm({
      project_id:   meeting.project_id,
      title:        meeting.title,
      description:  meeting.description || '',
      meeting_date: meeting.meeting_date?.split('T')[0] || '',
      meeting_time: meeting.meeting_time?.substring(0, 5) || '10:00',
      duration_mins: meeting.duration_mins,
      type:         meeting.type,
      link:         meeting.link || '',
      location:     meeting.location || ''
    })
    setEditingId(meeting.id)
    setShowForm(true)
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/meetings/${id}`, { status })
      toast.success(`Meeting marked as ${status}.`)
      fetchMeetings()
    } catch { toast.error('Update failed.') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this meeting?')) return
    try {
      await api.delete(`/meetings/${id}`)
      toast.success('Meeting deleted.')
      fetchMeetings()
    } catch { toast.error('Delete failed.') }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  }) : '—'

  const formatTime = (t) => {
    if (!t) return '—'
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  return (
    <div className="space-y-6">

      <div className="page-header">
        <div>
          <h1 className="page-title">Meetings</h1>
          <p className="page-sub">{meetings.length} {filter === 'upcoming' ? 'upcoming' : ''} meetings</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
          className="btn-primary">
          <Plus size={15} /> Schedule Meeting
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'upcoming',  label: 'Upcoming' },
          { key: 'all',       label: 'All' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map(f => (
          <button key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              filter === f.key
                ? 'bg-oxford text-white border-oxford'
                : 'bg-white text-muted border-border hover:border-oxford/30'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Schedule / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-syne font-700 text-oxford text-lg">
                {editingId ? 'Edit Meeting' : 'Schedule Meeting'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                className="text-muted hover:text-oxford">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Project *</label>
                <select className="form-select" value={form.project_id}
                  onChange={e => f('project_id', e.target.value)} required>
                  <option value="">Select project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title} — {p.client_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Meeting Title *</label>
                <input className="form-input" value={form.title}
                  onChange={e => f('title', e.target.value)}
                  placeholder="e.g. Project Kickoff Call" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={form.meeting_date}
                    onChange={e => f('meeting_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div>
                  <label className="form-label">Time *</label>
                  <input type="time" className="form-input" value={form.meeting_time}
                    onChange={e => f('meeting_time', e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Duration (minutes)</label>
                  <select className="form-select" value={form.duration_mins}
                    onChange={e => f('duration_mins', parseInt(e.target.value))}>
                    {[15, 30, 45, 60, 90, 120].map(d => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type}
                    onChange={e => f('type', e.target.value)}>
                    <option value="video">Video Call</option>
                    <option value="call">Phone Call</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
              </div>
              {form.type === 'video' && (
                <div>
                  <label className="form-label">Meeting Link (Google Meet / Zoom)</label>
                  <input className="form-input" value={form.link}
                    onChange={e => f('link', e.target.value)}
                    placeholder="https://meet.google.com/..." />
                </div>
              )}
              {form.type === 'in_person' && (
                <div>
                  <label className="form-label">Location</label>
                  <input className="form-input" value={form.location}
                    onChange={e => f('location', e.target.value)}
                    placeholder="TechEthix Office, Indore" />
                </div>
              )}
              {form.type === 'call' && (
                <div>
                  <label className="form-label">Phone / WhatsApp Number</label>
                  <input className="form-input" value={form.link}
                    onChange={e => f('link', e.target.value)}
                    placeholder="+91 62623 26939" />
                </div>
              )}
              <div>
                <label className="form-label">Description (optional)</label>
                <textarea className="form-textarea" rows={2} value={form.description}
                  onChange={e => f('description', e.target.value)}
                  placeholder="Agenda or notes for the client..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving...' : editingId ? 'Update Meeting' : 'Schedule & Notify Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meetings list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar size={36} className="text-muted/30 mx-auto mb-3" />
          <p className="font-syne font-700 text-oxford">No meetings</p>
          <p className="text-muted text-sm mt-1">Schedule a meeting to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map(m => {
            const Icon = TYPE_ICON[m.type] || Video
            const isPast = new Date(`${m.meeting_date}T${m.meeting_time}`) < new Date()
            return (
              <div key={m.id} className={clsx(
                'card flex items-center gap-4',
                m.status === 'cancelled' && 'opacity-60'
              )}>
                <div className={clsx(
                  'p-3 rounded-xl flex-shrink-0',
                  m.status === 'completed' ? 'bg-green-50' :
                  m.status === 'cancelled' ? 'bg-gray-100'  : 'bg-oxford/8'
                )}>
                  <Icon size={20} className={
                    m.status === 'completed' ? 'text-green-600' :
                    m.status === 'cancelled' ? 'text-gray-400'  : 'text-oxford'
                  } />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-oxford">{m.title}</p>
                    <span className={`badge text-xs ${STATUS_STYLE[m.status] || 'badge-gray'}`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(m.meeting_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {formatTime(m.meeting_time)} · {m.duration_mins} min
                    </span>
                    <span>{TYPE_LABEL[m.type]}</span>
                    {m.project_title && <span className="text-oxford font-medium">{m.project_title}</span>}
                  </div>
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noreferrer"
                      className="text-xs text-oxford hover:text-rose underline mt-0.5 inline-block">
                      {m.type === 'video' ? 'Join link' : m.link}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {m.status === 'scheduled' && (
                    <>
                      <button onClick={() => handleEdit(m)}
                        className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-oxford transition-colors">
                        <Edit2 size={15} />
                      </button>
                      {isPast && (
                        <button onClick={() => handleStatusUpdate(m.id, 'completed')}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-muted hover:text-green-600 transition-colors"
                          title="Mark completed">
                          <CheckCircle size={15} />
                        </button>
                      )}
                      <button onClick={() => handleStatusUpdate(m.id, 'cancelled')}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                        title="Cancel">
                        <X size={15} />
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
