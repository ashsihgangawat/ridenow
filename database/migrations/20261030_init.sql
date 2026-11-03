-- RideNow PostgreSQL Initial Schema DDL
-- Generated for PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'DRIVER', 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "VehicleCategory" AS ENUM ('BIKE', 'AUTO', 'MINI', 'SEDAN', 'SUV');
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ONLINE', 'WALLET');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- Tables
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "phone" VARCHAR(20) UNIQUE NOT NULL,
    "email" VARCHAR(120) UNIQUE,
    "passwordHash" VARCHAR(255),
    "fullName" VARCHAR(100) NOT NULL,
    "role" "Role" DEFAULT 'CUSTOMER' NOT NULL,
    "status" "UserStatus" DEFAULT 'ACTIVE' NOT NULL,
    "avatar" TEXT,
    "preferredLang" VARCHAR(10) DEFAULT 'en' NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "CustomerProfile" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "homeAddress" TEXT,
    "workAddress" TEXT,
    "walletBalance" DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    "emergencyPhone" VARCHAR(20),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "DriverProfile" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "licenseNumber" VARCHAR(50) UNIQUE NOT NULL,
    "verificationStatus" "VerificationStatus" DEFAULT 'PENDING' NOT NULL,
    "rejectionReason" TEXT,
    "isOnline" BOOLEAN DEFAULT false NOT NULL,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION DEFAULT 5.0 NOT NULL,
    "totalRatings" INT DEFAULT 0 NOT NULL,
    "totalTrips" INT DEFAULT 0 NOT NULL,
    "walletBalance" DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "DriverDocument" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "driverId" UUID NOT NULL REFERENCES "DriverProfile"("id") ON DELETE CASCADE,
    "documentType" VARCHAR(50) NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "documentNumber" VARCHAR(50),
    "status" "VerificationStatus" DEFAULT 'PENDING' NOT NULL,
    "rejectionNote" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "Vehicle" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "driverId" UUID UNIQUE NOT NULL REFERENCES "DriverProfile"("id") ON DELETE CASCADE,
    "category" "VehicleCategory" DEFAULT 'MINI' NOT NULL,
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "year" INT NOT NULL,
    "registrationNumber" VARCHAR(30) UNIQUE NOT NULL,
    "color" VARCHAR(30) NOT NULL,
    "capacity" INT DEFAULT 4 NOT NULL,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "Ride" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "bookingCode" VARCHAR(20) UNIQUE NOT NULL,
    "customerId" UUID NOT NULL REFERENCES "CustomerProfile"("id"),
    "driverId" UUID REFERENCES "DriverProfile"("id"),
    "vehicleCategory" "VehicleCategory" NOT NULL,
    "status" "RideStatus" DEFAULT 'REQUESTED' NOT NULL,
    "otp" VARCHAR(6) NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "dropAddress" TEXT NOT NULL,
    "dropLat" DOUBLE PRECISION NOT NULL,
    "dropLng" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationMinutes" INT NOT NULL,
    "baseFare" DOUBLE PRECISION NOT NULL,
    "distanceFare" DOUBLE PRECISION NOT NULL,
    "waitingCharges" DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    "surgeMultiplier" DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
    "discountAmount" DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    "totalFare" DOUBLE PRECISION NOT NULL,
    "platformCommission" DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    "driverEarnings" DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    "paymentMethod" "PaymentMethod" DEFAULT 'CASH' NOT NULL,
    "paymentStatus" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
    "cancellationReason" TEXT,
    "cancelledBy" VARCHAR(50),
    "startedAt" TIMESTAMP WITH TIME ZONE,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "RideLocation" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "rideId" UUID NOT NULL REFERENCES "Ride"("id") ON DELETE CASCADE,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "Payment" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "rideId" UUID UNIQUE NOT NULL REFERENCES "Ride"("id"),
    "transactionId" VARCHAR(100) UNIQUE NOT NULL,
    "paymentGateway" VARCHAR(50) DEFAULT 'RAZORPAY' NOT NULL,
    "paymentMethod" "PaymentMethod" DEFAULT 'ONLINE' NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) DEFAULT 'INR' NOT NULL,
    "status" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
    "razorpayOrderId" VARCHAR(100),
    "razorpayPaymentId" VARCHAR(100),
    "razorpaySignature" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "Refund" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "paymentId" UUID NOT NULL REFERENCES "Payment"("id"),
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "PaymentStatus" DEFAULT 'SUCCESS' NOT NULL,
    "processedBy" VARCHAR(100),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "CommissionRecord" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "rideId" UUID UNIQUE NOT NULL REFERENCES "Ride"("id"),
    "driverId" UUID NOT NULL REFERENCES "DriverProfile"("id"),
    "grossFare" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "platformAmount" DOUBLE PRECISION NOT NULL,
    "driverAmount" DOUBLE PRECISION NOT NULL,
    "payoutStatus" VARCHAR(30) DEFAULT 'SETTLED' NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "FareConfiguration" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "category" "VehicleCategory" UNIQUE NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "baseFare" DOUBLE PRECISION NOT NULL,
    "perKmRate" DOUBLE PRECISION NOT NULL,
    "waitingRateMin" DOUBLE PRECISION NOT NULL,
    "minimumFare" DOUBLE PRECISION NOT NULL,
    "surgeMultiplier" DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "PromoCode" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "code" VARCHAR(30) UNIQUE NOT NULL,
    "description" TEXT NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "maxDiscount" DOUBLE PRECISION NOT NULL,
    "minRideAmount" DOUBLE PRECISION DEFAULT 100 NOT NULL,
    "validUntil" TIMESTAMP WITH TIME ZONE NOT NULL,
    "maxUses" INT DEFAULT 1000 NOT NULL,
    "usedCount" INT DEFAULT 0 NOT NULL,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "Review" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "rideId" UUID UNIQUE NOT NULL REFERENCES "Ride"("id"),
    "customerId" UUID NOT NULL REFERENCES "CustomerProfile"("id"),
    "driverId" UUID NOT NULL REFERENCES "DriverProfile"("id"),
    "rating" INT NOT NULL,
    "comment" TEXT,
    "tags" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "Complaint" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "ticketId" VARCHAR(30) UNIQUE NOT NULL,
    "userId" UUID NOT NULL REFERENCES "User"("id"),
    "rideId" UUID REFERENCES "Ride"("id"),
    "category" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ComplaintStatus" DEFAULT 'OPEN' NOT NULL,
    "resolution" TEXT,
    "resolvedBy" VARCHAR(100),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "Notification" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(30) DEFAULT 'INFO' NOT NULL,
    "isRead" BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "AdminProfile" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "department" VARCHAR(50) DEFAULT 'Operations' NOT NULL,
    "permissions" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "SystemSetting" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) UNIQUE NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "action" VARCHAR(100) NOT NULL,
    "targetEntity" VARCHAR(100) NOT NULL,
    "targetId" VARCHAR(100),
    "performedBy" UUID REFERENCES "User"("id"),
    "details" TEXT,
    "ipAddress" VARCHAR(50),
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_user_role_status ON "User"("role", "status");
CREATE INDEX idx_driver_online_verif ON "DriverProfile"("isOnline", "verificationStatus");
CREATE INDEX idx_ride_status ON "Ride"("status");
CREATE INDEX idx_ride_customer ON "Ride"("customerId");
CREATE INDEX idx_ride_driver ON "Ride"("driverId");

