import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProgramChairHome from './pages/programchair/Home'
import Login from './pages/Login'
import ProgramChairDashboard from './pages/programchair/Dashboard'
import StaffHome from './pages/staff/Home'
import StaffLogin from './pages/staff/Login'
import StaffDashboard from './pages/staff/Dashboard'


export default function App() {
  return (
    <Router>
      <Routes>
        {/* Program Chair Routes */}
        <Route path="/" element={<ProgramChairHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/programchair/dashboard" element={<ProgramChairDashboard />} />
        
        {/* Staff Routes */}
        <Route path="/staff" element={<StaffHome />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}
