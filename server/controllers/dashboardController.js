const WorkOrder = require('../models/WorkOrder');

const statuses = [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'postponed',
  'cancelled',
];

async function getSummaryStats(req, res, next) {
  try {
    const groupedStatuses = await WorkOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statusCounts = statuses.reduce((counts, status) => {
      const result = groupedStatuses.find((item) => item._id === status);
      counts[status] = result ? result.count : 0;
      return counts;
    }, {});
    const totalOrders = Object.values(statusCounts).reduce((total, count) => total + count, 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        byStatus: statusCounts,
        completionRate: totalOrders
          ? Number(((statusCounts.completed / totalOrders) * 100).toFixed(2))
          : 0,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getTechnicianPerformance(req, res, next) {
  try {
    const performance = await WorkOrder.aggregate([
      { $match: { status: 'completed', assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', completedOrders: { $sum: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'technician',
        },
      },
      { $unwind: '$technician' },
      {
        $project: {
          _id: 0,
          technician: {
            id: '$technician._id',
            username: '$technician.username',
            fullName: '$technician.fullName',
            phone: '$technician.phone',
          },
          completedOrders: 1,
        },
      },
      { $sort: { completedOrders: -1, 'technician.fullName': 1 } },
    ]);

    return res.status(200).json({
      success: true,
      performance,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getSummaryStats, getTechnicianPerformance };
