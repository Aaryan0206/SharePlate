const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const FoodListing = require('../models/FoodListing');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:5000/api';

const runGeospatialTests = async () => {
  console.log('====================================================');
  console.log('  SHAREPLATE PHASE 4 GEOSPATIAL & MAP TEST SUITE    ');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shareplate');

  let passed = 0;
  let total = 0;

  const test = async (title, fn) => {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] Test ${total}: ${title}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] Test ${total}: ${title} -> ${err.message}`);
    }
  };

  // 1. Get Donor Token
  const donorLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'donor@greenhearth.com', password: 'BakeryPassword2026!' }),
  });
  const donorData = await donorLoginRes.json();
  const donorToken = donorData.token;

  // Test 1: Verify 2dsphere index exists in MongoDB
  await test('Verify 2dsphere index exists on FoodListing.location in MongoDB', async () => {
    const indexes = await FoodListing.collection.getIndexes();
    const has2dsphere = Object.values(indexes).some((idx) => idx[0] && idx[0][0] === 'location' && idx[0][1] === '2dsphere');
    if (!has2dsphere && !indexes['location_2dsphere']) {
      throw new Error(`2dsphere index missing. Indexes: ${JSON.stringify(indexes)}`);
    }
  });

  // Test 2: Valid GeoJSON coordinates are accepted [lng, lat]
  let geoListingId = '';
  await test('Valid GeoJSON coordinates [longitude, latitude] are accepted upon creation', async () => {
    const now = Date.now();
    const res = await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({
        title: 'Geospatially Tagged Buffet Meals',
        description: 'Fresh lunch buffet with exact verified coordinates.',
        category: 'cooked meals',
        quantity: 12,
        unit: 'boxes',
        pickupAddress: 'Campus Block C, 45 University Ave',
        location: {
          type: 'Point',
          coordinates: [77.5950, 12.9720], // Valid [lng, lat]
        },
        pickupStartTime: new Date(now + 30 * 60 * 1000).toISOString(),
        pickupEndTime: new Date(now + 2 * 3600 * 1000).toISOString(),
        expiryTime: new Date(now + 3 * 3600 * 1000).toISOString(),
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.listing?.location?.coordinates) {
      throw new Error(`Failed to create geo listing: ${JSON.stringify(data)}`);
    }
    const [lng, lat] = data.listing.location.coordinates;
    if (lng !== 77.595 || lat !== 12.972) {
      throw new Error(`Coordinates altered: got [${lng}, ${lat}]`);
    }
    geoListingId = data.listing._id;
  });

  // Test 3: Reject invalid longitude (> 180 or < -180)
  await test('Reject invalid longitude (> 180 or < -180) with HTTP 400', async () => {
    const now = Date.now();
    const res = await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({
        title: 'Invalid Longitude Food',
        description: 'Testing longitude out of bounds.',
        category: 'bakery',
        quantity: 5,
        unit: 'loaves',
        pickupAddress: 'Nowhere',
        location: {
          type: 'Point',
          coordinates: [195.0, 12.0], // Invalid lng > 180!
        },
        pickupStartTime: new Date(now + 30 * 60 * 1000).toISOString(),
        pickupEndTime: new Date(now + 2 * 3600 * 1000).toISOString(),
        expiryTime: new Date(now + 3 * 3600 * 1000).toISOString(),
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request. Got ${res.status}`);
    }
  });

  // Test 4: Reject invalid latitude (> 90 or < -90)
  await test('Reject invalid latitude (> 90 or < -90) with HTTP 400', async () => {
    const now = Date.now();
    const res = await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({
        title: 'Invalid Latitude Food',
        description: 'Testing latitude out of bounds.',
        category: 'bakery',
        quantity: 5,
        unit: 'loaves',
        pickupAddress: 'Nowhere',
        location: {
          type: 'Point',
          coordinates: [77.0, 95.0], // Invalid lat > 90!
        },
        pickupStartTime: new Date(now + 30 * 60 * 1000).toISOString(),
        pickupEndTime: new Date(now + 2 * 3600 * 1000).toISOString(),
        expiryTime: new Date(now + 3 * 3600 * 1000).toISOString(),
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request. Got ${res.status}`);
    }
  });

  // Test 5: Reject malformed coordinate pairs (e.g. only 1 number or non-array)
  await test('Reject malformed coordinate pairs (single element or missing) with HTTP 400', async () => {
    const now = Date.now();
    const res = await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({
        title: 'Malformed Coords Food',
        description: 'Testing incomplete coordinates array.',
        category: 'bakery',
        quantity: 5,
        unit: 'loaves',
        pickupAddress: 'Nowhere',
        location: {
          type: 'Point',
          coordinates: [77.0], // only 1 number!
        },
        pickupStartTime: new Date(now + 30 * 60 * 1000).toISOString(),
        pickupEndTime: new Date(now + 2 * 3600 * 1000).toISOString(),
        expiryTime: new Date(now + 3 * 3600 * 1000).toISOString(),
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request. Got ${res.status}`);
    }
  });

  // Test 6: Nearby search returns listings within requested radius (e.g. 5 km)
  await test('Nearby search returns listings within requested radius (e.g. 5 km)', async () => {
    const res = await fetch(`${API_BASE}/food/nearby?longitude=77.5946&latitude=12.9716&radiusKm=5`);
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data.listings) || data.count < 6) {
      throw new Error(`Expected at least 6 nearby listings within 5 km. Got ${data.count}`);
    }
    // Verify all returned listings have distanceKm <= 5
    data.listings.forEach((l) => {
      if (l.distanceKm > 5) {
        throw new Error(`Listing ${l.title} has distance ${l.distanceKm} km > 5 km!`);
      }
    });
  });

  // Test 7: Listings outside radius are strictly excluded
  await test('Listings outside the requested radius are strictly excluded', async () => {
    // 5 km search should NOT include the distant 22 km suburban bread
    const res5 = await fetch(`${API_BASE}/food/nearby?longitude=77.5946&latitude=12.9716&radiusKm=5`);
    const data5 = await res5.json();
    const hasDistantIn5 = data5.listings.some((l) => l.title.includes('Suburban Farmhouse'));
    if (hasDistantIn5) {
      throw new Error('Distant listing (22 km away) was incorrectly included in 5 km radius search!');
    }

    // 30 km search SHOULD include the distant 22 km suburban bread
    const res30 = await fetch(`${API_BASE}/food/nearby?longitude=77.5946&latitude=12.9716&radiusKm=30`);
    const data30 = await res30.json();
    const hasDistantIn30 = data30.listings.some((l) => l.title.includes('Suburban Farmhouse'));
    if (!hasDistantIn30) {
      throw new Error('Distant listing was not found in 30 km radius search!');
    }
  });

  // Test 8: Expired listings are strictly excluded from nearby search
  await test('Expired food listings are strictly excluded from nearby search', async () => {
    const res = await fetch(`${API_BASE}/food/nearby?longitude=77.5946&latitude=12.9716&radiusKm=10`);
    const data = await res.json();
    const hasExpired = data.listings.some((l) => l.title.includes('Expired Catered Food') || l.status === 'expired');
    if (hasExpired) {
      throw new Error('Expired food was returned in nearby available food search!');
    }
  });

  // Test 9: Category and keyword filters work combined with nearby search
  await test('Category and keyword search work in combination with nearby search', async () => {
    const res = await fetch(`${API_BASE}/food/nearby?longitude=77.5946&latitude=12.9716&radiusKm=10&category=bakery&search=Sourdough`);
    const data = await res.json();
    if (res.status !== 200 || data.count === 0) {
      throw new Error('Combined category + search + nearby query returned 0 results');
    }
    data.listings.forEach((l) => {
      if (l.category !== 'bakery' || !l.title.toLowerCase().includes('sourdough')) {
        throw new Error(`Unexpected listing in filtered nearby search: ${l.title}`);
      }
    });
  });

  // Test 10: Distance in km is calculated and returned on each listing
  await test('Distance in kilometres is calculated accurately and attached to response', async () => {
    const res = await fetch(`${API_BASE}/food/nearby?longitude=77.5946&latitude=12.9716&radiusKm=10`);
    const data = await res.json();
    data.listings.forEach((l) => {
      if (typeof l.distanceKm !== 'number' || isNaN(l.distanceKm)) {
        throw new Error(`Listing ${l.title} is missing valid distanceKm property: ${l.distanceKm}`);
      }
    });
  });

  // Test 11: Invalid coordinates return HTTP 400 validation error
  await test('Invalid coordinates query parameters return HTTP 400 validation error', async () => {
    const res = await fetch(`${API_BASE}/food/nearby?longitude=invalid&latitude=999`);
    if (res.status !== 400) {
      throw new Error(`Expected 400. Got ${res.status}`);
    }
  });

  // Test 12: Excessive radius (> 50 km) is rejected or capped
  await test('Excessive search radius (> 50 km) returns HTTP 400 validation error', async () => {
    const res = await fetch(`${API_BASE}/food/nearby?longitude=77.5946&latitude=12.9716&radiusKm=150`);
    if (res.status !== 400) {
      throw new Error(`Expected 400 for radius > 50km. Got ${res.status}`);
    }
  });

  // Test 13: Listings without coordinates remain accessible through ordinary browsing
  await test('Listings without coordinates remain accessible through regular browsing (GET /api/food)', async () => {
    const res = await fetch(`${API_BASE}/food?status=available`);
    const data = await res.json();
    const hasLegacy = data.listings.some((l) => l.title.includes('Legacy Donation Listing'));
    if (!hasLegacy) {
      throw new Error('Legacy listing without coordinates was missing from standard browse results!');
    }
  });

  // Clean up test listing
  if (geoListingId) {
    await FoodListing.findByIdAndDelete(geoListingId);
  }

  console.log('\n====================================================');
  console.log(`PHASE 4 TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================\n');

  process.exit(passed === total ? 0 : 1);
};

runGeospatialTests();
