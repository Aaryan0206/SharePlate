const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const FoodListing = require('../models/FoodListing');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:5000/api';

const runPhase3Tests = async () => {
  console.log('====================================================');
  console.log('    SHAREPLATE PHASE 3 FOOD LISTINGS TEST SUITE     ');
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

  // Setup tokens for Donor, Recipient, and a Second Donor
  // 1. Get Donor Token
  const donorLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'donor@greenhearth.com', password: 'BakeryPassword2026!' }),
  });
  const donorData = await donorLoginRes.json();
  const donorToken = donorData.token;

  // 2. Get Recipient Token
  const recipientLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'recipient@metroshelter.org', password: 'ShelterPassword2026!' }),
  });
  const recipientData = await recipientLoginRes.json();
  const recipientToken = recipientData.token;

  // 3. Register a Second Donor (to test cross-donor editing prohibition)
  const secondDonorEmail = `other_donor_${Date.now()}@bakery.org`;
  const secondDonorRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Second Donor Kitchen',
      email: secondDonorEmail,
      password: 'SecondPassword2026!',
      role: 'donor',
    }),
  });
  const secondDonorData = await secondDonorRes.json();
  const secondDonorToken = secondDonorData.token;

  let createdListingId = '';

  // Test 1: Donor creates a valid listing
  await test('Donor successfully creates food listing (POST /api/food)', async () => {
    const now = Date.now();
    const payload = {
      title: 'Steamed Basmati Rice & Dal Makhani (Tested Surplus)',
      description: 'Hot buffet surplus freshly packed in sealed food-grade containers.',
      category: 'cooked meals',
      quantity: 15,
      unit: 'boxes',
      servingsCount: 15,
      pickupAddress: 'Campus Dining Service Gate 3',
      pickupStartTime: new Date(now + 20 * 60 * 1000).toISOString(),
      pickupEndTime: new Date(now + 2 * 3600 * 1000).toISOString(),
      expiryTime: new Date(now + 3 * 3600 * 1000).toISOString(),
      allergenInformation: 'Contains Dairy. Gluten-free.',
      foodHandlingNotes: 'Keep hot or reheat to 75°C before serving.',
    };

    const res = await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.status !== 201 || !data.listing?._id) {
      throw new Error(`Failed to create listing: ${JSON.stringify(data)}`);
    }
    createdListingId = data.listing._id;
  });

  // Test 2: Verify in MongoDB Compass / Mongoose
  await test('Listing stored in MongoDB under foodlistings collection with correct donor ObjectId', async () => {
    const doc = await FoodListing.findById(createdListingId);
    if (!doc) throw new Error('Listing not found in MongoDB');
    if (doc.donor.toString() !== donorData.user._id.toString()) {
      throw new Error(`Donor ID mismatch: expected ${donorData.user._id}, got ${doc.donor}`);
    }
    if (doc.status !== 'available') {
      throw new Error(`Initial status should be 'available', got ${doc.status}`);
    }
  });

  // Test 3: Recipient cannot create food listing
  await test('Recipient is forbidden from creating food listing (HTTP 403)', async () => {
    const now = Date.now();
    const res = await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recipientToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Listing',
        description: 'Should fail',
        category: 'bakery',
        quantity: 5,
        unit: 'loaves',
        pickupAddress: 'Anywhere',
        pickupStartTime: new Date(now + 3600 * 1000).toISOString(),
        pickupEndTime: new Date(now + 2 * 3600 * 1000).toISOString(),
        expiryTime: new Date(now + 3 * 3600 * 1000).toISOString(),
      }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden. Got ${res.status}`);
    }
  });

  // Test 4: Unauthenticated user cannot create food listing
  await test('Unauthenticated request to POST /api/food returns 401 Unauthorized', async () => {
    const res = await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No Auth' }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401. Got ${res.status}`);
    }
  });

  // Test 5: Rejection of invalid dates (start >= end)
  await test('Rejection of invalid dates where pickupStartTime >= pickupEndTime (HTTP 400)', async () => {
    const now = Date.now();
    const res = await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({
        title: 'Bad Times Food',
        description: 'Description of food items',
        category: 'bakery',
        quantity: 10,
        unit: 'loaves',
        pickupAddress: 'Market Square',
        pickupStartTime: new Date(now + 4 * 3600 * 1000).toISOString(),
        pickupEndTime: new Date(now + 2 * 3600 * 1000).toISOString(), // earlier than start!
        expiryTime: new Date(now + 6 * 3600 * 1000).toISOString(),
      }),
    });
    const data = await res.json();
    if (res.status !== 400 || data.success !== false) {
      throw new Error(`Expected 400 Bad Request. Got ${res.status}`);
    }
  });

  // Test 6: Rejection of negative / zero quantity
  await test('Rejection of zero or negative quantity (HTTP 400)', async () => {
    const now = Date.now();
    const res = await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({
        title: 'Zero Quantity Food',
        description: 'Description of food items',
        category: 'bakery',
        quantity: 0,
        unit: 'loaves',
        pickupAddress: 'Market Square',
        pickupStartTime: new Date(now + 3600 * 1000).toISOString(),
        pickupEndTime: new Date(now + 2 * 3600 * 1000).toISOString(),
        expiryTime: new Date(now + 6 * 3600 * 1000).toISOString(),
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request. Got ${res.status}`);
    }
  });

  // Test 7: Browse listings & verify expired items are excluded
  await test('Public browse GET /api/food returns available items and excludes expired items', async () => {
    const res = await fetch(`${API_BASE}/food`);
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data.listings)) {
      throw new Error(`Failed to browse listings: ${JSON.stringify(data)}`);
    }

    const now = new Date();
    data.listings.forEach((listing) => {
      if (new Date(listing.expiryTime) <= now) {
        throw new Error(`Expired listing returned in available browse results: ${listing.title}`);
      }
    });
  });

  // Test 8: Filter by category
  await test('Category filtering works (e.g. category=bakery)', async () => {
    const res = await fetch(`${API_BASE}/food?category=bakery`);
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    data.listings.forEach((l) => {
      if (l.category !== 'bakery') {
        throw new Error(`Expected bakery category, found: ${l.category}`);
      }
    });
  });

  // Test 9: Text search by keyword
  await test('Text search works (e.g. search=Basmati)', async () => {
    const res = await fetch(`${API_BASE}/food?search=Basmati`);
    const data = await res.json();
    if (res.status !== 200 || data.listings.length === 0) {
      throw new Error('Search for Basmati returned 0 results');
    }
  });

  // Test 10: Donor cannot edit another donor listing
  await test('Donor cannot edit another donor listing (HTTP 403 Forbidden)', async () => {
    const res = await fetch(`${API_BASE}/food/${createdListingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondDonorToken}`,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden. Got ${res.status}`);
    }
  });

  // Test 11: Donor can edit their own listing
  await test('Donor can edit their own listing (PATCH /api/food/:id)', async () => {
    const res = await fetch(`${API_BASE}/food/${createdListingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({ quantity: 20, description: 'Updated portions count to 20 boxes' }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.listing.quantity !== 20) {
      throw new Error(`Update failed: ${JSON.stringify(data)}`);
    }
  });

  // Test 12: Donor can cancel an eligible listing
  await test('Donor can cancel listing (PATCH /api/food/:id/cancel)', async () => {
    const res = await fetch(`${API_BASE}/food/${createdListingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.listing.status !== 'cancelled') {
      throw new Error(`Cancellation failed: ${JSON.stringify(data)}`);
    }
  });

  // Test 13: Donor retrieves their own listings via GET /api/food/my-listings
  await test('Donor retrieves all their listings via GET /api/food/my-listings', async () => {
    const res = await fetch(`${API_BASE}/food/my-listings`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !data.stats || !Array.isArray(data.listings)) {
      throw new Error(`My-listings failed: ${JSON.stringify(data)}`);
    }
  });

  // Test 14: Invalid ObjectId returns HTTP 400
  await test('Invalid ObjectId returns HTTP 400 Bad Request', async () => {
    const res = await fetch(`${API_BASE}/food/invalid-mongo-id-123`);
    if (res.status !== 400) {
      throw new Error(`Expected 400. Got ${res.status}`);
    }
  });

  console.log('\n====================================================');
  console.log(`PHASE 3 TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================\n');

  process.exit(passed === total ? 0 : 1);
};

runPhase3Tests();
