const mongoose = require('mongoose');

const validCategories = [
  'cooked meals',
  'bakery',
  'fruits and vegetables',
  'packaged food',
  'groceries',
  'other',
];

const validUnits = ['servings', 'kg', 'packets', 'boxes', 'loaves', 'packs'];

const validStatuses = ['available', 'reserved', 'collected', 'expired', 'cancelled'];

const foodListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a food title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description of the food'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a food category'],
      lowercase: true,
      trim: true,
      enum: {
        values: validCategories,
        message: '{VALUE} is not a valid category. Valid options: ' + validCategories.join(', '),
      },
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please specify the available quantity'],
      min: [0.1, 'Quantity must be greater than zero'],
    },
    originalQuantity: {
      type: Number,
      min: [0.1, 'Original quantity must be greater than zero'],
    },
    availableQuantity: {
      type: Number,
      min: [0, 'Available quantity cannot be negative'],
    },
    reservedQuantity: {
      type: Number,
      min: [0, 'Reserved quantity cannot be negative'],
      default: 0,
    },
    collectedQuantity: {
      type: Number,
      min: [0, 'Collected quantity cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      required: [true, 'Please specify the unit (servings, kg, packets, boxes, loaves)'],
      lowercase: true,
      trim: true,
      enum: {
        values: validUnits,
        message: '{VALUE} is not a valid unit. Allowed units: ' + validUnits.join(', '),
      },
    },
    servingsCount: {
      type: Number,
      min: [1, 'Servings count must be at least 1'],
      default: null,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Food listing must be associated with a donor'],
      index: true,
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
      maxlength: [300, 'Pickup address cannot exceed 300 characters'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude] in GeoJSON format
        validate: {
          validator: function (val) {
            // Optional: existing listings without coordinates remain valid
            if (!val || val.length === 0) return true;
            if (val.length !== 2) return false;
            const [lng, lat] = val;
            return (
              typeof lng === 'number' &&
              typeof lat === 'number' &&
              !isNaN(lng) &&
              !isNaN(lat) &&
              lng >= -180 &&
              lng <= 180 &&
              lat >= -90 &&
              lat <= 90
            );
          },
          message:
            'Coordinates must be [longitude, latitude] with longitude between -180 and 180, and latitude between -90 and 90.',
        },
      },
    },
    pickupInstructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Pickup instructions cannot exceed 500 characters'],
      default: '',
    },
    pickupStartTime: {
      type: Date,
      required: [true, 'Pickup start time is required'],
    },
    pickupEndTime: {
      type: Date,
      required: [true, 'Pickup end time is required'],
    },
    expiryTime: {
      type: Date,
      required: [true, 'Food expiry date and time is required'],
      index: true,
    },
    allergenInformation: {
      type: String,
      trim: true,
      default: 'None specified',
    },
    foodHandlingNotes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: validStatuses,
        message: '{VALUE} is not a valid listing status',
      },
      default: 'available',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal query performance on browse and filter operations
foodListingSchema.index({ status: 1, expiryTime: 1, createdAt: -1 });
foodListingSchema.index({ category: 1, status: 1 });
foodListingSchema.index({ donor: 1, status: 1 });
foodListingSchema.index({ location: '2dsphere' }, { sparse: true });

// Virtual to check if listing has expired
foodListingSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiryTime;
});

// Pre-save validation for date ordering and quantity consistency
foodListingSchema.pre('save', function (next) {
  // Initialize originalQuantity & availableQuantity on new listings or missing fields
  if (this.originalQuantity === undefined || this.originalQuantity === null) {
    this.originalQuantity = this.quantity;
  }
  if (this.availableQuantity === undefined || this.availableQuantity === null) {
    this.availableQuantity = this.quantity;
  }
  if (this.reservedQuantity === undefined || this.reservedQuantity === null) {
    this.reservedQuantity = 0;
  }
  if (this.collectedQuantity === undefined || this.collectedQuantity === null) {
    this.collectedQuantity = 0;
  }

  // Ensure pickupStartTime is earlier than pickupEndTime
  if (this.pickupStartTime >= this.pickupEndTime) {
    return next(new Error('Pickup start time must be earlier than pickup end time'));
  }
  // Ensure pickupEndTime is not after expiryTime
  if (this.pickupEndTime > this.expiryTime) {
    return next(new Error('Pickup end time cannot exceed the food expiry time'));
  }
  next();
});

// Enable virtuals in JSON responses
foodListingSchema.set('toJSON', { virtuals: true });
foodListingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FoodListing', foodListingSchema);
