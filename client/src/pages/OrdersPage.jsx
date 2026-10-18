import { useEffect, useState } from 'react'
import { Download, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axiosClient'
import { useAuth } from '../context/AuthContext'
import { exportOrdersToExcel } from '../utils/exportExcel'
import {
  formatDate,
  orderTypeLabels,
  statusClasses,
  statusLabels,
} from '../utils/orderLabels'

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value) || 0)
}

const statusFilters = [
  ['all', 'Tất cả'],
  ['pending', 'Chờ xử lý'],
  ['assigned', 'Đã giao'],
  ['in_progress', 'Đang thực hiện'],
  ['completed', 'Hoàn thành'],
  ['postponed', 'Tạm hoãn'],
]

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('all')
  const [orderType, setOrderType] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const params = {
          ...(status !== 'all' ? { status } : {}),
          ...(orderType ? { orderType } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        }
        const { data } = await api.get('/orders', { params })
        setOrders(data.orders || [])
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Không thể tải danh sách phiếu việc.')
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [status, orderType, search])

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách phiếu việc</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi toàn bộ công việc điều phối.</p>
        </div>
        {user?.role === 'admin' && (
          <div className="print:hidden flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportOrdersToExcel(orders)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <Download size={18} /> 📥 Xuất Excel đối soát
            </button>
            <Link
              to="/orders/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              <Plus size={18} /> Tạo phiếu mới
            </Link>
          </div>
        )}
      </div>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên khách hàng, số điện thoại hoặc mã phiếu"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-500"
            />
          </label>
          <select
            value={orderType}
            onChange={(event) => setOrderType(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
          >
            <option value="">Tất cả dịch vụ</option>
            <option value="installation">Lắp đặt</option>
            <option value="maintenance">Bảo trì</option>
            <option value="warranty">Bảo hành</option>
          </select>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setStatus(value)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                status === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Đang tải danh sách phiếu việc...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Chưa có phiếu việc phù hợp.
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-bold text-cyan-600">{order.orderCode}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{order.title}</h2>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.status]}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                <p><span className="text-slate-400">Khách hàng:</span> {order.customer?.name}</p>
                <p><span className="text-slate-400">Số điện thoại:</span> {order.customer?.phone}</p>
                <p><span className="text-slate-400">Lịch dự kiến:</span> {formatDate(order.scheduledDate)}</p>
                <p><span className="text-slate-400">Dịch vụ:</span> {orderTypeLabels[order.orderType]}</p>
                <div className="flex items-start gap-1 sm:col-span-2 lg:col-span-4">
                  <span className="text-slate-400">Địa chỉ:</span>
                  <span className="min-w-0">{order.customer?.address}</span>
                  {order.customer?.address && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.customer.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="ml-1 shrink-0 text-xs font-semibold text-cyan-700 hover:text-cyan-900"
                    >
                      📍 Chỉ đường
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {order.deviceCategory === 'network' ? 'Mạng - Wi-Fi' : 'Camera'}
                </span>
                {order.issueDetails?.map((issue) => (
                  <span key={issue} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-700">
                    {issue}
                  </span>
                ))}
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${order.isUnderWarranty ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {order.isUnderWarranty ? 'Trong hạn BH - Miễn phí' : `Ngoài BH: ${formatCurrency(order.serviceFee)} ₫`}
                </span>
              </div>
              <div className="mt-4 flex justify-end">
                <Link to={`/orders/${order._id}`} className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
                  Xem chi tiết
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
