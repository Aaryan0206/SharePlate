const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:5000/api';

const runE2E = async () => {
  console.log('====================================================');
  console.log('    SHAREPLATE PHASE 2 E2E LIVE TEST REPORT        ');
  console.log('====================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shareplate';
  await mongoose.connect(mongoUri);

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

  // 1. Health Endpoint
  await test('Backend Health & MongoDB status check', async () => {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'online') {
      throw new Error(`Unexpected health status: ${JSON.stringify(data)}`);
    }
  });

  // 2. Reject Public Registration as Admin
  await test('Reject public registration attempting role="admin"', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker',
        email: 'hacker@exploit.com',
        password: 'Password123!',
        role: 'admin',
      }),
    });
    const data = await res.json();
    if (res.status !== 400 || data.success !== false) {
      throw new Error(`Admin registration should return 400. Got ${res.status}`);
    }
  });

  // 3. Register New Donor
  const donorEmail = `donor_${Date.now()}@campusbakery.org`;
  let donorToken = '';
  await test('Register new Donor via POST /api/auth/register', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Artisan Sourdough Bakery',
        email: donorEmail,
        password: 'BakeryPassword2026!',
        role: 'donor',
        phone: '+1-555-0321',
        organizationType: 'Bakery',
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.token || data.user.role !== 'donor') {
      throw new Error(`Failed to register donor: ${JSON.stringify(data)}`);
    }
    donorToken = data.token;
  });

  // 4. Verify MongoDB record for Donor
  await test('Verify MongoDB Compass: Donor record stored with bcrypt hash', async () => {
    const doc = await User.findOne({ email: donorEmail }).select('+password');
    if (!doc) throw new Error('Donor document not found in MongoDB');
    if (!doc.password.startsWith('$2a$') && !doc.password.startsWith('$2b$')) {
      throw new Error('Password was not hashed with bcrypt');
    }
    if (doc.password === 'BakeryPassword2026!') {
      throw new Error('Password stored as plaintext! Security failure.');
    }
    if (doc.role !== 'donor' || !doc.isActive) {
      throw new Error('Role or active status incorrect');
    }
  });

  // 5. Duplicate Email Rejection
  await test('Reject duplicate email registration with HTTP 409 Conflict', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Pretender',
        email: donorEmail,
        password: 'BakeryPassword2026!',
        role: 'donor',
      }),
    });
    const data = await res.json();
    if (res.status !== 409 || data.success !== false) {
      throw new Error(`Expected 409 Conflict. Got ${res.status}`);
    }
  });

  // 6. Register New Recipient
  const recipientEmail = `recipient_${Date.now()}@sheltercare.org`;
  let recipientToken = '';
  await test('Register new Recipient via POST /api/auth/register', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hope Youth Shelter',
        email: recipientEmail,
        password: 'ShelterPassword2026!',
        role: 'recipient',
        phone: '+1-555-0999',
        organizationType: 'NGO Shelter',
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.token || data.user.role !== 'recipient') {
      throw new Error(`Failed to register recipient: ${JSON.stringify(data)}`);
    }
    recipientToken = data.token;
  });

  // 7. Verify MongoDB record for Recipient
  await test('Verify MongoDB Compass: Recipient record stored with bcrypt hash', async () => {
    const doc = await User.findOne({ email: recipientEmail }).select('+password');
    if (!doc) throw new Error('Recipient document not found in MongoDB');
    if (!doc.password.startsWith('$2a$') && !doc.password.startsWith('$2b$')) {
      throw new Error('Password was not hashed with bcrypt');
    }
    if (doc.role !== 'recipient') {
      throw new Error('Role incorrect in database');
    }
  });

  // 8. Login with Valid Credentials
  await test('Login with valid credentials returns JWT token & user object', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: donorEmail,
        password: 'BakeryPassword2026!',
      }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.token || data.user.email !== donorEmail) {
      throw new Error(`Login failed: ${JSON.stringify(data)}`);
    }
  });

  // 9. Login with Invalid Password
  await test('Reject login with invalid password (HTTP 401 Unauthorized)', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: donorEmail,
        password: 'WrongPassword!',
      }),
    });
    const data = await res.json();
    if (res.status !== 401 || data.success !== false) {
      throw new Error(`Expected 401. Got ${res.status}`);
    }
  });

  // 10. Login with Nonexistent Email
  await test('Reject login with nonexistent email (HTTP 401 Unauthorized)', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ghost_user_does_not_exist@shareplate.org',
        password: 'Password123!',
      }),
    });
    const data = await res.json();
    if (res.status !== 401 || data.success !== false) {
      throw new Error(`Expected 401. Got ${res.status}`);
    }
  });

  // 11. Profile Check /api/auth/me (Protected Route)
  await test('Access GET /api/auth/me with valid Bearer token', async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.user.email !== donorEmail) {
      throw new Error(`Failed to get profile: ${JSON.stringify(data)}`);
    }
    if (data.user.password !== undefined) {
      throw new Error('Password hash leaked in /api/auth/me response');
    }
  });

  // 12. Reject /api/auth/me without Token
  await test('Reject GET /api/auth/me without token (HTTP 401 Unauthorized)', async () => {
    const res = await fetch(`${API_BASE}/auth/me`);
    const data = await res.json();
    if (res.status !== 401 || data.success !== false) {
      throw new Error(`Expected 401 Unauthorized. Got ${res.status}`);
    }
  });

  // 13. Role Authorization: Donor can access /donor-only
  await test('Donor role grants access to /api/auth/donor-only (HTTP 200)', async () => {
    const res = await fetch(`${API_BASE}/auth/donor-only`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.success !== true) {
      throw new Error(`Expected 200. Got ${res.status}`);
    }
  });

  // 14. Role Authorization: Donor cannot access /admin-only (HTTP 403 Forbidden)
  await test('Donor role is forbidden from /api/auth/admin-only (HTTP 403 Forbidden)', async () => {
    const res = await fetch(`${API_BASE}/auth/admin-only`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const data = await res.json();
    if (res.status !== 403 || data.success !== false) {
      throw new Error(`Expected 403 Forbidden. Got ${res.status}`);
    }
  });

  // 15. Role Authorization: Recipient can access /recipient-only
  await test('Recipient role grants access to /api/auth/recipient-only (HTTP 200)', async () => {
    const res = await fetch(`${API_BASE}/auth/recipient-only`, {
      headers: { Authorization: `Bearer ${recipientToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.success !== true) {
      throw new Error(`Expected 200. Got ${res.status}`);
    }
  });

  // 16. Role Authorization: Recipient cannot access /donor-only (HTTP 403 Forbidden)
  await test('Recipient role is forbidden from /api/auth/donor-only (HTTP 403 Forbidden)', async () => {
    const res = await fetch(`${API_BASE}/auth/donor-only`, {
      headers: { Authorization: `Bearer ${recipientToken}` },
    });
    const data = await res.json();
    if (res.status !== 403 || data.success !== false) {
      throw new Error(`Expected 403 Forbidden. Got ${res.status}`);
    }
  });

  // 17. Admin Login & Full Access
  await test('Admin account can access all role zones including /admin-only', async () => {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@shareplate.org',
        password: 'Admin@SharePlate2026',
      }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
    }

    const adminToken = loginData.token;
    const adminRes = await fetch(`${API_BASE}/auth/admin-only`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminRes.status !== 200) {
      throw new Error(`Admin access to /admin-only failed: ${adminRes.status}`);
    }
  });

  // 18. Logout endpoint
  await test('Logout via POST /api/auth/logout clears auth cookie', async () => {
    const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    const data = await res.json();
    if (res.status !== 200 || data.success !== true) {
      throw new Error(`Logout failed: ${JSON.stringify(data)}`);
    }
  });

  console.log('\n====================================================');
  console.log(`E2E TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================\n');

  process.exit(passed === total ? 0 : 1);
};

runE2E();
