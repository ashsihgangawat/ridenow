"""
RideNow Platform - JSON to PostgreSQL (Supabase) Migration Script
Idempotent, transaction-safe migration preserving original IDs, foreign keys, and counts.
"""

import os
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import sessionmaker

# Ensure local imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import (
    Base,
    User,
    CustomerProfile,
    DriverProfile,
    DriverDocument,
    Vehicle,
    Ride,
    Payment,
    CommissionRecord,
    FareConfiguration,
    PromoCode,
    Review,
    Complaint,
    AdminProfile,
    SystemSetting,
)


def parse_dt(val: Any) -> datetime:
    if not val:
        return datetime.utcnow()
    if isinstance(val, datetime):
        return val
    try:
        s = str(val).replace("Z", "+00:00")
        return datetime.fromisoformat(s)
    except Exception:
        return datetime.utcnow()


def run_migration(db_url: Optional[str] = None, json_file_path: Optional[str] = None) -> Dict[str, Any]:
    # 1. Resolve Target Database URL
    target_url = db_url or os.environ.get("DATABASE_URL", "").strip()
    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql://", 1)

    if not target_url:
        raise ValueError(
            "DATABASE_URL is not set. Please supply a valid Supabase/PostgreSQL connection string.\n"
            "Example: python migrate_json_to_postgres.py postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"
        )

    # 2. Resolve JSON Database Path
    json_path = json_file_path or os.environ.get("DATABASE_PATH")
    if not json_path or not os.path.exists(json_path):
        candidate1 = os.path.join(os.path.dirname(__file__), "data/ridenow_db.json")
        candidate2 = os.path.join(os.path.dirname(__file__), "../../database/ridenow_db.json")
        json_path = candidate1 if os.path.exists(candidate1) else candidate2

    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Source JSON database not found at {json_path}")

    print(f"============================================================")
    print(f"[START] RideNow Database Migration to Supabase / PostgreSQL")
    print(f"============================================================")
    print(f"- Source JSON DB : {json_path} ({os.path.getsize(json_path)} bytes)")
    # Mask password in logs
    masked_url = target_url
    if "@" in target_url and "://" in target_url:
        prefix, rest = target_url.split("://", 1)
        creds, host = rest.split("@", 1)
        user = creds.split(":", 1)[0]
        masked_url = f"{prefix}://{user}:****@{host}"
    print(f"- Target DB      : {masked_url}")
    print(f"============================================================")

    # 3. Load JSON Source Data
    with open(json_path, "r", encoding="utf-8") as f:
        source_data = json.load(f)

    # 4. Create Engine & Initialize Tables
    connect_args = {"check_same_thread": False} if target_url.startswith("sqlite") else {}
    engine = create_engine(target_url, connect_args=connect_args)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    report = {
        "sourceFile": json_path,
        "targetUrl": masked_url,
        "startedAt": datetime.utcnow().isoformat() + "Z",
        "counts": {},
        "failed": [],
        "success": False,
    }

    try:
        # ---------------------------------------------------------
        # Step A: Users (45 records)
        # ---------------------------------------------------------
        users_in = source_data.get("users", [])
        migrated_users = 0
        for u in users_in:
            existing = session.query(User).filter_by(id=u["id"]).first()
            if not existing:
                user_obj = User(
                    id=u["id"],
                    phone=u["phone"],
                    email=u.get("email"),
                    password_hash=u.get("passwordHash"),
                    full_name=u.get("fullName", "User"),
                    role=u.get("role", "RIDER").upper(),
                    status=u.get("status", "ACTIVE").upper(),
                    avatar=u.get("avatar"),
                    preferred_lang=u.get("preferredLang", "en"),
                    created_at=parse_dt(u.get("createdAt")),
                    updated_at=parse_dt(u.get("updatedAt")),
                )
                session.add(user_obj)
                migrated_users += 1
        session.flush()
        report["counts"]["users"] = {"totalInJson": len(users_in), "migrated": migrated_users}
        print(f"[OK] Users             : {len(users_in)} in JSON | {migrated_users} inserted")

        # ---------------------------------------------------------
        # Step B: Customer Profiles (15 records)
        # ---------------------------------------------------------
        customers_in = source_data.get("customerProfiles", [])
        migrated_customers = 0
        for c in customers_in:
            existing = session.query(CustomerProfile).filter_by(id=c["id"]).first()
            if not existing:
                cp_obj = CustomerProfile(
                    id=c["id"],
                    user_id=c["userId"],
                    home_address=c.get("homeAddress"),
                    work_address=c.get("workAddress"),
                    wallet_balance=float(c.get("walletBalance", 0.0)),
                    emergency_phone=c.get("emergencyPhone"),
                    created_at=parse_dt(c.get("createdAt")),
                    updated_at=parse_dt(c.get("updatedAt")),
                )
                session.add(cp_obj)
                migrated_customers += 1
        session.flush()
        report["counts"]["customerProfiles"] = {"totalInJson": len(customers_in), "migrated": migrated_customers}
        print(f"[OK] Customer Profiles : {len(customers_in)} in JSON | {migrated_customers} inserted")

        # ---------------------------------------------------------
        # Step C: Driver Profiles (30 records)
        # ---------------------------------------------------------
        drivers_in = source_data.get("driverProfiles", [])
        migrated_drivers = 0
        for d in drivers_in:
            existing = session.query(DriverProfile).filter_by(id=d["id"]).first()
            if not existing:
                dp_obj = DriverProfile(
                    id=d["id"],
                    user_id=d["userId"],
                    license_number=d.get("licenseNumber"),
                    verification_status=d.get("verificationStatus", "PENDING"),
                    admin_approved=bool(d.get("adminApproved", False)),
                    is_online=bool(d.get("isOnline", False)),
                    current_lat=float(d["currentLat"]) if d.get("currentLat") is not None else None,
                    current_lng=float(d["currentLng"]) if d.get("currentLng") is not None else None,
                    heading=float(d.get("heading", 0.0)),
                    rating=float(d.get("rating", 5.0)),
                    total_ratings=int(d.get("totalRatings", 0)),
                    total_trips=int(d.get("totalTrips", 0)),
                    wallet_balance=float(d.get("walletBalance", 0.0)),
                    rejection_reason=d.get("rejectionReason"),
                    last_location_update=parse_dt(d.get("lastLocationUpdate")) if d.get("lastLocationUpdate") else None,
                    created_at=parse_dt(d.get("createdAt")),
                    updated_at=parse_dt(d.get("updatedAt")),
                )
                session.add(dp_obj)
                migrated_drivers += 1
        session.flush()
        report["counts"]["driverProfiles"] = {"totalInJson": len(drivers_in), "migrated": migrated_drivers}
        print(f"[OK] Driver Profiles   : {len(drivers_in)} in JSON | {migrated_drivers} inserted")

        # ---------------------------------------------------------
        # Step D: Driver Documents (40 records)
        # ---------------------------------------------------------
        docs_in = source_data.get("driverDocuments", [])
        migrated_docs = 0
        for doc in docs_in:
            existing = session.query(DriverDocument).filter_by(id=doc["id"]).first()
            if not existing:
                doc_obj = DriverDocument(
                    id=doc["id"],
                    driver_id=doc["driverId"],
                    document_type=doc.get("documentType", "AADHAAR"),
                    document_number=doc.get("documentNumber"),
                    file_url=doc.get("fileUrl"),
                    file_name=doc.get("fileName"),
                    file_size=doc.get("fileSize"),
                    file_type=doc.get("fileType"),
                    expiry_date=doc.get("expiryDate"),
                    status=doc.get("status", "PENDING"),
                    rejection_reason=doc.get("rejectionReason"),
                    created_at=parse_dt(doc.get("createdAt")),
                    updated_at=parse_dt(doc.get("updatedAt")),
                )
                session.add(doc_obj)
                migrated_docs += 1
        session.flush()
        report["counts"]["driverDocuments"] = {"totalInJson": len(docs_in), "migrated": migrated_docs}
        print(f"[OK] Driver Documents  : {len(docs_in)} in JSON | {migrated_docs} inserted")

        # ---------------------------------------------------------
        # Step E: Vehicles (30 records)
        # ---------------------------------------------------------
        vehicles_in = source_data.get("vehicles", [])
        migrated_vehicles = 0
        for v in vehicles_in:
            existing = session.query(Vehicle).filter_by(id=v["id"]).first()
            if not existing:
                veh_obj = Vehicle(
                    id=v["id"],
                    driver_id=v["driverId"],
                    category=v.get("category", "MINI").upper(),
                    make=v.get("make", "Bajaj"),
                    model=v.get("model", "Compact"),
                    year=int(v.get("year", 2022)),
                    registration_number=v.get("registrationNumber") or v.get("vehicleNumber") or v.get("plateNumber"),
                    plate_number=v.get("plateNumber"),
                    vehicle_number=v.get("vehicleNumber"),
                    color=v.get("color", "Yellow/Green"),
                    capacity=int(v.get("capacity", 4)),
                    is_active=bool(v.get("isActive", True)),
                    created_at=parse_dt(v.get("createdAt")),
                    updated_at=parse_dt(v.get("updatedAt")),
                )
                session.add(veh_obj)
                migrated_vehicles += 1
        session.flush()
        report["counts"]["vehicles"] = {"totalInJson": len(vehicles_in), "migrated": migrated_vehicles}
        print(f"[OK] Vehicles          : {len(vehicles_in)} in JSON | {migrated_vehicles} inserted")

        # ---------------------------------------------------------
        # Step F: Rides (39 records)
        # ---------------------------------------------------------
        rides_in = source_data.get("rides", [])
        migrated_rides = 0
        for r in rides_in:
            existing = session.query(Ride).filter_by(id=r["id"]).first()
            if not existing:
                ride_obj = Ride(
                    id=r["id"],
                    booking_code=r.get("bookingCode", f"RN-{r['id'][:4]}"),
                    customer_id=r.get("customerId"),
                    customer_name=r.get("customerName"),
                    customer_phone=r.get("customerPhone"),
                    driver_id=r.get("driverId"),
                    driver_name=r.get("driverName"),
                    driver_phone=r.get("driverPhone"),
                    vehicle_category=r.get("vehicleCategory", "MINI"),
                    status=r.get("status", "COMPLETED"),
                    otp=str(r.get("otp", "0000")),
                    pickup_address=r.get("pickupAddress", "Indore"),
                    pickup_lat=float(r.get("pickupLat", 22.7196)),
                    pickup_lng=float(r.get("pickupLng", 75.8577)),
                    drop_address=r.get("dropAddress", "Indore"),
                    drop_lat=float(r.get("dropLat", 22.7500)),
                    drop_lng=float(r.get("dropLng", 75.8900)),
                    distance_km=float(r.get("distanceKm", 5.0)),
                    duration_minutes=int(r.get("durationMinutes", 15)),
                    base_fare=float(r.get("baseFare", 40.0)),
                    distance_fare=float(r.get("distanceFare", 30.0)),
                    waiting_charges=float(r.get("waitingCharges", 0.0)),
                    surge_multiplier=float(r.get("surgeMultiplier", 1.0)),
                    discount_amount=float(r.get("discountAmount", 0.0)),
                    total_fare=float(r.get("totalFare", 70.0)),
                    platform_commission=float(r.get("platformCommission", 10.5)),
                    driver_earnings=float(r.get("driverEarnings", 59.5)),
                    payment_method=r.get("paymentMethod", "CASH"),
                    payment_status=r.get("paymentStatus", "PENDING"),
                    cancellation_reason=r.get("cancellationReason"),
                    cancelled_by=r.get("cancelledBy"),
                    started_at=parse_dt(r.get("startedAt")) if r.get("startedAt") else None,
                    completed_at=parse_dt(r.get("completedAt")) if r.get("completedAt") else None,
                    created_at=parse_dt(r.get("createdAt")),
                    updated_at=parse_dt(r.get("updatedAt")),
                )
                session.add(ride_obj)
                migrated_rides += 1
        session.flush()
        report["counts"]["rides"] = {"totalInJson": len(rides_in), "migrated": migrated_rides}
        print(f"[OK] Rides             : {len(rides_in)} in JSON | {migrated_rides} inserted")

        # ---------------------------------------------------------
        # Step G: Payments (1 record) & CommissionRecords (12 records)
        # ---------------------------------------------------------
        payments_in = source_data.get("payments", [])
        migrated_payments = 0
        for p in payments_in:
            existing = session.query(Payment).filter_by(id=p["id"]).first()
            if not existing:
                pay_obj = Payment(
                    id=p["id"],
                    ride_id=p["rideId"],
                    transaction_id=p.get("transactionId") or f"TXN-{p['id']}",
                    amount=float(p.get("amount", 0.0)),
                    payment_method=p.get("paymentMethod", "ONLINE"),
                    payment_gateway=p.get("paymentGateway", "RAZORPAY"),
                    status=p.get("status", "SUCCESS"),
                    created_at=parse_dt(p.get("createdAt")),
                    updated_at=parse_dt(p.get("updatedAt")),
                )
                session.add(pay_obj)
                migrated_payments += 1
        session.flush()
        report["counts"]["payments"] = {"totalInJson": len(payments_in), "migrated": migrated_payments}
        print(f"[OK] Payments          : {len(payments_in)} in JSON | {migrated_payments} inserted")

        comm_in = source_data.get("commissionRecords", [])
        migrated_comm = 0
        for cm in comm_in:
            existing = session.query(CommissionRecord).filter_by(id=cm["id"]).first()
            if not existing:
                comm_obj = CommissionRecord(
                    id=cm["id"],
                    ride_id=cm["rideId"],
                    driver_id=cm["driverId"],
                    gross_fare=float(cm.get("grossFare", 0.0)),
                    commission_rate=float(cm.get("commissionRate", 15.0)),
                    platform_amount=float(cm.get("platformAmount", 0.0)),
                    driver_amount=float(cm.get("driverAmount", 0.0)),
                    payout_status=cm.get("payoutStatus", "SETTLED"),
                    created_at=parse_dt(cm.get("createdAt")),
                    updated_at=parse_dt(cm.get("updatedAt")),
                )
                session.add(comm_obj)
                migrated_comm += 1
        session.flush()
        report["counts"]["commissionRecords"] = {"totalInJson": len(comm_in), "migrated": migrated_comm}
        print(f"[OK] Commission Records: {len(comm_in)} in JSON | {migrated_comm} inserted")

        # ---------------------------------------------------------
        # Step H: Remaining Tables (Fares, Promos, Reviews, Complaints, Admin, Settings)
        # ---------------------------------------------------------
        fares_in = source_data.get("fareConfigurations", [])
        for f_item in fares_in:
            if not session.query(FareConfiguration).filter_by(id=f_item["id"]).first():
                session.add(FareConfiguration(
                    id=f_item["id"],
                    category=f_item["category"],
                    name=f_item["name"],
                    base_fare=float(f_item["baseFare"]),
                    per_km_rate=float(f_item["perKmRate"]),
                    waiting_rate_min=float(f_item.get("waitingRateMin", 0.0)),
                    minimum_fare=float(f_item["minimumFare"]),
                    surge_multiplier=float(f_item.get("surgeMultiplier", 1.0)),
                    is_active=bool(f_item.get("isActive", True)),
                    updated_at=parse_dt(f_item.get("updatedAt")),
                ))

        promos_in = source_data.get("promoCodes", [])
        for pr in promos_in:
            if not session.query(PromoCode).filter_by(id=pr["id"]).first():
                session.add(PromoCode(
                    id=pr["id"],
                    code=pr["code"],
                    description=pr.get("description", ""),
                    discount_percent=float(pr.get("discountPercent", 0.0)),
                    max_discount=float(pr.get("maxDiscount", 0.0)),
                    min_ride_amount=float(pr.get("minRideAmount", 0.0)),
                    valid_until=str(pr.get("validUntil")),
                    max_uses=int(pr.get("maxUses", 1000)),
                    used_count=int(pr.get("usedCount", 0)),
                    is_active=bool(pr.get("isActive", True)),
                    created_at=parse_dt(pr.get("createdAt")),
                ))

        reviews_in = source_data.get("reviews", [])
        for rev in reviews_in:
            if not session.query(Review).filter_by(id=rev["id"]).first():
                session.add(Review(
                    id=rev["id"],
                    ride_id=rev["rideId"],
                    customer_id=rev["customerId"],
                    driver_id=rev["driverId"],
                    rating=int(rev["rating"]),
                    comment=rev.get("comment"),
                    tags=rev.get("tags"),
                    created_at=parse_dt(rev.get("createdAt")),
                    updated_at=parse_dt(rev.get("updatedAt")),
                ))

        complaints_in = source_data.get("complaints", [])
        for comp in complaints_in:
            if not session.query(Complaint).filter_by(id=comp["id"]).first():
                session.add(Complaint(
                    id=comp["id"],
                    ticket_id=comp.get("ticketId", f"TKT-{comp['id'][:6]}"),
                    user_id=comp["userId"],
                    category=comp.get("category", "General"),
                    subject=comp.get("subject", "Complaint"),
                    description=comp.get("description", ""),
                    status=comp.get("status", "OPEN"),
                    resolution=comp.get("resolution"),
                    resolved_by=comp.get("resolvedBy"),
                    created_at=parse_dt(comp.get("createdAt")),
                    updated_at=parse_dt(comp.get("updatedAt")),
                ))

        admin_in = source_data.get("adminProfiles", [])
        for adm in admin_in:
            if not session.query(AdminProfile).filter_by(id=adm["id"]).first():
                session.add(AdminProfile(
                    id=adm["id"],
                    user_id=adm["userId"],
                    department=adm.get("department", "Operations"),
                    permissions=str(adm.get("permissions", "[]")),
                    created_at=parse_dt(adm.get("createdAt")),
                    updated_at=parse_dt(adm.get("updatedAt")),
                ))

        settings_in = source_data.get("systemSettings", [])
        for st in settings_in:
            if not session.query(SystemSetting).filter_by(id=st["id"]).first():
                session.add(SystemSetting(
                    id=st["id"],
                    key=st["key"],
                    value=str(st["value"]),
                    description=st.get("description"),
                    updated_at=parse_dt(st.get("updatedAt")),
                ))

        # Commit Entire Transaction
        session.commit()
        report["success"] = True
        report["completedAt"] = datetime.utcnow().isoformat() + "Z"
        print(f"============================================================")
        print(f"[SUCCESS] TRANSACTION COMMITTED SUCCESSFULLY!")
        print(f"============================================================")

    except Exception as e:
        session.rollback()
        report["success"] = False
        report["error"] = str(e)
        print(f"[ERROR] ERROR DURING MIGRATION: {e}")
        print(f"[ROLLBACK] Transaction rolled back completely. No partial state saved.")
        raise e
    finally:
        session.close()
        engine.dispose()

    return report


if __name__ == "__main__":
    db_arg = sys.argv[1] if len(sys.argv) > 1 else None
    run_migration(db_url=db_arg)
