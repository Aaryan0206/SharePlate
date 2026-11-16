const mongoose = require('mongoose');
const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const Reservation = require('../models/Reservation');
const AuditLog = require('../models/AuditLog');

const MAX_LIMIT = 50;

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePagination(query) {
  const rawPage = query.page !== undefined ? Number(query.page) : 1;
  const rawLimit = query.limit !== undefined ? Number(query.limit) : 10;

  if (!Number.isInteger(rawPage) || rawPage < 1) {
    return { error: 'page must be a positive integer (>= 1).' };
  }
  if (!Number.isInteger(rawLimit) || rawLimit < 1) {
    return { error: 'limit must be a positive integer (>= 1).' };
  }

  const limit = Math.min(MAX_LIMIT, rawLimit);
  const skip = (rawPage - 1) * limit;
  return { page: rawPage, limit, skip };
}

async function recordAuditLog({ adminId, actionType, targetType, targetId, reason = '', metadata = {} }) {
  try {
    const log = await AuditLog.create({
      admin: adminId,
      actionType,
      targetType,
      targetId,
      reason: String(reason || '').trim(),
      metadata,
    });
    return { logged: true, log };
  } catch (err) {
    console.error(`[AuditLog Warning] Failed to record ${actionType} on ${targetType}:${targetId}:`, err.message);
    return { logged: false, error: err.message };
  }
}

// @desc    Get live platform overview metrics from MongoDB
// @route   GET /api/admin/overview
// @access  Private (Admin only)
exports.getOverview = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      userCounts,
      listingCounts,
      availableActiveCount,
      reservationCounts,
      collectedByUnit,
      recentAuditCount,
    ] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            donors: { $sum: { $cond: [{ $eq: ['$role', 'donor'] }, 1, 0] } },
            recipients: { $sum: { $cond: [{ $eq: ['$role', 'recipient'] }, 1, 0] } },
            admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
            active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
          },
        },
      ]),
      FoodListing.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      FoodListing.countDocuments({
        status: 'available',
        expiryTime: { $gt: now },
        $or: [
          { availableQuantity: { $gt: 0 } },
          { availableQuantity: { $exists: false }, quantity: { $gt: 0 } },
        ],
      }),
      Reservation.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Reservation.aggregate([
        { $match: { status: 'collected' } },
        {
          $group: {
            _id: '$unit',
            totalQuantity: { $sum: '$quantityReserved' },
            collectionCount: { $sum: 1 },
          },
        },
        { $sort: { totalQuantity: -1 } },
      ]),
      AuditLog.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const u = userCounts[0] || { total: 0, donors: 0, recipients: 0, admins: 0, active: 0, inactive: 0 };

    const listingMap = { available: 0, reserved: 0, collected: 0, expired: 0, cancelled: 0 };
    let totalListings = 0;
    for (const row of listingCounts) {
      if (listingMap[row._id] !== undefined) {
        listingMap[row._id] = row.count;
      }
      totalListings += row.count;
    }

    const resvMap = { reserved: 0, collected: 0, cancelled: 0, expired: 0 };
    let totalReservations = 0;
    for (const row of reservationCounts) {
      if (resvMap[row._id] !== undefined) {
        resvMap[row._id] = row.count;
      }
      totalReservations += row.count;
    }

    res.status(200).json({
      success: true,
      overview: {
        users: {
          total: u.total,
          donors: u.donors,
          recipients: u.recipients,
          admins: u.admins,
          active: u.active,
          inactive: u.inactive,
        },
        listings: {
          total: totalListings,
          availableNow: availableActiveCount,
          byStatus: listingMap,
        },
        reservations: {
          total: totalReservations,
          active: resvMap.reserved,
          collected: resvMap.collected,
          cancelled: resvMap.cancelled,
          expired: resvMap.expired,
          cancelledAndExpired: resvMap.cancelled + resvMap.expired,
        },
        collectedByUnit: collectedByUnit.map((item) => ({
          unit: item._id,
          totalQuantity: Number(item.totalQuantity.toFixed(2)),
          collectionCount: item.collectionCount,
        })),
        recentAuditCount,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get time-series & category analytics via MongoDB aggregation pipelines
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
exports.getAnalytics = async (req, res, next) => {
  try {
    let startDate;
    let endDate;

    if (req.query.startDate || req.query.endDate) {
      endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
      startDate = req.query.startDate
        ? new Date(req.query.startDate)
        : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate or endDate format.',
        });
      }
      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate cannot be after endDate.',
        });
      }
    } else {
      const days = req.query.days !== undefined ? Number(req.query.days) : 30;
      if (!Number.isInteger(days) || days < 1 || days > 365) {
        return res.status(400).json({
          success: false,
          message: 'days must be an integer between 1 and 365.',
        });
      }
      endDate = new Date();
      startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    }

    const [
      listingsOverTime,
      reservationsOverTime,
      collectionsOverTime,
      reservationStatusBreakdown,
      categoryBreakdown,
      collectedByUnit,
    ] = await Promise.all([
      FoodListing.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            listingsCreated: { $sum: 1 },
            listedQuantity: { $sum: { $ifNull: ['$originalQuantity', '$quantity'] } },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', listingsCreated: 1, listedQuantity: 1 } },
      ]),
      Reservation.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            reservationsCount: { $sum: 1 },
            quantityReserved: { $sum: '$quantityReserved' },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', reservationsCount: 1, quantityReserved: 1 } },
      ]),
      Reservation.aggregate([
        {
          $match: {
            status: 'collected',
            collectedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectedAt' } },
            collectionsCount: { $sum: 1 },
            quantityCollected: { $sum: '$quantityReserved' },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', collectionsCount: 1, quantityCollected: 1 } },
      ]),
      Reservation.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      FoodListing.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: '$category',
            listingCount: { $sum: 1 },
            totalListedQuantity: { $sum: { $ifNull: ['$originalQuantity', '$quantity'] } },
            totalCollectedQuantity: { $sum: { $ifNull: ['$collectedQuantity', 0] } },
          },
        },
        { $sort: { listingCount: -1 } },
        {
          $project: {
            _id: 0,
            category: '$_id',
            listingCount: 1,
            totalListedQuantity: 1,
            totalCollectedQuantity: 1,
          },
        },
      ]),
      Reservation.aggregate([
        {
          $match: {
            status: 'collected',
            collectedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$unit',
            totalQuantity: { $sum: '$quantityReserved' },
            collectionCount: { $sum: 1 },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $project: { _id: 0, unit: '$_id', totalQuantity: 1, collectionCount: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      range: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      analytics: {
        listingsOverTime,
        reservationsOverTime,
        collectionsOverTime,
        reservationStatusBreakdown,
        categoryBreakdown,
        collectedByUnit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated, searchable list of users (safe profile fields only)
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    if (pagination.error) {
      return res.status(400).json({ success: false, message: pagination.error });
    }

    const filter = {};
    if (req.query.role && req.query.role !== 'all') {
      if (!['donor', 'recipient', 'admin'].includes(req.query.role)) {
        return res.status(400).json({ success: false, message: 'Invalid role filter.' });
      }
      filter.role = req.query.role;
    }

    if (req.query.isActive !== undefined && req.query.isActive !== 'all') {
      if (req.query.isActive !== 'true' && req.query.isActive !== 'false') {
        return res.status(400).json({ success: false, message: 'isActive must be true, false, or all.' });
      }
      filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search && req.query.search.trim()) {
      const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('name email role phone organizationType isActive createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      totalUsers,
      totalPages: Math.max(1, Math.ceil(totalUsers / pagination.limit)),
      currentPage: pagination.page,
      limit: pagination.limit,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate or deactivate a user account with self-lockout & last-admin safeguards
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, reason = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
    }

    const targetUser = await User.findById(id).select('name email role isActive');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent self-deactivation
    if (targetUser._id.toString() === req.user._id.toString() && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot deactivate their own account.',
      });
    }

    // Prevent deactivating the last active admin
    if (targetUser.role === 'admin' && isActive === false && targetUser.isActive === true) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the last active administrator account.',
        });
      }
    }

    if (targetUser.isActive === isActive) {
      return res.status(200).json({
        success: true,
        message: `Account is already ${isActive ? 'active' : 'deactivated'}.`,
        user: targetUser,
      });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    const audit = await recordAuditLog({
      adminId: req.user._id,
      actionType: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      targetType: 'User',
      targetId: targetUser._id,
      reason: reason || (isActive ? 'Account reactivated by admin' : 'Account deactivated by admin'),
      metadata: {
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
        isActive,
      },
    });

    res.status(200).json({
      success: true,
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: targetUser,
      auditLogged: audit.logged,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role with last-admin & self-demotion safeguards
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }
    if (!['donor', 'recipient', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'A reason (at least 3 characters) is required for role changes.',
      });
    }

    const targetUser = await User.findById(id).select('name email role isActive');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (targetUser._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot demote their own role.',
      });
    }

    if (targetUser.role === 'admin' && role !== 'admin' && targetUser.isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change the role of the last active administrator.',
        });
      }
    }

    const previousRole = targetUser.role;
    if (previousRole === role) {
      return res.status(200).json({
        success: true,
        message: `User already has role "${role}".`,
        user: targetUser,
      });
    }

    targetUser.role = role;
    await targetUser.save();

    const audit = await recordAuditLog({
      adminId: req.user._id,
      actionType: 'USER_ROLE_CHANGED',
      targetType: 'User',
      targetId: targetUser._id,
      reason: reason.trim(),
      metadata: {
        targetEmail: targetUser.email,
        previousRole,
        newRole: role,
      },
    });

    res.status(200).json({
      success: true,
      message: `User role updated from "${previousRole}" to "${role}".`,
      user: targetUser,
      auditLogged: audit.logged,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated food listings for admin oversight
// @route   GET /api/admin/listings
// @access  Private (Admin only)
exports.getListings = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    if (pagination.error) {
      return res.status(400).json({ success: false, message: pagination.error });
    }

    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category.toLowerCase();
    }
    if (req.query.search && req.query.search.trim()) {
      const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
      filter.$or = [{ title: regex }, { pickupAddress: regex }];
    }

    const [totalListings, listings] = await Promise.all([
      FoodListing.countDocuments(filter),
      FoodListing.find(filter)
        .select('title category quantity originalQuantity availableQuantity reservedQuantity collectedQuantity unit status pickupAddress expiryTime createdAt donor')
        .populate('donor', 'name email organizationType')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: listings.length,
      totalListings,
      totalPages: Math.max(1, Math.ceil(totalListings / pagination.limit)),
      currentPage: pagination.page,
      limit: pagination.limit,
      listings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Administrative cancellation/moderation of a food listing (with reason & audit log)
// @route   PATCH /api/admin/listings/:id/cancel
// @access  Private (Admin only)
exports.moderateCancelListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID format.' });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'A moderation reason (at least 3 characters) is required.',
      });
    }

    const listing = await FoodListing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Food listing not found.' });
    }
    if (listing.status === 'collected' || listing.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel listing in "${listing.status}" status.`,
      });
    }
    if ((listing.reservedQuantity || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel listing while active reservations remain unresolved. Cancel pending reservations first.',
      });
    }

    const previousStatus = listing.status;
    listing.status = 'cancelled';
    await listing.save();

    const audit = await recordAuditLog({
      adminId: req.user._id,
      actionType: 'LISTING_MODERATED_CANCEL',
      targetType: 'FoodListing',
      targetId: listing._id,
      reason: reason.trim(),
      metadata: {
        title: listing.title,
        previousStatus,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Food listing cancelled by administrator.',
      listing,
      auditLogged: audit.logged,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated reservations for admin oversight (never exposes pickup codes or hashes)
// @route   GET /api/admin/reservations
// @access  Private (Admin only)
exports.getReservations = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    if (pagination.error) {
      return res.status(400).json({ success: false, message: pagination.error });
    }

    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const [totalReservations, reservations] = await Promise.all([
      Reservation.countDocuments(filter),
      Reservation.find(filter)
        .select('foodListing recipient donor quantityReserved unit status reservedAt pickupDeadline collectedAt cancelledAt createdAt')
        .populate('foodListing', 'title category unit status')
        .populate('recipient', 'name email organizationType')
        .populate('donor', 'name email organizationType')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: reservations.length,
      totalReservations,
      totalPages: Math.max(1, Math.ceil(totalReservations / pagination.limit)),
      currentPage: pagination.page,
      limit: pagination.limit,
      reservations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Administrative cancellation of an active reservation (preserves quantity invariants)
// @route   PATCH /api/admin/reservations/:id/cancel
// @access  Private (Admin only)
exports.adminCancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid reservation ID format.' });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'A cancellation reason (at least 3 characters) is required.',
      });
    }

    const existing = await Reservation.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    const cancelled = await Reservation.findOneAndUpdate(
      { _id: id, status: 'reserved' },
      { $set: { status: 'cancelled', cancelledAt: new Date() } },
      { new: true }
    );

    if (!cancelled) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel reservation in "${existing.status}" status.`,
      });
    }

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

    const audit = await recordAuditLog({
      adminId: req.user._id,
      actionType: 'RESERVATION_ADMIN_CANCEL',
      targetType: 'Reservation',
      targetId: cancelled._id,
      reason: reason.trim(),
      metadata: {
        foodListingId: cancelled.foodListing,
        quantityRestored: cancelled.quantityReserved,
        unit: cancelled.unit,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled by administrator and quantity restored.',
      reservation: cancelled,
      auditLogged: audit.logged,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated, read-only audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin only)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    if (pagination.error) {
      return res.status(400).json({ success: false, message: pagination.error });
    }

    const filter = {};
    if (req.query.actionType && req.query.actionType !== 'all') {
      filter.actionType = req.query.actionType;
    }
    if (req.query.targetType && req.query.targetType !== 'all') {
      filter.targetType = req.query.targetType;
    }

    const [totalLogs, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .populate('admin', 'name email role')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      totalLogs,
      totalPages: Math.max(1, Math.ceil(totalLogs / pagination.limit)),
      currentPage: pagination.page,
      limit: pagination.limit,
      logs,
    });
  } catch (error) {
    next(error);
  }
};
