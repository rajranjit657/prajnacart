-- =============================================================================
-- PRAJNACART DATABASE SCHEMA (PostgreSQL / Supabase Migration)
-- Full Multi-Vendor Marketplace with Roles, Catalog, Orders, Payments, Reviews
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name, description) VALUES
    ('customer', 'Customer', 'End-user customer with ordering and review capabilities'),
    ('seller', 'Seller', 'Multi-vendor seller managing inventory, catalog and seller orders'),
    ('admin', 'Admin', 'Platform administrator with full governance access')
ON CONFLICT (id) DO NOTHING;

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'customer' REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(100) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    gender VARCHAR(20),
    date_of_birth DATE,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    address_type VARCHAR(20) DEFAULT 'home', -- 'home' or 'work'
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SELLERS
CREATE TABLE IF NOT EXISTS sellers (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(100) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    store_name VARCHAR(200) NOT NULL UNIQUE,
    store_slug VARCHAR(220) NOT NULL UNIQUE,
    business_email VARCHAR(255) NOT NULL,
    business_phone VARCHAR(20) NOT NULL,
    gstin VARCHAR(50),
    pan VARCHAR(50),
    bank_account_name VARCHAR(150),
    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(20),
    bank_name VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'suspended'
    rating NUMERIC(3, 2) DEFAULT 4.5,
    rating_count INT DEFAULT 0,
    commission_rate NUMERIC(5, 2) DEFAULT 8.00, -- 8% marketplace fee
    pickup_address JSONB,
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SELLER DOCUMENTS
CREATE TABLE IF NOT EXISTS seller_documents (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    seller_id VARCHAR(100) NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'gst_certificate', 'pan_card', 'canceled_cheque', 'id_proof'
    document_url TEXT NOT NULL,
    verification_status VARCHAR(30) DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(150) NOT NULL UNIQUE,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    icon_name VARCHAR(50),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. SUBCATEGORIES
CREATE TABLE IF NOT EXISTS subcategories (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_id, slug)
);

-- 9. BRANDS
CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(150) NOT NULL UNIQUE,
    slug VARCHAR(180) NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(350) NOT NULL UNIQUE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT NOT NULL,
    category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    subcategory_id VARCHAR(100) REFERENCES subcategories(id) ON DELETE SET NULL,
    brand_id VARCHAR(100) REFERENCES brands(id) ON DELETE SET NULL,
    brand_name VARCHAR(150),
    seller_id VARCHAR(100) NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    mrp NUMERIC(12, 2) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    discount_percent INT DEFAULT 0,
    tax_percent NUMERIC(5, 2) DEFAULT 18.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    thumbnail_url TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 0.0,
    rating_count INT DEFAULT 0,
    review_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_deal_of_the_day BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(30) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
    warranty_info VARCHAR(255) DEFAULT '1 Year Manufacturer Warranty',
    return_policy VARCHAR(255) DEFAULT '7 Days Replacement Policy',
    delivery_info VARCHAR(255) DEFAULT 'Free Delivery Available',
    specifications JSONB DEFAULT '[]'::jsonb, -- e.g. [{"group": "General", "items": [{"name": "In The Box", "value": "Handset, Cable"}]}]
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INT DEFAULT 0,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    variant_name VARCHAR(200) NOT NULL, -- e.g. "8GB RAM / 128GB Storage - Phantom Black"
    color VARCHAR(100),
    color_code VARCHAR(20),
    size VARCHAR(50),
    storage VARCHAR(50),
    ram VARCHAR(50),
    weight VARCHAR(50),
    mrp NUMERIC(12, 2) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id VARCHAR(100) REFERENCES product_variants(id) ON DELETE CASCADE,
    seller_id VARCHAR(100) NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    total_stock INT NOT NULL DEFAULT 0,
    reserved_stock INT NOT NULL DEFAULT 0,
    available_stock INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. SELLER PRODUCTS (Multi-vendor listing mapping)
CREATE TABLE IF NOT EXISTS seller_products (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    seller_id VARCHAR(100) NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(12, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(seller_id, product_id)
);

-- 15. CART & CART ITEMS
CREATE TABLE IF NOT EXISTS cart (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(100) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    cart_id VARCHAR(100) NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id VARCHAR(100) REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, product_id, variant_id)
);

-- 16. WISHLIST & WISHLIST ITEMS
CREATE TABLE IF NOT EXISTS wishlists (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(100) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    wishlist_id VARCHAR(100) NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wishlist_id, product_id)
);

-- 17. COUPONS & COUPON USAGE
CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2) DEFAULT 0,
    max_discount_value NUMERIC(10, 2),
    usage_limit INT DEFAULT 1000,
    used_count INT DEFAULT 0,
    per_user_limit INT DEFAULT 1,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_usage (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    coupon_id VARCHAR(100) NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id VARCHAR(100),
    discount_applied NUMERIC(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    order_number VARCHAR(100) NOT NULL UNIQUE, -- e.g. NM202608250001
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    items_subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    coupon_code VARCHAR(50),
    coupon_discount NUMERIC(12, 2) DEFAULT 0,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    shipping_fee NUMERIC(12, 2) DEFAULT 0,
    grand_total NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'razorpay', 'cod'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    order_status VARCHAR(50) DEFAULT 'placed', -- 'placed', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'
    tracking_id VARCHAR(100),
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id VARCHAR(100) REFERENCES product_variants(id) ON DELETE RESTRICT,
    seller_id VARCHAR(100) NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    product_title VARCHAR(300) NOT NULL,
    variant_name VARCHAR(200),
    thumbnail_url TEXT,
    unit_mrp NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(12, 2) NOT NULL,
    item_status VARCHAR(50) DEFAULT 'placed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. SELLER ORDERS (Splits for multi-vendor order routing)
CREATE TABLE IF NOT EXISTS seller_orders (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_id VARCHAR(100) NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    seller_subtotal NUMERIC(12, 2) NOT NULL,
    commission_rate NUMERIC(5, 2) DEFAULT 8.0,
    commission_amount NUMERIC(12, 2) NOT NULL,
    seller_payout_amount NUMERIC(12, 2) NOT NULL,
    fulfillment_status VARCHAR(50) DEFAULT 'placed', -- 'placed', 'packed', 'shipped', 'delivered', 'cancelled'
    payout_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    payment_gateway VARCHAR(50) NOT NULL, -- 'razorpay', 'cod', 'demo'
    transaction_id VARCHAR(150),
    razorpay_order_id VARCHAR(150),
    razorpay_payment_id VARCHAR(150),
    razorpay_signature VARCHAR(255),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'successful', 'failed', 'refunded'
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. REVIEWS & REVIEW IMAGES
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id VARCHAR(100) REFERENCES orders(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT TRUE,
    helpful_votes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

CREATE TABLE IF NOT EXISTS review_images (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    review_id VARCHAR(100) NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. BANNERS (Hero carousel & homepage promotions)
CREATE TABLE IF NOT EXISTS banners (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(200) NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    cta_text VARCHAR(50) DEFAULT 'Shop Now',
    cta_link VARCHAR(255) DEFAULT '/products',
    badge_text VARCHAR(50),
    display_order INT DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'order', 'promotion', 'system', 'alert'
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. RETURNS & REFUNDS
CREATE TABLE IF NOT EXISTS returns (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id VARCHAR(100) NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'requested', -- 'requested', 'approved', 'pickup_scheduled', 'item_received', 'refund_issued', 'rejected'
    refund_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    return_id VARCHAR(100) REFERENCES returns(id) ON DELETE SET NULL,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    gateway_refund_id VARCHAR(150),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 25. COMMISSIONS & PAYOUTS
CREATE TABLE IF NOT EXISTS commissions (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    seller_id VARCHAR(100) NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    seller_order_id VARCHAR(100) NOT NULL REFERENCES seller_orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payouts (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    seller_id VARCHAR(100) NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    transaction_ref VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed',
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 26. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & quick lookup
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller ON seller_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
