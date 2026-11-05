"""
RideNow Platform - SQLAlchemy Database Models
Fully compatible with database/schema.prisma, PostgreSQL (Supabase), and ridenow_db.json.
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Index,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    phone = Column(String(32), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=True, index=True)
    password_hash = Column(String(256), nullable=True)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), nullable=False, default="RIDER", index=True)
    status = Column(String(32), nullable=False, default="ACTIVE", index=True)
    avatar = Column(String(512), nullable=True)
    preferred_lang = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer_profile = relationship("CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    driver_profile = relationship("DriverProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="user")

    __table_args__ = (
        Index("idx_users_role_status", "role", "status"),
    )


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    home_address = Column(String(256), nullable=True)
    work_address = Column(String(256), nullable=True)
    wallet_balance = Column(Float, default=0.0, nullable=False)
    emergency_phone = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="customer_profile")
    rides = relationship("Ride", back_populates="customer")
    reviews = relationship("Review", back_populates="customer")


class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    license_number = Column(String(64), unique=True, nullable=True, index=True)
    verification_status = Column(String(32), default="PENDING", index=True)
    admin_approved = Column(Boolean, default=False, index=True)
    is_online = Column(Boolean, default=False, index=True)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    heading = Column(Float, default=0.0)
    rating = Column(Float, default=5.0)
    total_ratings = Column(Integer, default=0)
    total_trips = Column(Integer, default=0)
    wallet_balance = Column(Float, default=0.0)
    rejection_reason = Column(Text, nullable=True)
    last_location_update = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="driver_profile")
    vehicle = relationship("Vehicle", back_populates="driver", uselist=False, cascade="all, delete-orphan")
    documents = relationship("DriverDocument", back_populates="driver", cascade="all, delete-orphan")
    rides = relationship("Ride", back_populates="driver")
    reviews = relationship("Review", back_populates="driver")
    commission_records = relationship("CommissionRecord", back_populates="driver")

    __table_args__ = (
        Index("idx_driver_online_status", "is_online", "verification_status"),
    )


class DriverDocument(Base):
    __tablename__ = "driver_documents"

    id = Column(String(64), primary_key=True)
    driver_id = Column(String(64), ForeignKey("driver_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(64), nullable=False, index=True)
    document_number = Column(String(64), nullable=True)
    file_url = Column(Text, nullable=True)
    file_name = Column(String(256), nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(64), nullable=True)
    expiry_date = Column(String(32), nullable=True)
    status = Column(String(32), default="PENDING", index=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    driver = relationship("DriverProfile", back_populates="documents")

    __table_args__ = (
        Index("idx_driver_doc_type", "driver_id", "document_type"),
    )


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(64), primary_key=True)
    driver_id = Column(String(64), ForeignKey("driver_profiles.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    category = Column(String(32), nullable=False, default="MINI", index=True)
    make = Column(String(64), nullable=False)
    model = Column(String(64), nullable=False)
    year = Column(Integer, default=2022)
    registration_number = Column(String(64), nullable=True, index=True)
    plate_number = Column(String(64), nullable=True)
    vehicle_number = Column(String(64), nullable=True)
    color = Column(String(32), default="White")
    capacity = Column(Integer, default=4)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    driver = relationship("DriverProfile", back_populates="vehicle")


class Ride(Base):
    __tablename__ = "rides"

    id = Column(String(64), primary_key=True)
    booking_code = Column(String(32), unique=True, nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customer_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_name = Column(String(128), nullable=True)
    customer_phone = Column(String(32), nullable=True)
    driver_id = Column(String(64), ForeignKey("driver_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    driver_name = Column(String(128), nullable=True)
    driver_phone = Column(String(32), nullable=True)
    vehicle_category = Column(String(32), nullable=False, default="MINI", index=True)
    status = Column(String(32), nullable=False, default="REQUESTED", index=True)
    otp = Column(String(8), nullable=False)

    pickup_address = Column(String(256), nullable=False)
    pickup_lat = Column(Float, nullable=False)
    pickup_lng = Column(Float, nullable=False)
    drop_address = Column(String(256), nullable=False)
    drop_lat = Column(Float, nullable=False)
    drop_lng = Column(Float, nullable=False)

    distance_km = Column(Float, default=0.0)
    duration_minutes = Column(Integer, default=0)

    base_fare = Column(Float, default=0.0)
    distance_fare = Column(Float, default=0.0)
    waiting_charges = Column(Float, default=0.0)
    surge_multiplier = Column(Float, default=1.0)
    discount_amount = Column(Float, default=0.0)
    total_fare = Column(Float, default=0.0)
    platform_commission = Column(Float, default=0.0)
    driver_earnings = Column(Float, default=0.0)

    payment_method = Column(String(32), default="CASH")
    payment_status = Column(String(32), default="PENDING", index=True)

    cancellation_reason = Column(Text, nullable=True)
    cancelled_by = Column(String(32), nullable=True)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("CustomerProfile", back_populates="rides")
    driver = relationship("DriverProfile", back_populates="rides")
    payment = relationship("Payment", back_populates="ride", uselist=False)
    commission_record = relationship("CommissionRecord", back_populates="ride", uselist=False)
    review = relationship("Review", back_populates="ride", uselist=False)

    __table_args__ = (
        Index("idx_ride_status_created", "status", "created_at"),
    )


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True)
    ride_id = Column(String(64), ForeignKey("rides.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    transaction_id = Column(String(128), unique=True, nullable=True, index=True)
    payment_gateway = Column(String(32), default="RAZORPAY")
    payment_method = Column(String(32), default="ONLINE")
    amount = Column(Float, nullable=False)
    currency = Column(String(8), default="INR")
    status = Column(String(32), default="PENDING", index=True)
    razorpay_order_id = Column(String(128), nullable=True)
    razorpay_payment_id = Column(String(128), nullable=True)
    razorpay_signature = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    ride = relationship("Ride", back_populates="payment")


class CommissionRecord(Base):
    __tablename__ = "commission_records"

    id = Column(String(64), primary_key=True)
    ride_id = Column(String(64), ForeignKey("rides.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    driver_id = Column(String(64), ForeignKey("driver_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    gross_fare = Column(Float, nullable=False)
    commission_rate = Column(Float, default=15.0)
    platform_amount = Column(Float, nullable=False)
    driver_amount = Column(Float, nullable=False)
    payout_status = Column(String(32), default="SETTLED", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    ride = relationship("Ride", back_populates="commission_record")
    driver = relationship("DriverProfile", back_populates="commission_records")


class FareConfiguration(Base):
    __tablename__ = "fare_configurations"

    id = Column(String(64), primary_key=True)
    category = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(64), nullable=False)
    base_fare = Column(Float, nullable=False)
    per_km_rate = Column(Float, nullable=False)
    waiting_rate_min = Column(Float, default=0.0)
    minimum_fare = Column(Float, nullable=False)
    surge_multiplier = Column(Float, default=1.0)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(String(64), primary_key=True)
    code = Column(String(32), unique=True, nullable=False, index=True)
    description = Column(String(256), nullable=False)
    discount_percent = Column(Float, nullable=False)
    max_discount = Column(Float, nullable=False)
    min_ride_amount = Column(Float, default=0.0)
    valid_until = Column(String(64), nullable=False)
    max_uses = Column(Integer, default=1000)
    used_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(64), primary_key=True)
    ride_id = Column(String(64), ForeignKey("rides.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    driver_id = Column(String(64), ForeignKey("driver_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    tags = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    ride = relationship("Ride", back_populates="review")
    customer = relationship("CustomerProfile", back_populates="reviews")
    driver = relationship("DriverProfile", back_populates="reviews")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(64), primary_key=True)
    ticket_id = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ride_id = Column(String(64), ForeignKey("rides.id", ondelete="SET NULL"), nullable=True, index=True)
    category = Column(String(64), nullable=False)
    subject = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(32), default="OPEN", index=True)
    resolution = Column(Text, nullable=True)
    resolved_by = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="complaints")


class AdminProfile(Base):
    __tablename__ = "admin_profiles"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    department = Column(String(64), default="Operations")
    permissions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="admin_profile")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(String(64), primary_key=True)
    key = Column(String(64), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(256), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

