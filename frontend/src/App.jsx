import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ProgramChairDashboard from './pages/programchair/Dashboard'
import StaffHome from './pages/staff/Home'
import StaffLogin from './pages/staff/Login'
import StaffDashboard from './pages/staff/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Program Chair Routes */}
        <Route 
          path="/programchair/dashboard" 
          element={
            <ProtectedRoute>
              <ProgramChairDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Staff Routes */}
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute>
              <StaffHome />
            </ProtectedRoute>
          } 
        />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route 
          path="/staff/dashboard" 
          element={
            <ProtectedRoute>
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}
