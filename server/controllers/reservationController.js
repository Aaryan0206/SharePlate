const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const FoodListing = require('../models/FoodListing');
const {
  generatePickupCode,
  hashPickupCode,
  verifyPickupCode,
  encryptPickupCode,
  decryptPickupCode,
} = require('../utils/pickupCode');

/**
 * Ensures legacy FoodListing documents have quantity tracking fields initialized
 * before performing atomic conditional updates.
 */
async function ensureListingQuantityInitialized(listingId) {
  await FoodListing.updateOne(
    { _id: listingId, availableQuantity: { $exists: false } },
    [
      {
        $set: {
          originalQuantity: '$quantity',
          availableQuantity: '$quantity',
          reservedQuantity: { $ifNull: ['$reservedQuantity', 0] },
          collectedQuantity: { $ifNull: ['$collectedQuantity', 0] },
        },
      },
    ]
  );
}

/**
 * Lazily expires reservations whose pickupDeadline has passed and safely restores
 * stock at most once using atomic status transitions.
 */
async function syncExpiredReservations(filter = {}) {
  const now = new Date();
  const expiredCandidates = await Reservation.find({
    ...filter,
    status: 'reserved',
    pickupDeadline: { $lt: now },
  }).select('_id foodListing quantityReserved');

  for (const candidate of expiredCandidates) {
    const transitioned = await Reservation.findOneAndUpdate(
      {
        _id: candidate._id,
        status: 'reserved',
        pickupDeadline: { $lt: now },
      },
      {
        $set: { status: 'expired' },
      },
      { new: true }
    );

    if (!transitioned) continue;

    // Restore quantity only if the listing itself is still active and unexpired
    const listing = await FoodListing.findById(transitioned.foodListing);
    if (!listing) continue;

    if (listing.expiryTime > now && ['available', 'reserved'].includes(listing.status)) {
      const restored = await FoodListing.findOneAndUpdate(
        { _id: listing._id },
        {
          $inc: {
            availableQuantity: transitioned.quantityReserved,
            reservedQuantity: -transitioned.quantityReserved,
          },
        },
        { new: true }
      );
      if (restored && restored.status === 'reserved' && restored.availableQuantity > 0) {
        await FoodListing.updateOne(
          { _id: restored._id, status: 'reserved', availableQuantity: { $gt: 0 } },
          { $set: { status: 'available' } }
        );
      }
    } else {
      await FoodListing.updateOne(
        { _id: listing._id },
        {
          $inc: { reservedQuantity: -transitioned.quantityReserved },
          ...(listing.expiryTime <= now && listing.status !== 'collected' && listing.status !== 'cancelled'
            ? { $set: { status: 'expired' } }
            : {}),
        }
      );
    }
  }
}

// @desc    Reserve a quantity of an available food listing
// @route   POST /api/reservations
// @access  Private (Recipient only)
exports.createReservation = async (req, res, next) => {
  try {
    const { foodListingId, quantityReserved } = req.body;

    if (!foodListingId || !mongoose.Types.ObjectId.isValid(foodListingId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid foodListingId is required.',
      });
    }

    const qty = Number(quantityReserved);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'quantityReserved must be a positive number greater than zero.',
      });
    }

    // Backfill quantity fields if this listing predates Phase 5
    await ensureListingQuantityInitialized(foodListingId);

    const now = new Date();

    // Atomic conditional decrement: prevents check-then-update race conditions
    const updatedListing = await FoodListing.findOneAndUpdate(
      {
        _id: foodListingId,
        status: 'available',
        expiryTime: { $gt: now },
        availableQuantity: { $gte: qty },
      },
      {
        $inc: {
          availableQuantity: -qty,
          reservedQuantity: qty,
        },
      },
      { new: true }
    );

    if (!updatedListing) {
      const existing = await FoodListing.findById(foodListingId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Food listing not found.',
        });
      }
      if (existing.expiryTime <= now || existing.status === 'expired') {
        return res.status(400).json({
          success: false,
          message: 'This food listing has expired and can no longer be reserved.',
        });
      }
      if (existing.status === 'cancelled' || existing.status === 'collected') {
        return res.status(400).json({
          success: false,
          message: `This food listing is ${existing.status} and unavailable for reservation.`,
        });
      }
      const remaining = existing.availableQuantity ?? existing.quantity ?? 0;
      return res.status(409).json({
        success: false,
        message:
          remaining <= 0
            ? 'All portions of this food listing have already been reserved.'
            : `Insufficient quantity available. Only ${remaining} ${existing.unit} remaining.`,
      });
    }

    // Prevent donor from reserving their own listing
    if (updatedListing.donor.toString() === req.user._id.toString()) {
      await FoodListing.updateOne(
        { _id: foodListingId },
        { $inc: { availableQuantity: qty, reservedQuantity: -qty } }
      );
      return res.status(403).json({
        success: false,
        message: 'Donors cannot reserve their own food listings.',
      });
    }

    // If remaining available quantity reached 0, mark listing status as 'reserved'
    if (updatedListing.availableQuantity <= 0) {
      await FoodListing.updateOne(
        { _id: foodListingId, availableQuantity: { $lte: 0 }, status: 'available' },
        { $set: { status: 'reserved' } }
      );
    }

    const plainCode = generatePickupCode();
    const pickupCodeHash = hashPickupCode(plainCode);
    const pickupCodeEncrypted = encryptPickupCode(plainCode);
    const pickupCodeHint = `****-${plainCode.slice(-2)}`;

    const pickupDeadline =
      updatedListing.pickupEndTime && updatedListing.pickupEndTime <= updatedListing.expiryTime
        ? updatedListing.pickupEndTime
        : updatedListing.expiryTime;

    let reservation;
    try {
      reservation = await Reservation.create({
        foodListing: updatedListing._id,
        recipient: req.user._id,
        donor: updatedListing.donor,
        quantityReserved: qty,
        unit: updatedListing.unit,
        status: 'reserved',
        pickupCodeHash,
        pickupCodeEncrypted,
        pickupCodeHint,
        reservedAt: now,
        pickupDeadline,
      });
    } catch (createErr) {
      // Compensating rollback: restore listing quantity and availability if reservation creation fails
      const rolledBack = await FoodListing.findOneAndUpdate(
        { _id: foodListingId },
        {
          $inc: {
            availableQuantity: qty,
            reservedQuantity: -qty,
          },
        },
        { new: true }
      );
      if (rolledBack && rolledBack.status === 'reserved' && rolledBack.availableQuantity > 0) {
        await FoodListing.updateOne(
          { _id: foodListingId, status: 'reserved', availableQuantity: { $gt: 0 } },
          { $set: { status: 'available' } }
        );
      }

      if (createErr.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'You already have an active reservation for this food listing.',
        });
      }
      throw createErr;
    }

    const populated = await Reservation.findById(reservation._id)
      .populate('foodListing', 'title category unit pickupAddress pickupInstructions pickupStartTime pickupEndTime expiryTime imageUrl availableQuantity status')
      .populate('donor', 'name organizationType phone');

    const responseObj = populated.toObject();
    responseObj.pickupCode = plainCode;

    res.status(201).json({
      success: true,
      message: 'Food reservation confirmed! Present your pickup code when collecting.',
      reservation: responseObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated recipient's reservation history
// @route   GET /api/reservations/my-reservations
// @access  Private (Recipient or Admin)
exports.getMyReservations = async (req, res, next) => {
  try {
    await syncExpiredReservations({ recipient: req.user._id });

    const filter = { recipient: req.user._id };
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const reservations = await Reservation.find(filter)
      .select('+pickupCodeEncrypted')
      .populate('foodListing', 'title category unit pickupAddress pickupInstructions pickupStartTime pickupEndTime expiryTime imageUrl availableQuantity status location')
      .populate('donor', 'name organizationType phone')
      .sort({ createdAt: -1 });

    const formatted = reservations.map((r) => {
      const obj = r.toObject();
      const encrypted = obj.pickupCodeEncrypted;
      delete obj.pickupCodeEncrypted;
      delete obj.pickupCodeHash;

      if (obj.status === 'reserved' && encrypted) {
        obj.pickupCode = decryptPickupCode(encrypted);
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      reservations: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reservations for listings owned by the authenticated donor
// @route   GET /api/reservations/donor
// @access  Private (Donor or Admin)
exports.getDonorReservations = async (req, res, next) => {
  try {
    await syncExpiredReservations({ donor: req.user._id });

    const filter = { donor: req.user._id };
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    if (req.query.foodListingId && mongoose.Types.ObjectId.isValid(req.query.foodListingId)) {
      filter.foodListing = req.query.foodListingId;
    }

    const reservations = await Reservation.find(filter)
      .populate('foodListing', 'title category unit pickupAddress pickupStartTime pickupEndTime expiryTime imageUrl originalQuantity availableQuantity reservedQuantity collectedQuantity status')
      .populate('recipient', 'name email phone organizationType')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single reservation details (recipient owner, donor owner, or admin)
// @route   GET /api/reservations/:id
// @access  Private
exports.getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID format.',
      });
    }

    await syncExpiredReservations({ _id: id });

    const reservation = await Reservation.findById(id)
      .select('+pickupCodeEncrypted')
      .populate('foodListing', 'title category unit pickupAddress pickupInstructions pickupStartTime pickupEndTime expiryTime imageUrl availableQuantity status location')
      .populate('donor', 'name organizationType phone')
      .populate('recipient', 'name email phone organizationType');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.',
      });
    }

    const isRecipient = reservation.recipient._id.toString() === req.user._id.toString();
    const isDonor = reservation.donor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRecipient && !isDonor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this reservation.',
      });
    }

    const obj = reservation.toObject();
    const encrypted = obj.pickupCodeEncrypted;
    delete obj.pickupCodeEncrypted;
    delete obj.pickupCodeHash;

    // Only expose the full pickup verification code to the authorized recipient while active
    if (isRecipient && obj.status === 'reserved' && encrypted) {
      obj.pickupCode = decryptPickupCode(encrypted);
    }

    res.status(200).json({
      success: true,
      reservation: obj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an eligible reservation and restore listing quantity once
// @route   PATCH /api/reservations/:id/cancel
// @access  Private (Recipient owner or Admin)
exports.cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID format.',
      });
    }

    const existing = await Reservation.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.',
      });
    }

    const isRecipient = existing.recipient.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isRecipient && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only cancel your own reservations.',
      });
    }

    // Atomic state transition: ensures repeated cancellations never restore quantity twice
    const cancelled = await Reservation.findOneAndUpdate(
      { _id: id, status: 'reserved' },
      { $set: { status: 'cancelled', cancelledAt: new Date() } },
      { new: true }
    );

    if (!cancelled) {
      if (existing.status === 'collected') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel a reservation that has already been collected.',
        });
      }
      if (existing.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'This reservation has already been cancelled.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Cannot cancel reservation in "${existing.status}" status.`,
      });
    }

    // Restore reserved quantity to FoodListing atomically
    const restoredListing = await FoodListing.findOneAndUpdate(
      { _id: cancelled.foodListing },
      {
        $inc: {
          availableQuantity: cancelled.quantityReserved,
          reservedQuantity: -cancelled.quantityReserved,
        },
      },
      { new: true }
    );

    if (
      restoredListing &&
      restoredListing.status === 'reserved' &&
      restoredListing.availableQuantity > 0 &&
      restoredListing.expiryTime > new Date()
    ) {
      await FoodListing.updateOne(
        { _id: restoredListing._id, status: 'reserved', availableQuantity: { $gt: 0 } },
        { $set: { status: 'available' } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled and food quantity restored.',
      reservation: cancelled,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify pickup code and mark reservation as collected (idempotent)
// @route   POST /api/reservations/:id/verify-pickup
// @access  Private (Donor owner or Admin)
exports.verifyPickup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pickupCode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID format.',
      });
    }

    if (!pickupCode || typeof pickupCode !== 'string' || !pickupCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pickup verification code is required.',
      });
    }

    const reservation = await Reservation.findById(id).select('+pickupCodeHash');
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.',
      });
    }

    const isDonor = reservation.donor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isDonor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to verify pickup for this reservation.',
      });
    }

    // Idempotent handling: repeated verification does not modify quantities twice
    if (reservation.status === 'collected') {
      const safeReservation = reservation.toObject();
      delete safeReservation.pickupCodeHash;
      return res.status(200).json({
        success: true,
        alreadyCollected: true,
        message: 'Pickup was already verified and collected.',
        reservation: safeReservation,
      });
    }

    if (reservation.status === 'cancelled' || reservation.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: `Cannot verify pickup: reservation is ${reservation.status}.`,
      });
    }

    // Enforce pickup deadline server-side
    const now = new Date();
    if (now > reservation.pickupDeadline) {
      await syncExpiredReservations({ _id: reservation._id });
      return res.status(400).json({
        success: false,
        message: 'Pickup deadline has passed. This reservation has expired.',
      });
    }

    // Constant-time HMAC verification
    const isMatch = verifyPickupCode(pickupCode, reservation.pickupCodeHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pickup verification code. Please check with the recipient.',
      });
    }

    // Atomic transition from 'reserved' -> 'collected'
    const collected = await Reservation.findOneAndUpdate(
      { _id: id, status: 'reserved' },
      { $set: { status: 'collected', collectedAt: now } },
      { new: true }
    );

    if (!collected) {
      // Another concurrent request collected it first
      const latest = await Reservation.findById(id);
      if (latest && latest.status === 'collected') {
        return res.status(200).json({
          success: true,
          alreadyCollected: true,
          message: 'Pickup was already verified and collected.',
          reservation: latest,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Reservation is no longer eligible for collection.',
      });
    }

    // Update FoodListing: move quantity from reservedQuantity -> collectedQuantity
    const updatedListing = await FoodListing.findOneAndUpdate(
      { _id: collected.foodListing },
      {
        $inc: {
          reservedQuantity: -collected.quantityReserved,
          collectedQuantity: collected.quantityReserved,
        },
      },
      { new: true }
    );

    // Only mark listing 'collected' when NO available or reserved quantity remains
    if (
      updatedListing &&
      updatedListing.availableQuantity <= 0 &&
      updatedListing.reservedQuantity <= 0
    ) {
      await FoodListing.updateOne(
        {
          _id: updatedListing._id,
          availableQuantity: { $lte: 0 },
          reservedQuantity: { $lte: 0 },
        },
        { $set: { status: 'collected' } }
      );
    }

    const populated = await Reservation.findById(collected._id)
      .populate('foodListing', 'title category unit availableQuantity reservedQuantity collectedQuantity status')
      .populate('recipient', 'name email phone organizationType');

    res.status(200).json({
      success: true,
      alreadyCollected: false,
      message: 'Pickup verified! Food collection recorded successfully.',
      reservation: populated,
    });
  } catch (error) {
    next(error);
  }
};
