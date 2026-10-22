export const statusLabels = {
  pending: 'Chờ xử lý',
  assigned: 'Đã giao',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  postponed: 'Tạm hoãn',
  cancelled: 'Đã hủy',
}

export const statusClasses = {
  pending: 'bg-amber-100 text-amber-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-emerald-100 text-emerald-700',
  postponed: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
}

export const orderTypeLabels = {
  installation: 'Lắp đặt',
  maintenance: 'Bảo trì',
  warranty: 'Bảo hành',
}

export const serviceLabels = {
  installation: 'Lắp đặt mới',
  maintenance: 'Bảo trì / Sửa chữa',
  warranty: 'Bảo hành',
}

export function formatDate(value) {
  if (!value) return 'Chưa cập nhật'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
