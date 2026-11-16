# SharePlate — 5–7 Minute Placement Interview Demonstration Script

> **Tagline:** *Share more. Waste less.*  
> **Stack:** React 18, Vite, Tailwind CSS, Leaflet, Recharts | Node.js, Express.js | MongoDB + Mongoose

---

## 1. Opening & Problem Statement (45 seconds)
"Hi, I'm presenting **SharePlate**, a hyper-local surplus food sharing platform built with the MERN stack and MongoDB.  
Restaurants, college cafeterias, bakeries, and event organizers often have wholesome surplus food at the end of service, while nearby shelters, students, and community groups need affordable or free meals.  
SharePlate bridges that gap in real time with **three role-based workflows**—**Donors**, **Recipients**, and **Admins**—backed by geospatial discovery, atomic inventory control, and secure pickup verification."

---

## 2. Architecture & Key Technical Decisions (1 minute)
1. **Role-Based Auth & Security:**
   - Passwords are hashed with `bcryptjs` and excluded from queries (`select: false`).
   - Authentication uses signed **JWTs** in `HttpOnly` cookies (plus Bearer header support).
   - Every protected request goes through `protect` (which also checks `user.isActive` so deactivated users are blocked immediately) and `authorizeRoles(...)`.
   - Sensitive endpoints (`/login`, `/register`, `/verify-pickup`) are protected by rate limiting.
2. **MongoDB Collections & Relationships:**
   - `users`: donors, recipients, admins (`email` unique index).
   - `foodlistings`: references `donor` (`User`), tracks `originalQuantity`, `availableQuantity`, `reservedQuantity`, `collectedQuantity`, and GeoJSON `location`.
   - `reservations`: links `foodListing`, `recipient`, and `donor`, with a partial unique index preventing duplicate active reservations by the same recipient on the same listing.
   - `auditlogs`: immutable ledger of admin moderation actions.

---

## 3. Live Demo Walkthrough (3–3.5 minutes)

### Step A: Discovery & MongoDB Geospatial Search (45 sec)
- Open `/browse` and `/map`.
- **Explain:** "Locations are stored as GeoJSON `Point` (`[longitude, latitude]`) with a sparse **`2dsphere` index** on `FoodListing.location`. When a user searches nearby within a 1–50 km radius, `GET /api/food/nearby` uses MongoDB `$near` and `$geometry` while filtering out expired listings server-side."

### Step B: Donor Listing Creation (45 sec)
- Log in as Donor (`donor@greenhearth.com` / `BakeryPassword2026!`) -> `/donate`.
- Create a surplus listing (e.g., 10 boxes, pickup window, expiry, map pin).
- Show it immediately appearing in `/browse` and `/map`.

### Step C: Recipient Reservation & Concurrency Strategy (1 min)
- Log in as Recipient (`recipient@metroshelter.org` / `ShelterPassword2026!`).
- Reserve e.g. 4 boxes on `/food/:id`.
- **Explain:** "Because our local MongoDB runs as a standalone instance without replica-set transactions, I prevented double-booking using an **atomic conditional `findOneAndUpdate`** conditioned on `status: 'available'`, `expiryTime > now`, and `availableQuantity >= qty`. The invariant `availableQuantity + reservedQuantity + collectedQuantity == originalQuantity` always holds."
- Show the generated **8-character pickup code** (stored in MongoDB only as an HMAC-SHA256 hash + AES-256-GCM ciphertext, never plaintext).
- Cancel a reservation in `/recipient/dashboard` to show idempotent quantity restoration, then reserve again.

### Step D: Donor Pickup Verification (30 sec)
- Log back in as Donor -> `/donor/dashboard`.
- Enter the recipient's pickup code.
- **Explain:** "Verification uses constant-time HMAC comparison (`crypto.timingSafeEqual`) and an atomic `reserved -> collected` transition so repeated submissions are idempotent."

### Step E: Admin Analytics & Audit Logs (30 sec)
- Log in as Admin (`admin@shareplate.org` / `Admin@SharePlate2026`) -> `/admin/dashboard`.
- Show **Overview & Analytics** (MongoDB aggregation pipelines grouping daily trends, categories, and `collectedByUnit` without mixing incompatible units like `kg` and `boxes`).
- Show **Users**, **Food Listings**, **Reservations**, and **Audit Logs** (plus self-lockout / last-admin safeguards).

---

## 4. Trade-Offs & Closing (45 seconds)
- **Standalone Atomic Updates vs. Multi-Document Transactions:** Chosen because local MongoDB is standalone; atomic `$inc` with conditional filters + compensating rollback prevents overbooking cleanly, though a replica set would be used in production for full ACID spans.
- **Lazy Expiry vs. Background Cron:** Expired listings/reservations are filtered and transitioned on read/action, keeping deployment simple with zero external job queue.
- **Verification:** "All 6 automated backend suites (**83/83 tests**) and the Vite production build pass against live MongoDB."
