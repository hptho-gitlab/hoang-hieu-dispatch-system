import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react'
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
  const [serviceFee, setServiceFee] = useState('')
  const [postponeReason, setPostponeReason] = useState('')
  const [files, setFiles] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [printedDate] = useState(
    () => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date()),
  )
  const isAdmin = user?.role === 'admin'
  const activeTechnicians = technicians.filter((technician) => technician.isActive === true)

  const loadOrder = useCallback(async () => {
    const { data } = await api.get(`/orders/${id}`)
    setOrder(data.order)
    setSelectedTechnician(data.order.assignedTo?._id || '')
    setNotes(data.order.technicianNotes || '')
    setServiceFee(String(data.order.serviceFee || 0))
  }, [id])

  useEffect(() => {
    Promise.all([
      loadOrder(),
      isAdmin ? api.get('/users', { params: { role: 'technician', isActive: 'true' } }) : Promise.resolve(null),
    ])
      .then(([, usersResponse]) => {
        if (usersResponse) {
          setTechnicians((usersResponse.data.users || usersResponse.data)
            .filter((technician) => technician.isActive === true))
        }
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
    if (!order.isUnderWarranty) formData.append('serviceFee', serviceFee)
    files.forEach((file) => formData.append('completionPhotos', file))
    runAction(() => api.post(`/orders/${id}/complete`, formData))
  }

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Đang tải chi tiết phiếu việc...</div>
  if (!order) return <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{error || 'Không tìm thấy phiếu việc.'}</div>

  const categoryLabel = order.deviceCategory === 'network' ? 'Mạng - Wi-Fi' : 'Camera'
  const formattedFee = new Intl.NumberFormat('vi-VN').format(Number(order.serviceFee) || 0)
  const timelineStyles = {
    created: { dot: 'bg-slate-500', icon: CircleDot },
    assigned: { dot: 'bg-indigo-600', icon: UserRound },
    in_progress: { dot: 'bg-sky-500', icon: Activity },
    postponed: { dot: 'bg-orange-500', icon: CircleDot },
    cancelled: { dot: 'bg-red-500', icon: CircleDot },
    completed: { dot: 'bg-emerald-600', icon: CheckCircle2 },
  }
  const roleLabels = {
    admin: 'Điều phối viên',
    technician: 'Kỹ thuật viên',
  }
  const timeline = [...(order.timeline || [])]
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))

  return (
    <>
      <section className="mx-auto max-w-5xl space-y-6 print:hidden">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Quay lại"><ArrowLeft size={20} /></button>
        <div>
          <p className="text-xs font-bold text-cyan-600">{order.orderCode}</p>
          <h1 className="text-2xl font-bold text-slate-900">{order.title}</h1>
        </div>
        <button type="button" onClick={() => window.print()} className="ml-auto rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          🖨️ In phiếu bảo trì
        </button>
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
              <p><span className="text-slate-400">Hạng mục:</span> {categoryLabel}</p>
              <p><span className="text-slate-400">Lịch dự kiến:</span> {formatDate(order.scheduledDate)}</p>
              <p><span className="text-slate-400">Chi phí:</span> {order.isUnderWarranty ? 'Trong hạn BH - Miễn phí' : `${formattedFee} ₫`}</p>
              <p className="flex gap-2"><UserRound size={17} className="text-cyan-600" />{order.customer.name}</p>
              <p className="flex items-center gap-2">
                <Phone size={17} className="shrink-0 text-cyan-600" />
                <span>{order.customer.phone}</span>
                <a
                  href={`tel:${order.customer.phone}`}
                  className="print:hidden text-xs font-semibold text-cyan-700 hover:text-cyan-900"
                >
                  📞 Gọi khách
                </a>
              </p>
              <div className="flex gap-2 sm:col-span-2">
                <MapPin size={17} className="mt-0.5 shrink-0 text-cyan-600" />
                <div className="min-w-0">
                  <p>{order.customer.address}</p>
                  <div className="print:hidden mt-2 flex flex-wrap gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      📍 Xem bản đồ
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.customer.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border border-cyan-200 px-2.5 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
                    >
                      🧭 Chỉ đường
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-500">Tình trạng / Sự cố</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(order.issueDetails?.length ? order.issueDetails : ['Chưa cập nhật']).map((issue) => (
                  <span key={issue} className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-700">{issue}</span>
                ))}
              </div>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${order.isUnderWarranty ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {order.isUnderWarranty ? 'Trong thời hạn bảo hành - Miễn phí' : `Ngoài thời hạn bảo hành - ${formattedFee} ₫`}
              </span>
            </div>
          </div>
          {isAdmin && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Phân công kỹ thuật viên</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <select value={selectedTechnician} onChange={(event) => setSelectedTechnician(event.target.value)} className="form-input flex-1">
                  <option value="">Chọn kỹ thuật viên</option>
                  {order.assignedTo && order.assignedTo.isActive === false && (
                    <option value={order.assignedTo._id} disabled>
                      {order.assignedTo.fullName} (Đã khóa - đang giữ phân công)
                    </option>
                  )}
                  {activeTechnicians.map((technician) => (
                    <option key={technician._id} value={technician._id}>
                      {technician.fullName}
                    </option>
                  ))}
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
              {!order.isUnderWarranty && (
                <label className="block text-sm font-medium text-slate-700">
                  Phí bảo trì / dịch vụ (VNĐ)
                  <input type="number" min="0" value={serviceFee} onChange={(event) => setServiceFee(event.target.value)} className="form-input" />
                </label>
              )}
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 print:hidden">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-cyan-600" />
          <h2 className="text-lg font-bold text-slate-900">Nhật ký xử lý (Audit Trail)</h2>
        </div>
        {timeline.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">Chưa có nhật ký xử lý.</p>
        ) : (
          <div className="mt-5 space-y-0">
            {timeline.map((item, index) => {
              const style = timelineStyles[item.action] || timelineStyles.created
              const Icon = style.icon
              const timestamp = new Intl.DateTimeFormat('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).format(new Date(item.createdAt))
              return (
                <div key={`${item.action}-${item.createdAt}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < timeline.length - 1 && (
                    <span className="absolute left-[11px] top-7 h-full w-px bg-slate-200" />
                  )}
                  <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${style.dot}`}>
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <time className="text-xs text-slate-400">{timestamp}</time>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Thực hiện bởi: {item.performedBy?.fullName || 'Hệ thống'}</span>
                      {item.performedBy?.role && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                          {roleLabels[item.performedBy.role] || item.performedBy.role}
                        </span>
                      )}
                    </div>
                    {item.note && (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
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
      <div className="hidden min-h-[297mm] bg-white p-8 text-black print:block">
        <div className="flex justify-between border-b-2 border-black pb-4 text-center text-sm">
          <div className="w-1/2 text-left">
            <p className="font-bold">CÔNG TY TNHH MTV ĐIỆN TỬ VIỄN THÔNG HOÀNG HIẾU</p>
            <p className="mt-1">Chuyên: Camera quan sát - Thiết bị mạng - Viễn thông</p>
          </div>
          <div className="w-1/2 text-right">
            <p className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="mt-1">Độc lập - Tự do - Hạnh phúc</p>
          </div>
        </div>
        <div className="py-6 text-center">
          <h1 className="text-xl font-bold">PHIẾU BẢO TRÌ & BIÊN BẢN NGHIỆM THU KỸ THUẬT</h1>
          <p className="mt-2">Mã phiếu: <strong>{order.orderCode}</strong> · Ngày in: {printedDate}</p>
        </div>
        <div className="space-y-5 text-sm">
          <section>
            <h2 className="border-b border-black pb-1 font-bold">I. THÔNG TIN KHÁCH HÀNG</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <p><strong>Họ tên:</strong> {order.customer.name}</p>
              <p><strong>SĐT:</strong> {order.customer.phone}</p>
              <p className="col-span-2"><strong>Địa chỉ:</strong> {order.customer.address}</p>
            </div>
          </section>
          <section>
            <h2 className="border-b border-black pb-1 font-bold">II. CHI TIẾT KỸ THUẬT</h2>
            <div className="mt-3 space-y-2">
              <p><strong>Hạng mục:</strong> {categoryLabel}</p>
              <p><strong>Tình trạng / Sự cố:</strong> {order.issueDetails?.length ? order.issueDetails.join('; ') : 'Không có thông tin'}</p>
              <p><strong>Kết quả xử lý:</strong> {order.technicianNotes || 'Chưa cập nhật'}</p>
            </div>
          </section>
          <section>
            <h2 className="border-b border-black pb-1 font-bold">III. BẢO HÀNH & CHI PHÍ</h2>
            <div className="mt-3 space-y-2">
              <p>[{order.isUnderWarranty ? '✓' : ' '}] Trong thời hạn bảo hành (Miễn phí)</p>
              <p>[{order.isUnderWarranty ? ' ' : '✓'}] Ngoài thời hạn bảo hành (Thu phí)</p>
              <p className="mt-4 text-base font-bold">Tổng chi phí thanh toán: {formattedFee} VNĐ</p>
            </div>
          </section>
          <section className="pt-8">
            <h2 className="border-b border-black pb-1 font-bold">IV. CHỮ KÝ</h2>
            <div className="mt-5 grid grid-cols-2 text-center">
              <div>
                <p className="font-bold">ĐẠI DIỆN KỸ THUẬT VIÊN</p>
                <p className="mt-20">{order.assignedTo?.fullName || '................................'}</p>
              </div>
              <div>
                <p className="font-bold">KHÁCH HÀNG NGHIỆM THU</p>
                <p className="mt-20">{order.customer.name}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
