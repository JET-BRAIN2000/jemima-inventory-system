-- Jemima Inventory System schema for MySQL
-- Run: mysql -u root -p jemima < schema.sql

CREATE DATABASE IF NOT EXISTS jemima CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jemima;

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  account_status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_date DATETIME NOT NULL,
  last_login DATETIME NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id VARCHAR(50) PRIMARY KEY,
  full_name VARCHAR(255),
  job_title ENUM('Store Owner','Manager','Cashier','Sales Representative','Accountant'),
  phone_number VARCHAR(50),
  date_of_birth DATE,
  address TEXT,
  profile_picture_path VARCHAR(255),
  date_modified DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stores (
  store_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  store_name VARCHAR(255) NOT NULL DEFAULT 'My Store',
  store_description TEXT,
  store_address VARCHAR(1000) NOT NULL DEFAULT '',
  store_phone VARCHAR(50) NOT NULL DEFAULT '',
  store_email VARCHAR(255) NOT NULL DEFAULT '',
  store_logo_path VARCHAR(255) DEFAULT NULL,
  base_currency CHAR(3) NOT NULL DEFAULT 'USD',
  currency_symbol VARCHAR(10) NOT NULL DEFAULT '$',
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC+0',
  date_created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  category_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  description TEXT,
  date_created DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_items (
  item_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category_id VARCHAR(50),
  category_name VARCHAR(255),
  unit_price DECIMAL(12,2) DEFAULT 0,
  quantity_current INT DEFAULT 0,
  quantity_initial INT DEFAULT 0,
  description TEXT,
  item_status ENUM('Active','Inactive') DEFAULT 'Active',
  date_added DATETIME,
  date_modified DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sales (
  sale_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255),
  item_id VARCHAR(50),
  item_name VARCHAR(255),
  quantity_sold INT DEFAULT 0,
  unit_price DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(14,2) DEFAULT 0,
  payment_method ENUM('Cash','Credit Card','Debit Card','Mobile Money','Check'),
  sale_timestamp DATETIME,
  receipt_number VARCHAR(100),
  transaction_status ENUM('Completed','Pending','Cancelled') DEFAULT 'Completed',
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_items(item_id) ON DELETE SET NULL
);