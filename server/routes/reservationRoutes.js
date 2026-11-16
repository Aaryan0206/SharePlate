const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  getDonorReservations,
  getReservationById,
  cancelReservation,
  verifyPickup,
} = require('../controllers/reservationController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

const pickupVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many pickup verification attempts. Please wait before trying again.',
});

// All reservation routes require authentication
router.use(protect);

// Recipient endpoints
router.post('/', authorizeRoles('recipient'), createReservation);
router.get('/my-reservations', authorizeRoles('recipient', 'admin'), getMyReservations);
router.patch('/:id/cancel', authorizeRoles('recipient', 'admin'), cancelReservation);

// Donor endpoints
router.get('/donor', authorizeRoles('donor', 'admin'), getDonorReservations);
router.post('/:id/verify-pickup', pickupVerifyLimiter, authorizeRoles('donor', 'admin'), verifyPickup);

// Shared detail endpoint (authorized recipient, donor, or admin)
router.get('/:id', getReservationById);

module.exports = router;
