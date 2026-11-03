# RideNow API Specification & WebSocket Telemetry Reference

Base URL: `http://localhost:5050/api`

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/send-otp`
Sends mobile SMS OTP.
- **Request:**
  ```json
  { "phone": "+919811122233", "role": "CUSTOMER" }
  ```
- **Response:**
  ```json
  { "success": true, "message": "OTP sent successfully to +919811122233", "demoOtp": "1234" }
  ```

### `POST /api/auth/verify-otp`
Verifies OTP and returns user profile + JWT.
- **Request:**
  ```json
  { "phone": "+919811122233", "otp": "1234", "role": "CUSTOMER" }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": { "id": "...", "fullName": "Rahul Verma", "role": "CUSTOMER" }
  }
  ```

### `POST /api/auth/admin/login`
Super Admin & staff password authentication.
- **Request:**
  ```json
  { "email": "admin@ridenow.in", "password": "Admin@123" }
  ```

---

## 2. Customer Portal (`/api/customer`)
*Requires `Authorization: Bearer <token>`*

### `POST /api/customer/rides/request`
Request a new trip. Calculates formula fare and dispatches nearby drivers.
- **Request:**
  ```json
  {
    "vehicleCategory": "AUTO",
    "pickupAddress": "Connaught Place Central, New Delhi",
    "pickupLat": 28.6328,
    "pickupLng": 77.2197,
    "dropAddress": "Cyber City DLF Phase 2, Gurugram",
    "dropLat": 28.4900,
    "dropLng": 77.0890,
    "paymentMethod": "CASH",
    "promoCode": "WELCOME50"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "ride": {
      "bookingCode": "RN-4912",
      "status": "REQUESTED",
      "otp": "4819",
      "distanceKm": 16.4,
      "totalFare": 215,
      "platformCommission": 32.25
    }
  }
  ```

### `POST /api/customer/rides/:rideId/cancel`
Cancels booking with optional reason.

### `POST /api/customer/rides/:rideId/rate`
Submit 1-5 star review with driver compliment tags.

### `POST /api/customer/rides/sos`
Dispatches emergency alert with live GPS coordinates to hotline 112.

---

## 3. Driver Partner Portal (`/api/driver`)
*Requires `Authorization: Bearer <token>`*

### `POST /api/driver/toggle-online`
Toggle online availability (`isOnline: true/false`). Blocked if `verificationStatus !== 'APPROVED'`.

### `GET /api/driver/requests`
Fetch pending ride requests matching vehicle category.

### `POST /api/driver/rides/:rideId/accept`
Accepts dispatched ride.

### `POST /api/driver/rides/:rideId/arrived`
Marks driver arrival at passenger pickup location.

### `POST /api/driver/rides/:rideId/start`
Validates passenger 4-digit PIN OTP and starts ride.

### `POST /api/driver/rides/:rideId/complete`
Completes ride, deducts 15% platform commission, and credits driver wallet.

### `POST /api/driver/documents/upload`
Uploads Driving Licence, Vehicle RC, and Insurance.

---

## 4. Super Admin Panel (`/api/admin`)
*Requires role: `SUPER_ADMIN`, `OPERATIONS_ADMIN`, `FINANCE_ADMIN`, or `SUPPORT_ADMIN`*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/stats` | KPI metrics (Revenue, Rides, Drivers, Pending approvals) |
| `GET` | `/customers` | View all customers & trip counts |
| `PUT` | `/customers/:id/status` | Suspend or activate customer account |
| `GET` | `/drivers` | View all drivers, ratings & vehicles |
| `PUT` | `/drivers/:id/status` | Suspend or activate driver partner |
| `GET` | `/verifications/pending` | List pending KYC submissions |
| `POST` | `/verifications/:driverId/review` | Approve or Reject KYC with reason |
| `GET` | `/vehicles` | Manage fleet list & registration plates |
| `GET` | `/rides` | Filter all rides by status and category |
| `GET` | `/live-tracking` | Real-time GPS telemetry of active trips & drivers |
| `GET` | `/fare-configurations` | Rates for Bike, Auto, Mini, Sedan, SUV |
| `PUT` | `/fare-configurations/:category` | Update Base Fare, Per KM, Waiting, Surge |
| `GET` | `/payments` | Financial records & transaction IDs |
| `POST` | `/payments/:rideId/refund` | Issue customer refund |
| `GET` | `/commission` | Retained commission volume & rate |
| `PUT` | `/commission` | Update platform commission percentage |
| `GET` | `/promos` | Manage promo codes & discounts |
| `POST` | `/promos` | Create new promo code |
| `GET` | `/complaints` | Support & dispute ticketing system |
| `PUT` | `/complaints/:id/resolve` | Resolve dispute with notes |
| `GET` | `/reviews` | Passenger ratings & comments moderation |
| `POST` | `/notifications/broadcast` | Broadcast announcement push message |
| `GET` | `/analytics` | Revenue & category market share charts |
| `GET` | `/analytics/export-csv` | Download CSV ride & financial report |
| `GET` | `/users` | Manage admin users & roles |
| `GET` | `/settings` | System-wide settings & maintenance mode |
| `GET` | `/api-config` | Google Maps, Razorpay & SMS Gateway health |
| `GET` | `/audit-logs` | Immutable admin action history |

---

## 5. WebSocket Telemetry Events (Socket.IO)

- `join_user`: Join private user room (`user_{userId}`).
- `join_ride`: Join active ride room (`ride_{rideId}`).
- `new_ride_request`: Sent to nearby online drivers.
- `ride_accepted`: Notifies passenger that driver is dispatched.
- `ride_status_updated`: Real-time state transition (`ARRIVED`, `IN_PROGRESS`, `COMPLETED`).
- `driver_location_changed`: Live moving vehicle coordinates.
- `sos_triggered`: High-priority alert sent to admin monitoring center.

