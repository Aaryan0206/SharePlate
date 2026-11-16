const express = require('express');
const router = express.Router();
const {
  createListing,
  getListings,
  getNearbyListings,
  getListingById,
  updateListing,
  cancelListing,
  getMyListings,
} = require('../controllers/foodController');
const { geocodeAddress } = require('../controllers/geocodingController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Public browse & search routes
router.get('/', getListings);
router.get('/nearby', getNearbyListings);
router.get('/geocode', geocodeAddress);

// Protected donor listings retrieval (must be before /:id)
router.get('/my-listings', protect, authorizeRoles('donor', 'admin'), getMyListings);

// Single listing retrieval
router.get('/:id', getListingById);

// Donor management routes
router.post('/', protect, authorizeRoles('donor', 'admin'), createListing);
router.patch('/:id', protect, authorizeRoles('donor', 'admin'), updateListing);
router.patch('/:id/cancel', protect, authorizeRoles('donor', 'admin'), cancelListing);

module.exports = router;
