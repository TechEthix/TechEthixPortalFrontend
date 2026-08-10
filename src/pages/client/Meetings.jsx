// client/src/pages/client/Meetings.jsx
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { Calendar, Video, Phone, MapPin, Clock, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

const TYPE_ICON  = { video: Video, call: Phone, in_person: MapPin }
const TYPE_LABEL = { video: 'Video Call', call: 'Phone Call', in_person: 'In Person' }
const STATUS_STYLE = { scheduled: 'badge-blue', completed: 'badge-green', cancelled: 'badge-red' }

export default function ClientMeetings() {
  const [meetings,  setMeetings]  = useState([])
  const [projectId, setProjectId] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    api.get('/client/my-project')
      .then(r => {
        if (!r.data.data) return
        setProjectId(r.data.data.id)
        return api.get(`/meetings/project/${r.data.data.id}`)
      })
      .then(r => r && setMeetings(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) : '—'

  const formatTime = (t) => {
    if (!t) return '—'
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  const upcoming = meetings.filter(m =>
    m.status === 'scheduled' &&
    new Date(`${m.meeting_date}T${m.meeting_time}`) >= new Date()
  )
  const past = meetings.filter(m =>
    m.status !== 'scheduled' ||
    new Date(`${m.meeting_date}T${m.meeting_time}`) < new Date()
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Meetings</h1>
        <p className="page-sub">Scheduled calls and sessions with TechEthix</p>
      </div>

      {/* Next meeting highlight */}
      {upcoming.length > 0 && (() => {
        const next = upcoming[0]
        const Icon = TYPE_ICON[next.type] || Video
        return (
          <div className="card bg-oxford border-0">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-3">Next Meeting</p>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl flex-shrink-0">
                <Icon size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-syne font-700 text-white text-lg">{next.title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-white/60 mt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} /> {formatDate(next.meeting_date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} /> {formatTime(next.meeting_time)} IST · {next.duration_mins} min
                  </span>
                </div>
                {next.description && (
                  <p className="text-white/50 text-sm mt-2">{next.description}</p>
                )}
              </div>
            </div>
            {next.link && (
              <div className="mt-4 pt-4 border-t border-white/10">
                {next.type === 'video' ? (
                  <a href={next.link} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-oxford px-5 py-2.5
                               rounded-xl text-sm font-medium hover:bg-cream transition-colors">
                    <Video size={15} /> Join Meeting
                  </a>
                ) : next.type === 'call' ? (
                  <p className="text-white/70 text-sm">
                    We will call you at: <strong className="text-white">{next.link}</strong>
                  </p>
                ) : (
                  <p className="text-white/70 text-sm">
                    Location: <strong className="text-white">{next.location || next.link}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* No meetings */}
      {meetings.length === 0 && (
        <div className="card text-center py-16">
          <Calendar size={36} className="text-muted/30 mx-auto mb-3" />
          <p className="font-syne font-700 text-oxford">No meetings scheduled</p>
          <p className="text-muted text-sm mt-1">
            TechEthix will schedule meetings as your project progresses.
          </p>
        </div>
      )}

      {/* Upcoming meetings */}
      {upcoming.length > 1 && (
        <div className="card">
          <h3 className="font-syne font-700 text-oxford mb-4">Upcoming</h3>
          <div className="space-y-3">
            {upcoming.slice(1).map(m => (
              <MeetingRow key={m.id} meeting={m} formatDate={formatDate} formatTime={formatTime} />
            ))}
          </div>
        </div>
      )}

      {/* Past meetings */}
      {past.length > 0 && (
        <div className="card">
          <h3 className="font-syne font-700 text-oxford mb-4">Past Meetings</h3>
          <div className="space-y-3">
            {past.map(m => (
              <MeetingRow key={m.id} meeting={m} formatDate={formatDate} formatTime={formatTime} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MeetingRow({ meeting: m, formatDate, formatTime }) {
  const Icon = TYPE_ICON[m.type] || Video
  return (
    <div className={clsx(
      'flex items-center gap-3 p-3 rounded-xl border border-border',
      m.status === 'cancelled' && 'opacity-60'
    )}>
      <div className="p-2 bg-cream rounded-lg flex-shrink-0">
        <Icon size={16} className="text-oxford" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-oxford">{m.title}</p>
        <p className="text-xs text-muted mt-0.5">
          {formatDate(m.meeting_date)} · {formatTime(m.meeting_time)} · {m.duration_mins} min
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {m.link && m.type === 'video' && m.status === 'scheduled' && (
          <a href={m.link} target="_blank" rel="noreferrer"
            className="text-xs text-oxford font-medium hover:text-rose underline">
            Join
          </a>
        )}
        <span className={`badge text-xs ${STATUS_STYLE[m.status] || 'badge-gray'}`}>
          {m.status}
        </span>
      </div>
    </div>
  )
}
