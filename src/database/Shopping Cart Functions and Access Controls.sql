-- Debug and Fix Cart Functions
-- Let's check and recreate the cart functions with better error handling

-- First, let's see what functions exist
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosrc as source
FROM pg_proc 
WHERE proname IN ('create_cart', 'get_user_cart', 'get_cart_items', 'add_cart_item', 'update_cart_item', 'remove_cart_item');

-- Drop and recreate the cart functions with better error handling
DROP FUNCTION IF EXISTS create_cart(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_cart(UUID, TEXT);
DROP FUNCTION IF EXISTS get_cart_items(UUID);
DROP FUNCTION IF EXISTS add_cart_item(UUID, UUID, INTEGER, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS update_cart_item(UUID, INTEGER, DECIMAL);
DROP FUNCTION IF EXISTS remove_cart_item(UUID);

-- Simple cart creation function
CREATE OR REPLACE FUNCTION create_cart(user_id_param UUID DEFAULT NULL, session_id_param TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_cart_id UUID;
    expires_time TIMESTAMPTZ;
BEGIN
    -- Set expiration time
    expires_time := NOW() + INTERVAL '24 hours';
    
    -- Validate inputs
    IF user_id_param IS NULL AND session_id_param IS NULL THEN
        RAISE EXCEPTION 'Either user_id or session_id must be provided';
    END IF;
    
    -- Insert new cart
    INSERT INTO session_carts (user_id, session_id, expires_at, created_at, updated_at)
    VALUES (
        user_id_param,
        session_id_param,
        expires_time,
        NOW(),
        NOW()
    )
    RETURNING id INTO new_cart_id;
    
    RETURN new_cart_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating cart: %', SQLERRM;
END;
$$;

-- Simple function to get user cart
CREATE OR REPLACE FUNCTION get_user_cart(user_id_param UUID DEFAULT NULL, session_id_param TEXT DEFAULT NULL)
RETURNS TABLE (
    cart_id UUID,
    user_id UUID,
    session_id TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate inputs
    IF user_id_param IS NULL AND session_id_param IS NULL THEN
        RAISE EXCEPTION 'Either user_id or session_id must be provided';
    END IF;
    
    RETURN QUERY
    SELECT 
        sc.id as cart_id,
        sc.user_id,
        sc.session_id,
        sc.created_at,
        sc.expires_at
    FROM session_carts sc
    WHERE 
        (user_id_param IS NOT NULL AND sc.user_id = user_id_param) OR
        (session_id_param IS NOT NULL AND sc.session_id = session_id_param)
    ORDER BY sc.created_at DESC
    LIMIT 1;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error getting cart: %', SQLERRM;
END;
$$;

-- Simple function to get cart items
CREATE OR REPLACE FUNCTION get_cart_items(cart_id_param UUID)
RETURNS TABLE (
    id UUID,
    menu_item_id UUID,
    quantity INTEGER,
    unit_price DECIMAL,
    total_price DECIMAL,
    special_instructions TEXT,
    menu_item_name TEXT,
    menu_item_image TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci.menu_item_id,
        ci.quantity,
        ci.unit_price,
        ci.total_price,
        ci.special_instructions,
        COALESCE(mi.name, 'Unknown Item') as menu_item_name,
        COALESCE(mi.image_url, '☕') as menu_item_image
    FROM cart_items ci
    LEFT JOIN menu_items mi ON ci.menu_item_id = mi.id
    WHERE ci.cart_id = cart_id_param
    ORDER BY ci.created_at;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error getting cart items: %', SQLERRM;
END;
$$;

-- Function to add item to cart
CREATE OR REPLACE FUNCTION add_cart_item(
    cart_id_param UUID,
    menu_item_id_param UUID,
    quantity_param INTEGER,
    unit_price_param DECIMAL,
    instructions_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_item_id UUID;
BEGIN
    -- Validate inputs
    IF quantity_param <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;
    
    IF unit_price_param < 0 THEN
        RAISE EXCEPTION 'Unit price must be positive';
    END IF;
    
    INSERT INTO cart_items (
        cart_id,
        menu_item_id,
        quantity,
        unit_price,
        total_price,
        special_instructions,
        created_at,
        updated_at
    )
    VALUES (
        cart_id_param,
        menu_item_id_param,
        quantity_param,
        unit_price_param,
        unit_price_param * quantity_param,
        instructions_param,
        NOW(),
        NOW()
    )
    RETURNING id INTO new_item_id;
    
    RETURN new_item_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error adding cart item: %', SQLERRM;
END;
$$;

-- Function to update cart item
CREATE OR REPLACE FUNCTION update_cart_item(
    item_id_param UUID,
    quantity_param INTEGER,
    unit_price_param DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate inputs
    IF quantity_param <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;
    
    UPDATE cart_items 
    SET 
        quantity = quantity_param,
        total_price = unit_price_param * quantity_param,
        updated_at = NOW()
    WHERE id = item_id_param;
    
    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating cart item: %', SQLERRM;
END;
$$;

-- Function to remove cart item
CREATE OR REPLACE FUNCTION remove_cart_item(item_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM cart_items WHERE id = item_id_param;
    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error removing cart item: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_cart(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_cart(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_cart_items(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_cart_item(UUID, UUID, INTEGER, DECIMAL, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_cart_item(UUID, INTEGER, DECIMAL) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION remove_cart_item(UUID) TO authenticated, anon;

-- Test the create_cart function
SELECT create_cart(NULL, 'test_session_123') as test_cart_id;