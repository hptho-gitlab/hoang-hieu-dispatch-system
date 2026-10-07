import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'

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
                <PageHeading
                  title="Bảng điều khiển"
                  description="Theo dõi tình hình điều phối và tiến độ phiếu việc."
                />
              }
            />
          </Route>
          <Route
            path="/orders"
            element={
              <PageHeading
                title="Danh sách phiếu việc"
                description="Quản lý và theo dõi các phiếu việc được phân công."
              />
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
                <PageHeading
                  title="Tạo phiếu mới"
                  description="Tạo phiếu việc mới cho khách hàng."
                />
              }
            />
          </Route>
          <Route
            path="/orders/:id"
            element={
              <PageHeading
                title="Chi tiết phiếu việc"
                description="Xem thông tin và cập nhật tiến độ phiếu việc."
              />
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
