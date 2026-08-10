// client/src/components/NotificationBell.jsx
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Bell, CheckCheck } from 'lucide-react'
import clsx from 'clsx'

const TYPE_ICON = {
  new_lead:             '👤',
  proposal_accepted:    '✅',
  payment_received:     '💰',
  milestone_complete:   '🏁',
  milestone_approved:   '👍',
  revision_submitted:   '🔄',
  revision_response:    '💬',
  project_delivered:    '🚀',
  maintenance_request:  '🔧',
  maintenance_done:     '✓',
  maintenance_exhausted:'⚠️',
  techcare_activated:   '🛡️',
  default:              '🔔',
}

export default function NotificationBell() {
  const navigate              = useNavigate()
  const [open,         setOpen]        = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount,  setUnreadCount] = useState(0)
  const [loading,      setLoading]     = useState(false)
  const dropRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchCount = () => {
    api.get('/notifications?unread_only=true&limit=1')
      .then(r => setUnreadCount(r.data.unread_count || 0))
      .catch(() => {})
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications?limit=15')
      setNotifications(data.data || [])
      setUnreadCount(data.unread_count || 0)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setOpen(p => !p)
    if (!open) fetchNotifications()
  }

  const handleClick = async (notif) => {
    // Mark as read
    if (!notif.is_read) {
      await api.put(`/notifications/${notif.id}/read`).catch(() => {})
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(p => Math.max(0, p - 1))
    }
    setOpen(false)
    if (notif.link) navigate(notif.link)
  }

  const handleMarkAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-cream transition-colors"
      >
        <Bell size={18} className="text-oxford" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose text-white
                           text-[10px] font-700 rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border
                        rounded-2xl shadow-lg z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h4 className="font-syne font-700 text-oxford text-sm">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-rose text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-muted hover:text-oxford transition-colors"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <div className="w-5 h-5 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell size={24} className="text-muted/30 mx-auto mb-2" />
                <p className="text-muted text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={clsx(
                    'w-full flex items-start gap-3 px-4 py-3 hover:bg-cream transition-colors text-left',
                    'border-b border-border last:border-0',
                    !n.is_read && 'bg-blue-50/40'
                  )}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] || TYPE_ICON.default}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      'text-sm leading-snug',
                      n.is_read ? 'text-oxford font-400' : 'text-oxford font-500'
                    )}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-xs text-muted/60 mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-rose flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN')
}
