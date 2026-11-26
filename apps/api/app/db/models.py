"""
SQLAlchemy ORM models matching the RealValue data model:
- users
- properties
- searches (snapshot of inputs and results)
- saved_homes
- downloads (strict: user_id, search_id, file, first & last downloaded)
- charges (itemized $4.00 records)
- invoices (monthly aggregated billing records)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    BigInteger,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"usr_{uuid.uuid4().hex[:12]}")
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    searches = relationship("Search", back_populates="user", cascade="all, delete-orphan")
    saved_homes = relationship("SavedHome", back_populates="user", cascade="all, delete-orphan")
    downloads = relationship("Download", back_populates="user", cascade="all, delete-orphan")
    charges = relationship("Charge", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"prop_{uuid.uuid4().hex[:12]}")
    formatted_address: Mapped[str] = mapped_column(String(500), index=True, nullable=False)
    provider_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    property_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[float | None] = mapped_column(Integer, nullable=True)
    square_feet: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lot_square_feet: Mapped[int | None] = mapped_column(Integer, nullable=True)
    year_built: Mapped[int | None] = mapped_column(Integer, nullable=True)
    facts_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Search(Base):
    __tablename__ = "searches"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"srch_{uuid.uuid4().hex[:12]}")
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    estimate_status: Mapped[str] = mapped_column(String(50), nullable=False)
    estimate_cents: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    interval_low_cents: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    interval_high_cents: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    confidence: Mapped[str | None] = mapped_column(String(20), nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), default="fixture-comps-v0.1")
    inputs_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    results_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relationships
    user = relationship("User", back_populates="searches")
    downloads = relationship("Download", back_populates="search", cascade="all, delete-orphan")
    charges = relationship("Charge", back_populates="search", cascade="all, delete-orphan")


class SavedHome(Base):
    __tablename__ = "saved_homes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"svd_{uuid.uuid4().hex[:12]}")
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    search_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    latest_estimate_cents: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relationships
    user = relationship("User", back_populates="saved_homes")

    __table_args__ = (
        UniqueConstraint("user_id", "address", name="uq_user_saved_address"),
    )


class Download(Base):
    """
    Strict download rule:
    Only created when the user explicitly clicks Download and file generates successfully.
    """
    __tablename__ = "downloads"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"dl_{uuid.uuid4().hex[:12]}")
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    search_id: Mapped[str] = mapped_column(String(64), ForeignKey("searches.id", ondelete="CASCADE"), index=True, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    estimate_cents: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_size_kb: Mapped[int] = mapped_column(Integer, default=48)
    first_downloaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_downloaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relationships
    user = relationship("User", back_populates="downloads")
    search = relationship("Search", back_populates="downloads")

    __table_args__ = (
        UniqueConstraint("user_id", "search_id", name="uq_user_download_search"),
    )


class Charge(Base):
    """
    Itemized search charges:
    PRICE_PER_SEARCH = 400 cents ($4.00). Only created on successful valuation.
    """
    __tablename__ = "charges"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"chg_{uuid.uuid4().hex[:12]}")
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    search_id: Mapped[str] = mapped_column(String(64), ForeignKey("searches.id", ondelete="CASCADE"), index=True, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, default=400)
    status: Mapped[str] = mapped_column(String(30), default="succeeded")
    stripe_charge_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relationships
    user = relationship("User", back_populates="charges")
    search = relationship("Search", back_populates="charges")


class Invoice(Base):
    """
    Monthly aggregated invoices calculated on the server in cents.
    """
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    billing_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    billing_period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_amount_cents: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(30), default="open")
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relationships
    user = relationship("User", back_populates="invoices")
