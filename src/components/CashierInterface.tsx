import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, Calculator, Search, X } from 'lucide-react';
import { supabase, testConnection, MenuItemDB, MenuItemSize } from '../lib/supabase';
import SizeSelector from './SizeSelector';
import './CashierInterface.css';

// MenuItemDB is now imported from supabase.ts

interface CartItem {
  menu_item: MenuItemDB;
  quantity: number;
  size?: string;
  size_price?: number;
}

const CashierInterface: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItemDB[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'gcash'>('cash');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemDB | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);

  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'hot-coffee', label: 'Hot Coffee' },
    { value: 'iced-coffee', label: 'Iced Coffee' },
    { value: 'tea', label: 'Tea' },
    { value: 'frappe', label: 'Frappe' },
    { value: 'pastry', label: 'Pastry' },
    { value: 'snacks', label: 'Snacks' }
  ];

  useEffect(() => {
    fetchMenuItems();

    // Set up real-time subscription for menu items
    const subscription = supabase
      .channel('cashier_menu_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'menu_items'
      }, (payload) => {
        console.log('🔄 Cashier: Menu item change detected:', payload);
        fetchMenuItems(); // Refresh menu items on any change
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMenuItems = async (retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      console.log('🍽️ Cashier: Fetching menu items from Supabase...');
      
      // Test connection first if this is the first try
      if (retryCount === 0) {
        const isConnected = await testConnection();
        if (!isConnected) {
          console.warn('⚠️ Cashier: Connection test failed, keeping current items');
          return;
        }
      }
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');

      if (error) {
        console.warn('⚠️ Supabase fetch error:', error);
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => fetchMenuItems(retryCount + 1), 2000);
          return;
        }
        console.log('⚠️ Cashier: Max retries reached, keeping current menu items');
        return;
      }

      // Always update state with database data, even if empty
      console.log('✅ Cashier: Loaded menu items from Supabase:', data?.length || 0, 'items');
      setMenuItems(data || []);
      
      if (data && data.length === 0) {
        console.log('📝 No menu items in database - please add items in Menu Management first');
      }
    } catch (error: any) {
      console.error('❌ Cashier: Fetch failed:', error);
      
      if (error.message?.includes('timeout') && retryCount < maxRetries) {
        console.log(`🔄 Timeout, retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => fetchMenuItems(retryCount + 1), 2000);
        return;
      }
      
      console.log('⚠️ Cashier: Keeping current menu items due to network error');
    }
  };

  const handleMenuItemClick = (menuItem: MenuItemDB) => {
    if (menuItem.sizes && menuItem.sizes.length > 0) {
      // Show size selection modal
      setSelectedMenuItem(menuItem);
      setSelectedSize(null);
      setSelectedPrice(menuItem.base_price);
      setShowSizeModal(true);
    } else {
      // Add directly to cart with base price
      addToCart(menuItem, undefined, menuItem.base_price);
    }
  };

  const addToCart = (menuItem: MenuItemDB, size?: string, price?: number) => {
    const itemPrice = price || menuItem.base_price;
    const cartKey = `${menuItem.id}_${size || 'no-size'}`;
    
    setCart(prev => {
      const existingItem = prev.find(item => 
        item.menu_item.id === menuItem.id && item.size === size
      );
      
      if (existingItem) {
        return prev.map(item =>
          item.menu_item.id === menuItem.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { 
          menu_item: menuItem, 
          quantity: 1, 
          size: size,
          size_price: itemPrice
        }];
      }
    });
  };

  const handleSizeSelection = (size: string, price: number) => {
    setSelectedSize(size);
    setSelectedPrice(price);
  };

  const confirmSizeAndAddToCart = () => {
    if (selectedMenuItem) {
      addToCart(selectedMenuItem, selectedSize || undefined, selectedPrice);
      setShowSizeModal(false);
      setSelectedMenuItem(null);
      setSelectedSize(null);
      setSelectedPrice(0);
    }
  };

  const closeSizeModal = () => {
    setShowSizeModal(false);
    setSelectedMenuItem(null);
    setSelectedSize(null);
    setSelectedPrice(0);
  };

  const updateQuantity = (menuItemId: string, size: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => 
        !(item.menu_item.id === menuItemId && item.size === size)
      ));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.menu_item.id === menuItemId && item.size === size
            ? { ...item, quantity } 
            : item
        )
      );
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.size_price || item.menu_item.base_price;
      return sum + (itemPrice * item.quantity);
    }, 0);
  };

  const generateOrderNumber = (): string => {
    return Math.floor(100 + Math.random() * 900).toString();
  };

  const processOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    setProcessing(true);
    try {
      const orderNumber = generateOrderNumber();
      const totalAmount = getTotalAmount();

      // Create order data
      const orderData = {
        order_number: orderNumber,
        customer_name: customerEmail || 'Walk-in Customer', // Add required customer_name field
        customer_email: customerEmail || null,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: 'completed' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💳 Processing order:', orderData);

      // Try to save order to database
      try {
        const { data: savedOrder, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (error) throw error;

        if (savedOrder) {
          const orderId = savedOrder.id;
          
          console.log('✅ Order saved to database:', orderId);

          // Save order items to database
          if (orderId) {
            const orderItems = cart.map(item => ({
              order_id: orderId,
              menu_item_id: item.menu_item.id,
              menu_item_name: item.menu_item.name,
              quantity: item.quantity,
              unit_price: item.size_price || item.menu_item.base_price,
              total_price: (item.size_price || item.menu_item.base_price) * item.quantity,
              special_instructions: item.size ? `Size: ${item.size}` : null
            }));

            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(orderItems);

            if (!itemsError) {
              console.log('✅ Order items saved to database');
            }
          }

          // Show receipt with database order number
          showReceipt(savedOrder.order_number, savedOrder.total_amount);
          
          // Trigger event to refresh order history for database orders too
          window.dispatchEvent(new CustomEvent('newOrderCreated'));
        } else {
          throw new Error('Database save failed');
        }
      } catch (error) {
        console.warn('⚠️ Database save failed, processing locally:', error);
        
        // Fallback: process locally
        const localOrderData = {
          ...orderData,
          id: Date.now()
        };
        
        // Save to localStorage for order history
        const existingOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
        const orderWithItems = {
          ...localOrderData,
          order_items: cart.map(item => ({
            id: Math.random(),
            quantity: item.quantity,
            unit_price: item.size_price || item.menu_item.base_price,
            total_price: (item.size_price || item.menu_item.base_price) * item.quantity,
            special_instructions: item.size ? `Size: ${item.size}` : null,
            menu_item: {
              name: item.menu_item.name,
              icon: '☕' // Default icon since schema doesn't have icon field
            }
          }))
        };
        
        existingOrders.unshift(orderWithItems);
        localStorage.setItem('local_orders', JSON.stringify(existingOrders));
        
        console.log('✅ Order saved locally for order history');
        showReceipt(localOrderData.order_number, localOrderData.total_amount);
      }

      // Trigger event to refresh order history
      window.dispatchEvent(new CustomEvent('newOrderCreated'));
      
      // Clear cart
      setCart([]);
      setCustomerEmail('');
      
      // Show success message
      alert('Order completed successfully! Check Order History tab to see your order.');
    } catch (error: any) {
      console.error('Error processing order:', error);
      alert('Error processing order: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const showReceipt = (orderNumber: string, totalAmount: number) => {
    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    if (receiptWindow) {
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Order Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #8b4513; padding-bottom: 10px; }
              .order-number { font-size: 24px; color: #8b4513; font-weight: bold; margin: 20px 0; }
              .items { margin: 20px 0; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { border-top: 2px solid #8b4513; padding-top: 10px; font-weight: bold; font-size: 18px; }
              .footer { text-align: center; margin-top: 20px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>☕ EzDevs Coffee</h1>
              <p>Thank you for your order!</p>
            </div>
            <div class="order-number">Order #${orderNumber}</div>
            <div class="items">
              ${cart.map(item => `
                <div class="item">
                  <span>${item.menu_item.name}${item.size ? ` (${item.size})` : ''} x ${item.quantity}</span>
                  <span>₱${((item.size_price || item.menu_item.base_price) * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="total">
              <div class="item">
                <span>Total:</span>
                <span>₱${totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <div class="footer">
              <p>Payment: ${paymentMethod.toUpperCase()}</p>
              <p>Date: ${new Date().toLocaleString()}</p>
              <p>Please present this receipt when collecting your order</p>
            </div>
          </body>
        </html>
      `);
      receiptWindow.document.close();
      receiptWindow.print();
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all'; // Since we don't have category names, show all for now
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && item.is_available;
  });

  return (
    <div className="cashier-interface">
      <div className="cashier-header">
        <h2>Cashier / Point of Sale</h2>
        <p>Create orders for walk-in customers</p>
      </div>

      <div className="cashier-layout">
        <div className="menu-section">
          <div className="menu-controls">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="category-filters">
              {categories.map(category => (
                <button
                  key={category.value}
                  className={`category-btn ${selectedCategory === category.value ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-items-grid">
            {filteredMenuItems.map(item => (
              <div key={item.id} className="menu-item-tile" onClick={() => handleMenuItemClick(item)}>
                <div className="item-image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <span className="item-icon">☕</span>
                  )}
                </div>
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <div className="pricing-info">
                    {item.sizes && item.sizes.length > 0 ? (
                      <div className="size-pricing">
                        <p className="base-price">From ₱{item.base_price}</p>
                        <p className="size-count">{item.sizes.length} sizes</p>
                      </div>
                    ) : (
                      <p className="item-price">₱{item.base_price}</p>
                    )}
                  </div>
                </div>
                {item.is_featured && (
                  <div className="popular-indicator">★</div>
                )}
                {item.sizes && item.sizes.length > 0 && (
                  <div className="size-indicator">📏</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="order-section">
          <div className="cart-header">
            <ShoppingCart size={20} />
            <h3>Current Order</h3>
          </div>

          <div className="customer-info">
            <label htmlFor="customer-email">Customer Email (Optional)</label>
            <input
              type="email"
              id="customer-email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>No items in cart</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={`${item.menu_item.id}_${item.size || 'no-size'}_${index}`} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.menu_item.name}</h4>
                    {item.size && <p className="item-size">{item.size}</p>}
                    <p>₱{(item.size_price || item.menu_item.base_price).toFixed(2)} each</p>
                  </div>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.menu_item.id, item.size, item.quantity - 1)}>
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menu_item.id, item.size, item.quantity + 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="item-total">
                    ₱{((item.size_price || item.menu_item.base_price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="payment-section">
            <div className="payment-method">
              <label>Payment Method:</label>
              <div className="payment-options">
                {[
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'gcash', label: 'GCash' }
                ].map(method => (
                  <button
                    key={method.value}
                    className={`payment-btn ${paymentMethod === method.value ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(method.value as any)}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="order-total">
              <div className="total-line">
                <span>Total Items: {cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="total-line grand-total">
                <span>Grand Total: ₱{getTotalAmount().toFixed(2)}</span>
              </div>
            </div>

            <button
              className="process-order-btn"
              onClick={processOrder}
              disabled={cart.length === 0 || processing}
            >
              {processing ? (
                'Processing...'
              ) : (
                <>
                  <Calculator size={20} />
                  Process Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Size Selection Modal */}
      {showSizeModal && selectedMenuItem && (
        <div className="size-modal-overlay" onClick={closeSizeModal}>
          <div className="size-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Size for {selectedMenuItem.name}</h3>
              <button className="close-modal-btn" onClick={closeSizeModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <SizeSelector
                item={selectedMenuItem}
                selectedSize={selectedSize}
                onSizeChange={handleSizeSelection}
              />
              
              <div className="modal-summary">
                <p>Selected: {selectedSize || 'No size selected'}</p>
                <p className="modal-price">Price: ₱{selectedPrice.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={closeSizeModal}
              >
                Cancel
              </button>
              <button 
                className="add-to-cart-btn"
                onClick={confirmSizeAndAddToCart}
                disabled={!selectedSize}
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierInterface;