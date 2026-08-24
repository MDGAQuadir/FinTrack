-- ==========================================================
-- FinTrack Database Migration: V1__initial_schema.sql
-- Base Schema for Users, Credits, Debits, Unified Ledger,
-- Borrow & Lend, and Webhook Events.
-- ==========================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    phone VARCHAR(50),
    occupation VARCHAR(255),
    city VARCHAR(255),
    address TEXT,
    zipcode VARCHAR(50),
    state VARCHAR(255),
    country VARCHAR(255),
    balance DOUBLE PRECISION DEFAULT 0.0,
    initial_balance DOUBLE PRECISION DEFAULT 0.0,
    otp VARCHAR(10),
    otp_expires TIMESTAMP,
    last_login_request TIMESTAMP,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credits (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    purpose VARCHAR(255),
    credited_from VARCHAR(255),
    date VARCHAR(20),
    source_of_payment VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debits (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    paid_to VARCHAR(255),
    payment_method VARCHAR(255),
    date VARCHAR(20),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unifieds (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    date VARCHAR(20),
    source_of_payment VARCHAR(255),
    purpose VARCHAR(255),
    debit DOUBLE PRECISION DEFAULT 0.0,
    credit DOUBLE PRECISION DEFAULT 0.0,
    balance DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS borrow_lends (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    person_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    settled_amount DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(50) NOT NULL,
    due_date VARCHAR(20),
    contact VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id VARCHAR(36) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(36),
    event_type VARCHAR(100),
    payload_hash VARCHAR(64),
    status VARCHAR(50),
    error_message TEXT,
    duration_ms BIGINT DEFAULT 0,
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_webhook_provider_event UNIQUE (provider, event_id)
);
