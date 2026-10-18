import { useEffect, useState } from 'react'
import { Plus, UserRound, X } from 'lucide-react'
import api from '../api/axiosClient'

const emptyForm = {
  username: '',
  password: '',
  fullName: '',
  phone: '',
  role: 'technician',
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadUsers() {
    const { data } = await api.get('/users')
    setUsers(data.users || [])
  }

  useEffect(() => {
    loadUsers()
      .catch((requestError) => setError(requestError.response?.data?.message || 'Không thể tải danh sách nhân sự.'))
      .finally(() => setLoading(false))
  }, [])

  async function createUser(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/users', form)
      setForm(emptyForm)
      setModalOpen(false)
      await loadUsers()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tạo nhân sự.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user) {
    try {
      await api.patch(`/users/${user._id}/toggle-active`)
      await loadUsers()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản.')
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân sự</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý tài khoản điều phối viên và kỹ thuật viên.</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700">
          <Plus size={18} /> Thêm nhân viên
        </button>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Đang tải danh sách nhân sự...</div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Chưa có nhân sự.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Nhân sự</th>
                <th className="px-5 py-4 font-medium">Số điện thoại</th>
                <th className="px-5 py-4 font-medium">Vai trò</th>
                <th className="px-5 py-4 font-medium">Trạng thái</th>
                <th className="px-5 py-4 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((staff) => (
                <tr key={staff._id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-700"><UserRound size={17} /></span>
                      <div><p className="font-semibold text-slate-800">{staff.fullName}</p><p className="text-xs text-slate-500">@{staff.username}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{staff.phone}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{staff.role === 'admin' ? 'Điều phối viên' : 'Kỹ thuật viên'}</span></td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${staff.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{staff.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span></td>
                  <td className="px-5 py-4 text-right">
                    <button type="button" onClick={() => toggleActive(staff)} className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">{staff.isActive ? 'Khóa' : 'Mở khóa'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={createUser} className="w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">Thêm nhân viên</h2><button type="button" onClick={() => setModalOpen(false)} aria-label="Đóng"><X size={20} /></button></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Họ và tên<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700">Số điện thoại<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700">Tên đăng nhập<input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700">Mật khẩu<input required minLength="6" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Vai trò<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="form-input"><option value="technician">Kỹ thuật viên</option><option value="admin">Điều phối viên</option></select></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2 text-sm text-slate-600">Hủy</button><button disabled={saving} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang tạo...' : 'Tạo nhân viên'}</button></div>
          </form>
        </div>
      )}
    </section>
  )
}
