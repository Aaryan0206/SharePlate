const validCategories = [
  'cooked meals',
  'bakery',
  'fruits and vegetables',
  'packaged food',
  'groceries',
  'other',
];

const validUnits = ['servings', 'kg', 'packets', 'boxes', 'loaves', 'packs'];

// Normalizes category strings (e.g. 'cooked-meals' -> 'cooked meals')
const normalizeCategory = (cat) => {
  if (!cat || typeof cat !== 'string') return '';
  const cleaned = cat.toLowerCase().trim().replace(/-/g, ' ');
  return cleaned;
};

const validateFoodListingInput = (data, isUpdate = false) => {
  const errors = [];

  // Title
  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.push('Food title must be at least 3 characters long');
    } else if (data.title.trim().length > 150) {
      errors.push('Food title cannot exceed 150 characters');
    }
  }

  // Description
  if (!isUpdate || data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 5) {
      errors.push('Food description must be at least 5 characters long');
    }
  }

  // Category
  if (!isUpdate || data.category !== undefined) {
    const normalizedCategory = normalizeCategory(data.category);
    if (!normalizedCategory || !validCategories.includes(normalizedCategory)) {
      errors.push(`Invalid category. Allowed categories: ${validCategories.join(', ')}`);
    }
  }

  // Quantity
  if (!isUpdate || data.quantity !== undefined) {
    const qty = Number(data.quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.push('Quantity must be a positive number greater than 0');
    }
  }

  // Unit
  if (!isUpdate || data.unit !== undefined) {
    if (!data.unit || typeof data.unit !== 'string' || !validUnits.includes(data.unit.toLowerCase().trim())) {
      errors.push(`Invalid unit. Allowed units: ${validUnits.join(', ')}`);
    }
  }

  // Pickup Address
  if (!isUpdate || data.pickupAddress !== undefined) {
    if (!data.pickupAddress || typeof data.pickupAddress !== 'string' || data.pickupAddress.trim().length < 3) {
      errors.push('Pickup address is required');
    }
  }

  // Dates Validation
  if (!isUpdate || (data.pickupStartTime && data.pickupEndTime && data.expiryTime)) {
    const now = new Date();
    const startTime = new Date(data.pickupStartTime);
    const endTime = new Date(data.pickupEndTime);
    const expiryTime = new Date(data.expiryTime);

    if (isNaN(startTime.getTime())) {
      errors.push('Pickup start time is an invalid date/time format');
    }
    if (isNaN(endTime.getTime())) {
      errors.push('Pickup end time is an invalid date/time format');
    }
    if (isNaN(expiryTime.getTime())) {
      errors.push('Expiry time is an invalid date/time format');
    }

    if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
      if (startTime >= endTime) {
        errors.push('Pickup start time must be earlier than pickup end time');
      }
    }

    if (!isNaN(endTime.getTime()) && !isNaN(expiryTime.getTime())) {
      if (endTime > expiryTime) {
        errors.push('Pickup end time cannot be later than food expiry time');
      }
    }

    // Expiry time must be in the future when creating
    if (!isUpdate && !isNaN(expiryTime.getTime())) {
      if (expiryTime <= now) {
        errors.push('Food expiry time must be in the future');
      }
    }
  }

  // Location / Coordinates Validation
  if (data.location !== undefined || data.coordinates !== undefined || (data.longitude !== undefined && data.latitude !== undefined)) {
    let coords = null;
    if (data.location && Array.isArray(data.location.coordinates)) {
      coords = data.location.coordinates;
    } else if (Array.isArray(data.coordinates)) {
      coords = data.coordinates;
    } else if (data.longitude !== undefined && data.latitude !== undefined) {
      coords = [Number(data.longitude), Number(data.latitude)];
    }

    if (coords !== null) {
      if (!Array.isArray(coords) || coords.length !== 2) {
        errors.push('Coordinates must be an array of [longitude, latitude]');
      } else {
        const [lng, lat] = coords.map(Number);
        if (isNaN(lng) || isNaN(lat)) {
          errors.push('Coordinates must contain valid numbers');
        } else {
          if (lng < -180 || lng > 180) {
            errors.push('Longitude must be between -180 and 180 degrees');
          }
          if (lat < -90 || lat > 90) {
            errors.push('Latitude must be between -90 and 90 degrees');
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateNearbyQueryParams = (query) => {
  const errors = [];
  const { longitude, latitude, radiusKm } = query;

  if (longitude === undefined || latitude === undefined) {
    errors.push('Both longitude and latitude are required for nearby food search');
  } else {
    const lng = Number(longitude);
    const lat = Number(latitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be a valid number between -180 and 180');
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be a valid number between -90 and 90');
    }
  }

  if (radiusKm !== undefined) {
    const radius = Number(radiusKm);
    if (isNaN(radius) || radius <= 0) {
      errors.push('Search radius must be a positive number greater than 0');
    } else if (radius > 50) {
      errors.push('Maximum search radius is 50 km');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateFoodListingInput,
  validateNearbyQueryParams,
  normalizeCategory,
  validCategories,
  validUnits,
};
