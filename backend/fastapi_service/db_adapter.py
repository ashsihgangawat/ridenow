"""
RideNow Platform - Database Adapter & Persistence Layer
Handles atomic writes to JSON backup and safe persistence to PostgreSQL/Supabase.
"""

import os
import json
import tempfile
from typing import Dict, Any, Optional
from datetime import datetime

from database import get_engine, get_session, DATABASE_URL, check_db_connection
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


def atomic_save_json(data: Dict[str, Any], target_path: str):
    """
    Writes data to a temporary file in the same directory and replaces the target file atomically.
    Prevents file truncation or corruption if the server crashes mid-write.
    """
    dir_name = os.path.dirname(os.path.abspath(target_path))
    os.makedirs(dir_name, exist_ok=True)
    temp_file = os.path.join(dir_name, f".tmp_{os.path.basename(target_path)}_{os.getpid()}")
    try:
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        # Atomic replace
        os.replace(temp_file, target_path)
    except Exception as e:
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception:
                pass
        raise e


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


def persist_ride_to_postgres(ride_dict: Dict[str, Any]):
    """Syncs a single created or updated Ride record directly into PostgreSQL."""
    session = get_session()
    if session is None:
        return

    try:
        r_id = ride_dict.get("id")
        if not r_id:
            return

        existing = session.query(Ride).filter_by(id=r_id).first()
        if existing:
            # Update fields
            existing.status = ride_dict.get("status", existing.status)
            existing.driver_id = ride_dict.get("driverId", existing.driver_id)
            existing.driver_name = ride_dict.get("driverName", existing.driver_name)
            existing.driver_phone = ride_dict.get("driverPhone", existing.driver_phone)
            existing.payment_status = ride_dict.get("paymentStatus", existing.payment_status)
            existing.payment_method = ride_dict.get("paymentMethod", existing.payment_method)
            existing.total_fare = float(ride_dict.get("totalFare", existing.total_fare))
            existing.driver_earnings = float(ride_dict.get("driverEarnings", existing.driver_earnings))
            existing.platform_commission = float(ride_dict.get("platformCommission", existing.platform_commission))
            existing.cancellation_reason = ride_dict.get("cancellationReason", existing.cancellation_reason)
            existing.cancelled_by = ride_dict.get("cancelledBy", existing.cancelled_by)
            if ride_dict.get("startedAt"):
                existing.started_at = parse_dt(ride_dict["startedAt"])
            if ride_dict.get("completedAt"):
                existing.completed_at = parse_dt(ride_dict["completedAt"])
            existing.updated_at = datetime.utcnow()
        else:
            new_ride = Ride(
                id=r_id,
                booking_code=ride_dict.get("bookingCode", f"RN-{r_id[:4]}"),
                customer_id=ride_dict.get("customerId"),
                customer_name=ride_dict.get("customerName"),
                customer_phone=ride_dict.get("customerPhone"),
                driver_id=ride_dict.get("driverId"),
                driver_name=ride_dict.get("driverName"),
                driver_phone=ride_dict.get("driverPhone"),
                vehicle_category=ride_dict.get("vehicleCategory", "MINI"),
                status=ride_dict.get("status", "REQUESTED"),
                otp=str(ride_dict.get("otp", "0000")),
                pickup_address=ride_dict.get("pickupAddress", "Pickup Point"),
                pickup_lat=float(ride_dict.get("pickupLat", 0.0)),
                pickup_lng=float(ride_dict.get("pickupLng", 0.0)),
                drop_address=ride_dict.get("dropAddress", "Drop Point"),
                drop_lat=float(ride_dict.get("dropLat", 0.0)),
                drop_lng=float(ride_dict.get("dropLng", 0.0)),
                distance_km=float(ride_dict.get("distanceKm", 0.0)),
                duration_minutes=int(ride_dict.get("durationMinutes", 0)),
                base_fare=float(ride_dict.get("baseFare", 0.0)),
                distance_fare=float(ride_dict.get("distanceFare", 0.0)),
                waiting_charges=float(ride_dict.get("waitingCharges", 0.0)),
                surge_multiplier=float(ride_dict.get("surgeMultiplier", 1.0)),
                discount_amount=float(ride_dict.get("discountAmount", 0.0)),
                total_fare=float(ride_dict.get("totalFare", 0.0)),
                platform_commission=float(ride_dict.get("platformCommission", 0.0)),
                driver_earnings=float(ride_dict.get("driverEarnings", 0.0)),
                payment_method=ride_dict.get("paymentMethod", "CASH"),
                payment_status=ride_dict.get("paymentStatus", "PENDING"),
                cancellation_reason=ride_dict.get("cancellationReason"),
                cancelled_by=ride_dict.get("cancelledBy"),
                started_at=parse_dt(ride_dict.get("startedAt")) if ride_dict.get("startedAt") else None,
                completed_at=parse_dt(ride_dict.get("completedAt")) if ride_dict.get("completedAt") else None,
                created_at=parse_dt(ride_dict.get("createdAt")),
                updated_at=datetime.utcnow(),
            )
            session.add(new_ride)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"[DB] PostgreSQL Ride sync warning: {e}")
    finally:
        session.close()


def persist_driver_location_to_postgres(driver_id: str, lat: float, lng: float, heading: float = 0.0):
    """Updates driver GPS coordinate directly in PostgreSQL."""
    session = get_session()
    if session is None:
        return

    try:
        driver = session.query(DriverProfile).filter_by(id=driver_id).first()
        if driver:
            driver.current_lat = lat
            driver.current_lng = lng
            driver.heading = heading
            driver.last_location_update = datetime.utcnow()
            driver.updated_at = datetime.utcnow()
            session.commit()
    except Exception as e:
        session.rollback()
        print(f"[DB] PostgreSQL Driver location sync warning: {e}")
    finally:
        session.close()

