import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface UseCartReturn {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  currentOrderId: number | null;
  addItem: (product: any, quantity?: number, size?: string) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  finalizeOrder: () => Promise<boolean>;
  loadDraftOrder: () => Promise<void>;
}

const useCart = (): UseCartReturn => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);

  // Load cart from localStorage and draft order on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('coffee-cart');
    const savedOrderId = localStorage.getItem('current-order-id');
    
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
    
    if (savedOrderId) {
      setCurrentOrderId(parseInt(savedOrderId));
    }
    
    // Load draft order from database
    loadDraftOrder();
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('coffee-cart', JSON.stringify(items));
  }, [items]);

  // Save current order ID to localStorage
  useEffect(() => {
    if (currentOrderId) {
      localStorage.setItem('current-order-id', currentOrderId.toString());
    } else {
      localStorage.removeItem('current-order-id');
    }
  }, [currentOrderId]);

  // Load draft order from database
  const loadDraftOrder = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Find existing draft order
      const { data: draftOrder } = await supabase
        .from('orders')
        .select(`
          id,
          order_items (
            id,
            quantity,
            size,
            unit_price,
            menu_items (
              id,
              name,
              image_url,
              icon
            )
          )
        `)
        .eq('customer_id', session.user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (draftOrder) {
        setCurrentOrderId(draftOrder.id);
        
        // Convert database order items to cart items
        const cartItems: CartItem[] = draftOrder.order_items.map((orderItem: any) => ({
          id: orderItem.menu_items.id,
          name: orderItem.menu_items.name,
          price: orderItem.unit_price,
          quantity: orderItem.quantity,
          image: orderItem.menu_items.image_url || '☕',
          size: orderItem.size
        }));
        
        setItems(cartItems);
        console.log('✅ Loaded draft order:', draftOrder.id);
      }
    } catch (error) {
      console.error('Failed to load draft order:', error);
    }
  };

  // Create or get current draft order
  const getCurrentOrder = async (): Promise<number | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      // If we have a current order, return it
      if (currentOrderId) {
        return currentOrderId;
      }

      // First, check if there's an existing draft order
      const { data: existingDraft } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', session.user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingDraft) {
        setCurrentOrderId(existingDraft.id);
        console.log('✅ Found existing draft order:', existingDraft.id);
        return existingDraft.id;
      }

      // Create new draft order with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { data: newOrder, error } = await supabase
            .from('orders')
            .insert({
              customer_id: session.user.id,
              status: 'draft',
              order_number: `DRAFT-${Date.now()}`,
              total_amount: 0,
              customer_email: session.user.email || '',
              customer_name: session.user.user_metadata?.full_name || 'Customer'
            })
            .select('id, order_number')
            .single();

          if (error) throw error;

          setCurrentOrderId(newOrder.id);
          console.log('✅ Created new draft order:', newOrder.id, 'with order number:', newOrder.order_number);
          return newOrder.id;
        } catch (insertError: any) {
          retryCount++;
          console.warn(`Attempt ${retryCount} failed:`, insertError.message);
          
          if (insertError.code === '23505' && retryCount < maxRetries) {
            // Duplicate key error, wait and retry
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
            continue;
          } else {
            throw insertError;
          }
        }
      }

      throw new Error('Failed to create order after multiple attempts');
    } catch (error) {
      console.error('Failed to get current order:', error);
      return null;
    }
  };

  // Add item to database order
  const addItemToOrder = async (orderId: number, product: any, quantity: number, size?: string) => {
    try {
      const unitPrice = size ? 
        product.sizes?.find((s: any) => s.id === size)?.price || product.price : 
        parseFloat(product.price.replace('₱', ''));

      const { error } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          menu_item_id: product.id,
          menu_item_name: product.name, // Add the missing menu_item_name field
          quantity,
          unit_price: unitPrice,
          total_price: unitPrice * quantity,
          special_instructions: size ? `Size: ${size}` : null
        });

      if (error) throw error;
      console.log('✅ Added item to order:', product.name);
    } catch (error) {
      console.error('Failed to add item to order:', error);
      throw error;
    }
  };

  const addItem = async (product: any, quantity: number = 1, size?: string, requireAuth: boolean = false) => {
    console.log('🛒 Adding item to cart:', product.name, 'Quantity:', quantity);
    
    // For session-based cart, we don't require authentication
    // Users can add items to cart and then login/signup during checkout
    
    let sessionId = localStorage.getItem('session_cart_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('session_cart_id', sessionId);
    }

    console.log('✅ Using session cart:', sessionId);

    try {
      // Get or create order in database
      const orderId = await getCurrentOrder();
      if (orderId) {
        await addItemToOrder(orderId, product, quantity, size);
      }

      setItems(currentItems => {
        const existingItemIndex = currentItems.findIndex(
          item => item.id === product.id && item.size === size
        );

        if (existingItemIndex >= 0) {
          // Item exists, update quantity
          console.log('📦 Updating existing item quantity');
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].quantity += quantity;
          return updatedItems;
        } else {
          // New item, add to cart
          console.log('🆕 Adding new item to cart');
          const newItem: CartItem = {
            id: product.id,
            name: product.name,
            price: size ? product.sizes?.find((s: any) => s.id === size)?.price || product.price : parseFloat(product.price.replace('₱', '')),
            quantity,
            image: product.image || '☕',
            size
          };
          return [...currentItems, newItem];
        }
      });
      
      console.log('🎉 Item successfully added to cart and order!');
      
      // Show success feedback
      const itemName = size ? `${product.name} (${size})` : product.name;
      alert(`✅ ${itemName} added to cart!`);
      
    } catch (error) {
      console.error('❌ Error adding item to cart:', error);
      alert('Error adding item to cart. Please try again.');
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setCurrentOrderId(null);
  };

  // Finalize the current order (convert from draft to pending)
  const finalizeOrder = async (): Promise<boolean> => {
    try {
      if (!currentOrderId) {
        console.error('No current order to finalize');
        return false;
      }

      // Generate proper order number and update status to pending
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const finalOrderNumber = orderNumberData || Math.floor(Math.random() * 900 + 100).toString().padStart(3, '0');
      
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'pending',
          order_number: finalOrderNumber,
          total_amount: totalPrice
        })
        .eq('id', currentOrderId)
        .select('order_number')
        .single();

      if (error) throw error;

      console.log('✅ Order finalized with order number:', data.order_number);
      
      // Clear current cart and order
      setItems([]);
      setCurrentOrderId(null);
      
      return true;
    } catch (error) {
      console.error('Failed to finalize order:', error);
      return false;
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    items,
    totalItems,
    totalPrice,
    currentOrderId,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    finalizeOrder,
    loadDraftOrder
  };
};

export default useCart;