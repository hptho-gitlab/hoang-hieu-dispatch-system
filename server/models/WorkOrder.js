const crypto = require('crypto');
const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    orderType: {
      type: String,
      enum: ['installation', 'maintenance', 'warranty'],
      required: true,
    },
    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'completed', 'postponed', 'cancelled'],
      default: 'pending',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    completedAt: Date,
    technicianNotes: String,
    completionPhotos: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

workOrderSchema.pre('save', async function generateOrderCode(next) {
  if (this.orderCode) {
    return next();
  }

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let orderCode;
  do {
    const suffix = crypto.randomInt(0, 10000).toString().padStart(4, '0');
    orderCode = `WO-${date}-${suffix}`;
  } while (await this.constructor.exists({ orderCode })); // eslint-disable-line no-await-in-loop

  this.orderCode = orderCode;
  return next();
});

module.exports = mongoose.model('WorkOrder', workOrderSchema);
