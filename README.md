# SharePlate — Surplus Food Sharing Platform

> **Tagline:** *Share more. Waste less.*

SharePlate is a modern, hyper-local surplus food redistribution web application designed to reduce food waste and combat hunger. It connects college cafeterias, restaurants, bakeries, hostels, and event organizers with students, families, and community shelters who can collect excess wholesome food.

---

## 1. Project Overview & Placement Context

- **Academic Context:** College Placement Demonstration Project using MongoDB.
- **Architectural Philosophy:** Practical, production-grade MERN architecture emphasizing geospatial queries (`2dsphere`), atomic stock consistency, role-based workflows, and intuitive sustainability UI/UX.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with a custom sustainability design palette
- **Icons:** Lucide React
- **Routing:** React Router v6
- **State Management:** React Authentication Context (`AuthContext`)
- **Charts & Maps:** Recharts, Leaflet / React Leaflet with OpenStreetMap tiles (Phases 4 & 6)

### Backend
- **Runtime:** Node.js & Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT-based authentication with `bcryptjs` password hashing (Phase 2)
- **Session Security:** Cryptographically signed JWTs, HttpOnly cookies with `SameSite`, Bearer token fallback
- **Listing Management:** Real-time CRUD operations, server-side expiry validation, ownership guards (Phase 3)
- **Security:** Role-based access control, input validation, centralized error handling

---

## 3. UI/UX Design System

The visual identity embodies a professional, modern sustainability venture:
- **Primary Color:** Deep Forest Green (`#1B4332`, `forest-800`) — represents environmental stewardship and trust.
- **Secondary Colors:**
  - Sage Green (`#52B788`, `#D8F3DC`) — freshness and vitality.
  - Warm Cream (`#FDFBF7`, `#FAF6EE`) — inviting, approachable backdrop.
  - Subtle Muted Orange (`#E07A5F`) — urgency badges, alerts, and reservation accents.
- **Typography:** Inter (modern, clean, accessible sans-serif).
- **Cards & Surfaces:** Soft rounded geometry (`rounded-2xl`, `rounded-3xl`), subtle borders, restrained shadows.

---

## 4. Phased Implementation Roadmap

- [x] **Phase 1: Project Inspection, UI Foundation, and Landing Page** *(Completed & Verified)*
- [x] **Phase 2: Authentication, User Roles, and Protected Routes** *(Completed & Verified)*
- [x] **Phase 3: Food Listings, Create/Edit Forms, and Browsing Filters** *(Completed & Verified)*
  - Mongoose `FoodListing` schema with category validation, pickup windows, and compound indexes.
  - Full CRUD API endpoints (`/api/food`) protected by JWT ownership checks.
  - Server-side expiry calculation filtering out expired items from normal browse results.
  - Dynamic discovery page (`/browse`) with live MongoDB search, category filters, quantity range, and pagination.
  - Dedicated food listing details page (`/food/:id`) showing large imagery, donor profile, pickup times, and allergen notices.
  - Donor listing management dashboard (`/donor/dashboard`) with edit and cancellation capabilities.
  - 14/14 automated food listing tests passing (`server/scripts/testFoodAPI.js`).
- [x] **Phase 4: MongoDB Geospatial Search and Interactive Map** *(Completed & Verified)*
  - GeoJSON `Point` coordinates schema: `[longitude, latitude]` (`-180 <= lng <= 180`, `-90 <= lat <= 90`).
  - Sparse `2dsphere` index on `FoodListing.location` supporting efficient spherical distance calculations.
  - Dedicated `GET /api/food/nearby` endpoint utilizing MongoDB `$near` and `$geometry` operators with strict server-side expiry exclusion.
  - Free OpenStreetMap Nominatim reverse geocoder (`GET /api/food/geocode`) with in-memory caching and User-Agent etiquette.
  - Interactive Leaflet map (`/map`) using custom DOM divIcons, user location tracking, radius circles, and dynamic flyTo animators.
  - Location picker modal for donors during listing creation and editing, with manual map-pinning and address search.
  - "Find Food Near Me" radius filter on the Browse page with responsive distance badges (`X.X km away`).
  - Backward compatibility: legacy listings without coordinates remain fully accessible in standard browse queries.
  - 13/13 automated geospatial tests passing (`server/scripts/testGeospatial.js`).
- [x] **Phase 5: Reservations, Cancellation, Quantity Consistency, and Collection** *(Completed & Verified)*
  - `Reservation` Mongoose model with `reserved`, `cancelled`, `collected`, `expired` lifecycle, partial unique active-reservation index, and HMAC-SHA256 + AES-256-GCM pickup code protection.
  - Extended `FoodListing` quantity model tracking `originalQuantity`, `availableQuantity`, `reservedQuantity`, and `collectedQuantity` (`available + reserved + collected == original`).
  - Atomic conditional `findOneAndUpdate` decrementing with compensating rollback (for standalone MongoDB where replica-set transactions are unavailable) preventing double-booking and race conditions.
  - Idempotent cancellation (`PATCH /api/reservations/:id/cancel`) and idempotent donor pickup verification (`POST /api/reservations/:id/verify-pickup`).
  - Live Recipient Reservation History & Pickup Code portal (`/recipient/dashboard`) and Donor Verification Queue (`/donor/dashboard`).
  - 15/15 automated reservation & concurrency tests passing (`server/scripts/testReservations.js`).
- [x] **Phase 6: Admin Dashboard, Platform Analytics & Management** *(Completed & Verified)*
  - Protected `/admin` and `/admin/dashboard` routes with live overview metrics, Recharts analytics (`AreaChart`, `PieChart`, `BarChart`), user/listing/reservation moderation, and immutable `AuditLog` tracking.
  - 13/13 automated admin, security, and analytics tests passing (`server/scripts/testAdmin.js`).
- [x] **Phase 7: Final Integration, Security Review & Placement Readiness** *(Completed & Verified)*
  - Added rate limiting (`rateLimitMiddleware.js`) on `/api/auth/login`, `/api/auth/register`, and `/api/reservations/:id/verify-pickup`.
  - Hardened production CORS rejection, bounded JSON payload limits (`100kb`), security response headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`), and fixed error-handler status precedence.
  - Full end-to-end browser verification across donor, recipient, map, and admin flows + 83/83 backend tests + production Vite build.

---

## 4.1 Architecture & Request Flow

```text
React 18 + Vite UI (localhost:5173)
  │  fetch('/api/*') + credentials: 'include' + Bearer JWT
  ▼
Vite Dev Proxy / Express.js API (localhost:5000)
  ├── Security Headers + CORS + 100KB JSON Limit + Cookie Parser
  ├── Rate Limiters (Auth & Pickup Verification)
  ├── protect (JWT verify -> User lookup -> isActive check)
  ├── authorizeRoles('donor' | 'recipient' | 'admin')
  └── Controllers -> Mongoose ODM -> MongoDB (127.0.0.1:27017/shareplate)
```

### Authentication & Authorization Design
- **Passwords:** Hashed with `bcryptjs` (`select: false` on `User.password`).
- **Tokens:** Signed JWTs stored in `HttpOnly` cookies (`SameSite=lax` in dev, `SameSite=none; Secure` in production) with Bearer token support.
- **RBAC:** `protect` verifies the JWT and checks `user.isActive` on every protected request (so deactivated accounts are blocked immediately); `authorizeRoles` enforces role permissions (`donor`, `recipient`, `admin`), and controllers enforce document ownership.
- **Pickup Verification Codes:** 8-character alphanumeric codes stored in MongoDB only as `pickupCodeHash` (HMAC-SHA256 for constant-time verification) and `pickupCodeEncrypted` (AES-256-GCM so only the recipient's own endpoint can decrypt it).

### Known Limitations
1. **Standalone MongoDB:** Local `127.0.0.1:27017` runs as a standalone instance without replica-set multi-document ACID transactions. SharePlate compensates with atomic conditional `findOneAndUpdate` operations and compensating rollbacks, but a crash strictly between two writes would require reconciliation.
2. **In-Memory Rate Limiter & Geocode Cache:** Rate-limit windows and Nominatim geocode caches live in Node.js memory (suitable for single-instance deployment; use Redis for horizontal scaling).
3. **Lazy Expiry:** Expired reservations and listings are transitioned lazily on read/action endpoints rather than by a separate cron/worker process.

---

## 5. MongoDB Compass Verification Guide

You can inspect the database collections and geospatial indexes directly in **MongoDB Compass**:

1. Open **MongoDB Compass**.
2. Connect to: `mongodb://127.0.0.1:27017`
3. Select database: **`shareplate`**
4. Collections available:
   - **`users`**: Contains registered accounts with bcrypt hashed passwords (`$2a$` / `$2b$`).
   - **`foodlistings`**: Contains surplus food donations with GeoJSON `location` objects, donor references, pickup windows, and quantity tracking (`originalQuantity`, `availableQuantity`, `reservedQuantity`, `collectedQuantity`).
   - **`reservations`**: Contains food reservation records linking `foodListing`, `recipient`, and `donor`, along with `pickupCodeHash` (HMAC-SHA256), `pickupCodeEncrypted` (AES-256-GCM), `pickupDeadline`, `collectedAt`, and `cancelledAt`.
5. Inspect Indexes:
   - **`foodlistings` -> `Indexes`**: Confirm `location_2dsphere` (Sparse) and compound indexes on `status`, `expiryTime`, `category`.
   - **`reservations` -> `Indexes`**: Confirm indexes on `{ recipient: 1, status: 1, createdAt: -1 }`, `{ donor: 1, status: 1, createdAt: -1 }`, `{ foodListing: 1, status: 1 }`, `{ status: 1, pickupDeadline: 1 }`, and the partial unique index `{ foodListing: 1, recipient: 1 }` (`status: 'reserved'`).
6. Inspect Documents:
   - Under **`foodlistings`**, verify `availableQuantity + reservedQuantity + collectedQuantity == originalQuantity` before and after reservations/cancellations/collections.
   - Under **`reservations`**, verify no plaintext `pickupCode` is stored, and check `status`, `collectedAt`, or `cancelledAt`.

### Quantity Consistency & Concurrency Model (Standalone MongoDB)
Because the local MongoDB deployment runs as a **standalone instance** (multi-document ACID transactions require a replica set), SharePlate guarantees overbooking protection using **atomic conditional `findOneAndUpdate`** queries:
- Decrementing `availableQuantity` and incrementing `reservedQuantity` happens in one atomic document lock conditioned on `status: 'available'`, `expiryTime > now`, and `availableQuantity >= qty`.
- If `Reservation.create()` fails (e.g., duplicate active reservation), a **compensating rollback** immediately restores `availableQuantity` and `reservedQuantity`.
- Cancellation (`PATCH /api/reservations/:id/cancel`) and collection verification (`POST /api/reservations/:id/verify-pickup`) use atomic status transitions (`status: 'reserved'` -> `'cancelled'` / `'collected'`) so repeated requests are idempotent and never alter stock twice.

---

## 6. API Endpoints (Phases 2, 3 & 4)

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a donor or recipient account |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT cookie & bearer token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve profile for authenticated user |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate authentication session and clear cookie |
| `POST` | `/api/food` | Donor, Admin | Publish a new surplus food listing with GeoJSON location |
| `GET` | `/api/food` | Public | Browse available listings with search, category, sort, and optional nearby filter |
| `GET` | `/api/food/nearby` | Public | Geospatial search querying listings within radius (`km`) using `$near` |
| `GET` | `/api/food/geocode` | Public | Forward geocode address queries using OpenStreetMap Nominatim with cache |
| `GET` | `/api/food/:id` | Public | Retrieve full details of a specific food listing |
| `PATCH` | `/api/food/:id` | Donor Owner, Admin | Edit listing details and update coordinates (restricted if collected/cancelled) |
| `PATCH` | `/api/food/:id/cancel` | Donor Owner, Admin | Cancel an eligible listing |
| `GET` | `/api/food/my-listings` | Donor, Admin | Retrieve the authenticated donor's own listings and metrics |
| `POST` | `/api/reservations` | Recipient | Atomically reserve a quantity of an available listing |
| `GET` | `/api/reservations/my-reservations` | Recipient, Admin | View recipient's reservation history and active pickup codes |
| `GET` | `/api/reservations/donor` | Donor, Admin | View incoming reservations for listings owned by the donor |
| `GET` | `/api/reservations/:id` | Owner / Admin | View single reservation details |
| `PATCH` | `/api/reservations/:id/cancel` | Recipient Owner, Admin | Cancel an eligible reservation and restore listing quantity once |
| `POST` | `/api/reservations/:id/verify-pickup` | Donor Owner, Admin | Verify pickup code and record collection (idempotent) |

---

## 7. Running the Application Locally

### 1. Run Backend Server
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

### 2. Run Frontend Client
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### 3. Seed Realistic Geospatial Food Data
```bash
cd server
npm run seed:food
# Inserts 9 verified listings across central Bangalore, suburbs, legacy, and expired items
```

### 4. Run Automated Test Suites
```bash
cd server
npm run test:auth          # Phase 2 auth suite (10 tests)
npm run test:food          # Phase 3 food listing suite (14 tests)
npm run test:geo           # Phase 4 geospatial & map suite (13 tests)
npm run test:reservations  # Phase 5 reservation & concurrency suite (15 tests)
npm run test:admin         # Phase 6 admin analytics, safeguards & audit suite (13 tests)
npm run test:e2e           # End-to-end integration suite (18 tests)
# Total: 83/83 automated tests passing against live MongoDB!
```

---

## 8. Phase 6 — Admin Dashboard, Platform Analytics & Management

### Routes & Access Control
- **Frontend Routes**: `/admin` and `/admin/dashboard` (protected by `ProtectedRoute` with `allowedRoles={['admin']}` and `Admin Portal` nav link hidden for non-admin users).
- **Backend Endpoints** (`/api/admin/*`, all protected by `protect` + `authorizeRoles('admin')`):
  - `GET /api/admin/overview` — Live MongoDB counts and unit-grouped collected quantities.
  - `GET /api/admin/analytics?days=30` (or `startDate` & `endDate`) — MongoDB aggregation pipelines for daily listings, reservations, collections, status breakdown, and top categories.
  - `GET /api/admin/users` — Paginated (`max 50`), searchable, filterable user directory (excludes `password`).
  - `PATCH /api/admin/users/:id/status` — Activate/deactivate user accounts; deactivated users are immediately rejected by `protect` middleware (`403`).
  - `PATCH /api/admin/users/:id/role` — Update user roles (`donor`, `recipient`, `admin`).
  - `GET /api/admin/listings` & `PATCH /api/admin/listings/:id/cancel` — Moderation view and cancellation of `available`/`reserved` listings (auto-cancels active reservations and preserves `availableQuantity + reservedQuantity + collectedQuantity == originalQuantity`).
  - `GET /api/admin/reservations` & `PATCH /api/admin/reservations/:id/cancel` — Reservation oversight (never exposes `verificationCodeHash` or verification codes) and admin cancellation restoring listing quantities.
  - `GET /api/admin/audit-logs` — Read-only paginated audit trail (`AuditLog` collection).

### Metric Definitions
- **Users**: `total`, `donors`, `recipients`, `admins`, `active`, `inactive`.
- **Listings**: `total`, `availableNow` (`status: 'available'`, `availableQuantity > 0`, `expiresAt > now`), plus `byStatus` breakdown.
- **Reservations**: `total`, `active` (`status: 'reserved'`), `collected`, `cancelled`, `expired`, `cancelledAndExpired`.
- **Collected by Unit (`collectedByUnit`)**: Aggregated from `Reservation` documents with `status: 'collected'` grouped by `unit` so incompatible units (`servings`, `kg`, `packets`, `boxes`) are never summed together.

### Safeguards & Standalone MongoDB Note
- Admins cannot deactivate or demote their own account (`400`).
- The system blocks deactivating or demoting the **last active admin** (`400`).
- Local MongoDB at `127.0.0.1:27017/shareplate` runs as a **standalone** instance, so multi-document ACID transactions are not available; `AuditLog` entries are written immediately after each primary mutation with explicit error handling.

### Verifying Phase 6 in MongoDB Compass
1. Connect to `mongodb://127.0.0.1:27017/shareplate`.
2. Open the **`auditlogs`** collection to inspect immutable moderation records (`admin`, `actionType`, `targetType`, `targetId`, `reason`, `metadata`, `createdAt`).
3. Open the **`users`** collection to verify `isActive` and `role` updates while confirming `password` remains bcrypt-hashed and never returned by `/api/admin/users`.

---

## 9. Demo Accounts for Interview Demonstration

| Persona | Role | Email | Password | Allowed Dashboards |
|---|---|---|---|---|
| **Platform Administrator** | `admin` | `admin@shareplate.org` | `Admin@SharePlate2026` | `/admin/dashboard`, `/donor/dashboard`, `/recipient/dashboard` |
| **Flour & Hearth Bakery** | `donor` | `donor@greenhearth.com` | `BakeryPassword2026!` | `/donor/dashboard`, `/donate` |
| **Hope Youth Shelter** | `recipient` | `recipient@metroshelter.org` | `ShelterPassword2026!` | `/recipient/dashboard`, `/browse` |
