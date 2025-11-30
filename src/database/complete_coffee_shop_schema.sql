-- Complete Coffee Shop Database Schema for Supabase
-- Production-ready schema with all necessary tables and relationships

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CORE TABLES
-- ========================================

-- User profiles (customers and admins)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'cashier')),
    address JSONB, -- Store structured address data
    preferences JSONB, -- Store user preferences like favorite orders
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu categories
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    preparation_time INTEGER, -- in minutes
    calories INTEGER,
    allergens TEXT[], -- array of allergen strings
    tags TEXT[], -- array of tags like 'vegan', 'organic', etc.
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu item options (sizes, add-ons, modifications)
CREATE TABLE menu_item_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    option_type TEXT NOT NULL CHECK (option_type IN ('size', 'addon', 'modification')),
    name TEXT NOT NULL,
    price_modifier DECIMAL(10,2) NOT NULL DEFAULT 0, -- positive for add-ons, negative for discounts
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CART AND ORDER SYSTEM
-- ========================================

-- Session carts (temporary cart storage)
CREATE TABLE session_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL, -- For anonymous users
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For logged-in users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Cart items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES session_carts(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart item options (selected options for each cart item)
CREATE TABLE cart_item_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_item_id UUID NOT NULL REFERENCES cart_items(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES menu_item_options(id) ON DELETE CASCADE,
    option_name TEXT NOT NULL,
    option_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    order_type TEXT NOT NULL DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'takeaway', 'delivery')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'digital_wallet', 'gift_card')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    notes TEXT,
    estimated_ready_time TIMESTAMP WITH TIME ZONE,
    table_number INTEGER,
    delivery_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    menu_item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order item options (selected options for each order item)
CREATE TABLE order_item_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    option_name TEXT NOT NULL,
    option_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- BUSINESS MANAGEMENT
-- ========================================

-- Store settings
CREATE TABLE store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax rates
CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    rate DECIMAL(5,4) NOT NULL, -- e.g., 0.0825 for 8.25%
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discounts and promotions
CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'buy_x_get_y')),
    value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2),
    applicable_categories UUID[],
    applicable_items UUID[],
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer feedback/reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- UTILITY FUNCTIONS
-- ========================================

-- Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get today's date in YYYYMMDD format
    SELECT TO_CHAR(NOW(), 'YYYYMMDD') INTO new_number;
    
    -- Get the count of orders created today
    SELECT COUNT(*) + 1 INTO counter
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Combine date and counter (padded to 3 digits)
    new_number := new_number || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Update timestamp triggers
CREATE TRIGGER update_user_profiles_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_menu_categories_timestamp BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_menu_items_timestamp BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_session_carts_timestamp BEFORE UPDATE ON session_carts FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_cart_items_timestamp BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_store_settings_timestamp BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_discounts_timestamp BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Auto-generate order number trigger
CREATE OR REPLACE FUNCTION auto_generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number = generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION auto_generate_order_number();

-- Create user profile trigger (allows admin creation via Supabase dashboard)
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow admin and cashier emails to create accounts
    IF NEW.email LIKE '%admin%' OR NEW.email LIKE '%@admin.%' OR NEW.email LIKE '%cashier%' THEN
        INSERT INTO user_profiles (id, email, full_name, role)
        VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Administrator'),
            CASE 
                WHEN NEW.email LIKE '%admin%' OR NEW.email LIKE '%@admin.%' THEN 'admin'
                WHEN NEW.email LIKE '%cashier%' THEN 'cashier'
                ELSE 'admin'
            END
        );
        RETURN NEW;
    ELSE
        -- For non-admin emails, create profile but don't allow login
        -- This allows you to manually create admin accounts in Supabase dashboard
        INSERT INTO user_profiles (id, email, full_name, role)
        VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
            'admin'  -- Set as admin by default for manual creation
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_profile_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Clean up expired carts
CREATE OR REPLACE FUNCTION cleanup_expired_carts()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM session_carts WHERE expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_featured ON menu_items(is_featured);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_session_carts_user ON session_carts(user_id);
CREATE INDEX idx_session_carts_session ON session_carts(session_id);
CREATE INDEX idx_session_carts_expires ON session_carts(expires_at);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage all profiles" ON user_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Menu policies (public read, admin write)
CREATE POLICY "Anyone can view menu categories" ON menu_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view menu items" ON menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Anyone can view menu item options" ON menu_item_options FOR SELECT USING (is_available = true);
CREATE POLICY "Admins can manage menu categories" ON menu_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin'))
);
CREATE POLICY "Admins can manage menu items" ON menu_items FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin'))
);
CREATE POLICY "Admins can manage menu options" ON menu_item_options FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin'))
);

-- Cart policies
CREATE POLICY "Users can manage their own carts" ON session_carts FOR ALL USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND session_id IS NOT NULL) -- Allow anonymous carts
);
CREATE POLICY "Users can manage their cart items" ON cart_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM session_carts sc 
        WHERE sc.id = cart_items.cart_id 
        AND (sc.user_id = auth.uid() OR sc.user_id IS NULL)
    )
);
CREATE POLICY "Users can manage their cart item options" ON cart_item_options FOR ALL USING (
    EXISTS (
        SELECT 1 FROM cart_items ci 
        JOIN session_carts sc ON ci.cart_id = sc.id
        WHERE ci.id = cart_item_options.cart_item_id 
        AND (sc.user_id = auth.uid() OR sc.user_id IS NULL)
    )
);

-- Order policies
CREATE POLICY "Customers can view their own orders" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Staff can view all orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cashier'))
);
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cashier'))
);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders o 
        WHERE o.id = order_items.order_id 
        AND (o.customer_id = auth.uid() OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cashier')
        ))
    )
);
CREATE POLICY "Anyone can create order items" ON order_items FOR INSERT WITH CHECK (true);

-- Order item options policies
CREATE POLICY "Users can view order item options for their orders" ON order_item_options FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM order_items oi 
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.id = order_item_options.order_item_id 
        AND (o.customer_id = auth.uid() OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cashier')
        ))
    )
);
CREATE POLICY "Anyone can create order item options" ON order_item_options FOR INSERT WITH CHECK (true);

-- Store settings policies
CREATE POLICY "Anyone can view store settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage store settings" ON store_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tax rates policies
CREATE POLICY "Anyone can view active tax rates" ON tax_rates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tax rates" ON tax_rates FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Discount policies
CREATE POLICY "Anyone can view active discounts" ON discounts FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage discounts" ON discounts FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Review policies
CREATE POLICY "Anyone can view public reviews" ON reviews FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create reviews for their orders" ON reviews FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (customer_id = auth.uid());
CREATE POLICY "Admins can manage all reviews" ON reviews FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ========================================
-- VIEWS FOR ANALYTICS
-- ========================================

-- Sales analytics view
CREATE OR REPLACE VIEW sales_analytics AS
SELECT 
    DATE(o.created_at) as sale_date,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as average_order_value,
    COUNT(DISTINCT o.customer_id) as unique_customers
FROM orders o
WHERE o.status IN ('completed', 'ready')
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

-- Popular items view
CREATE OR REPLACE VIEW popular_items AS
SELECT 
    mi.id,
    mi.name,
    mc.name as category_name,
    COUNT(oi.id) as order_count,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.total_price) as total_revenue
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('completed', 'ready') OR o.status IS NULL
GROUP BY mi.id, mi.name, mc.name
ORDER BY total_quantity_sold DESC NULLS LAST;

-- Order summary view
CREATE OR REPLACE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.status,
    o.order_type,
    o.total_amount,
    o.created_at,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_name, o.status, o.order_type, o.total_amount, o.created_at
ORDER BY o.created_at DESC;

-- Cart summary view
CREATE OR REPLACE VIEW cart_summary AS
SELECT 
    sc.id as cart_id,
    sc.user_id,
    sc.session_id,
    COUNT(ci.id) as item_count,
    SUM(ci.total_price) as cart_total,
    sc.created_at,
    sc.updated_at
FROM session_carts sc
LEFT JOIN cart_items ci ON sc.id = ci.cart_id
GROUP BY sc.id, sc.user_id, sc.session_id, sc.created_at, sc.updated_at;

-- Insert default menu categories
INSERT INTO menu_categories (name, description, display_order, is_active) VALUES
('Coffee', 'Hot and cold coffee beverages', 1, true),
('Tea', 'Premium tea selection', 2, true),
('Pastries', 'Fresh baked goods and desserts', 3, true),
('Sandwiches', 'Gourmet sandwiches and wraps', 4, true),
('Pasta', 'Italian pasta dishes', 5, true),
('Salads', 'Fresh and healthy salads', 6, true),
('Breakfast', 'All-day breakfast options', 7, true),
('Snacks', 'Light bites and appetizers', 8, true),
('Beverages', 'Non-coffee beverages and smoothies', 9, true),
('Desserts', 'Sweet treats and ice cream', 10, true);

-- Insert default store settings
INSERT INTO store_settings (key, value, description) VALUES
('store_name', '"Bos Coffee"', 'Store name'),
('store_address', '{"street": "", "city": "", "state": "", "zip": ""}', 'Store address'),
('store_phone', '""', 'Store phone number'),
('store_email', '""', 'Store email address'),
('tax_rate', '0.0825', 'Default tax rate (8.25%)'),
('currency', '"USD"', 'Currency code'),
('business_hours', '{"monday": {"open": "06:00", "close": "22:00", "closed": false}, "tuesday": {"open": "06:00", "close": "22:00", "closed": false}, "wednesday": {"open": "06:00", "close": "22:00", "closed": false}, "thursday": {"open": "06:00", "close": "22:00", "closed": false}, "friday": {"open": "06:00", "close": "22:00", "closed": false}, "saturday": {"open": "07:00", "close": "23:00", "closed": false}, "sunday": {"open": "07:00", "close": "21:00", "closed": false}}', 'Business hours'),
('max_tables', '20', 'Maximum number of tables');

-- Insert default tax rate
INSERT INTO tax_rates (name, rate, is_active) VALUES ('Default Sales Tax', 0.0825, true);