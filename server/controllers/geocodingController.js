// Geocoding controller using OpenStreetMap Nominatim
// Kept securely on backend, respects Nominatim usage policy with custom User-Agent and caching.

const geocodeCache = new Map();

exports.geocodeAddress = async (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string' || address.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid address string with at least 3 characters.',
      });
    }

    const normalizedAddress = address.trim();

    // Check in-memory cache
    if (geocodeCache.has(normalizedAddress)) {
      const cached = geocodeCache.get(normalizedAddress);
      return res.status(200).json({
        success: true,
        source: 'cache',
        ...cached,
      });
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      normalizedAddress
    )}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    let nominatimRes;
    try {
      nominatimRes = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'SharePlate-SurplusFoodSharing/1.0 (contact@shareplate.org)',
          'Accept-Language': 'en',
        },
        signal: controller.signal,
      });
    } catch (networkErr) {
      clearTimeout(timeout);
      return res.status(503).json({
        success: false,
        message:
          'Geocoding service temporarily unavailable. You can click on the map to set pickup coordinates manually.',
      });
    }

    clearTimeout(timeout);

    if (!nominatimRes.ok) {
      return res.status(502).json({
        success: false,
        message:
          'Unable to resolve address from geocoding provider. Please select your pickup point on the map.',
      });
    }

    const data = await nominatimRes.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'No location coordinates could be matched for this address. Please choose your pickup location on the map.',
      });
    }

    const firstResult = data[0];
    const lon = parseFloat(firstResult.lon);
    const lat = parseFloat(firstResult.lat);

    if (isNaN(lon) || isNaN(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return res.status(422).json({
        success: false,
        message: 'Geocoding returned invalid coordinate bounds.',
      });
    }

    const resultData = {
      coordinates: [lon, lat], // GeoJSON order: [longitude, latitude]
      longitude: lon,
      latitude: lat,
      displayName: firstResult.display_name,
    };

    // Cache the result (up to 500 items)
    if (geocodeCache.size > 500) {
      const firstKey = geocodeCache.keys().next().value;
      geocodeCache.delete(firstKey);
    }
    geocodeCache.set(normalizedAddress, resultData);

    return res.status(200).json({
      success: true,
      source: 'nominatim',
      ...resultData,
    });
  } catch (error) {
    next(error);
  }
};
