const mongoose = require('mongoose');
const FoodListing = require('../models/FoodListing');
const {
  validateFoodListingInput,
  validateNearbyQueryParams,
  normalizeCategory,
} = require('../validators/foodValidators');

// Haversine distance calculator (returns distance in km rounded to 1 decimal place)
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// @desc    Create a new surplus food listing
// @route   POST /api/food
// @access  Private (Donor & Admin only)
exports.createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      quantity,
      unit,
      servingsCount,
      imageUrl,
      pickupAddress,
      pickupInstructions,
      pickupStartTime,
      pickupEndTime,
      expiryTime,
      allergenInformation,
      foodHandlingNotes,
    } = req.body;

    // Validate inputs
    const { isValid, errors } = validateFoodListingInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    // Always derive donor from the authenticated JWT session
    const donorId = req.user._id;

    // Extract GeoJSON location if provided
    let locationData;
    if (req.body.location && Array.isArray(req.body.location.coordinates)) {
      locationData = {
        type: 'Point',
        coordinates: req.body.location.coordinates.map(Number),
      };
    } else if (Array.isArray(req.body.coordinates)) {
      locationData = {
        type: 'Point',
        coordinates: req.body.coordinates.map(Number),
      };
    } else if (req.body.longitude !== undefined && req.body.latitude !== undefined) {
      locationData = {
        type: 'Point',
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
      };
    }

    const listingData = {
      title: title.trim(),
      description: description.trim(),
      category: normalizeCategory(category),
      quantity: Number(quantity),
      unit: unit.toLowerCase().trim(),
      servingsCount: servingsCount ? Number(servingsCount) : null,
      imageUrl:
        imageUrl && imageUrl.trim().startsWith('http')
          ? imageUrl.trim()
          : 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      donor: donorId,
      pickupAddress: pickupAddress.trim(),
      pickupInstructions: pickupInstructions ? pickupInstructions.trim() : '',
      pickupStartTime: new Date(pickupStartTime),
      pickupEndTime: new Date(pickupEndTime),
      expiryTime: new Date(expiryTime),
      allergenInformation: allergenInformation ? allergenInformation.trim() : 'None specified',
      foodHandlingNotes: foodHandlingNotes ? foodHandlingNotes.trim() : '',
      status: 'available', // Enforced server-side default
      ...(locationData && { location: locationData }),
    };

    const newListing = await FoodListing.create(listingData);

    const populated = await FoodListing.findById(newListing._id).populate(
      'donor',
      'name email phone organizationType'
    );

    res.status(201).json({
      success: true,
      message: 'Surplus food listing published successfully',
      listing: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Browse & filter food listings (supports both regular browse and geospatial radius search)
// @route   GET /api/food
// @access  Public
exports.getListings = async (req, res, next) => {
  try {
    const {
      category,
      search,
      status = 'available',
      minQuantity,
      maxQuantity,
      sort = 'newest',
      page = 1,
      limit = 9,
      longitude,
      latitude,
      radiusKm,
    } = req.query;

    const query = {};
    const now = new Date();

    // 1. Status Filter & Server-side Expiry Rule
    if (status === 'available') {
      query.status = 'available';
      // Only return listings whose expiry time has not yet passed
      query.expiryTime = { $gt: now };
    } else if (status === 'all') {
      // Return any status without filtering
    } else {
      query.status = status;
    }

    // 2. Category Filter
    if (category && category !== 'all') {
      query.category = normalizeCategory(category);
    }

    // 3. Text Search (title & description)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // 4. Quantity Filters
    if (minQuantity || maxQuantity) {
      query.quantity = {};
      if (minQuantity) query.quantity.$gte = Number(minQuantity);
      if (maxQuantity) query.quantity.$lte = Number(maxQuantity);
    }

    // 5. Geospatial Filter ($near via 2dsphere index)
    const isNearbyQuery = longitude !== undefined && latitude !== undefined;
    let userLng = null;
    let userLat = null;

    if (isNearbyQuery) {
      const { isValid, errors } = validateNearbyQueryParams({ longitude, latitude, radiusKm });
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: errors[0],
          errors,
        });
      }

      userLng = Number(longitude);
      userLat = Number(latitude);
      const radius = Math.min(50, Math.max(0.1, Number(radiusKm) || 10)); // max 50km
      const radiusMeters = radius * 1000;

      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLng, userLat],
          },
          $maxDistance: radiusMeters,
        },
      };
    }

    // 6. Sorting Options
    let sortQuery = { createdAt: -1 }; // default newest first
    // Note: When using $near, MongoDB automatically sorts by proximity.
    if (!isNearbyQuery) {
      if (sort === 'expirySoonest') {
        sortQuery = { expiryTime: 1 };
      } else if (sort === 'quantityDesc') {
        sortQuery = { quantity: -1 };
      } else if (sort === 'oldest') {
        sortQuery = { createdAt: 1 };
      }
    }

    // 7. Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));
    const skip = (pageNum - 1) * limitNum;

    const totalListings = await FoodListing.countDocuments(query);
    const totalPages = Math.ceil(totalListings / limitNum) || 1;

    let findQuery = FoodListing.find(query)
      .populate('donor', 'name organizationType phone email');

    // Only apply manual sort if not using $near (since $near has its own distance sort)
    if (!isNearbyQuery) {
      findQuery = findQuery.sort(sortQuery);
    }

    findQuery = findQuery.skip(skip).limit(limitNum);

    const listings = await findQuery;

    // Attach calculated distance in km if user coordinates were provided
    const processedListings = listings.map((l) => {
      const obj = l.toObject();
      if (
        isNearbyQuery &&
        l.location &&
        Array.isArray(l.location.coordinates) &&
        l.location.coordinates.length === 2
      ) {
        obj.distanceKm = calculateDistanceKm(
          userLat,
          userLng,
          l.location.coordinates[1],
          l.location.coordinates[0]
        );
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      count: processedListings.length,
      totalListings,
      totalPages,
      currentPage: pageNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      isNearbyQuery,
      searchCenter: isNearbyQuery ? { longitude: userLng, latitude: userLat, radiusKm: Number(radiusKm) || 10 } : null,
      listings: processedListings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dedicated nearby food listings endpoint
// @route   GET /api/food/nearby
// @access  Public
exports.getNearbyListings = async (req, res, next) => {
  try {
    const { longitude, latitude, radiusKm = 10, category, search, limit = 20 } = req.query;

    const { isValid, errors } = validateNearbyQueryParams({ longitude, latitude, radiusKm });
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const userLng = Number(longitude);
    const userLat = Number(latitude);
    const maxRadiusKm = Math.min(50, Math.max(0.1, Number(radiusKm)));
    const radiusMeters = maxRadiusKm * 1000;
    const now = new Date();

    const query = {
      status: 'available',
      expiryTime: { $gt: now },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLng, userLat],
          },
          $maxDistance: radiusMeters,
        },
      },
    };

    if (category && category !== 'all') {
      query.category = normalizeCategory(category);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const listings = await FoodListing.find(query)
      .populate('donor', 'name organizationType phone email')
      .limit(Math.min(50, parseInt(limit, 10) || 20));

    const processed = listings.map((l) => {
      const obj = l.toObject();
      if (l.location && Array.isArray(l.location.coordinates) && l.location.coordinates.length === 2) {
        obj.distanceKm = calculateDistanceKm(
          userLat,
          userLng,
          l.location.coordinates[1],
          l.location.coordinates[0]
        );
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      count: processed.length,
      radiusKm: maxRadiusKm,
      center: [userLng, userLat],
      listings: processed,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single food listing by ID
// @route   GET /api/food/:id
// @access  Public
exports.getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food listing ID format',
      });
    }

    const listing = await FoodListing.findById(id).populate(
      'donor',
      'name organizationType email phone'
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found or has been removed',
      });
    }

    res.status(200).json({
      success: true,
      listing,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update listing details (Donor owner only)
// @route   PATCH /api/food/:id
// @access  Private (Donor owner or Admin)
exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food listing ID format',
      });
    }

    const listing = await FoodListing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found',
      });
    }

    // Ownership Verification
    const isOwner = listing.donor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to edit this listing.',
      });
    }

    // Prevent editing of completed, collected, or cancelled listings
    if (listing.status === 'collected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a listing that has already been collected.',
      });
    }

    if (listing.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a cancelled listing. Please create a new listing instead.',
      });
    }

    // Validate update fields
    const { isValid, errors } = validateFoodListingInput(req.body, true);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    // Handle quantity updates while preserving reservation/collection consistency
    if (req.body.quantity !== undefined) {
      const newTotalQty = Number(req.body.quantity);
      const reservedQty = listing.reservedQuantity || 0;
      const collectedQty = listing.collectedQuantity || 0;
      const newAvailableQty = newTotalQty - reservedQty - collectedQty;

      if (newAvailableQty < 0) {
        return res.status(400).json({
          success: false,
          message: `Quantity cannot be reduced below already reserved and collected amount (${reservedQty + collectedQty} ${listing.unit}).`,
        });
      }

      listing.quantity = newTotalQty;
      listing.originalQuantity = newTotalQty;
      listing.availableQuantity = newAvailableQty;

      if (newAvailableQty === 0 && reservedQty > 0) {
        listing.status = 'reserved';
      } else if (newAvailableQty > 0 && listing.status === 'reserved') {
        listing.status = 'available';
      }
    }

    // Apply allowed updates
    const updatableFields = [
      'title',
      'description',
      'category',
      'unit',
      'servingsCount',
      'imageUrl',
      'pickupAddress',
      'pickupInstructions',
      'pickupStartTime',
      'pickupEndTime',
      'expiryTime',
      'allergenInformation',
      'foodHandlingNotes',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'category') {
          listing[field] = normalizeCategory(req.body[field]);
        } else if (field === 'pickupStartTime' || field === 'pickupEndTime' || field === 'expiryTime') {
          listing[field] = new Date(req.body[field]);
        } else {
          listing[field] = req.body[field];
        }
      }
    });

    // Check for updated coordinates
    if (req.body.location && Array.isArray(req.body.location.coordinates)) {
      listing.location = {
        type: 'Point',
        coordinates: req.body.location.coordinates.map(Number),
      };
    } else if (Array.isArray(req.body.coordinates)) {
      listing.location = {
        type: 'Point',
        coordinates: req.body.coordinates.map(Number),
      };
    } else if (req.body.longitude !== undefined && req.body.latitude !== undefined) {
      listing.location = {
        type: 'Point',
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
      };
    }

    await listing.save();

    const updated = await FoodListing.findById(id).populate(
      'donor',
      'name organizationType email phone'
    );

    res.status(200).json({
      success: true,
      message: 'Food listing updated successfully',
      listing: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an eligible listing
// @route   PATCH /api/food/:id/cancel
// @access  Private (Donor owner or Admin)
exports.cancelListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food listing ID format',
      });
    }

    const listing = await FoodListing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found',
      });
    }

    // Ownership Verification
    const isOwner = listing.donor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to cancel this listing.',
      });
    }

    if (listing.status === 'collected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a listing that has already been collected.',
      });
    }

    if (listing.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This listing is already cancelled.',
      });
    }

    listing.status = 'cancelled';
    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Food listing successfully cancelled',
      listing,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all listings created by the authenticated donor
// @route   GET /api/food/my-listings
// @access  Private (Donor & Admin only)
exports.getMyListings = async (req, res, next) => {
  try {
    const donorId = req.user._id;

    const listings = await FoodListing.find({ donor: donorId })
      .sort({ createdAt: -1 });

    const now = new Date();

    // Calculate metrics
    const stats = {
      total: listings.length,
      available: listings.filter((l) => l.status === 'available' && new Date(l.expiryTime) > now).length,
      expired: listings.filter((l) => l.status === 'expired' || (l.status === 'available' && new Date(l.expiryTime) <= now)).length,
      collected: listings.filter((l) => l.status === 'collected').length,
      cancelled: listings.filter((l) => l.status === 'cancelled').length,
    };

    res.status(200).json({
      success: true,
      count: listings.length,
      stats,
      listings,
    });
  } catch (error) {
    next(error);
  }
};
