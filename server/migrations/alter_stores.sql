-- Migration: Add NOT NULL constraints and sensible defaults to `stores` table
-- Run with: mysql -u <user> -p jemima < alter_stores.sql

-- NOTE: MySQL does not allow DEFAULT values on TEXT columns in some versions.
-- We set NOT NULL where safe and add defaults for VARCHAR/CHAR/DATETIME columns.

ALTER TABLE stores
  MODIFY COLUMN store_name VARCHAR(255) NOT NULL DEFAULT 'My Store',
  MODIFY COLUMN store_description TEXT NULL,
  MODIFY COLUMN store_address VARCHAR(1000) NOT NULL DEFAULT '',
  MODIFY COLUMN store_phone VARCHAR(50) NOT NULL DEFAULT '',
  MODIFY COLUMN store_email VARCHAR(255) NOT NULL DEFAULT '',
  MODIFY COLUMN store_logo_path VARCHAR(255) NOT NULL DEFAULT '',
  MODIFY COLUMN base_currency CHAR(3) NOT NULL DEFAULT 'USD',
  MODIFY COLUMN currency_symbol VARCHAR(10) NOT NULL DEFAULT '$',
  MODIFY COLUMN timezone VARCHAR(100) NOT NULL DEFAULT 'UTC+0',
  MODIFY COLUMN date_created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN date_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
