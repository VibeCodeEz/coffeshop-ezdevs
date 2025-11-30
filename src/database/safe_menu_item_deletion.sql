-- Safe Menu Item Deletion Functions
-- This file provides database functions to handle menu item deletion safely

-- Function to check if a menu item has order history
CREATE OR REPLACE FUNCTION check_menu_item_order_history(item_id UUID)
RETURNS TABLE(has_orders BOOLEAN, order_count INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM order_items WHERE menu_item_id = item_id) as has_orders,
        (SELECT COUNT(*)::INTEGER FROM order_items WHERE menu_item_id = item_id) as order_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete a menu item (soft delete if has orders, hard delete if not)
CREATE OR REPLACE FUNCTION safe_delete_menu_item(item_id UUID)
RETURNS TABLE(
    success BOOLEAN, 
    action_taken TEXT, 
    message TEXT
) AS $$
DECLARE
    has_orders BOOLEAN;
    order_count INTEGER;
    item_name TEXT;
BEGIN
    -- Get item name for logging
    SELECT name INTO item_name FROM menu_items WHERE id = item_id;
    
    IF item_name IS NULL THEN
        RETURN QUERY SELECT FALSE, 'error', 'Menu item not found';
        RETURN;
    END IF;
    
    -- Check order history
    SELECT h.has_orders, h.order_count INTO has_orders, order_count
    FROM check_menu_item_order_history(item_id) h;
    
    IF has_orders THEN
        -- Soft delete: mark as unavailable
        UPDATE menu_items 
        SET is_available = FALSE, updated_at = NOW()
        WHERE id = item_id;
        
        RETURN QUERY SELECT 
            TRUE, 
            'soft_delete', 
            format('Item "%s" marked as unavailable (found in %s orders)', item_name, order_count);
    ELSE
        -- Hard delete: completely remove
        DELETE FROM menu_items WHERE id = item_id;
        
        RETURN QUERY SELECT 
            TRUE, 
            'hard_delete', 
            format('Item "%s" permanently deleted', item_name);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a soft-deleted menu item
CREATE OR REPLACE FUNCTION restore_menu_item(item_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    item_name TEXT;
BEGIN
    -- Get item name
    SELECT name INTO item_name FROM menu_items WHERE id = item_id;
    
    IF item_name IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Menu item not found';
        RETURN;
    END IF;
    
    -- Restore item
    UPDATE menu_items 
    SET is_available = TRUE, updated_at = NOW()
    WHERE id = item_id;
    
    RETURN QUERY SELECT 
        TRUE, 
        format('Item "%s" restored and marked as available', item_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_menu_item_order_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_delete_menu_item(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_menu_item(UUID) TO authenticated;

-- Create RLS policies for the functions
CREATE POLICY "Admin can use deletion functions" ON menu_items FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add helpful view for menu management
CREATE OR REPLACE VIEW menu_items_with_order_count AS
SELECT 
    mi.*,
    COALESCE(oi.order_count, 0) as order_count,
    CASE WHEN COALESCE(oi.order_count, 0) > 0 THEN TRUE ELSE FALSE END as has_orders
FROM menu_items mi
LEFT JOIN (
    SELECT 
        menu_item_id, 
        COUNT(*) as order_count
    FROM order_items 
    GROUP BY menu_item_id
) oi ON mi.id = oi.menu_item_id
ORDER BY mi.created_at DESC;

-- Grant select permission on the view
GRANT SELECT ON menu_items_with_order_count TO authenticated;