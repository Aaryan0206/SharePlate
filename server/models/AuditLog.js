const mongoose = require('mongoose');

const validActionTypes = [
  'USER_DEACTIVATED',
  'USER_ACTIVATED',
  'USER_ROLE_CHANGED',
  'LISTING_MODERATED_CANCEL',
  'RESERVATION_ADMIN_CANCEL',
];

const validTargetTypes = ['User', 'FoodListing', 'Reservation'];

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin reference is required'],
      index: true,
    },
    actionType: {
      type: String,
      required: [true, 'Action type is required'],
      enum: {
        values: validActionTypes,
        message: '{VALUE} is not a valid audit action type',
      },
      index: true,
    },
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      enum: {
        values: validTargetTypes,
        message: '{VALUE} is not a valid target type',
      },
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target record ID is required'],
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
