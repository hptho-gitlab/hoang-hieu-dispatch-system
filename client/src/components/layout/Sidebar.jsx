import {
  BarChart3,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const roleLabels = { admin: 'Điều phối viên', technician: 'Kỹ thuật viên' }

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const links = [
    ...(isAdmin ? [{ to: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard }] : []),
    { to: '/orders', label: 'Danh sách phiếu việc', icon: ClipboardList },
    ...(isAdmin
      ? [
          { to: '/orders/create', label: 'Tạo phiếu mới', icon: FilePlus2 },
          { to: '/reports', label: 'Báo cáo & Thống kê', icon: BarChart3 },
        ]
      : []),
  ]

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden"
          onClick={onClose}
          aria-label="Đóng menu"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-slate-950 text-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div>
            <p className="text-sm font-bold text-cyan-300">HOÀNG HIẾU TELECOM</p>
            <p className="mt-1 text-xs text-slate-400">Quản lý điều phối</p>
          </div>
          <button type="button" onClick={onClose} className="lg:hidden" aria-label="Đóng menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/5 p-3">
            <p className="truncate text-sm font-semibold">{user?.fullName}</p>
            <p className="mt-1 text-xs text-cyan-300">{roleLabels[user?.role]}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-red-500/15 hover:text-red-300"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  )
}
