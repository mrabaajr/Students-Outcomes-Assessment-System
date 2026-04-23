import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

const Login = lazy(() => import("./pages/Login"));
const Settings = lazy(() => import("./pages/account_settings"));
const ProgramChairDashboard = lazy(() => import("./pages/programchair/Dashboard"));
const StudentOutcomes = lazy(() => import("./pages/programchair/StudentOutcomes"));
const Courses = lazy(() => import("./pages/programchair/Courses"));
const Assessment = lazy(() => import("./pages/programchair/Assessment"));
const Reports = lazy(() => import("./pages/programchair/Reports"));
const ProgramChairPastReports = lazy(() => import("./pages/programchair/PastReports"));
const Classes = lazy(() => import("./pages/programchair/Classes"));
const FacultyHome = lazy(() => import("./pages/faculty/Home"));
const FacultyLogin = lazy(() => import("./pages/faculty/Login"));
const FacultyDashboard = lazy(() => import("./pages/faculty/Dashboard"));
const FacultyClasses = lazy(() => import("./pages/faculty/Classess"));
const FacultyAssessments = lazy(() => import("./pages/faculty/Assessments"));
const FacultyReports = lazy(() => import("./pages/faculty/Reports"));
const FacultyPastReports = lazy(() => import("./pages/faculty/PastReports"));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-xl border-4 border-[#FFC20E]/30 border-t-[#FFC20E] animate-spin" />
        <p className="text-sm font-medium text-[#231F20]">Loading page...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Login />} />

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
                <Assessment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:id"
            element={
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            }
          />
          <Route path="/programchair" element={<Navigate to="/programchair/dashboard" />} />
          <Route
            path="/programchair/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/programchair/past-reports"
            element={
              <ProtectedRoute>
                <ProgramChairPastReports />
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
            path="/faculty/past-reports"
            element={
              <ProtectedRoute>
                <FacultyPastReports />
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

          <Route
            path="/pages/account_settings"
            element={<Navigate to="/account_settings" replace />}
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
