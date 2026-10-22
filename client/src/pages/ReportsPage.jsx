import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Lightbulb,
  Printer,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import api from '../api/axiosClient'
import { exportDashboardReportToExcel } from '../utils/exportExcel'
import { serviceLabels, statusLabels } from '../utils/orderLabels'

const systemLabels = { camera: 'Camera giám sát', network: 'Mạng - Wi-Fi' }
const statusGroups = [
  { key: 'new', label: 'Mới tiếp nhận / Đã giao', statuses: ['pending', 'assigned'], color: 'bg-amber-500' },
  { key: 'processing', label: 'Đang xử lý', statuses: ['in_progress', 'postponed'], color: 'bg-sky-500' },
  { key: 'completed', label: 'Đã nghiệm thu', statuses: ['completed'], color: 'bg-emerald-500' },
  { key: 'cancelled', label: 'Đã hủy', statuses: ['cancelled'], color: 'bg-rose-500' },
]
function money(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} ₫`
}

function issueSummary(order) {
  return order.issueDetails?.length ? order.issueDetails[0] : 'Chưa cập nhật sự cố'
}

function getDateRange(period, referenceDate) {
  const end = new Date(referenceDate)
  end.setHours(23, 59, 59, 999)
  const start = new Date(referenceDate)
  start.setHours(0, 0, 0, 0)
  if (period === '7') start.setDate(start.getDate() - 6)
  if (period === '30') start.setDate(start.getDate() - 29)
  if (period === 'month') start.setDate(1)
  return period === 'all' || period === 'custom' ? null : { start, end }
}

function getTechnicianRows(orders, performance) {
  const rows = new Map()
  orders.forEach((order) => {
    const tech = order.assignedTo
    if (!tech?._id) return
    if (!rows.has(tech._id)) {
      rows.set(tech._id, {
        id: tech._id,
        name: tech.fullName || 'Chưa cập nhật',
        username: tech.username || '',
        total: 0,
        processing: 0,
        completed: 0,
        warranty: 0,
        chargeable: 0,
        revenue: 0,
        active: tech.isActive !== false,
      })
    }
    const row = rows.get(tech._id)
    row.total += 1
    if (['in_progress', 'postponed'].includes(order.status)) row.processing += 1
    if (order.status === 'completed') {
      row.completed += 1
      row.revenue += Number(order.serviceFee || 0)
    }
    if (order.isUnderWarranty) row.warranty += 1
    else row.chargeable += 1
  })
  performance.forEach((item) => {
    const tech = item.technician
    if (tech?.id && !rows.has(tech.id)) {
      rows.set(tech.id, {
        id: tech.id,
        name: tech.fullName || 'Chưa cập nhật',
        username: tech.username || '',
        total: 0,
        processing: 0,
        completed: 0,
        warranty: 0,
        chargeable: 0,
        revenue: 0,
        active: tech.isActive !== false,
      })
    }
  })
  return [...rows.values()]
    .map((row) => ({ ...row, rate: row.total ? (row.completed / row.total) * 100 : 0 }))
    .sort((a, b) => b.completed - a.completed || b.rate - a.rate)
}

function kpiClass(rate, total) {
  if (!total) return 'bg-slate-100 text-slate-600'
  if (rate >= 80) return 'bg-emerald-100 text-emerald-700'
  if (rate >= 50) return 'bg-blue-100 text-blue-700'
  return 'bg-amber-100 text-amber-700'
}

export default function ReportsPage() {
  const [orders, setOrders] = useState([])
  const [performance, setPerformance] = useState([])
  const [summary, setSummary] = useState(null)
  const [filters, setFilters] = useState({ period: 'all', startDate: '', endDate: '', system: '', warranty: '', service: '' })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [referenceDate] = useState(() => new Date())

  useEffect(() => {
    Promise.all([api.get('/orders'), api.get('/dashboard/summary'), api.get('/dashboard/technician-performance')])
      .then(([ordersResponse, summaryResponse, performanceResponse]) => {
        setOrders(ordersResponse.data.orders || [])
        setSummary(summaryResponse.data.stats || {})
        setPerformance(performanceResponse.data.performance || [])
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Không thể tải dữ liệu báo cáo.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredOrders = useMemo(() => {
    let range = getDateRange(filters.period, referenceDate)
    if (filters.period === 'custom' && (filters.startDate || filters.endDate)) {
      range = {
        start: filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : new Date('2000-01-01'),
        end: filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : referenceDate,
      }
    }
    return orders.filter((order) => {
      const created = new Date(order.createdAt || order.scheduledDate)
      return (!range || (created >= range.start && created <= range.end))
        && (!filters.system || order.deviceCategory === filters.system)
        && (!filters.warranty || (filters.warranty === 'warranty' ? order.isUnderWarranty : !order.isUnderWarranty))
        && (!filters.service || order.orderType === filters.service)
    })
  }, [filters, orders, referenceDate])

  const analytics = useMemo(() => {
    const total = filteredOrders.length
    const completed = filteredOrders.filter((order) => order.status === 'completed').length
    const warranty = filteredOrders.filter((order) => order.isUnderWarranty).length
    const revenue = filteredOrders.reduce((sum, order) => sum + (order.status === 'completed' ? Number(order.serviceFee || 0) : 0), 0)
    const issueCounts = {}
    filteredOrders.forEach((order) => (order.issueDetails || []).forEach((issue) => { issueCounts[issue] = (issueCounts[issue] || 0) + 1 }))
    const issues = Object.entries(issueCounts).sort((a, b) => b[1] - a[1])
    const categoryCounts = filteredOrders.reduce((counts, order) => {
      if (order.deviceCategory === 'camera' || order.deviceCategory === 'network') counts[order.deviceCategory] += 1
      return counts
    }, { camera: 0, network: 0 })
    const statusCounts = statusGroups.map((group) => ({
      ...group,
      count: filteredOrders.filter((order) => group.statuses.includes(order.status)).length,
    }))
    return { total, completed, warranty, revenue, issues, categoryCounts, statusCounts, feeOrders: total - warranty }
  }, [filteredOrders])

  const technicianRows = useMemo(() => getTechnicianRows(filteredOrders, performance), [filteredOrders, performance])
  const dominantTech = technicianRows[0]
  const dominantCategory = analytics.categoryCounts.camera >= analytics.categoryCounts.network ? 'Camera' : 'Mạng - Wi-Fi'
  const warrantyRate = analytics.total ? Math.round((analytics.warranty / analytics.total) * 100) : 0
  const totalIssues = analytics.issues.reduce((sum, [, count]) => sum + count, 0)
  const maxIssueCount = analytics.issues[0]?.[1] || 1
  const avgFee = analytics.feeOrders ? analytics.revenue / analytics.feeOrders : 0

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value, ...(field === 'period' && value !== 'custom' ? { startDate: '', endDate: '' } : {}) }))
  }

  function resetFilters() {
    setFilters({ period: 'all', startDate: '', endDate: '', system: '', warranty: '', service: '' })
  }

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      exportDashboardReportToExcel({
        ...(summary || {}),
        totalOrders: analytics.total,
        totalRevenue: analytics.revenue,
        warrantyOrdersCount: analytics.warranty,
        outOfWarrantyOrdersCount: analytics.feeOrders,
        completionRate: analytics.total ? Number(((analytics.completed / analytics.total) * 100).toFixed(2)) : 0,
        byStatus: { completed: analytics.completed },
        categoryBreakdown: analytics.categoryCounts,
      }, performance, filteredOrders)
    } catch (requestError) {
      setError(requestError.message || 'Không thể xuất sổ đối soát Excel.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Đang tổng hợp báo cáo phân tích...</div>
  if (error && !orders.length) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold tracking-widest text-cyan-600">HOÀNG HIẾU TELECOM</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Phân tích xu hướng & Đối soát tài chính</h1>
          <p className="mt-1 text-sm text-slate-500">Báo cáo tương tác theo thời gian, hệ thống và chế độ bảo hành.</p>
        </div>
        <div className="print:hidden flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Printer size={17} /> In báo cáo A4</button>
          <button type="button" onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Download size={17} /> {exporting ? 'Đang xuất...' : 'Xuất sổ đối soát (.xlsx)'}</button>
        </div>
      </header>

      <div className="print:hidden rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="text-xs font-semibold text-slate-500">Khoảng thời gian
            <select value={filters.period} onChange={(event) => updateFilter('period', event.target.value)} className="form-input mt-1">
              <option value="all">Tất cả thời gian</option><option value="7">7 ngày qua</option><option value="30">30 ngày qua</option><option value="month">Tháng này</option><option value="custom">Tùy chỉnh</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">Từ ngày<input type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} disabled={filters.period !== 'custom'} className="form-input mt-1" /></label>
          <label className="text-xs font-semibold text-slate-500">Đến ngày<input type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} disabled={filters.period !== 'custom'} className="form-input mt-1" /></label>
          <label className="text-xs font-semibold text-slate-500">Hệ thống
            <select value={filters.system} onChange={(event) => updateFilter('system', event.target.value)} className="form-input mt-1"><option value="">Tất cả hệ thống</option><option value="camera">Camera giám sát</option><option value="network">Mạng - Wi-Fi</option></select>
          </label>
          <label className="text-xs font-semibold text-slate-500">Chế độ bảo hành
            <select value={filters.warranty} onChange={(event) => updateFilter('warranty', event.target.value)} className="form-input mt-1"><option value="">Tất cả chế độ BH</option><option value="warranty">Trong hạn BH (Miễn phí)</option><option value="fee">Ngoài hạn BH (Thu phí)</option></select>
          </label>
          <label className="text-xs font-semibold text-slate-500">Loại dịch vụ
            <select value={filters.service} onChange={(event) => updateFilter('service', event.target.value)} className="form-input mt-1"><option value="">Tất cả dịch vụ</option>{Object.entries(serviceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
        </div>
        <button type="button" onClick={resetFilters} className="mt-3 text-sm font-semibold text-cyan-700 hover:text-cyan-900">Đặt lại bộ lọc</button>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Phiếu trong bộ lọc', analytics.total, 'text-cyan-600', 'bg-cyan-50', CalendarDays],
          ['Tỷ lệ nghiệm thu', `${analytics.total ? ((analytics.completed / analytics.total) * 100).toFixed(1) : 0}%`, 'text-violet-600', 'bg-violet-50', CheckCircle2],
          ['Tỷ lệ trong hạn BH', `${warrantyRate}%`, 'text-emerald-600', 'bg-emerald-50', Sparkles],
          ['Doanh thu nghiệm thu', money(analytics.revenue), 'text-blue-600', 'bg-blue-50', Wallet],
        ].map(([label, value, color, bg, Icon]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}><Icon size={20} /></div><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>)}
      </div>

      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5">
        <div className="flex items-center gap-2"><Lightbulb className="text-indigo-600" size={21} /><h2 className="text-lg font-bold text-slate-900">Phân tích xu hướng & Đề xuất vận hành</h2></div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl bg-white/80 p-4"><p className="font-semibold text-indigo-800">Xu hướng sự cố & Dự báo vật tư</p><p className="mt-2 text-sm text-slate-600">{analytics.total ? `${dominantCategory} đang chiếm ưu thế. Sự cố thường gặp nhất là “${analytics.issues[0]?.[0] || 'chưa đủ dữ liệu'}”; nên ưu tiên tồn kho vật tư và linh kiện cho nhóm này.` : 'Chưa có dữ liệu trong phạm vi lọc để dự báo vật tư.'}</p></div>
          <div className="rounded-xl bg-white/80 p-4"><p className="font-semibold text-cyan-800">Đánh giá bảo hành & chất lượng</p><p className="mt-2 text-sm text-slate-600">{warrantyRate > 50 ? `Có ${warrantyRate}% phiếu trong hạn bảo hành. Nên rà soát chất lượng lắp đặt và độ bền thiết bị.` : `Tỷ lệ bảo hành ${warrantyRate}%, cho thấy chất lượng sau lắp đặt đang tương đối ổn định.`}</p></div>
          <div className="rounded-xl bg-white/80 p-4"><p className="font-semibold text-emerald-800">Đề xuất điều phối nhân sự</p><p className="mt-2 text-sm text-slate-600">{dominantTech ? `${dominantTech.name} đang dẫn đầu với ${dominantTech.completed} ca nghiệm thu và tỷ lệ ${dominantTech.rate.toFixed(1)}%. Có thể ưu tiên ca phức tạp cho nhân sự này, đồng thời cân bằng các ca đang xử lý.` : 'Chưa có kỹ thuật viên được phân công trong phạm vi lọc.'}</p></div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><TrendingUp className="text-cyan-600" size={20} /><h2 className="font-bold text-slate-900">Thống kê tần suất lỗi kỹ thuật chi tiết</h2></div><div className="mt-5 space-y-4">{analytics.issues.slice(0, 6).map(([issue, count]) => <div key={issue}><div className="flex justify-between gap-3 text-sm"><span className="truncate text-slate-700">{issue}</span><span className="shrink-0 font-semibold text-slate-600">{count} ca · {totalIssues ? Math.round((count / totalIssues) * 100) : 0}%</span></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-cyan-500" style={{ width: `${(count / maxIssueCount) * 100}%` }} /></div></div>)}{!analytics.issues.length && <p className="text-sm text-slate-500">Chưa có dữ liệu sự cố.</p>}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Cơ cấu Trạng thái & Đối soát Bảo hành / Thu phí</h2><div className="mt-5 flex h-5 overflow-hidden rounded-full bg-slate-100">{analytics.statusCounts.map((item) => <div key={item.key} className={item.color} style={{ width: `${analytics.total ? (item.count / analytics.total) * 100 : 0}%` }} title={`${item.label}: ${item.count}`} />)}</div><div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">{analytics.statusCounts.map((item) => <div key={item.key} className="flex items-center gap-2 text-slate-600"><span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />{item.label}: {item.count} ({analytics.total ? Math.round((item.count / analytics.total) * 100) : 0}%)</div>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Trong hạn BH · Miễn phí</p><p className="mt-1 text-2xl font-bold text-emerald-900">{analytics.warranty} phiếu</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs text-amber-700">Ngoài hạn BH · Thu phí</p><p className="mt-1 text-2xl font-bold text-amber-900">{analytics.feeOrders} phiếu</p><p className="mt-1 text-xs text-amber-700">Bình quân: {money(avgFee)}/phiếu thu phí</p></div></div><p className="mt-3 text-sm text-slate-600">Doanh thu từ phiếu đã nghiệm thu: <strong className="text-emerald-700">{money(analytics.revenue)}</strong></p></section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={20} /><h2 className="font-bold text-slate-900">Bảng đánh giá KPI & Đối soát doanh thu Kỹ thuật viên</h2></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="border-b border-slate-200 text-slate-500"><tr>{['Hạng', 'Kỹ thuật viên', 'Tổng phiếu giao', 'Đang xử lý', 'Đã nghiệm thu', 'Đơn BH / Đơn thu phí', 'Doanh thu mang về (VNĐ)', 'Tỷ lệ hoàn thành', 'Xếp loại KPI'].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{technicianRows.map((tech, index) => <tr key={tech.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-4 font-bold text-slate-500">#{index + 1}</td><td className="px-3 py-4"><p className="font-semibold text-slate-800">{tech.name}</p><p className="text-xs text-slate-500">{tech.username}</p></td><td className="px-3 py-4">{tech.total}</td><td className="px-3 py-4 text-sky-700">{tech.processing}</td><td className="px-3 py-4 text-emerald-700">{tech.completed}</td><td className="px-3 py-4">{tech.warranty} / {tech.chargeable}</td><td className="px-3 py-4 font-semibold">{money(tech.revenue)}</td><td className="px-3 py-4"><div className="flex items-center gap-2"><div className="h-2 w-20 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-500" style={{ width: `${tech.rate}%` }} /></div><span>{tech.rate.toFixed(1)}%</span></div></td><td className="px-3 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${kpiClass(tech.rate, tech.total)}`}>{!tech.total ? 'Chưa phân công' : tech.rate >= 80 ? 'Hiệu suất cao' : tech.rate >= 50 ? 'Đạt yêu cầu' : 'Cần đôn đốc'}</span></td></tr>)}</tbody></table>{!technicianRows.length && <p className="py-8 text-center text-sm text-slate-500">Chưa có dữ liệu kỹ thuật viên.</p>}</div></section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Sổ cái đối soát phiếu việc & Doanh thu</h2><p className="mt-1 text-sm text-slate-500">Danh sách {filteredOrders.length} phiếu theo phạm vi bộ lọc hiện tại.</p></div><Wallet className="text-emerald-600" size={21} /></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="border-b border-slate-200 text-slate-500"><tr>{['Mã phiếu', 'Ngày tạo', 'Khách hàng', 'Hệ thống & Lỗi chính', 'Kỹ thuật viên', 'Chế độ BH', 'Trạng thái', 'Chi phí nghiệm thu (VNĐ)'].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{filteredOrders.map((order) => <tr key={order._id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-3 font-semibold text-cyan-700">{order.orderCode}</td><td className="px-3 py-3 whitespace-nowrap">{order.createdAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(order.createdAt)) : '—'}</td><td className="px-3 py-3">{order.customer?.name || '—'}</td><td className="px-3 py-3"><span className="font-medium">{systemLabels[order.deviceCategory] || 'Khác'}</span><p className="max-w-[230px] truncate text-xs text-slate-500">{issueSummary(order)}</p></td><td className="px-3 py-3">{order.assignedTo?.fullName || 'Chưa phân công'}</td><td className="px-3 py-3"><span className={order.isUnderWarranty ? 'text-emerald-700' : 'text-amber-700'}>{order.isUnderWarranty ? 'Trong hạn BH' : 'Ngoài hạn BH'}</span></td><td className="px-3 py-3">{statusLabels[order.status] || order.status}</td><td className="px-3 py-3 text-right font-semibold">{money(order.status === 'completed' ? order.serviceFee : 0)}</td></tr>)}</tbody><tfoot><tr className="border-t-2 border-slate-200"><td colSpan="7" className="px-3 py-4 font-bold text-slate-800">TỔNG CỘNG ĐỐI SOÁT ({filteredOrders.length} phiếu)</td><td className="px-3 py-4 text-right font-bold text-emerald-700">{money(analytics.revenue)}</td></tr></tfoot></table>{!filteredOrders.length && <p className="py-8 text-center text-sm text-slate-500">Không có phiếu phù hợp với bộ lọc.</p>}</div></section>
    </section>
  )
}
