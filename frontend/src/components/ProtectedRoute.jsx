import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const accessToken = localStorage.getItem('accessToken')
  const userRole = String(localStorage.getItem('userRole') || '').toLowerCase()
  
  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  // Role-based route protection
  if (location.pathname.startsWith('/programchair') && userRole !== 'admin') {
    return <Navigate to={userRole === 'staff' ? '/faculty/dashboard' : '/'} replace />
  }

  if (location.pathname.startsWith('/faculty') && userRole !== 'staff') {
    return <Navigate to={userRole === 'admin' ? '/programchair/dashboard' : '/'} replace />
  }
  
  return children
}

export default ProtectedRoute
