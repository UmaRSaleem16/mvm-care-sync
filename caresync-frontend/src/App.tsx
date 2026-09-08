import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/Layout'
import { PageLoader } from '@/components/common/LoadingSpinner'

import Login from '@/pages/Login'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Dashboard from '@/pages/Dashboard'
import Vendors from '@/pages/Vendors'
import Facilities from '@/pages/Facilities'
import Requests from '@/pages/Requests'
import NewRequest from '@/pages/Requests/NewRequest'
import RequestDetail from '@/pages/Requests/RequestDetail'
import Profile from '@/pages/Profile'
import Users from '@/pages/Users'
import Help from '@/pages/Help'
import CalendarPage from '@/pages/Calendar'
import NotFound from '@/pages/NotFound'

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function StaffOrAboveRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role === 'readonly') return <Navigate to="/requests" replace />
  return <>{children}</>
}

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppLayout />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoutes />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/facilities" element={<Facilities />} />
          <Route path="/requests" element={<Requests />} />
          <Route
            path="/requests/new"
            element={
              <StaffOrAboveRoute>
                <NewRequest />
              </StaffOrAboveRoute>
            }
          />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/help" element={<Help />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
