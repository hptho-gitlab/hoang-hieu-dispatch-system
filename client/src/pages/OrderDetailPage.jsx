import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, MapPin, Phone, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axiosClient'
import { useAuth } from '../context/AuthContext'
import {
  formatDate,
  orderTypeLabels,
  statusClasses,
  statusLabels,
} from '../utils/orderLabels'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [selectedTechnician, setSelectedTechnician] = useState('')
  const [notes, setNotes] = useState('')
  const [postponeReason, setPostponeReason] = useState('')
  const [files, setFiles] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isAdmin = user?.role === 'admin'

  const loadOrder = useCallback(async () => {
    const { data } = await api.get(`/orders/${id}`)
    setOrder(data.order)
    setSelectedTechnician(data.order.assignedTo?._id || '')
    setNotes(data.order.technicianNotes || '')
  }, [id])

  useEffect(() => {
    Promise.all([
      loadOrder(),
      isAdmin ? api.get('/users', { params: { role: 'technician' } }) : Promise.resolve(null),
    ])
      .then(([, usersResponse]) => {
        if (usersResponse) setTechnicians(usersResponse.data.users || usersResponse.data)
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Không thể tải chi tiết phiếu việc.'))
      .finally(() => setLoading(false))
  }, [id, isAdmin, loadOrder])

  async function runAction(action) {
    setError('')
    setSaving(true)
    try {
      await action()
      await loadOrder()
      setModalOpen(false)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể cập nhật phiếu việc.')
    } finally {
      setSaving(false)
    }
  }

  function handleComplete(event) {
    event.preventDefault()
    const formData = new FormData()
    formData.append('technicianNotes', notes)
    files.forEach((file) => formData.append('completionPhotos', file))
    runAction(() => api.post(`/orders/${id}/complete`, formData))
  }

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Đang tải chi tiết phiếu việc...</div>
  if (!order) return <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{error || 'Không tìm thấy phiếu việc.'}</div>

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Quay lại"><ArrowLeft size={20} /></button>
        <div>
          <p className="text-xs font-bold text-cyan-600">{order.orderCode}</p>
          <h1 className="text-2xl font-bold text-slate-900">{order.title}</h1>
        </div>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Thông tin phiếu việc</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.status]}`}>{statusLabels[order.status]}</span>
            </div>
            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <p><span className="text-slate-400">Loại dịch vụ:</span> {orderTypeLabels[order.orderType]}</p>
              <p><span className="text-slate-400">Lịch dự kiến:</span> {formatDate(order.scheduledDate)}</p>
              <p className="flex gap-2"><UserRound size={17} className="text-cyan-600" />{order.customer.name}</p>
              <p className="flex gap-2"><Phone size={17} className="text-cyan-600" />{order.customer.phone}</p>
              <p className="flex gap-2 sm:col-span-2"><MapPin size={17} className="text-cyan-600" />{order.customer.address}</p>
            </div>
          </div>
          {isAdmin && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Phân công kỹ thuật viên</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <select value={selectedTechnician} onChange={(event) => setSelectedTechnician(event.target.value)} className="form-input flex-1">
                  <option value="">Chọn kỹ thuật viên</option>
                  {technicians.map((technician) => <option key={technician._id} value={technician._id}>{technician.fullName}</option>)}
                </select>
                <button type="button" disabled={!selectedTechnician || saving} onClick={() => runAction(() => api.patch(`/orders/${id}/assign`, { technicianId: selectedTechnician }))} className="rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
                  Phân công
                </button>
              </div>
            </div>
          )}
          {order.status === 'assigned' && !isAdmin && (
            <button type="button" disabled={saving} onClick={() => runAction(() => api.patch(`/orders/${id}/status`, { status: 'in_progress' }))} className="w-full rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white disabled:opacity-50">
              Bắt đầu thực hiện
            </button>
          )}
          {order.status === 'in_progress' && !isAdmin && (
            <form onSubmit={handleComplete} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setModalOpen(true)} className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50">Báo hoãn</button>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Ghi chú kỹ thuật & Thiết bị sử dụng *
                <textarea required rows="5" value={notes} onChange={(event) => setNotes(event.target.value)} className="form-input" placeholder="Ví dụ: camera serial, số mét dây đã sử dụng..." />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Tải lên ảnh nghiệm thu hiện trường (tối đa 4 ảnh)
                <input type="file" accept="image/jpeg,image/png" multiple onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 4))} className="mt-2 block w-full text-sm text-slate-500" />
              </label>
              <button disabled={saving} className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Hoàn thành & Bàn giao</button>
            </form>
          )}
          {order.technicianNotes && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Ghi chú kỹ thuật</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{order.technicianNotes}</p>
            </div>
          )}
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Kỹ thuật viên</h2>
          {order.assignedTo ? (
            <div className="mt-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{order.assignedTo.fullName}</p>
              <p className="mt-1">{order.assignedTo.phone}</p>
            </div>
          ) : <p className="mt-4 text-sm text-slate-500">Chưa phân công</p>}
          {order.completionPhotos?.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-slate-900">Ảnh nghiệm thu</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {order.completionPhotos.map((photo) => <a href={photo} target="_blank" rel="noreferrer" key={photo}><img src={photo} alt="Ảnh nghiệm thu" className="aspect-square w-full rounded-lg object-cover" /></a>)}
              </div>
            </div>
          )}
        </aside>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={(event) => { event.preventDefault(); runAction(() => api.patch(`/orders/${id}/status`, { status: 'postponed', technicianNotes: postponeReason })) }} className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Báo hoãn phiếu việc</h2>
            <label className="mt-4 block text-sm font-medium text-slate-700">Lý do hoãn *
              <textarea required rows="4" value={postponeReason} onChange={(event) => setPostponeReason(event.target.value)} className="form-input" placeholder="Nhập lý do cần hoãn..." />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2 text-sm text-slate-600">Hủy</button>
              <button disabled={saving} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white">Xác nhận báo hoãn</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
