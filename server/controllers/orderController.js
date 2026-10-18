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

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return value === 'true';
}

function parseJsonField(value, fieldName, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    const parseError = new Error(`${fieldName} không đúng định dạng JSON`);
    parseError.statusCode = 400;
    throw parseError;
  }
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
        { orderCode: searchRegex },
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
      .populate('assignedTo', 'username fullName phone role isActive')
      .populate('createdBy', 'username fullName');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    await order.populate('timeline.performedBy', 'fullName username role');

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return next(error);
  }
}

async function getCustomerHistory(req, res, next) {
  try {
    const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';
    if (!phone) {
      return sendValidationError(res, 'Vui lòng cung cấp số điện thoại khách hàng');
    }

    const orders = await WorkOrder.find({ 'customer.phone': phone })
      .populate('assignedTo', 'username fullName phone role')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const {
      title,
      orderType,
      customer,
      scheduledDate,
      deviceCategory,
      issueDetails,
      isUnderWarranty,
      warrantyEndDate,
      serviceFee,
      materialsUsed,
      assignedTo,
    } = req.body || {};
    const warranty = parseBoolean(isUnderWarranty);
    let parsedIssueDetails;
    let parsedMaterials;
    try {
      parsedIssueDetails = parseJsonField(issueDetails, 'issueDetails', []);
      parsedMaterials = parseJsonField(materialsUsed, 'materialsUsed', []);
    } catch (error) {
      return sendValidationError(res, error.message);
    }
    const parsedServiceFee = serviceFee === undefined || serviceFee === ''
      ? 0
      : Number(serviceFee);
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
      || (deviceCategory && !['camera', 'network', 'general'].includes(deviceCategory))
      || !Array.isArray(parsedIssueDetails)
      || !Array.isArray(parsedMaterials)
      || Number.isNaN(parsedServiceFee)
      || parsedServiceFee < 0
      || (warrantyEndDate && Number.isNaN(new Date(warrantyEndDate).getTime()))
    ) {
      return sendValidationError(res, 'Vui lòng nhập đầy đủ thông tin đơn hàng hợp lệ');
    }

    let assignedTechnician = null;
    if (assignedTo !== undefined) {
      if (!isValidId(assignedTo)) {
        return sendValidationError(res, 'Kỹ thuật viên được phân công không hợp lệ');
      }
      assignedTechnician = await User.findOne({
        _id: assignedTo,
        role: 'technician',
        isActive: true,
      });
      if (!assignedTechnician) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy kỹ thuật viên đang hoạt động',
        });
      }
    }

    const timeline = [{
      action: 'created',
      title: 'Khởi tạo phiếu công việc',
      note: 'Tạo phiếu mới trên hệ thống',
      performedBy: req.user.id,
    }];
    if (assignedTechnician) {
      timeline.push({
        action: 'assigned',
        title: 'Phân công kỹ thuật viên',
        note: 'Đã giao phiếu cho kỹ thuật viên phụ trách',
        performedBy: req.user.id,
      });
    }

    const order = await WorkOrder.create({
      title: title.trim(),
      orderType,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
      },
      deviceCategory,
      issueDetails: parsedIssueDetails,
      isUnderWarranty: warranty,
      warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null,
      serviceFee: warranty ? 0 : parsedServiceFee,
      materialsUsed: parsedMaterials,
      assignedTo: assignedTechnician ? assignedTechnician._id : null,
      status: assignedTechnician ? 'assigned' : 'pending',
      timeline,
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

    const order = await WorkOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    order.assignedTo = technician._id;
    order.status = 'assigned';
    order.timeline.push({
      action: 'assigned',
      title: 'Điều phối / Phân công kỹ thuật viên',
      note: `Phân công cho: ${technician.fullName}`,
      performedBy: req.user.id,
    });
    await order.save();
    await order.populate('assignedTo', 'username fullName phone role isActive');

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
    const { status, technicianNotes, reason } = req.body || {};
    if (!['in_progress', 'postponed', 'cancelled', 'pending'].includes(status)) {
      return sendValidationError(res, 'Trạng thái cập nhật không hợp lệ');
    }
    if (status === 'postponed' && (!technicianNotes || !technicianNotes.trim())) {
      return sendValidationError(res, 'Vui lòng nhập lý do hoãn đơn hàng');
    }
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const order = await WorkOrder.findOne({
      _id: req.params.id,
      assignedTo: req.user.id,
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng được phân công cho bạn',
      });
    }
    const statusTitles = {
      in_progress: 'Bắt đầu thực hiện thi công / sửa chữa',
      postponed: 'Tạm hoãn lịch hẹn',
      cancelled: 'Hủy phiếu công việc',
      pending: 'Chuyển về trạng thái chờ xử lý',
    };
    order.status = status;
    if (technicianNotes !== undefined) order.technicianNotes = technicianNotes.trim();
    order.timeline.push({
      action: status,
      title: statusTitles[status],
      note: reason || technicianNotes || '',
      performedBy: req.user.id,
    });
    await order.save();

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

    const {
      technicianNotes,
      serviceFee,
      materialsUsed,
    } = req.body || {};
    if (typeof technicianNotes !== 'string' || !technicianNotes.trim()) {
      return sendValidationError(res, 'Vui lòng nhập ghi chú hoàn thành đơn hàng');
    }
    let parsedMaterials;
    try {
      parsedMaterials = parseJsonField(materialsUsed, 'materialsUsed', []);
    } catch (error) {
      return sendValidationError(res, error.message);
    }
    if (!Array.isArray(parsedMaterials)) {
      return sendValidationError(res, 'Danh sách vật tư không hợp lệ');
    }
    const parsedServiceFee = serviceFee === undefined || serviceFee === ''
      ? undefined
      : Number(serviceFee);
    if (parsedServiceFee !== undefined
      && (Number.isNaN(parsedServiceFee) || parsedServiceFee < 0)) {
      return sendValidationError(res, 'Phí dịch vụ không hợp lệ');
    }

    const completionPhotos = (req.files || [])
      .map((file) => file.path || file.secure_url)
      .filter(Boolean);
    const currentOrder = await WorkOrder.findOne({
      _id: req.params.id,
      assignedTo: req.user.id,
    });
    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng được phân công cho bạn',
      });
    }

    const underWarranty = currentOrder.isUnderWarranty;
    const update = {
      status: 'completed',
      completedAt: new Date(),
      technicianNotes: technicianNotes.trim(),
      completionPhotos,
      materialsUsed: parsedMaterials,
    };
    if (!underWarranty && parsedServiceFee !== undefined) {
      update.serviceFee = parsedServiceFee;
    } else if (underWarranty) {
      update.serviceFee = 0;
    }

    currentOrder.status = update.status;
    currentOrder.completedAt = update.completedAt;
    currentOrder.technicianNotes = update.technicianNotes;
    currentOrder.completionPhotos = update.completionPhotos;
    currentOrder.materialsUsed = update.materialsUsed;
    if (update.serviceFee !== undefined) currentOrder.serviceFee = update.serviceFee;
    currentOrder.timeline.push({
      action: 'completed',
      title: 'Hoàn thành & Nghiệm thu hiện trường',
      note: `Nghiệm thu kèm ${completionPhotos.length} ảnh. Phí dịch vụ: ${(currentOrder.serviceFee || 0).toLocaleString('vi-VN')}đ`,
      performedBy: req.user.id,
    });
    await currentOrder.save();

    return res.status(200).json({
      success: true,
      message: 'Hoàn thành đơn hàng thành công',
      order: currentOrder,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getOrders,
  getOrderById,
  getCustomerHistory,
  createOrder,
  assignTechnician,
  updateStatus,
  completeOrder,
};
