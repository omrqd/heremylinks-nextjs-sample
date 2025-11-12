-- Migration: Add E-commerce System
-- Description: Products, orders, and payment configuration for users to sell on their bio pages
-- Date: 2025-11-12

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(500),
  product_type VARCHAR(20) NOT NULL DEFAULT 'physical', -- 'physical' or 'digital'
  quantity INTEGER DEFAULT NULL, -- NULL = unlimited (for digital products)
  is_active BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_address TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, cancelled, refunded
  payment_method VARCHAR(50) DEFAULT 'paypal',
  payment_id VARCHAR(255), -- PayPal transaction ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL, -- Snapshot of product name at time of purchase
  product_price DECIMAL(10, 2) NOT NULL, -- Snapshot of price at time of purchase
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_configs table (PayPal configuration)
CREATE TABLE IF NOT EXISTS payment_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  paypal_email VARCHAR(255),
  paypal_client_id VARCHAR(500),
  paypal_secret VARCHAR(500),
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add show_products column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS show_products BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_position ON products(user_id, position);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_configs_user_id ON payment_configs(user_id);

-- Add comments
COMMENT ON TABLE products IS 'Products that users sell on their bio pages';
COMMENT ON TABLE orders IS 'Customer orders from user bio pages';
COMMENT ON TABLE order_items IS 'Individual items in each order';
COMMENT ON TABLE payment_configs IS 'User PayPal configuration for receiving payments';
COMMENT ON COLUMN users.show_products IS 'Whether to show products section on user bio page';
COMMENT ON COLUMN products.product_type IS 'Type of product: physical (requires shipping) or digital (instant delivery)';
COMMENT ON COLUMN products.quantity IS 'Available quantity. NULL = unlimited (typically for digital products)';

