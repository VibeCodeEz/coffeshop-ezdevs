# Menu Item Deletion Solution

## Problem Description

The original error occurred when attempting to delete a menu item that was referenced in existing orders:

```
DELETE request → 409 (Conflict) response
Supabase error code 23503: foreign-key constraint violation
Message: menu item cannot be deleted because it is still referenced in order_items table
Constraint: order_items_menu_item_id_fkey
```

## Root Cause

The database schema uses `ON DELETE RESTRICT` for the foreign key relationship between `order_items` and `menu_items`:

```sql
CREATE TABLE order_items (
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    -- ...
);
```

This prevents deletion of menu items that appear in order history, which is correct behavior for data integrity.

## Solution Overview

The solution implements a **smart deletion system** that:

1. **Checks order history** before attempting deletion
2. **Offers appropriate deletion options** based on the item's usage
3. **Provides clear user feedback** about why deletion isn't possible
4. **Implements soft deletion** for items with order history
5. **Maintains data integrity** while allowing menu management

## Implementation Details

### 1. Order History Check Function

```typescript
const checkOrderHistory = async (itemId: string): Promise<{ hasOrders: boolean; orderCount: number }> => {
  const { data, error } = await supabase
    .from('order_items')
    .select('id')
    .eq('menu_item_id', itemId);

  return { 
    hasOrders: data && data.length > 0, 
    orderCount: data?.length || 0 
  };
};
```

### 2. Smart Delete Handler

The `handleDelete` function now:

```typescript
const handleDelete = async (item: MenuItemDB) => {
  // 1. Check order history first
  const { hasOrders, orderCount } = await checkOrderHistory(item.id);

  if (hasOrders) {
    // 2. Offer soft delete for items with orders
    const userChoice = window.confirm(
      `⚠️ "${item.name}" cannot be deleted because it appears in ${orderCount} order(s).\n\n` +
      `Choose an option:\n` +
      `• OK: Mark as unavailable (soft delete) - keeps order history\n` +
      `• Cancel: Keep item active`
    );

    if (userChoice) {
      await handleSoftDelete(item);
    }
  } else {
    // 3. Allow hard delete for items without orders
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${item.name}"?\n\n` +
      `This item has no order history and will be completely removed.`
    );

    if (confirmDelete) {
      // Perform hard delete
      await supabase.from('menu_items').delete().eq('id', item.id);
    }
  }
};
```

### 3. Soft Delete Implementation

```typescript
const handleSoftDelete = async (item: MenuItemDB) => {
  await supabase
    .from('menu_items')
    .update({ 
      is_available: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', item.id);

  alert(`"${item.name}" has been marked as unavailable and hidden from the menu.`);
};
```

### 4. Restore Functionality

```typescript
const handleRestore = async (item: MenuItemDB) => {
  await supabase
    .from('menu_items')
    .update({ 
      is_available: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', item.id);

  alert(`"${item.name}" has been restored and is now available on the menu.`);
};
```

### 5. UI Updates

#### Visual Indicators for Unavailable Items

```tsx
<div className={`menu-item-card ${!item.is_available ? 'unavailable' : ''}`}>
  {!item.is_available && (
    <div className="unavailable-badge">
      <X size={12} />
      Unavailable
    </div>
  )}
  
  <div className="item-image">
    {/* ... */}
    {!item.is_available && <div className="image-overlay"></div>}
  </div>
</div>
```

#### Dynamic Action Buttons

```tsx
{item.is_available ? (
  <button className="delete-btn" onClick={() => handleDelete(item)}>
    <Trash2 size={16} />
  </button>
) : (
  <button className="restore-btn" onClick={() => handleRestore(item)}>
    <Plus size={16} />
  </button>
)}
```

### 6. CSS Styling for Unavailable Items

```css
.menu-item-card.unavailable {
  opacity: 0.6;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
}

.unavailable-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ef4444;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  z-index: 2;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
}
```

## Database Functions (Optional Enhancement)

For better performance and consistency, database functions are provided:

```sql
-- Check order history
CREATE OR REPLACE FUNCTION check_menu_item_order_history(item_id UUID)
RETURNS TABLE(has_orders BOOLEAN, order_count INTEGER);

-- Safe deletion
CREATE OR REPLACE FUNCTION safe_delete_menu_item(item_id UUID)
RETURNS TABLE(success BOOLEAN, action_taken TEXT, message TEXT);

-- Restore item
CREATE OR REPLACE FUNCTION restore_menu_item(item_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT);
```

## Error Handling

The solution includes comprehensive error handling:

```typescript
try {
  // Deletion logic
} catch (error: any) {
  // Handle specific foreign key constraint error
  if (error.code === '23503' || error.message?.includes('foreign key')) {
    alert(`Cannot delete "${item.name}" - it's referenced in existing orders.\n\n` +
          `The item will be marked as unavailable instead.`);
    await handleSoftDelete(item);
  } else {
    alert(`Error deleting item: ${error.message}`);
  }
}
```

## Benefits

1. **Data Integrity**: Order history is preserved
2. **User Experience**: Clear feedback and appropriate options
3. **Flexibility**: Items can be restored if needed
4. **Safety**: No accidental data loss
5. **Compliance**: Maintains audit trail for business records

## Testing

Run the test script to verify functionality:

```bash
# Test the implementation
npm run test:deletion
```

## Migration

To apply this solution:

1. Update `MenuManagement.tsx` with the new deletion logic
2. Update `MenuManagement.css` with unavailable item styles
3. (Optional) Run the database migration for enhanced functions
4. Test with existing menu items that have order history

## Future Enhancements

- Batch operations for multiple items
- Audit log for deletion/restoration actions
- Advanced filtering (show/hide unavailable items)
- Scheduled cleanup of old unavailable items
- Integration with inventory management