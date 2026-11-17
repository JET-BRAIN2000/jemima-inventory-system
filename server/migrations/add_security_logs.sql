-- Migration: Add security_logs table and ensure profile columns allow NULL
-- Run: mysql -u root -p jemima < add_security_logs.sql

USE jemima;

-- ─────────────────────────────────────────────────────────
-- 1. Ensure all optional profile columns explicitly allow NULL
-- ─────────────────────────────────────────────────────────
ALTER TABLE profiles
  MODIFY COLUMN full_name VARCHAR(255) NULL DEFAULT NULL,
  MODIFY COLUMN job_title ENUM('Store Owner','Manager','Cashier','Sales Representative','Accountant') NULL DEFAULT 'Store Owner',
  MODIFY COLUMN phone_number VARCHAR(50) NULL DEFAULT NULL,
  MODIFY COLUMN date_of_birth DATE NULL DEFAULT NULL,
  MODIFY COLUMN address TEXT NULL,
  MODIFY COLUMN profile_picture_path VARCHAR(255) NULL DEFAULT NULL,
  MODIFY COLUMN date_modified DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ─────────────────────────────────────────────────────────
-- 2. Create security_logs table to track password changes
--    and other security events
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_logs (
  log_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  event_type ENUM('password_change','login','logout','failed_login','account_locked','two_factor_enabled','two_factor_disabled') NOT NULL,
  event_description TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  event_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Index for faster lookups by user and time
CREATE INDEX idx_security_logs_user ON security_logs(user_id, event_timestamp DESC);

-- ─────────────────────────────────────────────────────────
-- 3. Add password_changed_at column to users table
-- ─────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_changed_at DATETIME NULL DEFAULT NULL;
