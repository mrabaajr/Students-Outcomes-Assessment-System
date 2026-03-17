import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Settings from './pages/account_settings'
import ProgramChairDashboard from './pages/programchair/Dashboard'
import StudentOutcomes from './pages/programchair/StudentOutcomes'
import Courses from './pages/programchair/Courses'
import SOAssessment from './pages/programchair/SOAssessment'
import Reports from './pages/programchair/Reports'
import Classes from './pages/programchair/Classes'
import FacultyHome from './pages/faculty/Home'
import FacultyLogin from './pages/faculty/Login'
import FacultyDashboard from './pages/faculty/Dashboard'
import FacultyClasses from './pages/faculty/Classess'
import FacultyAssessments from './pages/faculty/Assessments'
import FacultyReports from './pages/faculty/Reports'
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
        
        {/* Faculty Routes */}
        <Route 
          path="/faculty" 
          element={
            <ProtectedRoute>
              <FacultyHome />
            </ProtectedRoute>
          } 
        />
        <Route path="/faculty/login" element={<FacultyLogin />} />
        <Route 
          path="/faculty/dashboard" 
          element={
            <ProtectedRoute>
              <FacultyDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/faculty/classes" 
          element={
            <ProtectedRoute>
              <FacultyClasses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/faculty/assessments" 
          element={
            <ProtectedRoute>
              <FacultyAssessments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/faculty/reports" 
          element={
            <ProtectedRoute>
              <FacultyReports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/faculty/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/programchair/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/account_settings" 
          element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
          } 
        />
        
        {/* Redirect old account settings path */}
        <Route 
          path="/pages/account_settings" 
          element={<Navigate to="/account_settings" replace />} 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}
