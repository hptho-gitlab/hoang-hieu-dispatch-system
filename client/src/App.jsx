import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import CreateOrderPage from './pages/CreateOrderPage'
import OrderDetailPage from './pages/OrderDetailPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.role === 'admin' ? '/dashboard' : '/orders'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']} />
            }
          >
            <Route
              index
              element={
                <DashboardPage />
              }
            />
          </Route>
          <Route
            path="/orders"
            element={
              <OrdersPage />
            }
          />
          <Route
            path="/orders/create"
            element={
              <ProtectedRoute allowedRoles={['admin']} />
            }
          >
            <Route
              index
              element={
                <CreateOrderPage />
              }
            />
          </Route>
          <Route
            path="/orders/:id"
            element={
              <OrderDetailPage />
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']} />
            }
          >
            <Route
              index
              element={<ReportsPage />}
            />
          </Route>
          <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route index element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
