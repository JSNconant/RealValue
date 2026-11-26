-- RealValue PostgreSQL Database Migration 001
-- Tables: users, properties, searches, saved_homes, downloads, charges, invoices

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) DEFAULT '',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(64) PRIMARY KEY,
    formatted_address VARCHAR(500) NOT NULL,
    provider_id VARCHAR(100),
    property_type VARCHAR(50),
    bedrooms INT,
    bathrooms NUMERIC(3, 1),
    square_feet INT,
    lot_square_feet INT,
    year_built INT,
    facts_snapshot JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(formatted_address);

CREATE TABLE IF NOT EXISTS searches (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(500) NOT NULL,
    estimate_status VARCHAR(50) NOT NULL,
    estimate_cents BIGINT,
    interval_low_cents BIGINT,
    interval_high_cents BIGINT,
    confidence VARCHAR(20),
    model_version VARCHAR(50) DEFAULT 'fixture-comps-v0.1',
    inputs_snapshot JSONB DEFAULT '{}'::jsonb,
    results_snapshot JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);

CREATE TABLE IF NOT EXISTS saved_homes (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_id VARCHAR(64),
    address VARCHAR(500) NOT NULL,
    latest_estimate_cents BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_saved_address UNIQUE(user_id, address)
);

CREATE INDEX IF NOT EXISTS idx_saved_homes_user_id ON saved_homes(user_id);

CREATE TABLE IF NOT EXISTS downloads (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_id VARCHAR(64) NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
    address VARCHAR(500) NOT NULL,
    estimate_cents BIGINT,
    file_path VARCHAR(500),
    file_size_kb INT DEFAULT 48,
    first_downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    last_downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_download_search UNIQUE(user_id, search_id)
);

CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);

CREATE TABLE IF NOT EXISTS charges (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_id VARCHAR(64) NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
    address VARCHAR(500) NOT NULL,
    amount_cents INT DEFAULT 400,
    status VARCHAR(30) DEFAULT 'succeeded',
    stripe_charge_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charges_user_id ON charges(user_id);

CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    total_amount_cents INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'open',
    pdf_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
