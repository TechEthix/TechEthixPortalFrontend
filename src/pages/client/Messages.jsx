// client/src/pages/client/Messages.jsx
import { useEffect, useState, useRef } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Send, MessageSquare } from 'lucide-react'
import clsx from 'clsx'

export default function ClientMessages() {
  const { user }    = useAuth()
  const [messages,  setMessages]  = useState([])
  const [projectId, setProjectId] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [text,      setText]      = useState('')
  const [sending,   setSending]   = useState(false)
  const bottomRef = useRef(null)

  const fetchMessages = async () => {
    try {
      const { data } = await api.get('/messages/my')
      setMessages(data.data || [])
      setProjectId(data.project_id)
    } catch {
      toast.error('Failed to load messages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async e => {
    e.preventDefault()
    if (!text.trim() || !projectId) return
    setSending(true)
    try {
      await api.post('/messages', { project_id: projectId, message: text.trim() })
      setText('')
      fetchMessages()
    } catch {
      toast.error('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col max-w-3xl" style={{ height: 'calc(100vh - 140px)' }}>

      <div className="mb-4">
        <h1 className="page-title">Messages</h1>
        <p className="page-sub">Direct communication with TechEthix</p>
      </div>

      {!projectId ? (
        <div className="card text-center py-16 flex-1">
          <MessageSquare size={36} className="text-muted/30 mx-auto mb-3" />
          <p className="font-syne font-700 text-oxford">No active project</p>
          <p className="text-muted text-sm mt-1">Messages become available after your project starts.</p>
        </div>
      ) : (
        <div className="card flex-1 flex flex-col p-0 overflow-hidden">

          {/* Notice */}
          <div className="px-4 py-3 bg-cream border-b border-border text-xs text-muted text-center">
            This is your formal project communication with TechEthix. All messages are logged.
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm">
                No messages yet. Start the conversation below.
              </div>
            ) : (
              messages.map(m => {
                const isMe = m.sender_id === user.id
                return (
                  <div key={m.id}
                    className={clsx('flex gap-2', isMe ? 'justify-end' : 'justify-start')}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-oxford flex items-center justify-center
                                      text-white text-xs font-syne font-700 flex-shrink-0 mt-0.5">
                        T
                      </div>
                    )}
                    <div className={clsx(
                      'max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5',
                      isMe
                        ? 'bg-oxford text-white rounded-br-sm'
                        : 'bg-cream text-oxford rounded-bl-sm border border-border'
                    )}>
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
                      <div className="w-7 h-7 rounded-full bg-rose flex items-center justify-center
                                      text-white text-xs font-syne font-700 flex-shrink-0 mt-0.5">
                        {user.name?.charAt(0)}
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
              placeholder="Type your message..."
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
