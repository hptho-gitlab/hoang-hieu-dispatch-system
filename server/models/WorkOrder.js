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
    deviceCategory: {
      type: String,
      enum: ['camera', 'network', 'general'],
      default: 'camera',
    },
    issueDetails: {
      type: [String],
      default: [],
    },
    isUnderWarranty: {
      type: Boolean,
      default: false,
    },
    warrantyEndDate: {
      type: Date,
      default: null,
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    materialsUsed: {
      type: [
        {
          name: { type: String, trim: true },
          quantity: { type: Number, default: 1, min: 0 },
          unit: { type: String, default: 'Cái', trim: true },
          unitPrice: { type: Number, default: 0, min: 0 },
        },
      ],
      default: [],
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
    timeline: [
      {
        action: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        note: {
          type: String,
          default: '',
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

workOrderSchema.pre('save', async function generateOrderCode(next) {
  if (this.isUnderWarranty) {
    this.serviceFee = 0;
  }

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
