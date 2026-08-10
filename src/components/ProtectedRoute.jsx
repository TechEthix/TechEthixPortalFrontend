// client/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Spinner shown while auth is being rehydrated
const Spinner = () => (
  <div className="min-h-screen bg-cream flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
  </div>
)

// Protect any route — optionally restrict to a role
export const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user)   return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/portal'} replace />
  }

  return children
}
