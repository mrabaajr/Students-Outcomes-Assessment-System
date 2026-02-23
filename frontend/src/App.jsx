import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ProgramChairDashboard from './pages/programchair/Dashboard'
import StudentOutcomes from './pages/programchair/StudentOutcomes'
import Courses from './pages/programchair/Courses'
import SOAssessment from './pages/programchair/SOAssessment'
import Reports from './pages/programchair/Reports'
import Classes from './pages/programchair/Classes'
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
        <Route 
          path="/programchair/student-outcomes" 
          element={
            <ProtectedRoute>
              <StudentOutcomes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/programchair/courses" 
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/programchair/assessment" 
          element={
            <ProtectedRoute>
              <SOAssessment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/assessment/:id" 
          element={
            <ProtectedRoute>
              <SOAssessment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/programchair" 
          element={<Navigate to="/programchair/dashboard" />} 
        />
        <Route 
          path="/programchair/reports" 
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/programchair/classes" 
          element={
            <ProtectedRoute>
              <Classes />
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
