require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const WorkOrder = require('../models/WorkOrder');

async function seedDatabase() {
  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    User.deleteMany({}),
    WorkOrder.deleteMany({}),
  ]);

  const password = await bcrypt.hash('password123', 10);
  const [admin, technician] = await User.insertMany([
    {
      username: 'admin',
      password,
      fullName: 'Hà Phúc Thọ (Điều phối)',
      phone: '0908123456',
      role: 'admin',
    },
    {
      username: 'tech_nam',
      password,
      fullName: 'Nguyễn Văn Nam (Kỹ thuật)',
      phone: '0912345678',
      role: 'technician',
    },
  ]);

  await WorkOrder.create([
    {
      title: 'Lắp đặt hệ thống 4 camera Dahua',
      orderType: 'installation',
      customer: {
        name: 'Nhà thuốc An Khang',
        phone: '0987654321',
        address: '124 Đại Lộ Bình Dương, TP. Thủ Dầu Một',
      },
      deviceCategory: 'camera',
      issueDetails: ['Khảo sát vị trí lắp đặt', 'Đi dây và cấu hình đầu ghi'],
      isUnderWarranty: false,
      serviceFee: 250000,
      timeline: [
        {
          action: 'created',
          title: 'Khởi tạo phiếu công việc',
          note: 'Tạo phiếu mới trên hệ thống',
          performedBy: admin._id,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ],
      scheduledDate: new Date(),
      createdBy: admin._id,
    },
    {
      title: 'Bảo trì mạng Wi-Fi và Access Point',
      orderType: 'maintenance',
      customer: {
        name: 'The Coffee House',
        phone: '0978112233',
        address: '45 Yersin, Phường Phú Cường, TP. Thủ Dầu Một',
      },
      status: 'assigned',
      assignedTo: technician._id,
      deviceCategory: 'network',
      issueDetails: ['Kiểm tra vùng phủ Wi-Fi', 'Kiểm tra Access Point và dây mạng'],
      isUnderWarranty: true,
      warrantyEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      serviceFee: 0,
      timeline: [
        {
          action: 'created',
          title: 'Khởi tạo phiếu công việc',
          note: 'Tạo phiếu mới trên hệ thống',
          performedBy: admin._id,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
        {
          action: 'assigned',
          title: 'Phân công kỹ thuật viên',
          note: 'Đã giao phiếu cho kỹ thuật viên phụ trách',
          performedBy: admin._id,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          action: 'in_progress',
          title: 'Bắt đầu thực hiện thi công / sửa chữa',
          note: 'Kỹ thuật viên đã tiếp nhận công việc',
          performedBy: technician._id,
          createdAt: new Date(Date.now() - 60 * 60 * 1000),
        },
      ],
      scheduledDate: new Date(),
      createdBy: admin._id,
    },
  ]);

  console.log('Đã tạo dữ liệu mẫu thành công: 2 người dùng và 2 phiếu công việc.');
}

seedDatabase()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Không thể tạo dữ liệu mẫu:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
