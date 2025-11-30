import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CartItem {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  special_instructions?: string;
  total_price: number;
}

interface UseSessionCartReturn {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  cartId: string | null;
  loading: boolean;
  addItem: (product: any, quantity?: number, size?: string, instructions?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  convertToOrder: (customerInfo: any) => Promise<string | null>;
}

const useSessionCart = (): UseSessionCartReturn => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize cart on mount
  useEffect(() => {
    initializeCart();
  }, [user]);

  const initializeCart = async () => {
    try {
      setLoading(true);
      
      let sessionId = localStorage.getItem('session_cart_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('session_cart_id', sessionId);
      }

      // Try to find existing cart with direct query (since RLS is disabled)
      let cart = null;
      
      try {
        let query = supabase
          .from('session_carts')
          .select('*');

        if (user) {
          // For logged in users, look for carts with their user_id
          query = query.eq('user_id', user.id);
        } else {
          // For anonymous users, look for carts with the session_id
          query = query.eq('session_id', sessionId);
        }

        const { data: existingCarts } = await query
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingCarts && existingCarts.length > 0) {
          cart = existingCarts[0];
        }
      } catch (error) {
        console.log('Error getting existing cart:', error);
      }

      // Create new cart if none exists
      if (!cart) {
        try {
          const { data: newCart, error } = await supabase
            .from('session_carts')
            .insert({
              user_id: user?.id || null,
              session_id: sessionId, // Always provide session_id since it's NOT NULL
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
            .select('*')
            .single();

          if (!error && newCart) {
            cart = newCart;
          } else if (error) {
            console.error('Error creating cart:', error);
          }
        } catch (error) {
          console.error('Error creating cart:', error);
        }
      }

      if (cart) {
        setCartId(cart.id);
        await loadCartItems(cart.id);
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartItems = async (cartId: string) => {
    try {
      // Direct query since RLS is disabled
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          menu_item_id,
          quantity,
          unit_price,
          total_price,
          special_instructions,
          menu_items (
            name,
            image_url
          )
        `)
        .eq('cart_id', cartId)
        .order('created_at');

      if (error) {
        console.error('Error loading cart items:', error);
        return;
      }

      const formattedItems: CartItem[] = (cartItems || []).map((item: any) => ({
        id: item.id,
        menu_item_id: item.menu_item_id,
        name: item.menu_items?.name || 'Unknown Item',
        price: item.unit_price,
        quantity: item.quantity,
        image: item.menu_items?.image_url || '☕',
        total_price: item.total_price,
        special_instructions: item.special_instructions,
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
  };

  const addItem = async (product: any, quantity: number = 1, size?: string, instructions?: string) => {
    try {
      if (!cartId) {
        await initializeCart();
        return;
      }

      // Handle both old and new schema field names for price
      const basePrice = product.base_price || product.price || 0;
      const unitPrice = size ? 
        product.sizes?.find((s: any) => s.name === size)?.price || basePrice : 
        basePrice;

      // Validate that we have a valid unit price
      if (!unitPrice || unitPrice <= 0) {
        console.error('Invalid unit price for product:', product);
        throw new Error('Product price is missing or invalid');
      }

      // Check if item already exists
      const existingItem = items.find(item => 
        item.menu_item_id === product.id && item.size === size
      );

      if (existingItem) {
        // Update existing item
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        // Add new item with direct insert
        try {
          const { error } = await supabase
            .from('cart_items')
            .insert({
              cart_id: cartId,
              menu_item_id: product.id,
              quantity,
              unit_price: unitPrice,
              total_price: unitPrice * quantity,
              special_instructions: instructions
            });

          if (error) {
            console.error('Error adding item:', error);
            return;
          }

          // Reload cart items
          await loadCartItems(cartId);
        } catch (error) {
          console.error('Error adding item to cart:', error);
        }
      }

      // Show success notification
      const itemName = size ? `${product.name} (${size})` : product.name;
      console.log(`✅ ${itemName} added to cart!`);
      
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }

      const item = items.find(i => i.id === itemId);
      if (!item) return;

      // Direct update since RLS is disabled
      const { error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          total_price: item.price * quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating quantity:', error);
        return;
      }

      // Update local state
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? { ...item, quantity, total_price: item.price * quantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      // Direct delete since RLS is disabled
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error removing item:', error);
        return;
      }

      // Update local state
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      if (!cartId) return;

      // Direct delete since RLS is disabled
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) {
        console.error('Error clearing cart:', error);
        return;
      }

      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const convertToOrder = async (customerInfo: any): Promise<string | null> => {
    try {
      if (!cartId || items.length === 0) return null;

      // Create order
      const orderData = {
        customer_id: user?.id || null,
        customer_name: customerInfo.name || 'Guest Customer',
        customer_email: customerInfo.email || user?.email || null,
        customer_phone: customerInfo.phone || null,
        order_type: customerInfo.orderType || 'takeaway',
        status: 'pending',
        subtotal: totalPrice,
        tax_amount: totalPrice * 0.08, // 8% tax
        total_amount: totalPrice * 1.08,
        table_number: customerInfo.tableNumber || null,
        notes: customerInfo.notes || null
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // Convert cart items to order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        menu_item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total_price,
        special_instructions: item.special_instructions
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await clearCart();
      
      // Remove cart if anonymous
      if (!user) {
        await supabase
          .from('session_carts')
          .delete()
          .eq('id', cartId);
        
        localStorage.removeItem('session_cart_id');
        setCartId(null);
      }

      return order.order_number;
    } catch (error) {
      console.error('Error converting cart to order:', error);
      throw error;
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.total_price, 0);

  return {
    items,
    totalItems,
    totalPrice,
    cartId,
    loading,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    convertToOrder
  };
};

export default useSessionCart;