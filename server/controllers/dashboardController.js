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
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const [summary] = await WorkOrder.aggregate([
      {
        $facet: {
          groupedStatuses: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          processingToday: [
            {
              $match: {
                scheduledDate: { $gte: startOfDay, $lt: endOfDay },
                status: { $in: ['assigned', 'in_progress'] },
              },
            },
            { $count: 'count' },
          ],
          revenue: [
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$serviceFee' } } },
          ],
          warrantyCounts: [
            {
              $group: {
                _id: '$isUnderWarranty',
                count: { $sum: 1 },
              },
            },
          ],
          categoryBreakdown: [
            { $match: { deviceCategory: { $in: ['camera', 'network'] } } },
            { $group: { _id: '$deviceCategory', count: { $sum: 1 } } },
          ],
        },
      },
    ]);
    const groupedStatuses = summary.groupedStatuses;
    const statusCounts = statuses.reduce((counts, status) => {
      const result = groupedStatuses.find((item) => item._id === status);
      counts[status] = result ? result.count : 0;
      return counts;
    }, {});
    const totalOrders = Object.values(statusCounts).reduce((total, count) => total + count, 0);
    const warrantyCounts = summary.warrantyCounts.reduce((counts, item) => {
      counts[item._id ? 'warranty' : 'outOfWarranty'] = item.count;
      return counts;
    }, { warranty: 0, outOfWarranty: 0 });
    const categoryBreakdown = summary.categoryBreakdown.reduce((counts, item) => {
      counts[item._id] = item.count;
      return counts;
    }, { camera: 0, network: 0 });

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: summary.revenue[0]?.total || 0,
        warrantyOrdersCount: warrantyCounts.warranty,
        outOfWarrantyOrdersCount: warrantyCounts.outOfWarranty,
        categoryBreakdown,
        byStatus: statusCounts,
        processingToday: summary.processingToday[0]?.count || 0,
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
            isActive: '$technician.isActive',
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
