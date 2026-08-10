// client/src/layouts/AdminLayout.jsx
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'
import {
  LayoutDashboard, Users, FileText, FolderKanban,
  CreditCard, Wrench, Bell, LogOut, Menu, X,
  ChevronDown, Settings, MessageSquare, Calendar
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { label: 'Dashboard',  icon: LayoutDashboard, to: '/admin' },
  { label: 'Leads',      icon: Users,            to: '/admin/leads',
    children: [
      { label: 'All Leads', to: '/admin/leads' },
      { label: 'Pipeline',  to: '/admin/leads/kanban' },
    ]
  },
  { label: 'Projects',   icon: FolderKanban,     to: '/admin/projects' },
  { label: 'Proposals',  icon: FileText,          to: '/admin/proposals' },
  { label: 'Payments',   icon: CreditCard,        to: '/admin/payments' },
  { label: 'Maintenance', icon: Wrench,            to: '/admin/maintenance' },
  { label: 'Payments',   icon: CreditCard,        to: '/admin/payments' },
  { label: 'Invoices',   icon: FileText,            to: '/admin/invoices' },
  { label: 'Meetings',   icon: Calendar,            to: '/admin/meetings' },
  { label: 'Messages',   icon: MessageSquare,      to: '/admin/messages' },
  { label: 'Settings',   icon: Settings,          to: '/admin/settings' },
]

function NavItem({ item }) {
  const [open, setOpen] = useState(false)

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(p => !p)}
          className="sidebar-link w-full justify-between"
        >
          <span className="flex items-center gap-3">
            <item.icon size={18} />
            {item.label}
          </span>
          <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="ml-7 mt-1 space-y-0.5">
            {item.children.map(child => (
              <NavLink
                key={child.to}
                to={child.to}
                end
                className={({ isActive }) =>
                  clsx('block px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    isActive ? 'text-white bg-white/15' : 'text-white/50 hover:text-white'
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin'}
      className={({ isActive }) =>
        clsx('sidebar-link', isActive && 'active')
      }
    >
      <item.icon size={18} />
      {item.label}
    </NavLink>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const Sidebar = () => (
    <div className="h-full bg-oxford flex flex-col">

      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <span className="font-syne font-800 text-xl text-white">
          Tech<span className="text-rose">Ethix</span>
        </span>
        <p className="text-white/30 text-xs mt-0.5">Admin Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-rose flex items-center justify-center
                          text-white text-xs font-700 font-syne flex-shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-white/40 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-cream overflow-hidden">

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-60 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 flex-shrink-0">
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button
            className="lg:hidden text-oxford"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl hover:bg-cream transition-colors">
              <Bell size={18} className="text-oxford" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose rounded-full" />
            </button>

            {/* User chip */}
            <div className="flex items-center gap-2 bg-cream px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-oxford flex items-center justify-center
                              text-white text-xs font-700 font-syne">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-sm font-medium text-oxford hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
