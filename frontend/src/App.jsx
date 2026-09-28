import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import CheckIn from './pages/CheckIn';
import Progress from './pages/Progress';
import Resources from './pages/Resources';
import Community from './pages/Community';
import Chatbot from './pages/Chatbot';
import Connect from './pages/Connect';
import Schedule from './pages/Schedule';
import AdminPanel from './pages/AdminPanel';
import ManageResources from './components/ManageResources';
import VideoMeetComponent from './pages/VideoMeet';
import JoinLobby from './pages/JoinLobby';

export default function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
        <ErrorBoundary>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Onboarding */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Student + Counselor shared */}
            <Route
              path="/connect"
              element={
                <ProtectedRoute allowedRoles={['student', 'counselor']}>
                  <Connect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute allowedRoles={['student', 'counselor']}>
                  <Schedule />
                </ProtectedRoute>
              }
            />

            {/* Student + Counselor dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student', 'counselor', 'admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Video Rooms */}
            <Route
              path="/video/join"
              element={
                <ProtectedRoute allowedRoles={['student', 'counselor']}>
                  <JoinLobby />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video/:room"
              element={
                <ProtectedRoute allowedRoles={['student', 'counselor']}>
                  <VideoMeetComponent />
                </ProtectedRoute>
              }
            />

            {/* Student-only routes */}
            <Route
              path="/check-in"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CheckIn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Progress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resources"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Resources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute allowedRoles={['student', 'counselor', 'admin']}>
                  <Community />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chatbot"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Chatbot />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-resources"
              element={
                <ProtectedRoute allowedRoles={['admin', 'counselor']}>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <ManageResources />
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}
