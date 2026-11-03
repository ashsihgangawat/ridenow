# RideNow Payment Module (Razorpay & Cash)

Welcome to the **RideNow Payment Integration Guide**. This document covers configuration, architecture, backend endpoints, and testing procedures for settling ride fares via **Razorpay (UPI, Cards, Netbanking)** and **Cash to Driver**.

---

## 1. Architecture & Security Overview

- **Paise Integer Handling**: All monetary operations are calculated and transferred in integer **paise** (`₹100 = 10000 paise`) to prevent floating-point rounding errors.
- **Client Security**: The Flutter mobile app **NEVER** holds or accesses the Razorpay `KEY_SECRET`. All order creations and signature verifications occur on the backend server.
- **Double-Tap Prevention**: The payment button state enters a protected processing lock to avoid duplicate orders or charges.
- **Fallback Resilience**: Both client and backend include local mock fallbacks so developers can test the end-to-end checkout flow offline or in test mode without an active payment gateway webhook.

---

## 2. Configuration & Keys Setup

### A. Mobile App (`lib/app/config/environment.dart`)
Set your Razorpay Test Key ID:
```dart
// Razorpay Payment Gateway Key (Test Mode)
// Replace with your Key ID from https://dashboard.razorpay.com/app/keys
static const String razorpayKeyId = 'rzp_test_YOUR_ACTUAL_KEY_ID';
```

### B. Backend (`backend/.env` or `backend/src/config/index.js`)
Set your Razorpay Key ID and Secret in your environment:
```env
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET
RAZORPAY_IS_LIVE=false
```

---

## 3. Backend Endpoints Expected

The payment module communicates with these endpoints:

### 1. Create Order
- **URL**: `POST /api/payments/create-order` (alias: `POST /payments/create-order`)
- **Request Body**:
  ```json
  {
    "rideId": "ride_12345",
    "amountPaise": 8500,
    "currency": "INR",
    "notes": { "bookingCode": "RN-4291" }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "orderId": "order_Hdf93jd83",
    "amount": 8500,
    "currency": "INR",
    "keyId": "rzp_test_YOUR_ACTUAL_KEY_ID",
    "rideId": "ride_12345"
  }
  ```

### 2. Verify Payment
- **URL**: `POST /api/payments/verify` (alias: `POST /payments/verify`)
- **Request Body**:
  ```json
  {
    "rideId": "ride_12345",
    "razorpayPaymentId": "pay_Ksfj83jf83",
    "razorpayOrderId": "order_Hdf93jd83",
    "razorpaySignature": "92f3b92f98e7..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment verified and ride marked as paid successfully",
    "paymentId": "pay_Ksfj83jf83"
  }
  ```

### 3. Cash Payment Settlement
- **URL**: `POST /api/payments/cash` (alias: `POST /payments/cash`)
- **Request Body**:
  ```json
  {
    "rideId": "ride_12345",
    "amountPaise": 8500
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Cash payment confirmed on trip completion"
  }
  ```

---

## 4. How to Test Razorpay in Test Mode

Use these official Razorpay test credentials in TEST MODE:

### A. UPI (Google Pay, PhonePe, Paytm, BHIM)
- **Virtual Payment Address (VPA)**: `success@razorpay`
- **Result**: Immediate successful transaction.
- **Failure Test**: `failure@razorpay`

### B. Credit & Debit Cards (Test Cards)
| Card Type | Card Number | Expiry | CVV | OTP |
|-----------|-------------|--------|-----|-----|
| Domestic Visa / Mastercard (Success) | `4111 1111 1111 1111` | Any future date (e.g. `12/28`) | `123` | `123456` or any 4-6 digit OTP |
| Domestic RuPay Card | `5081 2611 1111 1111` | Any future date | `123` | Any OTP |
| Immediate Failure Card | `4000 0000 0000 0002` | Any future date | `123` | N/A |

### C. Netbanking
- Select any bank in the test modal (e.g. **HDFC Bank**, **ICICI Bank**, or **State Bank of India**).
- When prompted on the mock bank simulator, click **Success**.

### D. Cash Flow
1. In the RideNow app payment screen, select **Cash to Driver**.
2. Tap **Confirm Cash Payment**.
3. The app confirms the cash settlement with the driver partner, creates the receipt, and returns the rider to the home dashboard.

---

## 5. Platform Specific Notes

### Android
- **Minimum SDK**: `minSdkVersion >= 19` (Default Flutter 21 is fully compatible).
- **ProGuard**: Custom rules added in `android/app/proguard-rules.pro` to retain Razorpay SDK interfaces (`-keep class com.razorpay.** {*;}`).
- **Cleartext Traffic**: Enabled in `AndroidManifest.xml` (`android:usesCleartextTraffic="true"`) for local emulator development.

### iOS
- Ensure your iOS project target is iOS 11.0 or higher.
- `razorpay_flutter` installs the native Razorpay framework via CocoaPods automatically during `pod install`.

