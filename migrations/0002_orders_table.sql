-- Orders table for guest checkout (doesn't require user_id)
-- Supports both Stripe and Revolut payments
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL, -- e.g. CR-12345678
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  
  -- Birth Details for Astrology Reading
  birth_day INTEGER NOT NULL,
  birth_month INTEGER NOT NULL,
  birth_year INTEGER NOT NULL,
  birth_time TEXT, -- Optional, format: HH:MM
  birth_place TEXT NOT NULL,
  
  -- Package Information
  package_id INTEGER NOT NULL,
  package_name TEXT NOT NULL,
  package_price REAL NOT NULL,
  
  -- Payment Information
  payment_provider TEXT NOT NULL DEFAULT 'stripe', -- 'stripe' or 'revolut'
  payment_method TEXT, -- 'card', 'bank_transfer', etc.
  
  -- Stripe Payment Data
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  
  -- Revolut Payment Data
  revolut_order_id TEXT UNIQUE,
  revolut_public_id TEXT,
  
  -- Payment Status
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  
  -- Order Status
  order_status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, cancelled
  fulfillment_status TEXT DEFAULT 'pending', -- pending, in_progress, delivered
  
  -- Metadata
  terms_accepted BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (package_id) REFERENCES packages(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_revolut_order ON orders(revolut_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders(payment_provider);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
