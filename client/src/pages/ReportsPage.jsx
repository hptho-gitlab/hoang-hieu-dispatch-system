import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardList,
  Download,
  Layers3,
  Percent,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import api from '../api/axiosClient'
import { exportDashboardReportToExcel } from '../utils/exportExcel'

function formatCurrency(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} ₫`
}

function buildTechnicianReports(orders) {
  const reports = new Map()

  orders.forEach((order) => {
    const technician = order.assignedTo
    if (!technician?._id) return

    if (!reports.has(technician._id)) {
      reports.set(technician._id, {
        id: technician._id,
        fullName: technician.fullName || 'Chưa cập nhật',
        username: technician.username || '',
        phone: technician.phone || '',
        isActive: technician.isActive !== false,
        totalAssigned: 0,
        inProgress: 0,
        completed: 0,
      })
    }

    const report = reports.get(technician._id)
    report.totalAssigned += 1
    if (order.status === 'in_progress') report.inProgress += 1
    if (order.status === 'completed') report.completed += 1
  })

  return [...reports.values()]
    .map((report) => ({
      ...report,
      completionRate: report.totalAssigned
        ? Number(((report.completed / report.totalAssigned) * 100).toFixed(2))
        : 0,
    }))
    .sort((first, second) => second.completed - first.completed || first.fullName.localeCompare(second.fullName))
}

export default function ReportsPage() {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/orders'),
    ])
      .then(([summaryResponse, ordersResponse]) => {
        setStats(summaryResponse.data.stats || {})
        setOrders(ordersResponse.data.orders || [])
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Không thể tải dữ liệu báo cáo.')
      })
      .finally(() => setLoading(false))
  }, [])

  const technicianReports = useMemo(() => buildTechnicianReports(orders), [orders])

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      const [summaryResponse, performanceResponse, ordersResponse] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/technician-performance'),
        api.get('/orders'),
      ])
      exportDashboardReportToExcel(
        summaryResponse.data.stats || {},
        performanceResponse.data.performance || [],
        ordersResponse.data.orders || [],
      )
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xuất báo cáo Excel.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-sm text-slate-500">Đang tải báo cáo & thống kê...</div>
  }

  if (error && !stats) {
    return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
  }

  const cards = [
    ['Tổng phiếu công việc', stats?.totalOrders || 0, ClipboardList, 'text-cyan-600', 'bg-cyan-50'],
    ['Tỷ lệ hoàn thành', `${stats?.completionRate || 0}%`, Percent, 'text-violet-600', 'bg-violet-50'],
    ['Phiếu trong hạn BH', stats?.warrantyOrdersCount || 0, ShieldCheck, 'text-emerald-600', 'bg-emerald-50'],
    ['Tổng doanh thu', formatCurrency(stats?.totalRevenue), Wallet, 'text-blue-600', 'bg-blue-50'],
  ]

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo & Thống kê</h1>
          <p className="mt-1 text-sm text-slate-500">Phân tích hiệu suất xử lý và đối soát phiếu việc.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="print:hidden inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={18} />
          {exporting ? 'Đang xuất báo cáo...' : '📥 Xuất báo cáo Excel (.xlsx)'}
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, iconColor, background]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${background} ${iconColor}`}>
              <Icon size={22} />
            </div>
            <p className="mt-5 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Layers3 size={20} className="text-cyan-600" />
          <h2 className="text-lg font-bold text-slate-900">Phân tích theo hệ thống</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-cyan-50 p-5">
            <p className="text-sm font-medium text-cyan-700">Camera giám sát</p>
            <p className="mt-2 text-3xl font-bold text-cyan-900">{stats?.categoryBreakdown?.camera || 0}</p>
            <p className="mt-1 text-xs text-cyan-700">phiếu công việc</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-5">
            <p className="text-sm font-medium text-indigo-700">Mạng / Wi-Fi</p>
            <p className="mt-2 text-3xl font-bold text-indigo-900">{stats?.categoryBreakdown?.network || 0}</p>
            <p className="mt-1 text-xs text-indigo-700">phiếu công việc</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Hiệu suất kỹ thuật viên</h2>
            <p className="mt-1 text-sm text-slate-500">Tổng hợp theo các phiếu đã được phân công.</p>
          </div>
          <CheckCircle2 size={22} className="text-emerald-600" />
        </div>
        {technicianReports.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">Chưa có dữ liệu kỹ thuật viên được phân công.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Kỹ thuật viên</th>
                  <th className="px-3 py-3 font-medium">Tổng phiếu được giao</th>
                  <th className="px-3 py-3 font-medium">Đang thực hiện</th>
                  <th className="px-3 py-3 font-medium">Đã hoàn thành</th>
                  <th className="px-3 py-3 font-medium">Tỷ lệ hoàn thành</th>
                  <th className="px-3 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {technicianReports.map((technician) => (
                  <tr key={technician.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-800">{technician.fullName}</p>
                      <p className="mt-1 text-xs text-slate-500">{technician.username} · {technician.phone}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-600">{technician.totalAssigned}</td>
                    <td className="px-3 py-4 text-amber-700">{technician.inProgress}</td>
                    <td className="px-3 py-4 text-emerald-700">{technician.completed}</td>
                    <td className="px-3 py-4 font-semibold text-slate-700">{technician.completionRate}%</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${technician.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {technician.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
