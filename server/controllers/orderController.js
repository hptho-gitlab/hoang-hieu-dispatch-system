const mongoose = require('mongoose');
const User = require('../models/User');
const WorkOrder = require('../models/WorkOrder');

const orderStatuses = [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'postponed',
  'cancelled',
];

function sendValidationError(res, message) {
  return res.status(400).json({ success: false, message });
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

async function getOrders(req, res, next) {
  try {
    const filter = {};
    const { status, orderType, search } = req.query;

    if (status) {
      if (!orderStatuses.includes(status)) {
        return sendValidationError(res, 'Trạng thái đơn hàng không hợp lệ');
      }
      filter.status = status;
    }
    if (orderType) {
      if (!['installation', 'maintenance', 'warranty'].includes(orderType)) {
        return sendValidationError(res, 'Loại đơn hàng không hợp lệ');
      }
      filter.orderType = orderType;
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { 'customer.name': searchRegex },
        { 'customer.phone': searchRegex },
      ];
    }
    if (req.user.role === 'technician') {
      filter.assignedTo = req.user.id;
    }

    const orders = await WorkOrder.find(filter)
      .populate('assignedTo', 'username fullName phone role')
      .sort({ scheduledDate: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const filter = { _id: req.params.id };
    if (req.user.role === 'technician') {
      filter.assignedTo = req.user.id;
    }

    const order = await WorkOrder.findOne(filter)
      .populate('assignedTo', 'username fullName phone role')
      .populate('createdBy', 'username fullName');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const {
      title, orderType, customer, scheduledDate,
    } = req.body || {};
    if (
      typeof title !== 'string'
      || !title.trim()
      || !['installation', 'maintenance', 'warranty'].includes(orderType)
      || !customer
      || typeof customer.name !== 'string'
      || typeof customer.phone !== 'string'
      || typeof customer.address !== 'string'
      || !customer.name.trim()
      || !customer.phone.trim()
      || !customer.address.trim()
      || !scheduledDate
      || Number.isNaN(new Date(scheduledDate).getTime())
    ) {
      return sendValidationError(res, 'Vui lòng nhập đầy đủ thông tin đơn hàng hợp lệ');
    }

    const order = await WorkOrder.create({
      title: title.trim(),
      orderType,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
      },
      scheduledDate: new Date(scheduledDate),
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      order,
    });
  } catch (error) {
    return next(error);
  }
}

async function assignTechnician(req, res, next) {
  try {
    const { technicianId } = req.body || {};
    if (!isValidId(req.params.id) || !isValidId(technicianId)) {
      return sendValidationError(res, 'Thông tin kỹ thuật viên hoặc đơn hàng không hợp lệ');
    }

    const technician = await User.findOne({
      _id: technicianId,
      role: 'technician',
      isActive: true,
    });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kỹ thuật viên đang hoạt động',
      });
    }

    const order = await WorkOrder.findByIdAndUpdate(
      req.params.id,
      { assignedTo: technician._id, status: 'assigned' },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'username fullName phone role');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    return res.status(200).json({
      success: true,
      message: 'Phân công kỹ thuật viên thành công',
      order,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status, technicianNotes } = req.body || {};
    if (!['in_progress', 'postponed'].includes(status)) {
      return sendValidationError(res, 'Trạng thái cập nhật không hợp lệ');
    }
    if (status === 'postponed' && (!technicianNotes || !technicianNotes.trim())) {
      return sendValidationError(res, 'Vui lòng nhập lý do hoãn đơn hàng');
    }
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const order = await WorkOrder.findOneAndUpdate(
      { _id: req.params.id, assignedTo: req.user.id },
      {
        status,
        ...(technicianNotes !== undefined ? { technicianNotes: technicianNotes.trim() } : {}),
      },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng được phân công cho bạn',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      order,
    });
  } catch (error) {
    return next(error);
  }
}

async function completeOrder(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const { technicianNotes } = req.body || {};
    if (typeof technicianNotes !== 'string' || !technicianNotes.trim()) {
      return sendValidationError(res, 'Vui lòng nhập ghi chú hoàn thành đơn hàng');
    }

    const completionPhotos = (req.files || [])
      .map((file) => file.path || file.secure_url)
      .filter(Boolean);
    const order = await WorkOrder.findOneAndUpdate(
      { _id: req.params.id, assignedTo: req.user.id },
      {
        status: 'completed',
        completedAt: new Date(),
        technicianNotes: technicianNotes.trim(),
        completionPhotos,
      },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng được phân công cho bạn',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hoàn thành đơn hàng thành công',
      order,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  assignTechnician,
  updateStatus,
  completeOrder,
};
