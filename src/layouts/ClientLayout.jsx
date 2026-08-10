// client/src/layouts/ClientLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'
import {
  LayoutDashboard, FolderKanban, CreditCard,
  MessageSquare, Files, Wrench, LogOut, Bell, FileText, Receipt, Calendar
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { label: 'Dashboard',   icon: LayoutDashboard, to: '/portal' },
  { label: 'My Project',  icon: FolderKanban,    to: '/portal/project' },
  { label: 'Payments',    icon: CreditCard,       to: '/portal/payments' },
  { label: 'Files',       icon: Files,            to: '/portal/files' },
  { label: 'Messages',    icon: MessageSquare,    to: '/portal/messages' },
  { label: 'Maintenance', icon: Wrench,           to: '/portal/maintenance' },
  { label: 'Agreement',   icon: FileText,        to: '/portal/agreement' },
  { label: 'Invoices',    icon: Receipt,        to: '/portal/invoices' },
  { label: 'Meetings',    icon: Calendar,       to: '/portal/meetings' },
]

export default function ClientLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-cream overflow-hidden">

      {/* Sidebar */}
      <div className="hidden lg:block w-56 flex-shrink-0 bg-oxford">
        <div className="h-full flex flex-col">

          <div className="px-5 py-6 border-b border-white/10">
            <span className="font-syne font-800 text-xl text-white">
              Tech<span className="text-rose">Ethix</span>
            </span>
            <p className="text-white/30 text-xs mt-0.5">Client Portal</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/portal'}
                className={({ isActive }) =>
                  clsx('sidebar-link', isActive && 'active')
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-rose flex items-center justify-center
                              text-white text-xs font-700 font-syne flex-shrink-0">
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-white/40 text-xs">Client</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="sidebar-link w-full text-red-400 hover:text-red-300"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-oxford border-t border-white/10 z-50 flex">
        {navItems.slice(0, 5).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/portal'}
            className={({ isActive }) =>
              clsx('flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                isActive ? 'text-white' : 'text-white/40'
              )
            }
          >
            <item.icon size={18} />
            <span>{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-sm text-muted">Welcome back,</p>
            <p className="font-syne font-700 text-oxford">{user?.name}</p>
          </div>
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
