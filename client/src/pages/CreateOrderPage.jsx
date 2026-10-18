import { useEffect, useState } from 'react'
import { ArrowLeft, History } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axiosClient'

const initialForm = {
  title: '',
  orderType: 'installation',
  deviceCategory: 'camera',
  issueDetails: [],
  otherIssue: '',
  isUnderWarranty: false,
  serviceFee: '0',
  name: '',
  phone: '',
  address: '',
  scheduledDate: '',
  technicianId: '',
}

const issueOptions = {
  camera: [
    'Camera hết dung lượng / Lỗi ổ cứng',
    'Lỗi camera không kết nối Wi-Fi',
    'App không nhận tín hiệu (Offline)',
    'Camera mất nguồn / Không lên hình',
    'Hình ảnh mờ, nhiễu / Mất hồng ngoại',
    'Lắp đặt mới / Di dời mắt camera',
  ],
  network: [
    'Mất kết nối Internet / Rớt mạng',
    'Lỗi Router / Bộ phát Wi-Fi (AP)',
    'Đứt cáp / Suy hao dây mạng LAN/Quang',
    'Xung đột IP / Lỗi cấu hình Switch',
    'Kéo mới đường dây mạng nội bộ',
  ],
}

const feeOptions = [150000, 250000, 350000, 500000]

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value) || 0)
}

export default function CreateOrderPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [technicians, setTechnicians] = useState([])
  const [loadingTechnicians, setLoadingTechnicians] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [customerHistory, setCustomerHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  useEffect(() => {
    api.get('/users', { params: { role: 'technician', isActive: 'true' } })
      .then(({ data }) => setTechnicians((data.users || data).filter((technician) => technician.isActive === true)))
      .catch(() => setError('Không thể tải danh sách kỹ thuật viên.'))
      .finally(() => setLoadingTechnicians(false))
  }, [])

  function updateField(field, value) {
    setForm((current) => {
      if (field === 'deviceCategory') {
        return { ...current, deviceCategory: value, issueDetails: [], otherIssue: '' }
      }
      if (field === 'isUnderWarranty') {
        return { ...current, isUnderWarranty: value, serviceFee: value ? '0' : current.serviceFee === '0' ? '' : current.serviceFee }
      }
      return { ...current, [field]: value }
    })
  }

  function toggleIssue(issue) {
    setForm((current) => ({
      ...current,
      issueDetails: current.issueDetails.includes(issue)
        ? current.issueDetails.filter((item) => item !== issue)
        : [...current.issueDetails, issue],
    }))
  }

  async function lookupCustomerHistory() {
    if (!form.phone.trim()) {
      setHistoryError('Vui lòng nhập số điện thoại khách hàng trước khi tra cứu.')
      return
    }
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const { data } = await api.get('/orders/customer-history', { params: { phone: form.phone.trim() } })
      setCustomerHistory(data.orders || [])
    } catch (requestError) {
      setHistoryError(requestError.response?.data?.message || 'Không thể tra cứu lịch sử bảo hành.')
    } finally {
      setHistoryLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const issueDetails = [...form.issueDetails]
      if (form.otherIssue.trim()) issueDetails.push(form.otherIssue.trim())
      const { data } = await api.post('/orders', {
        title: form.title,
        orderType: form.orderType,
        deviceCategory: form.deviceCategory,
        issueDetails,
        isUnderWarranty: form.isUnderWarranty,
        serviceFee: form.isUnderWarranty ? 0 : Number(form.serviceFee) || 0,
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
            Thiết bị / hệ thống *
            <select value={form.deviceCategory} onChange={(event) => updateField('deviceCategory', event.target.value)} className="form-input">
              <option value="camera">Hệ thống Camera giám sát</option>
              <option value="network">Hệ thống Mạng / Wi-Fi</option>
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
            <div className="mt-2 flex gap-2">
              <input required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} className="form-input mt-0 min-w-0 flex-1" placeholder="Nhập số điện thoại" />
              <button type="button" onClick={lookupCustomerHistory} disabled={historyLoading} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-cyan-200 px-3 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50">
                <History size={15} /> Tra cứu lịch sử BH
              </button>
            </div>
          </label>
          <div className="sm:col-span-2">
            {historyError && <p className="text-xs text-red-600">{historyError}</p>}
            {customerHistory.length > 0 && (
              <div className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3">
                <p className="mb-2 text-xs font-semibold text-cyan-800">Lịch sử 5 phiếu gần nhất</p>
                <div className="space-y-2">
                  {customerHistory.map((item) => (
                    <div key={item._id} className="flex flex-col gap-1 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-semibold text-slate-800">{item.orderCode} · {item.title}</span>
                      <span className="flex items-center gap-2">
                        {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(item.createdAt))}
                        <span className={`rounded-full px-2 py-0.5 font-medium ${item.isUnderWarranty ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.isUnderWarranty ? 'Trong hạn BH' : 'Ngoài BH'}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="sm:col-span-2 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-700">Nội dung sự cố</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {issueOptions[form.deviceCategory].map((issue) => (
                <label key={issue} className="flex items-start gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={form.issueDetails.includes(issue)} onChange={() => toggleIssue(issue)} className="mt-1 accent-cyan-600" />
                  {issue}
                </label>
              ))}
            </div>
            <input value={form.otherIssue} onChange={(event) => updateField('otherIssue', event.target.value)} className="form-input" placeholder="Mô tả sự cố khác (nếu có)" />
          </div>
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">
            Địa chỉ thực hiện *
            <textarea required rows="3" value={form.address} onChange={(event) => updateField('address', event.target.value)} className="form-input" placeholder="Nhập địa chỉ lắp đặt hoặc bảo trì" />
            <button
              type="button"
              disabled={!form.address.trim()}
              onClick={() => window.open(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address)}`,
                '_blank',
                'noopener,noreferrer',
              )}
              className="mt-2 inline-flex items-center rounded-lg border border-cyan-200 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              📍 Kiểm tra vị trí trên Google Maps
            </button>
          </label>
          <fieldset className="sm:col-span-2 rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-medium text-slate-700">Tình trạng bảo hành & phí dịch vụ</legend>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" checked={form.isUnderWarranty} onChange={() => updateField('isUnderWarranty', true)} />
                Trong thời hạn bảo hành (Miễn phí 0đ)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" checked={!form.isUnderWarranty} onChange={() => updateField('isUnderWarranty', false)} />
                Ngoài thời hạn bảo hành (Có tính phí)
              </label>
            </div>
            {!form.isUnderWarranty && (
              <div className="mt-3">
                <label className="text-sm font-medium text-slate-700">
                  Phí bảo trì / dịch vụ (VNĐ)
                  <input type="number" min="0" value={form.serviceFee} onChange={(event) => updateField('serviceFee', event.target.value)} className="form-input" placeholder="Nhập số tiền" />
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {feeOptions.map((fee) => (
                    <button type="button" key={fee} onClick={() => updateField('serviceFee', String(fee))} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${Number(form.serviceFee) === fee ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {formatCurrency(fee)}đ
                    </button>
                  ))}
                </div>
              </div>
            )}
          </fieldset>
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
