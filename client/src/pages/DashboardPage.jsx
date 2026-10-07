import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardList, Clock3, Percent } from 'lucide-react'
import api from '../api/axiosClient'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/dashboard/summary'), api.get('/dashboard/technician-performance')])
      .then(([summaryResponse, performanceResponse]) => {
        setStats(summaryResponse.data.stats)
        setPerformance(performanceResponse.data.performance || [])
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Không thể tải dữ liệu bảng điều khiển.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Đang tải bảng điều khiển...</div>
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>

  const cards = [
    ['Tổng phiếu công việc', stats?.totalOrders || 0, ClipboardList, 'text-cyan-600', 'bg-cyan-50'],
    ['Đang xử lý hôm nay', stats?.processingToday || 0, Clock3, 'text-amber-600', 'bg-amber-50'],
    ['Đã hoàn thành', stats?.byStatus?.completed || 0, CheckCircle2, 'text-emerald-600', 'bg-emerald-50'],
    ['Tỷ lệ hoàn thành (%)', `${stats?.completionRate || 0}%`, Percent, 'text-violet-600', 'bg-violet-50'],
  ]

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bảng điều khiển</h1>
        <p className="mt-1 text-sm text-slate-500">Tổng quan hoạt động điều phối và nghiệm thu.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, iconColor, background]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${background} ${iconColor}`}><Icon size={22} /></div>
            <p className="mt-5 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Hiệu suất kỹ thuật viên</h2>
        {performance.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">Chưa có dữ liệu nghiệm thu.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr><th className="px-3 py-3 font-medium">Kỹ thuật viên</th><th className="px-3 py-3 font-medium">Số phiếu đã nghiệm thu</th><th className="px-3 py-3 font-medium">Trạng thái hoạt động</th></tr>
              </thead>
              <tbody>
                {performance.map((item) => (
                  <tr key={item.technician.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-4 font-semibold text-slate-800">{item.technician.fullName}</td>
                    <td className="px-3 py-4 text-slate-600">{item.completedOrders}</td>
                    <td className="px-3 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.technician.isActive === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>{item.technician.isActive === false ? 'Tạm ngưng' : 'Đang hoạt động'}</span></td>
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
