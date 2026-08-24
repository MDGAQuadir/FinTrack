-- ==========================================================
-- FinTrack Database Migration: V2__performance_indexes.sql
-- Composite performance indexes for query optimization
-- ==========================================================

-- Index for User Credit queries by email and date
CREATE INDEX IF NOT EXISTS idx_credits_email_date ON credits (email, date);

-- Index for User Debit queries by email and date
CREATE INDEX IF NOT EXISTS idx_debits_email_date ON debits (email, date);

-- Composite index for Unified chronological ledger sorting
CREATE INDEX IF NOT EXISTS idx_unifieds_email_date_created ON unifieds (email, date, created_at);

-- Index for Borrow & Lend by user and status
CREATE INDEX IF NOT EXISTS idx_borrow_lends_user_status ON borrow_lends (user_id, status);

-- Index for Webhook Events by user and status
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_status ON webhook_events (user_id, status);
