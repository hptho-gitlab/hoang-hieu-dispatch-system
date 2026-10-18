import { useState } from 'react'
import { ClipboardList, FilePlus2, LayoutDashboard } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const mobileLinks = [
    ...(user?.role === 'admin'
      ? [{ to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard }]
      : []),
    { to: '/orders', label: 'Phiếu việc', icon: ClipboardList },
    ...(user?.role === 'admin'
      ? [{ to: '/orders/create', label: 'Tạo mới', icon: FilePlus2 }]
      : []),
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-slate-200 bg-white px-2 py-2 lg:hidden print:hidden">
          {mobileLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-w-20 flex-col items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-medium ${
                  isActive ? 'text-cyan-700' : 'text-slate-500'
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
