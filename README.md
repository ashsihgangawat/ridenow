# RideNow India – Full-Stack Mobility & Ride-Hailing Platform
*Inspired by Uber India (https://www.uber.com/in/en/)*

RideNow is a complete, production-oriented ride-hailing platform architected specifically for the Indian urban mobility market. It features a unified backend and database powering three dedicated portals:
1. **Customer Portal** (Ride booking, upfront pricing in ₹ INR, 4-digit PIN verification, live GPS telemetry, SOS 112 dispatch, English & Hindi support).
2. **Driver Partner Portal** (KYC document verification, online/offline toggle, dispatch radar, turn-by-turn simulation, 4-digit PIN verification, and earnings analytics).
3. **Super Admin Enterprise Panel (`/admin`)** (20 comprehensive management modules, dynamic fare configuration, driver approval workflow, CSV export, live fleet tracking, and audit logging).

---

## 🚀 Key Feature Highlights

### 1. Indian Vehicle Fleet
- **🏍️ RideNow Moto (Bike):** Fast solo transit through Indian traffic (₹25 base fare, ₹8/km).
- **🛺 RideNow Auto:** India's ubiquitous 3-wheeler with upfront meter pricing (₹35 base fare, ₹11/km).
- **🚗 RideNow Mini:** Everyday budget hatchbacks (Swift, WagonR) (₹50 base fare, ₹14/km).
- **🚘 RideNow Premier (Sedan):** Top-rated drivers and spacious sedans (Dzire, Etios) (₹75 base fare, ₹18/km).
- **🚙 RideNow XL (SUV):** 6-seater family/luggage carriers (Ertiga, Innova) (₹110 base fare, ₹23/km).

### 2. Fare Calculation Engine
Dynamic, formula-based calculation configured via Super Admin dashboard:
```
Estimated Fare = Base Fare + (Distance × Per KM Rate) + Waiting Charges + Surge Multiplier
Net Partner Earnings = Total Fare - (Platform Commission %)
```

### 3. Safety & Emergency (SOS)
- **4-Digit Ride Start PIN:** Trips never start until the driver enters the customer's unique PIN.
- **24/7 SOS Helpline:** 1-click dispatch to **National Emergency Response 112** and real-time alert sent to the Super Admin monitoring desk.

### 4. Bilingual Localization
- Instant one-click toggle between **English** and **हिन्दी (Hindi)** across navigation and forms.

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email / Phone | Password / OTP | Description |
|---|---|---|---|
| **Super Admin** | `admin@ridenow.in` | `Admin@123` | Full access to all 20 modules & system settings |
| **Operations Admin** | `ops@ridenow.in` | `Admin@123` | Fleet, customer & driver management |
| **Driver Partner (Auto)** | `+919876543210` | `1234` | Rajesh Kumar (Approved, Bajaj RE Auto, Online) |
| **Driver Partner (Sedan)** | `+919876543211` | `1234` | Amit Sharma (Approved, Maruti Dzire, Online) |
| **Driver Partner (Pending)**| `+919876543213` | `1234` | Suresh Verma (Bike, Pending KYC verification) |
| **Customer / Passenger** | `+919811122233` | `1234` | Rahul Verma (Noida/Delhi active passenger) |

*Universal Demo OTP: Code `1234` can be used on any phone number in test mode.*

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Socket.IO Client.
- **Backend:** Node.js, Express.js (ES Modules), Socket.IO, JWT Authentication, Bcrypt.js, CORS.
- **Database:** PostgreSQL (Production schema & migrations in `database/`) with built-in resilient file-backed adapter for instant local zero-dependency testing.
- **Payment & Maps:** Razorpay payment flow (Test & Live modes) and Google Maps / interactive GPS canvas simulation with real-world Indian landmark coordinates.
- **Containerization:** Docker, Dockerfile, docker-compose.yml.

---

## 📁 Project Directory Structure

```
ridenow/
├── frontend/
│   ├── customer/            # Customer Booking & Active Ride views
│   ├── driver/              # Driver Dashboard, KYC & Earnings views
│   ├── admin/               # Super Admin Panel (20 Enterprise modules)
│   ├── src/                 # Shared Components, Map Simulator, Contexts
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/     # Auth, Customer, Driver, Admin & Fare controllers
│   │   ├── routes/          # Express REST API routes
│   │   ├── services/        # Fare Engine, DB, Tracking & Razorpay services
│   │   ├── middleware/      # JWT Auth & Role guards
│   │   ├── sockets/         # Socket.IO real-time event handlers
│   │   ├── config/          # Environment configuration
│   │   └── seed.js          # Realistic pre-seeded Indian mobility dataset
│   ├── test/                # Automated API test suite
│   └── package.json
├── database/
│   ├── schema.prisma        # Complete Prisma PostgreSQL schema
│   ├── migrations/          # SQL DDL migrations
│   └── seed/                # Seed definitions
├── docs/
│   ├── architecture.md      # System Architecture Blueprint
│   └── api_documentation.md # Complete REST & WebSocket API specs
├── docker-compose.yml       # Production Docker multi-container stack
├── .env.example             # Environment variables template
└── README.md                # Master Documentation
```

---

## 💻 Local Setup & Startup Instructions

### 1. Prerequisites
- Node.js 18+ and npm installed.
- (Optional) Docker or PostgreSQL if deploying containerized database.

### 2. Start the Backend API & Socket Server
```bash
cd backend
npm install
npm run start
```
The server will initialize on `http://localhost:5050`, automatically pre-seeding the initial fleet and admin accounts.

### 3. Start the Frontend (Vite)
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

*Note: The backend also serves the pre-built frontend directly from `http://localhost:5050` when built via `npm run build`.*

---

## 🧪 Automated Integration Testing

RideNow includes a 13-stage end-to-end API test suite validating all core workflows:
```bash
cd backend
node test/runAllTests.js
```

### Verified Test Cases:
1. `GET /api/health` -> System health status ONLINE.
2. `POST /api/auth/admin/login` -> Super Admin password login & token generation.
3. `POST /api/auth/verify-otp` -> Passenger phone OTP authentication.
4. `POST /api/auth/verify-otp` -> Driver partner phone OTP authentication.
5. `POST /api/fare/estimate` -> Fare calculation across all 5 categories (Bike, Auto, Mini, Sedan, SUV) + Promo code discount.
6. `GET /api/admin/dashboard/stats` -> Super Admin dashboard KPI analytics.
7. `POST /api/customer/rides/request` -> Trip booking & 4-digit Ride Start PIN generation.
8. `POST /api/driver/rides/:id/accept` -> Driver ride acceptance.
9. `POST /api/driver/rides/:id/start` -> 4-digit PIN OTP verification & ride start.
10. `POST /api/driver/rides/:id/complete` -> Trip completion & 15% platform commission deduction.
11. `POST /api/customer/rides/:id/rate` -> Customer 5-star rating submission.
12. `POST /api/customer/rides/sos` -> SOS emergency alert dispatch to hotline 112.
13. `PUT /api/admin/fare-configurations/AUTO` -> Admin dynamic fare update & rate persistence.

---

## 🚢 Production Deployment with Docker Compose

To deploy PostgreSQL, the Node.js backend, and the Nginx frontend container:
```bash
docker-compose up -d --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5050`
- PostgreSQL: `localhost:5432`

---

## 🛡️ Super Admin 20 Modules Index

Access the admin dashboard at `/admin`:
1. **Dashboard:** High-level metrics, revenue, active rides, pending driver approvals.
2. **Customers Management:** Search passengers, check trip count, suspend or activate accounts.
3. **Drivers Management:** Full driver directory, vehicle assignments, rating moderation.
4. **Driver Verification (KYC):** Inspect Driving Licence, RC and Insurance documents; 1-click Approve or Reject.
5. **Vehicles Management:** Fleet registration records, vehicle makes and seating capacity.
6. **Ride Management:** Complete filterable logs of all requested, active, and completed rides.
7. **Live Ride Tracking:** Real-time moving GPS telemetry showing active trips and online fleet.
8. **Fare Management:** Edit Base Fare, Per-KM rate, Waiting charge, and Surge multiplier for each vehicle category.
9. **Payments Management:** Financial transaction logs, payment gateway receipts, and refund issuance.
10. **Commission Management:** Live platform commission rate adjustment (default 15%).
11. **Promo Codes:** Create and manage promotional discount vouchers (e.g. `WELCOME50`, `RIDEINDIA`).
12. **Customer Complaints:** Ticketing system for passenger grievances and dispute resolution.
13. **Driver Complaints:** Partner grievance management.
14. **Reviews and Ratings:** Customer feedback moderation.
15. **Notifications:** Send system broadcast announcements to all users.
16. **Reports and Analytics:** Revenue breakdowns and 1-click CSV report export.
17. **Admin Users and Roles:** RBAC user management (Super Admin, Ops, Finance, Support).
18. **System Settings:** Emergency hotline number (112), maintenance toggle, global surge.
19. **API Configuration:** Status monitoring for Google Maps, Razorpay, and SMS Gateway.
20. **Audit Logs:** Immutable audit log recording every single administrative action with timestamps.

