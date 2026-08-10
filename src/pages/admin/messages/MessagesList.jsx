// client/src/pages/admin/messages/MessagesList.jsx
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../../api/axios'
import { useAuth } from '../../../context/AuthContext'
import toast from 'react-hot-toast'
import { Send, MessageSquare } from 'lucide-react'
import clsx from 'clsx'

export default function AdminMessages() {
  const { user }          = useAuth()
  const [searchParams]    = useSearchParams()
  const [projects,  setProjects]  = useState([])
  const [active,    setActive]    = useState(null)
  const [messages,  setMessages]  = useState([])
  const [text,      setText]      = useState('')
  const [sending,   setSending]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const bottomRef = useRef(null)

  // Load all projects for sidebar
  useEffect(() => {
    api.get('/projects?limit=50')
      .then(r => {
        const projs = r.data.data || []
        setProjects(projs)
        const fromUrl = searchParams.get('project_id')
        const first   = fromUrl ? projs.find(p => p.id === parseInt(fromUrl)) : projs[0]
        if (first) setActive(first)
      })
      .catch(() => toast.error('Failed to load projects.'))
      .finally(() => setLoading(false))
  }, [])

  // Load messages when active project changes
  useEffect(() => {
    if (!active) return
    api.get(`/messages/project/${active.id}`)
      .then(r => setMessages(r.data.data || []))
      .catch(() => {})

    const interval = setInterval(() => {
      api.get(`/messages/project/${active.id}`)
        .then(r => setMessages(r.data.data || []))
        .catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [active])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async e => {
    e.preventDefault()
    if (!text.trim() || !active) return
    setSending(true)
    try {
      await api.post('/messages', { project_id: active.id, message: text.trim() })
      setText('')
      const { data } = await api.get(`/messages/project/${active.id}`)
      setMessages(data.data || [])
    } catch {
      toast.error('Failed to send.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 120px)' }}>

      {/* Project sidebar */}
      <div className="w-64 flex-shrink-0 card p-0 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-syne font-700 text-oxford text-sm">Projects</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">No projects yet</p>
          ) : (
            projects.map(p => (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className={clsx(
                  'w-full text-left px-4 py-3 border-b border-border transition-colors',
                  active?.id === p.id
                    ? 'bg-oxford text-white'
                    : 'hover:bg-cream text-oxford'
                )}
              >
                <p className={clsx('text-sm font-medium truncate',
                  active?.id === p.id ? 'text-white' : 'text-oxford'
                )}>
                  {p.title}
                </p>
                <p className={clsx('text-xs mt-0.5 truncate',
                  active?.id === p.id ? 'text-white/50' : 'text-muted'
                )}>
                  {p.client_name}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat panel */}
      {!active ? (
        <div className="flex-1 card flex items-center justify-center">
          <div className="text-center">
            <MessageSquare size={36} className="text-muted/30 mx-auto mb-3" />
            <p className="font-syne font-700 text-oxford">Select a project</p>
            <p className="text-muted text-sm mt-1">Choose a project to view messages</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 card p-0 overflow-hidden flex flex-col">

          {/* Header */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-white">
            <div>
              <p className="font-syne font-700 text-oxford text-sm">{active.title}</p>
              <p className="text-xs text-muted">{active.client_name}</p>
            </div>
            <span className={clsx('badge text-xs',
              active.status === 'active' ? 'badge-blue' : 'badge-gray'
            )}>
              {active.status?.replace(/_/g,' ')}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream/20">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm">
                No messages yet. Start the conversation.
              </div>
            ) : (
              messages.map(m => {
                const isMe = m.sender_role === 'admin'
                return (
                  <div key={m.id}
                    className={clsx('flex gap-2', isMe ? 'justify-end' : 'justify-start')}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-rose flex items-center justify-center
                                      text-white text-xs font-syne font-700 flex-shrink-0 mt-0.5">
                        {m.sender_name?.charAt(0)}
                      </div>
                    )}
                    <div className={clsx(
                      'max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5',
                      isMe
                        ? 'bg-oxford text-white rounded-br-sm'
                        : 'bg-white text-oxford rounded-bl-sm border border-border shadow-card'
                    )}>
                      {!isMe && (
                        <p className="text-xs font-medium text-rose mb-1">{m.sender_name}</p>
                      )}
                      <p className="text-sm leading-relaxed">{m.message}</p>
                      <p className={clsx('text-xs mt-1',
                        isMe ? 'text-white/50' : 'text-muted'
                      )}>
                        {new Date(m.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                        {' · '}
                        {new Date(m.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short'
                        })}
                      </p>
                    </div>
                    {isMe && (
                      <div className="w-7 h-7 rounded-full bg-oxford flex items-center justify-center
                                      text-white text-xs font-syne font-700 flex-shrink-0 mt-0.5">
                        S
                      </div>
                    )}
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend}
            className="border-t border-border p-3 flex gap-2 bg-white">
            <input
              className="form-input flex-1"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Message ${active.client_name}...`}
              disabled={sending}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="btn-primary px-4 py-2.5 flex-shrink-0"
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={16} />
              }
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
