import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axiosClient'

const initialForm = {
  title: '',
  orderType: 'installation',
  name: '',
  phone: '',
  address: '',
  scheduledDate: '',
  technicianId: '',
}

export default function CreateOrderPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [technicians, setTechnicians] = useState([])
  const [loadingTechnicians, setLoadingTechnicians] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/users', { params: { role: 'technician' } })
      .then(({ data }) => setTechnicians(data.users || data))
      .catch(() => setError('Không thể tải danh sách kỹ thuật viên.'))
      .finally(() => setLoadingTechnicians(false))
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/orders', {
        title: form.title,
        orderType: form.orderType,
        customer: { name: form.name, phone: form.phone, address: form.address },
        scheduledDate: form.scheduledDate,
      })
      if (form.technicianId) {
        await api.patch(`/orders/${data.order._id}/assign`, { technicianId: form.technicianId })
      }
      navigate('/orders')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tạo phiếu việc.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/orders" className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Quay lại">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tạo phiếu mới</h1>
          <p className="mt-1 text-sm text-slate-500">Nhập thông tin công việc và điều phối kỹ thuật viên.</p>
        </div>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">
            Tiêu đề công việc *
            <input required value={form.title} onChange={(event) => updateField('title', event.target.value)} className="form-input" placeholder="Ví dụ: Lắp đặt hệ thống camera" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Loại dịch vụ *
            <select value={form.orderType} onChange={(event) => updateField('orderType', event.target.value)} className="form-input">
              <option value="installation">Lắp đặt camera/mạng</option>
              <option value="maintenance">Bảo trì định kỳ</option>
              <option value="warranty">Bảo hành - sửa chữa</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Thời gian dự kiến *
            <input required type="datetime-local" value={form.scheduledDate} onChange={(event) => updateField('scheduledDate', event.target.value)} className="form-input" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Họ tên khách hàng *
            <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} className="form-input" placeholder="Nhập họ tên khách hàng" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Số điện thoại *
            <input required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} className="form-input" placeholder="Nhập số điện thoại" />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">
            Địa chỉ thực hiện *
            <textarea required rows="3" value={form.address} onChange={(event) => updateField('address', event.target.value)} className="form-input" placeholder="Nhập địa chỉ lắp đặt hoặc bảo trì" />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">
            Phân công kỹ thuật viên
            <select value={form.technicianId} onChange={(event) => updateField('technicianId', event.target.value)} className="form-input" disabled={loadingTechnicians}>
              <option value="">Chưa phân công</option>
              {technicians.map((technician) => (
                <option key={technician._id || technician.id} value={technician._id || technician.id}>
                  {technician.fullName} ({technician.phone})
                </option>
              ))}
            </select>
          </label>
        </div>
        <button disabled={submitting} className="w-full rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-700 disabled:opacity-60">
          {submitting ? 'Đang tạo phiếu...' : 'Tạo và điều phối phiếu'}
        </button>
      </form>
    </section>
  )
}
