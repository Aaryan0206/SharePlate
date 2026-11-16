const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const Reservation = require('../models/Reservation');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:5000/api';

const runReservationTests = async () => {
  console.log('==========================================================');
  console.log('  SHAREPLATE PHASE 5 RESERVATIONS & CONCURRENCY SUITE     ');
  console.log('==========================================================');

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

  // Setup isolated test accounts & listings
  const suffix = Date.now();
  const createdUserIds = [];
  const createdListingIds = [];
  const createdReservationIds = [];

  const registerAndLogin = async (name, email, role) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password: 'TestPassword2026!',
        role,
        organizationType: role === 'donor' ? 'Test Kitchen' : 'Community Member',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error(`Failed to register ${email}: ${data.message}`);
    }
    createdUserIds.push(data.user._id || data.user.id);
    return { token: data.token, user: data.user };
  };

  const donor1 = await registerAndLogin('Phase5 Donor One', `p5donor1_${suffix}@test.com`, 'donor');
  const donor2 = await registerAndLogin('Phase5 Donor Two', `p5donor2_${suffix}@test.com`, 'donor');
  const recipient1 = await registerAndLogin('Phase5 Recipient One', `p5rec1_${suffix}@test.com`, 'recipient');
  const recipient2 = await registerAndLogin('Phase5 Recipient Two', `p5rec2_${suffix}@test.com`, 'recipient');

  const createListing = async (token, overrides = {}) => {
    const now = Date.now();
    const res = await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: `Phase5 Test Surplus ${suffix}`,
        description: 'Isolated test listing for Phase 5 reservation verification.',
        category: 'cooked meals',
        quantity: 10,
        unit: 'boxes',
        pickupAddress: '100 Test Kitchen Ave',
        pickupStartTime: new Date(now + 10 * 60 * 1000).toISOString(),
        pickupEndTime: new Date(now + 3 * 3600 * 1000).toISOString(),
        expiryTime: new Date(now + 4 * 3600 * 1000).toISOString(),
        ...overrides,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.listing) {
      throw new Error(`Failed to create test listing: ${data.message}`);
    }
    createdListingIds.push(data.listing._id);
    return data.listing;
  };

  const mainListing = await createListing(donor1.token, { quantity: 10 });
  const raceListing = await createListing(donor1.token, { quantity: 5, title: `Race Condition Test ${suffix}` });

  // Create an expired listing directly in DB for Test 15
  const expiredListing = await FoodListing.create({
    title: `Expired Phase5 Listing ${suffix}`,
    description: 'Expired listing for reservation rejection test',
    category: 'bakery',
    quantity: 5,
    originalQuantity: 5,
    availableQuantity: 5,
    unit: 'loaves',
    donor: donor1.user._id || donor1.user.id,
    pickupAddress: 'Expired Test Address',
    pickupStartTime: new Date(Date.now() - 5 * 3600 * 1000),
    pickupEndTime: new Date(Date.now() - 2 * 3600 * 1000),
    expiryTime: new Date(Date.now() - 1 * 3600 * 1000),
    status: 'available',
  });
  createdListingIds.push(expiredListing._id);

  let firstReservationId = null;
  let firstPickupCode = null;
  let secondReservationId = null;
  let secondPickupCode = null;

  // Test 1: Recipient successfully reserves an available listing
  await test('Recipient successfully reserves an available listing', async () => {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recipient1.token}`,
      },
      body: JSON.stringify({
        foodListingId: mainListing._id,
        quantityReserved: 4,
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.success || !data.reservation.pickupCode) {
      throw new Error(`Expected 201 with pickupCode. Got ${res.status}: ${JSON.stringify(data)}`);
    }
    firstReservationId = data.reservation._id;
    firstPickupCode = data.reservation.pickupCode;
    createdReservationIds.push(firstReservationId);
  });

  // Test 2: Unauthenticated reservation attempts are rejected
  await test('Unauthenticated reservation attempts are rejected (HTTP 401)', async () => {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodListingId: mainListing._id, quantityReserved: 1 }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401. Got ${res.status}`);
    }
  });

  // Test 3: Donors cannot reserve food as recipients
  await test('Donors cannot reserve food as recipients (HTTP 403)', async () => {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donor2.token}`,
      },
      body: JSON.stringify({ foodListingId: mainListing._id, quantityReserved: 1 }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403. Got ${res.status}`);
    }
  });

  // Test 4: Invalid and non-positive quantities are rejected
  await test('Invalid and non-positive quantities are rejected (HTTP 400)', async () => {
    const resZero = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recipient2.token}`,
      },
      body: JSON.stringify({ foodListingId: mainListing._id, quantityReserved: 0 }),
    });
    const resNeg = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recipient2.token}`,
      },
      body: JSON.stringify({ foodListingId: mainListing._id, quantityReserved: -3 }),
    });
    if (resZero.status !== 400 || resNeg.status !== 400) {
      throw new Error(`Expected 400 for 0/-3. Got ${resZero.status} and ${resNeg.status}`);
    }
  });

  // Test 5: Insufficient quantity returns HTTP 409
  await test('Insufficient quantity returns HTTP 409 Conflict', async () => {
    // mainListing started with 10, 4 reserved -> 6 remaining. Requesting 8 must return 409.
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recipient2.token}`,
      },
      body: JSON.stringify({ foodListingId: mainListing._id, quantityReserved: 8 }),
    });
    if (res.status !== 409) {
      throw new Error(`Expected 409. Got ${res.status}`);
    }
  });

  // Test 6: Two concurrent requests cannot reserve more than the available quantity
  await test('Two concurrent requests cannot overbook the last available quantity', async () => {
    // raceListing has 5 boxes. Both recipient1 and recipient2 simultaneously try to reserve 4 boxes.
    const req1 = fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recipient1.token}`,
      },
      body: JSON.stringify({ foodListingId: raceListing._id, quantityReserved: 4 }),
    });
    const req2 = fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recipient2.token}`,
      },
      body: JSON.stringify({ foodListingId: raceListing._id, quantityReserved: 4 }),
    });

    const [r1, r2] = await Promise.all([req1, req2]);
    const [d1, d2] = await Promise.all([r1.json(), r2.json()]);

    const statuses = [r1.status, r2.status].sort();
    if (statuses[0] !== 201 || statuses[1] !== 409) {
      throw new Error(`Expected [201, 409] for concurrent requests. Got [${statuses.join(', ')}]`);
    }

    const winnerData = r1.status === 201 ? d1 : d2;
    createdReservationIds.push(winnerData.reservation._id);

    const updatedRace = await FoodListing.findById(raceListing._id);
    if (updatedRace.availableQuantity !== 1 || updatedRace.reservedQuantity !== 4) {
      throw new Error(
        `Stock inconsistency after race! available=${updatedRace.availableQuantity}, reserved=${updatedRace.reservedQuantity}`
      );
    }
  });

  // Test 7: Listing quantity remains correct after reservation
  await test('Listing quantity remains accurate in MongoDB after reservation', async () => {
    const dbListing = await FoodListing.findById(mainListing._id);
    if (dbListing.originalQuantity !== 10 || dbListing.availableQuantity !== 6 || dbListing.reservedQuantity !== 4) {
      throw new Error(
        `Expected original=10, available=6, reserved=4. Got original=${dbListing.originalQuantity}, available=${dbListing.availableQuantity}, reserved=${dbListing.reservedQuantity}`
      );
    }
  });

  // Test 8: Eligible cancellation restores quantity exactly once
  await test('Eligible cancellation restores listing quantity exactly once', async () => {
    const res = await fetch(`${API_BASE}/reservations/${firstReservationId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recipient1.token}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.reservation.status !== 'cancelled') {
      throw new Error(`Expected 200 cancelled. Got ${res.status}: ${JSON.stringify(data)}`);
    }
    const dbListing = await FoodListing.findById(mainListing._id);
    if (dbListing.availableQuantity !== 10 || dbListing.reservedQuantity !== 0) {
      throw new Error(
        `Expected available=10, reserved=0 after cancel. Got available=${dbListing.availableQuantity}, reserved=${dbListing.reservedQuantity}`
      );
    }
  });

  // Test 9: Repeated cancellation does not restore quantity again
  await test('Repeated cancellation is rejected and does not restore quantity twice', async () => {
    const res = await fetch(`${API_BASE}/reservations/${firstReservationId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recipient1.token}` },
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 on repeat cancel. Got ${res.status}`);
    }
    const dbListing = await FoodListing.findById(mainListing._id);
    if (dbListing.availableQuantity !== 10 || dbListing.reservedQuantity !== 0) {
      throw new Error(`Quantity changed on repeat cancel! available=${dbListing.availableQuantity}`);
    }
  });

  // Reserve again with recipient2 for pickup verification tests (reserve 10/10)
  const res2 = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${recipient2.token}`,
    },
    body: JSON.stringify({ foodListingId: mainListing._id, quantityReserved: 10 }),
  });
  const data2 = await res2.json();
  secondReservationId = data2.reservation._id;
  secondPickupCode = data2.reservation.pickupCode;
  createdReservationIds.push(secondReservationId);

  // Test 12 (before 11): Invalid pickup code is rejected
  await test('Invalid pickup verification code is rejected (HTTP 400)', async () => {
    const res = await fetch(`${API_BASE}/reservations/${secondReservationId}/verify-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donor1.token}`,
      },
      body: JSON.stringify({ pickupCode: 'WRONG-CODE' }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 for wrong code. Got ${res.status}`);
    }
  });

  // Test 13: A donor cannot verify another donor's reservation
  await test("Donor cannot verify another donor's reservation (HTTP 403)", async () => {
    const res = await fetch(`${API_BASE}/reservations/${secondReservationId}/verify-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donor2.token}`,
      },
      body: JSON.stringify({ pickupCode: secondPickupCode }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 for unauthorized donor. Got ${res.status}`);
    }
  });

  // Test 11: Valid pickup code verifies collection
  await test('Valid pickup code verifies collection and updates listing & reservation', async () => {
    const res = await fetch(`${API_BASE}/reservations/${secondReservationId}/verify-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donor1.token}`,
      },
      body: JSON.stringify({ pickupCode: secondPickupCode }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.reservation.status !== 'collected' || !data.reservation.collectedAt) {
      throw new Error(`Expected 200 collected. Got ${res.status}: ${JSON.stringify(data)}`);
    }
    const dbListing = await FoodListing.findById(mainListing._id);
    if (dbListing.collectedQuantity !== 10 || dbListing.reservedQuantity !== 0 || dbListing.status !== 'collected') {
      throw new Error(
        `Expected collectedQuantity=10, reserved=0, status=collected. Got collected=${dbListing.collectedQuantity}, reserved=${dbListing.reservedQuantity}, status=${dbListing.status}`
      );
    }
  });

  // Test 14: Repeated pickup verification does not change quantities twice
  await test('Repeated pickup verification is idempotent and does not change quantities twice', async () => {
    const res = await fetch(`${API_BASE}/reservations/${secondReservationId}/verify-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donor1.token}`,
      },
      body: JSON.stringify({ pickupCode: secondPickupCode }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.alreadyCollected) {
      throw new Error(`Expected idempotent 200 alreadyCollected. Got ${res.status}: ${JSON.stringify(data)}`);
    }
    const dbListing = await FoodListing.findById(mainListing._id);
    if (dbListing.collectedQuantity !== 10 || dbListing.reservedQuantity !== 0) {
      throw new Error(`Quantities altered on repeat verification! collected=${dbListing.collectedQuantity}`);
    }
  });

  // Test 10: Collected reservations cannot be cancelled
  await test('Collected reservations cannot be cancelled (HTTP 400)', async () => {
    const res = await fetch(`${API_BASE}/reservations/${secondReservationId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recipient2.token}` },
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 when cancelling collected reservation. Got ${res.status}`);
    }
  });

  // Test 15: Expired listings cannot be reserved
  await test('Expired listings cannot be reserved (HTTP 400)', async () => {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recipient1.token}`,
      },
      body: JSON.stringify({ foodListingId: expiredListing._id, quantityReserved: 1 }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 for expired listing. Got ${res.status}`);
    }
  });

  // Clean up isolated test data safely
  await Reservation.deleteMany({ _id: { $in: createdReservationIds } });
  await FoodListing.deleteMany({ _id: { $in: createdListingIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });

  console.log('\n==========================================================');
  console.log(`PHASE 5 TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('==========================================================\n');

  process.exit(passed === total ? 0 : 1);
};

runReservationTests().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
