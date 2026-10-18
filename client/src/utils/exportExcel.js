import * as XLSX from 'xlsx'

const serviceLabels = {
  installation: 'Lắp đặt mới',
  maintenance: 'Bảo trì / Sửa chữa',
  warranty: 'Bảo hành',
}

const categoryLabels = {
  camera: 'Camera giám sát',
  network: 'Mạng / Wi-Fi',
}

const statusLabels = {
  pending: 'Chờ xử lý',
  assigned: 'Đã giao việc',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  postponed: 'Tạm hoãn',
  cancelled: 'Đã hủy',
}

function formatDateTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value)).replace(',', '')
}

function formatFileDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mapOrder(order, index) {
  return {
    STT: index + 1,
    'Mã phiếu': order.orderCode || '',
    'Ngày tạo': formatDateTime(order.createdAt),
    'Tiêu đề công việc': order.title || '',
    'Khách hàng': order.customer?.name || '',
    'Số điện thoại': order.customer?.phone || '',
    'Địa chỉ': order.customer?.address || '',
    'Loại dịch vụ': serviceLabels[order.orderType] || order.orderType || '',
    'Hệ thống': categoryLabels[order.deviceCategory] || 'Khác',
    'Chi tiết sự cố': (order.issueDetails || []).join(', '),
    'Kỹ thuật viên': order.assignedTo?.fullName || 'Chưa phân công',
    'Trạng thái': statusLabels[order.status] || order.status || '',
    'Chế độ bảo hành': order.isUnderWarranty ? 'Trong hạn BH (Miễn phí)' : 'Ngoài hạn BH (Thu phí)',
    'Phí bảo trì (VNĐ)': Number(order.serviceFee || 0),
    'Ghi chú nghiệm thu': order.technicianNotes || '',
    'Ngày hoàn thành': formatDateTime(order.completedAt),
  }
}

function createOrderRows(orders) {
  return orders.map(mapOrder)
}

function setOrderColumnWidths(worksheet) {
  worksheet['!cols'] = [
    { wch: 7 },
    { wch: 18 },
    { wch: 19 },
    { wch: 34 },
    { wch: 24 },
    { wch: 16 },
    { wch: 42 },
    { wch: 24 },
    { wch: 22 },
    { wch: 48 },
    { wch: 25 },
    { wch: 18 },
    { wch: 27 },
    { wch: 20 },
    { wch: 48 },
    { wch: 19 },
  ]
}

function downloadWorkbook(workbook, filenamePrefix) {
  XLSX.writeFile(workbook, `${filenamePrefix}_${formatFileDate()}.xlsx`)
}

export function exportOrdersToExcel(orders, filenamePrefix = 'Doi_Soat_Phieu_Viec_Hoang_Hieu') {
  const rows = createOrderRows(orders)
  const totalCompletedRevenue = orders.reduce(
    (total, order) => total + (order.status === 'completed' ? Number(order.serviceFee || 0) : 0),
    0,
  )
  rows.push({
    'Mã phiếu': 'TỔNG DOANH THU ĐÃ NGHIỆM THU (VNĐ)',
    'Phí bảo trì (VNĐ)': totalCompletedRevenue,
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  setOrderColumnWidths(worksheet)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Đối soát phiếu việc')
  downloadWorkbook(workbook, filenamePrefix)
}

export function exportDashboardReportToExcel(summary, techPerformance, orders) {
  const stats = summary || {}
  const categoryBreakdown = stats.categoryBreakdown || {}
  const overviewRows = [
    { 'Chỉ tiêu': 'Tổng phiếu', 'Giá trị': stats.totalOrders || 0 },
    { 'Chỉ tiêu': 'Đã hoàn thành', 'Giá trị': stats.byStatus?.completed || 0 },
    { 'Chỉ tiêu': 'Tỷ lệ hoàn thành (%)', 'Giá trị': stats.completionRate || 0 },
    { 'Chỉ tiêu': 'Doanh thu bảo trì VNĐ', 'Giá trị': Number(stats.totalRevenue || 0) },
    { 'Chỉ tiêu': 'Phiếu trong hạn BH', 'Giá trị': stats.warrantyOrdersCount || 0 },
    { 'Chỉ tiêu': 'Phiếu ngoài hạn BH', 'Giá trị': stats.outOfWarrantyOrdersCount || 0 },
    { 'Chỉ tiêu': 'Camera', 'Giá trị': categoryBreakdown.camera || 0 },
    { 'Chỉ tiêu': 'Mạng / Wi-Fi', 'Giá trị': categoryBreakdown.network || 0 },
  ]
  const performanceRows = (techPerformance || []).map((item) => ({
    'Kỹ thuật viên': item.technician?.fullName || 'Chưa cập nhật',
    'Tên đăng nhập': item.technician?.username || '',
    'Số điện thoại': item.technician?.phone || '',
    'Số phiếu đã nghiệm thu': item.completedOrders || 0,
    'Trạng thái': item.technician?.isActive === false ? 'Tạm ngưng' : 'Đang hoạt động',
  }))

  const overviewSheet = XLSX.utils.json_to_sheet(overviewRows)
  overviewSheet['!cols'] = [{ wch: 32 }, { wch: 22 }]
  const performanceSheet = XLSX.utils.json_to_sheet(performanceRows)
  performanceSheet['!cols'] = [
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 25 },
    { wch: 20 },
  ]
  const ordersSheet = XLSX.utils.json_to_sheet(createOrderRows(orders || []))
  setOrderColumnWidths(ordersSheet)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Tổng quan & Doanh thu')
  XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Hiệu suất kỹ thuật viên')
  XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Chi tiết phiếu việc')
  downloadWorkbook(workbook, 'Bao_Cao_Tong_Hop_Hoang_Hieu')
}
