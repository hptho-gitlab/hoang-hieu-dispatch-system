import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import CreateOrderPage from './pages/CreateOrderPage'
import OrderDetailPage from './pages/OrderDetailPage'

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.role === 'admin' ? '/dashboard' : '/orders'} replace />
}

function PageHeading({ title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-semibold text-cyan-600">HOÀNG HIẾU TELECOM</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  )
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
              element={
                <PageHeading
                  title="Báo cáo & Thống kê"
                  description="Phân tích hiệu suất xử lý phiếu việc."
                />
              }
            />
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
