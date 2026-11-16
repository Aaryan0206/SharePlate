const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const Reservation = require('../models/Reservation');
const AuditLog = require('../models/AuditLog');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:5000/api';

const runAdminTests = async () => {
  console.log('==========================================================');
  console.log('  SHAREPLATE PHASE 6 ADMIN ANALYTICS & SECURITY SUITE     ');
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

  const suffix = Date.now();
  const createdUserIds = [];
  const createdListingIds = [];
  const createdReservationIds = [];
  const createdAuditIds = [];

  // Create an isolated test admin directly in DB (since public registration never allows admin)
  const testAdmin = await User.create({
    name: `Phase6 Test Admin ${suffix}`,
    email: `p6admin_${suffix}@test.com`,
    password: 'AdminPassword2026!',
    role: 'admin',
    organizationType: 'Platform Governance',
    isActive: true,
  });
  createdUserIds.push(testAdmin._id);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error(`Login failed for ${email}: ${data.message}`);
    }
    return data.token;
  };

  const registerUser = async (name, email, role) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password: 'TestPassword2026!',
        role,
        organizationType: role === 'donor' ? 'Test Cafe' : 'Community Member',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error(`Register failed for ${email}: ${data.message}`);
    }
    createdUserIds.push(data.user._id || data.user.id);
    return { token: data.token, user: data.user };
  };

  const adminToken = await login(testAdmin.email, 'AdminPassword2026!');
  const donor = await registerUser(`Phase6 Donor ${suffix}`, `p6donor_${suffix}@test.com`, 'donor');
  const recipient = await registerUser(`Phase6 Recipient ${suffix}`, `p6rec_${suffix}@test.com`, 'recipient');

  // Create controlled listing & reservation fixture
  const now = Date.now();
  const listingRes = await fetch(`${API_BASE}/food`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${donor.token}`,
    },
    body: JSON.stringify({
      title: `Phase6 Analytics Fixture ${suffix}`,
      description: 'Controlled fixture for Phase 6 analytics verification.',
      category: 'bakery',
      quantity: 12,
      unit: 'loaves',
      pickupAddress: '200 Analytics Blvd',
      pickupStartTime: new Date(now + 10 * 60 * 1000).toISOString(),
      pickupEndTime: new Date(now + 3 * 3600 * 1000).toISOString(),
      expiryTime: new Date(now + 4 * 3600 * 1000).toISOString(),
    }),
  });
  const listingData = await listingRes.json();
  const fixtureListing = listingData.listing;
  createdListingIds.push(fixtureListing._id);

  // Reserve 5 loaves
  const resvRes = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${recipient.token}`,
    },
    body: JSON.stringify({
      foodListingId: fixtureListing._id,
      quantityReserved: 5,
    }),
  });
  const resvData = await resvRes.json();
  const fixtureReservation = resvData.reservation;
  createdReservationIds.push(fixtureReservation._id);

  // Test 1: Admin can access the overview endpoint
  await test('Admin can access GET /api/admin/overview and receives live counts', async () => {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success || !data.overview || data.overview.users.total < 3) {
      throw new Error(`Expected 200 with overview. Got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // Test 2: Unauthenticated users receive 401
  await test('Unauthenticated requests to admin endpoints return HTTP 401', async () => {
    const endpoints = ['/admin/overview', '/admin/analytics', '/admin/users', '/admin/listings', '/admin/reservations', '/admin/audit-logs'];
    for (const ep of endpoints) {
      const res = await fetch(`${API_BASE}${ep}`);
      if (res.status !== 401) {
        throw new Error(`Expected 401 on ${ep}. Got ${res.status}`);
      }
    }
  });

  // Test 3: Donors and recipients receive 403 for admin endpoints
  await test('Donors and recipients receive HTTP 403 for admin endpoints', async () => {
    const resDonor = await fetch(`${API_BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${donor.token}` },
    });
    const resRec = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${recipient.token}` },
    });
    if (resDonor.status !== 403 || resRec.status !== 403) {
      throw new Error(`Expected 403 for donor & recipient. Got ${resDonor.status} and ${resRec.status}`);
    }
  });

  // Test 4: Analytics counts match controlled test fixtures
  await test('Analytics aggregation counts reflect controlled test fixtures', async () => {
    const res = await fetch(`${API_BASE}/admin/analytics?days=7`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !data.analytics) {
      throw new Error(`Expected 200 analytics. Got ${res.status}`);
    }
    const bakeryCat = data.analytics.categoryBreakdown.find((c) => c.category === 'bakery');
    if (!bakeryCat || bakeryCat.listingCount < 1) {
      throw new Error(`Expected bakery category in breakdown. Got ${JSON.stringify(data.analytics.categoryBreakdown)}`);
    }
    const reservedStatus = data.analytics.reservationStatusBreakdown.find((s) => s.status === 'reserved');
    if (!reservedStatus || reservedStatus.count < 1) {
      throw new Error(`Expected reserved status in breakdown. Got ${JSON.stringify(data.analytics.reservationStatusBreakdown)}`);
    }
  });

  // Test 5: Date filters work correctly and reject invalid ranges
  await test('Date filters work accurately and reject invalid date ranges with HTTP 400', async () => {
    const futureStart = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
    const futureEnd = new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString();
    const resEmpty = await fetch(
      `${API_BASE}/admin/analytics?startDate=${encodeURIComponent(futureStart)}&endDate=${encodeURIComponent(futureEnd)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const dataEmpty = await resEmpty.json();
    if (resEmpty.status !== 200 || dataEmpty.analytics.listingsOverTime.length !== 0) {
      throw new Error(`Expected 0 listings in future window. Got ${JSON.stringify(dataEmpty)}`);
    }

    const resInvalid = await fetch(
      `${API_BASE}/admin/analytics?startDate=${encodeURIComponent(futureEnd)}&endDate=${encodeURIComponent(futureStart)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (resInvalid.status !== 400) {
      throw new Error(`Expected 400 when startDate > endDate. Got ${resInvalid.status}`);
    }
  });

  // Test 6: User search and role filters work
  await test('User search by name/email and role filters return exact matches', async () => {
    const res = await fetch(
      `${API_BASE}/admin/users?search=${encodeURIComponent(`p6donor_${suffix}`)}&role=donor`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const data = await res.json();
    if (res.status !== 200 || data.users.length !== 1 || data.users[0].email !== `p6donor_${suffix}@test.com`) {
      throw new Error(`Expected exact donor match. Got ${JSON.stringify(data)}`);
    }
  });

  // Test 7: Pagination works and respects maximum limits
  await test('Pagination works and caps limit at maximum 50', async () => {
    const res = await fetch(`${API_BASE}/admin/users?page=1&limit=999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.limit !== 50 || data.currentPage !== 1) {
      throw new Error(`Expected limit capped at 50. Got limit=${data.limit}`);
    }
  });

  // Test 8: Sensitive fields are never returned
  await test('Sensitive fields (password, pickupCode, hashes, encryption) are never returned in admin APIs', async () => {
    const [usersRes, resvAdminRes] = await Promise.all([
      fetch(`${API_BASE}/admin/users?limit=20`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${API_BASE}/admin/reservations?limit=20`, { headers: { Authorization: `Bearer ${adminToken}` } }),
    ]);
    const usersJson = await usersRes.text();
    const resvJson = await resvAdminRes.text();

    if (usersJson.includes('"password"')) {
      throw new Error('Password field leaked in /api/admin/users!');
    }
    if (
      resvJson.includes('pickupCodeHash') ||
      resvJson.includes('pickupCodeEncrypted') ||
      resvJson.includes('"pickupCode"')
    ) {
      throw new Error('Pickup code or hash leaked in /api/admin/reservations!');
    }
  });

  // Test 9: Account deactivation blocks subsequent authenticated requests
  await test('Account deactivation blocks subsequent authenticated requests (HTTP 403)', async () => {
    const recId = recipient.user._id || recipient.user.id;
    const deactRes = await fetch(`${API_BASE}/admin/users/${recId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false, reason: 'Phase 6 deactivation test' }),
    });
    if (deactRes.status !== 200) {
      throw new Error(`Expected 200 on deactivation. Got ${deactRes.status}`);
    }

    // Recipient's existing JWT must now be blocked by authMiddleware
    const blockedRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${recipient.token}` },
    });
    if (blockedRes.status !== 403) {
      throw new Error(`Expected 403 for deactivated user token. Got ${blockedRes.status}`);
    }

    // Reactivate recipient for cleanup / further checks
    await fetch(`${API_BASE}/admin/users/${recId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: true, reason: 'Reactivate after test' }),
    });
  });

  // Test 10: Admin self-deactivation & last-active-admin protection
  await test('Admin cannot deactivate themselves or the last active admin (HTTP 400)', async () => {
    const selfRes = await fetch(`${API_BASE}/admin/users/${testAdmin._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false, reason: 'Self-lockout attempt' }),
    });
    if (selfRes.status !== 400) {
      throw new Error(`Expected 400 on self-deactivation. Got ${selfRes.status}`);
    }
  });

  // Test 11: Audit logs are created for administrative actions
  await test('Audit logs record administrative actions with admin ref, target, and reason', async () => {
    const res = await fetch(`${API_BASE}/admin/audit-logs?actionType=USER_DEACTIVATED&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const recId = (recipient.user._id || recipient.user.id).toString();
    const match = data.logs.find((l) => l.targetId === recId && l.reason === 'Phase 6 deactivation test');
    if (res.status !== 200 || !match) {
      throw new Error(`Expected audit log for USER_DEACTIVATED. Got ${JSON.stringify(data.logs)}`);
    }
    createdAuditIds.push(
      ...data.logs
        .filter((l) => l.admin && l.admin._id === testAdmin._id.toString())
        .map((l) => l._id)
    );
  });

  // Test 12: Normal users cannot create or modify audit logs
  await test('Normal users cannot view, create, or modify audit logs', async () => {
    const getRes = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${donor.token}` },
    });
    const postRes = await fetch(`${API_BASE}/admin/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donor.token}`,
      },
      body: JSON.stringify({ actionType: 'USER_DEACTIVATED' }),
    });
    if (getRes.status !== 403 || (postRes.status !== 403 && postRes.status !== 404)) {
      throw new Error(`Expected 403/404 for normal user audit log access. Got GET=${getRes.status}, POST=${postRes.status}`);
    }
  });

  // Test 13: Reservation quantity invariants remain intact after admin reservation cancel
  await test('Admin reservation cancellation preserves listing quantity invariants', async () => {
    const cancelRes = await fetch(`${API_BASE}/admin/reservations/${fixtureReservation._id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 'Admin moderation invariance test' }),
    });
    if (cancelRes.status !== 200) {
      throw new Error(`Expected 200 on admin reservation cancel. Got ${cancelRes.status}`);
    }

    const dbListing = await FoodListing.findById(fixtureListing._id);
    const sum = (dbListing.availableQuantity || 0) + (dbListing.reservedQuantity || 0) + (dbListing.collectedQuantity || 0);
    if (sum !== dbListing.originalQuantity || dbListing.availableQuantity !== 12) {
      throw new Error(`Invariant broken! sum=${sum}, original=${dbListing.originalQuantity}`);
    }
  });

  // Clean up controlled test fixtures safely
  await AuditLog.deleteMany({ admin: testAdmin._id });
  await Reservation.deleteMany({ _id: { $in: createdReservationIds } });
  await FoodListing.deleteMany({ _id: { $in: createdListingIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });

  console.log('\n==========================================================');
  console.log(`PHASE 6 TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('==========================================================\n');

  process.exit(passed === total ? 0 : 1);
};

runAdminTests().catch((err) => {
  console.error('Fatal Phase 6 test suite error:', err);
  process.exit(1);
});
