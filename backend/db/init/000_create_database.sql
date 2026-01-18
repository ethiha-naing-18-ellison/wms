-- ============================================
-- Warehouse Management System Database Schema
-- ============================================
-- This file creates all tables required for the WMS system
-- Run this file first, then run 001_users.sql and 002_seed_users.sql

-- ============================================
-- 1. USERS TABLE (Authentication & Authorization)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'operator')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. SUPPLIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100),
  address TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  product_id SERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  tags TEXT[], -- Array of tags
  low_stock_threshold INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. INVENTORY TABLE (Current Stock Levels)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
  inventory_id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL UNIQUE REFERENCES products(product_id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  avg_cost DECIMAL(10, 2) DEFAULT 0.00 CHECK (avg_cost >= 0),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. INBOUND RECEIPTS TABLE (Goods Received)
-- ============================================
CREATE TABLE IF NOT EXISTS inbound_receipts (
  inbound_id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
  reference_no VARCHAR(100),
  received_date DATE NOT NULL,
  created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. INBOUND ITEMS TABLE (Items in Each Receipt)
-- ============================================
CREATE TABLE IF NOT EXISTS inbound_items (
  inbound_item_id SERIAL PRIMARY KEY,
  inbound_id INTEGER NOT NULL REFERENCES inbound_receipts(inbound_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10, 2) NOT NULL CHECK (unit_cost >= 0)
);

-- ============================================
-- 7. OUTBOUND RECORDS TABLE (Goods Dispatched)
-- ============================================
CREATE TABLE IF NOT EXISTS outbound_records (
  outbound_id SERIAL PRIMARY KEY,
  customer_name VARCHAR(200) NOT NULL,
  so_reference VARCHAR(100), -- Sales Order Reference
  dispatch_date DATE NOT NULL,
  created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. OUTBOUND ITEMS TABLE (Items in Each Dispatch)
-- ============================================
CREATE TABLE IF NOT EXISTS outbound_items (
  outbound_item_id SERIAL PRIMARY KEY,
  outbound_id INTEGER NOT NULL REFERENCES outbound_records(outbound_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- ============================================
-- 9. INVENTORY AUDIT TABLE (Stock Movement History)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_audit (
  audit_id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('INBOUND', 'OUTBOUND')),
  quantity_change INTEGER NOT NULL, -- Positive for INBOUND, Negative for OUTBOUND
  reference_id INTEGER, -- References inbound_id or outbound_id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. ACTIVITY LOGS TABLE (User Activity Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  log_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, ARCHIVE, etc.
  entity VARCHAR(50) NOT NULL, -- product, inbound, outbound, etc.
  entity_id INTEGER, -- ID of the affected entity
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. OUTBOUND ATTACHMENTS TABLE (Document Storage)
-- ============================================
CREATE TABLE IF NOT EXISTS outbound_attachments (
  attachment_id SERIAL PRIMARY KEY,
  outbound_id INTEGER NOT NULL REFERENCES outbound_records(outbound_id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);

-- Inbound indexes
CREATE INDEX IF NOT EXISTS idx_inbound_receipts_supplier ON inbound_receipts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inbound_receipts_date ON inbound_receipts(received_date);
CREATE INDEX IF NOT EXISTS idx_inbound_items_inbound ON inbound_items(inbound_id);
CREATE INDEX IF NOT EXISTS idx_inbound_items_product ON inbound_items(product_id);

-- Outbound indexes
CREATE INDEX IF NOT EXISTS idx_outbound_records_date ON outbound_records(dispatch_date);
CREATE INDEX IF NOT EXISTS idx_outbound_items_outbound ON outbound_items(outbound_id);
CREATE INDEX IF NOT EXISTS idx_outbound_items_product ON outbound_items(product_id);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_inventory_audit_product ON inventory_audit(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_type ON inventory_audit(change_type);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_created ON inventory_audit(created_at);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_outbound_attachments_outbound ON outbound_attachments(outbound_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update products.updated_at on UPDATE
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Update inventory.updated_at on UPDATE
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_updated_at ON inventory;
CREATE TRIGGER trigger_update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- ============================================
-- END OF SCHEMA
-- ============================================
