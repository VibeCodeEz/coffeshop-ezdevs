-- Add sizes column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN sizes JSONB;

-- Add index for better performance on sizes queries
CREATE INDEX IF NOT EXISTS idx_menu_items_sizes ON menu_items USING GIN (sizes);

-- Add comment to document the column
COMMENT ON COLUMN menu_items.sizes IS 'JSON array of size options with pricing: [{"size": "Small", "price": 3.99, "available": true}, ...]';

-- Example update to show the structure (optional, just for reference)
-- UPDATE menu_items SET sizes = '[
--   {"size": "Small", "price": 3.99, "available": true},
--   {"size": "Medium", "price": 4.74, "available": true}, 
--   {"size": "Large", "price": 5.49, "available": true}
-- ]'::jsonb WHERE id = 1;