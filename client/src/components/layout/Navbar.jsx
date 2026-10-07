import { Bell, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Mở menu"
      >
        <Menu size={22} />
      </button>
      <div className="hidden text-sm font-medium text-slate-500 sm:block">
        Xin chào, {user?.fullName}
      </div>
      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Thông báo"
      >
        <Bell size={20} />
      </button>
    </header>
  )
}
