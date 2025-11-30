import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Minus, ShoppingCart, User, Clock, Check, X } from 'lucide-react';
import './Cashier.css';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  category_name: string;
  is_available: boolean;
}

interface CartItem {
  id: string;
  menu_item: MenuItem;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  order_type: 'dine-in' | 'takeaway' | 'delivery';
  status: string;
  total_amount: number;
  table_number?: number;
  created_at: string;
  items: CartItem[];
}

const Cashier: React.FC = () => {
  const { user, isAdminUser } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'queue'>('order');

  useEffect(() => {
    fetchMenuItems();
    fetchActiveOrders();
    
    // Set up real-time subscriptions
    const ordersSubscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchActiveOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          id,
          name,
          description,
          base_price,
          image_url,
          is_available,
          menu_categories (name)
        `)
        .eq('is_available', true);

      if (error) throw error;

      const formattedItems = data.map(item => ({
        ...item,
        category_name: item.menu_categories?.name || 'Other'
      }));

      setMenuItems(formattedItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          order_type,
          status,
          total_amount,
          table_number,
          created_at,
          order_items (
            id,
            menu_item_name,
            quantity,
            unit_price,
            total_price,
            special_instructions
          )
        `)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.menu_item.id === menuItem.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.menu_item.id === menuItem.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price
              }
            : item
        );
      } else {
        return [...prev, {
          id: `temp-${Date.now()}`,
          menu_item: menuItem,
          quantity: 1,
          unit_price: menuItem.base_price,
          total_price: menuItem.base_price
        }];
      }
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                quantity: newQuantity,
                total_price: newQuantity * item.unit_price
              }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setTableNumber('');
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.total_price, 0);
  };

  const processOrder = async () => {
    if (!customerName.trim() || cart.length === 0) {
      alert('Please enter customer name and add items to cart');
      return;
    }

    setLoading(true);
    try {
      // Create order
      const orderData = {
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        order_type: orderType,
        status: 'confirmed',
        total_amount: calculateTotal(),
        table_number: orderType === 'dine-in' && tableNumber ? parseInt(tableNumber) : null,
        cashier_id: user?.id
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item.id,
        menu_item_name: item.menu_item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        special_instructions: item.special_instructions || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      alert(`Order ${order.order_number} created successfully!`);
      clearCart();
      fetchActiveOrders();
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Error processing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          ...(newStatus === 'completed' && { completed_at: new Date().toISOString() })
        })
        .eq('id', orderId);

      if (error) throw error;
      fetchActiveOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || !isAdminUser) {
    return <div className="cashier-error">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="cashier-container">
      <div className="cashier-header">
        <h1>Cashier Interface</h1>
        <div className="cashier-tabs">
          <button 
            className={`tab ${activeTab === 'order' ? 'active' : ''}`}
            onClick={() => setActiveTab('order')}
          >
            <ShoppingCart size={20} />
            New Order
          </button>
          <button 
            className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <Clock size={20} />
            Order Queue ({orders.length})
          </button>
        </div>
      </div>

      {activeTab === 'order' ? (
        <div className="order-interface">
          <div className="menu-section">
            <div className="menu-header">
              <h2>Menu</h2>
              <div className="search-bar">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="menu-items-grid">
              {filteredMenuItems.map(item => (
                <div key={item.id} className="menu-item-card" onClick={() => addToCart(item)}>
                  {item.image_url && <img src={item.image_url} alt={item.name} />}
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p className="category">{item.category_name}</p>
                    <p className="price">${item.base_price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-section">
            <h2>Current Order</h2>
            
            <div className="customer-info">
              <input
                type="text"
                placeholder="Customer Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Customer Email (optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Customer Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              
              <div className="order-type">
                <label>Order Type:</label>
                <select value={orderType} onChange={(e) => setOrderType(e.target.value as any)}>
                  <option value="dine-in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              
              {orderType === 'dine-in' && (
                <input
                  type="number"
                  placeholder="Table Number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              )}
            </div>

            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <h4>{item.menu_item.name}</h4>
                    <p>${item.unit_price.toFixed(2)} each</p>
                  </div>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="item-total">
                    ${item.total_price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-summary">
              <div className="total">
                <strong>Total: ${calculateTotal().toFixed(2)}</strong>
              </div>
              <div className="order-actions">
                <button className="clear-btn" onClick={clearCart}>
                  Clear Cart
                </button>
                <button 
                  className="process-btn" 
                  onClick={processOrder}
                  disabled={loading || cart.length === 0}
                >
                  {loading ? 'Processing...' : 'Process Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="queue-interface">
          <div className="orders-grid">
            {orders.map(order => (
              <div key={order.id} className={`order-card status-${order.status}`}>
                <div className="order-header">
                  <h3>#{order.order_number}</h3>
                  <span className={`status-badge ${order.status}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="order-info">
                  <p><User size={16} /> {order.customer_name}</p>
                  <p><Clock size={16} /> {new Date(order.created_at).toLocaleTimeString()}</p>
                  <p>Type: {order.order_type}</p>
                  {order.table_number && <p>Table: {order.table_number}</p>}
                  <p className="total">Total: ${order.total_amount.toFixed(2)}</p>
                </div>

                <div className="order-items">
                  {order.order_items?.map((item, index) => (
                    <div key={index} className="order-item">
                      {item.quantity}x {item.menu_item_name}
                    </div>
                  ))}
                </div>

                <div className="order-actions">
                  {order.status === 'pending' && (
                    <button 
                      className="confirm-btn"
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                    >
                      <Check size={16} /> Confirm
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button 
                      className="prepare-btn"
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                    >
                      <Clock size={16} /> Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button 
                      className="ready-btn"
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                    >
                      <Check size={16} /> Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button 
                      className="complete-btn"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                    >
                      <Check size={16} /> Complete Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashier;