// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Public
import Login          from './pages/Login'
import LeadForm       from './pages/public/LeadForm'
import ProposalView   from './pages/public/ProposalView'

// Admin
import AdminLayout      from './layouts/AdminLayout'
import AdminDashboard   from './pages/admin/Dashboard'
import LeadsList        from './pages/admin/leads/LeadsList'
import LeadDetail       from './pages/admin/leads/LeadDetail'
import LeadKanban       from './pages/admin/leads/LeadKanban'
import ProposalsList    from './pages/admin/proposals/ProposalsList'
import ProposalBuilder  from './pages/admin/proposals/ProposalBuilder'
import ProjectsList     from './pages/admin/projects/ProjectsList'
import ProjectDetail    from './pages/admin/projects/ProjectDetail'
import PaymentsList     from './pages/admin/payments/PaymentsList'
import MaintenanceList  from './pages/admin/maintenance/MaintenanceList'
import AdminMessages    from './pages/admin/messages/MessagesList'
import ClientManager    from './pages/admin/clients/ClientManager'
import AdminMeetings     from './pages/admin/meetings/MeetingsList'
import InvoiceList     from './pages/admin/invoices/InvoiceList'

// Client
import ClientLayout      from './layouts/ClientLayout'
import ClientDashboard   from './pages/client/Dashboard'
import ClientProjectView from './pages/client/ProjectView'
import ClientPayments    from './pages/client/Payments'
import ClientMaintenance from './pages/client/Maintenance'
import ClientFiles       from './pages/client/Files'
import ClientMessages    from './pages/client/Messages'
import ClientAgreement   from './pages/client/Agreement'
import ClientInvoices    from './pages/client/Invoices'
import ClientMeetings    from './pages/client/Meetings'

const RootRedirect = () => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user)   return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/portal'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"                element={<RootRedirect />} />
      <Route path="/login"           element={<Login />} />
      <Route path="/inquiry"         element={<LeadForm />} />
      <Route path="/proposal/:token" element={<ProposalView />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index                  element={<AdminDashboard />} />
        <Route path="leads"           element={<LeadsList />} />
        <Route path="leads/kanban"    element={<LeadKanban />} />
        <Route path="leads/:id"       element={<LeadDetail />} />
        <Route path="proposals"       element={<ProposalsList />} />
        <Route path="proposals/new"   element={<ProposalBuilder />} />
        <Route path="projects"        element={<ProjectsList />} />
        <Route path="projects/:id"    element={<ProjectDetail />} />
        <Route path="payments"        element={<PaymentsList />} />
        <Route path="maintenance"     element={<MaintenanceList />} />
        <Route path="messages"        element={<AdminMessages />} />
        <Route path="clients"         element={<ClientManager />} />
        <Route path="meetings"        element={<AdminMeetings />} />
        <Route path="invoices"        element={<InvoiceList />} />
      </Route>

      {/* Client portal */}
      <Route path="/portal" element={<ProtectedRoute role="client"><ClientLayout /></ProtectedRoute>}>
        <Route index                  element={<ClientDashboard />} />
        <Route path="project"         element={<ClientProjectView />} />
        <Route path="payments"        element={<ClientPayments />} />
        <Route path="maintenance"     element={<ClientMaintenance />} />
        <Route path="files"           element={<ClientFiles />} />
        <Route path="messages"        element={<ClientMessages />} />
      </Route>

      <Route path="*" element={
        <div className="min-h-screen bg-cream flex items-center justify-center flex-col gap-4">
          <span className="font-syne text-6xl font-800 text-oxford">404</span>
          <p className="text-muted text-sm">Page not found</p>
          <a href="/" className="btn-primary">Go home</a>
        </div>
      } />
    </Routes>
  )
}