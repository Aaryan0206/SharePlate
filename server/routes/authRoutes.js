const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many authentication attempts. Please wait before trying again.',
});

// Public auth routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);

// Protected session route
router.get('/me', protect, getMe);

// Role verification test routes (for automated testing & role verification)
router.get('/donor-only', protect, authorizeRoles('donor', 'admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Donor zone. You have authorized donor permissions.',
    user: req.user.toSafeObject(),
  });
});

router.get('/recipient-only', protect, authorizeRoles('recipient', 'admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Recipient zone. You have authorized recipient permissions.',
    user: req.user.toSafeObject(),
  });
});

router.get('/admin-only', protect, authorizeRoles('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Admin portal. You have full administrative privileges.',
    user: req.user.toSafeObject(),
  });
});

module.exports = router;
