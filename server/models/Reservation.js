const mongoose = require('mongoose');

const validReservationStatuses = ['reserved', 'cancelled', 'collected', 'expired'];

const reservationSchema = new mongoose.Schema(
  {
    foodListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: [true, 'Food listing reference is required'],
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required'],
      index: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor reference is required'],
      index: true,
    },
    quantityReserved: {
      type: Number,
      required: [true, 'Reserved quantity is required'],
      min: [0.1, 'Reserved quantity must be greater than zero'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: validReservationStatuses,
        message: '{VALUE} is not a valid reservation status',
      },
      default: 'reserved',
      index: true,
    },
    pickupCodeHash: {
      type: String,
      required: true,
      select: false,
    },
    pickupCodeEncrypted: {
      type: String,
      required: true,
      select: false,
    },
    pickupCodeHint: {
      type: String,
      default: '',
    },
    reservedAt: {
      type: Date,
      default: Date.now,
    },
    pickupDeadline: {
      type: Date,
      required: [true, 'Pickup deadline is required'],
      index: true,
    },
    collectedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for recipient history, donor queue, listing lookup, and expiry queries
reservationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
reservationSchema.index({ donor: 1, status: 1, createdAt: -1 });
reservationSchema.index({ foodListing: 1, status: 1 });
reservationSchema.index({ status: 1, pickupDeadline: 1 });

// Prevent duplicate active reservations by the same recipient for the same listing
reservationSchema.index(
  { foodListing: 1, recipient: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'reserved' },
  }
);

module.exports = mongoose.model('Reservation', reservationSchema);
