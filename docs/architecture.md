# RideNow - System Architecture & Product Blueprint
Inspired by Uber India (https://www.uber.com/in/en/)

## 1. Executive Summary & Brand Identity
**RideNow** is a full-stack, enterprise-grade ride-hailing platform engineered specifically for the Indian mobility ecosystem. It mirrors the speed, simplicity, and premium UX of Uber India while providing deep localization:
- **Currency:** Indian Rupee (₹ INR)
- **Local Vehicle Fleet:** Bike, Auto Rickshaw, Mini (Hatchback), Sedan, SUV (6-Seater)
- **Languages:** English and Hindi (हिन्दी)
- **Security & Safety:** 4-digit ride OTP verification, SOS emergency dispatch to 112, real-time driver telemetry
- **Portals:** Unified backend powering Customer Portal, Driver Portal, and Super Admin Dashboard (/admin)

---

## 2. Architecture Overview
```
+-----------------------------------------------------------------------------------+
|                                 CLIENT PORTALS                                    |
|   +-----------------------+ +--------------------+ +----------------------------+ |
|   |    Customer Portal    | |   Driver Portal    | |    Super Admin Panel       | |
|   |  - Ride booking       | |  - KYC documents   | |  - 20 enterprise modules   | |
|   |  - Real-time tracking | |  - Go Online/Off   | |  - Dynamic fare engine     | |
|   |  - Cash/Razorpay      | |  - Accept/Start/End| |  - Live telemetry map      | |
|   |  - SOS & Ratings      | |  - Earnings stats  | |  - Driver verification     | |
|   +-----------------------+ +--------------------+ +----------------------------+ |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST + WebSocket (Socket.IO)
+------------------------------------------v----------------------------------------+
|                                BACKEND API GATEWAY                                |
|  - Express.js HTTP Server + Socket.IO Real-time Engine                           |
|  - JWT Authentication & Role-Based Access Control (RBAC)                          |
|  - Dynamic Fare Calculation Engine (Base + Per KM + Waiting + Surge - Commission) |
|  - Rate Limiting, CORS, Helmet, Audit Logging                                     |
+------------------------------------------+----------------------------------------+
                                           | Prisma ORM
+------------------------------------------v----------------------------------------+
|                             DATABASE & STORAGE LAYER                              |
|  - PostgreSQL Database (Production) with SQLite/Embedded Dev Engine               |
|  - Complete schema: Users, Customers, Drivers, Documents, Vehicles, Rides,        |
|    FareConfigs, Payments, PromoCodes, Reviews, Complaints, AuditLogs              |
+-----------------------------------------------------------------------------------+
```

---

## 3. Database Schema Models
1. **User:** Base credentials, phone, email, role (CUSTOMER, DRIVER, ADMIN, SUPER_ADMIN), status, language.
2. **CustomerProfile:** Saved addresses (Home, Work), wallet balance, emergency contacts.
3. **DriverProfile:** License number, experience, verification status (PENDING, APPROVED, REJECTED), is_online, current_lat, current_lng, rating.
4. **DriverDocument:** Document type (DRIVING_LICENSE, VEHICLE_RC, INSURANCE, AADHAAR), file_url, status, rejection_reason.
5. **Vehicle:** Category (BIKE, AUTO, MINI, SEDAN, SUV), make, model, registration_number, color, capacity.
6. **Ride:** Booking reference, customer_id, driver_id, vehicle_category, pickup/drop addresses & coords, status (REQUESTED, ACCEPTED, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED), otp, distance_km, duration_mins, fare_breakdown, payment_status, payment_method.
7. **FareConfiguration:** Category rates (base_fare, per_km_rate, waiting_charge_per_min, minimum_fare, surge_multiplier).
8. **Payment:** Razorpay order ID, payment ID, amount, currency, status, fee, tax.
9. **CommissionRecord:** Platform revenue cut, driver payout amount, settlement status.
10. **PromoCode:** Code name, discount percentage, max discount, expiry, usage count.
11. **Review:** Ride ID, rating (1-5), feedback, compliments tags.
12. **Complaint:** Ticket ID, user_id, ride_id, category, message, status (OPEN, IN_REVIEW, RESOLVED).
13. **AuditLog:** Action, target_entity, performed_by, metadata, IP, timestamp.
14. **SystemSetting:** Maintenance mode, platform commission percentage, default surge, emergency helpline number.

