const express = require('express');
const router = express.Router();
const {
  getOverview,
  getAnalytics,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getListings,
  moderateCancelListing,
  getReservations,
  adminCancelReservation,
  getAuditLogs,
} = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Enforce JWT authentication + strict admin role on every admin route
router.use(protect);
router.use(authorizeRoles('admin'));

// Platform overview & analytics (read-only)
router.get('/overview', getOverview);
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);

// Food listing oversight
router.get('/listings', getListings);
router.patch('/listings/:id/cancel', moderateCancelListing);

// Reservation oversight
router.get('/reservations', getReservations);
router.patch('/reservations/:id/cancel', adminCancelReservation);

// Read-only audit logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;
