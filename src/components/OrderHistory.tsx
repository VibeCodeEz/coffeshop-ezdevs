import React, { useState, useEffect } from 'react';
import { Search, Eye, Calendar, DollarSign, User, Package } from 'lucide-react';
import { supabase, testConnection } from '../lib/supabase';
import './OrderHistory.css';

interface OrderDB {
  id: number;
  order_number: string;
  customer_id?: string;
  customer_email?: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

interface OrderWithItems extends OrderDB {
  order_items: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    menu_item: {
      name: string;
      icon?: string;
    };
  }>;
}

const OrderHistory: React.FC = () => {
  // No sample data - will load from database only
  const fallbackOrders: OrderWithItems[] = [];

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for orders
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('🔄 Order change detected:', payload);
        fetchOrders(); // Refresh data on any change
      })
      .subscribe();

    // Listen for storage changes (when new local orders are added)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'local_orders') {
        console.log('📋 Local orders updated, refreshing order history');
        fetchOrders();
      }
    };
    
    // Listen for custom order events
    const handleNewOrder = () => {
      console.log('📋 New order event received, refreshing order history');
      setTimeout(fetchOrders, 500); // Small delay to ensure order is saved
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('newOrderCreated', handleNewOrder);
    
    return () => {
      ordersSubscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('newOrderCreated', handleNewOrder);
    };
  }, []);

  const fetchOrders = async (retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      console.log('📋 Order History: Fetching orders from Supabase...');
      
      // Start with local orders from localStorage
      const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
      console.log('📋 Found local orders:', localOrders.length);
      
      // Test connection first if this is the first try
      if (retryCount === 0) {
        const isConnected = await testConnection();
        if (!isConnected) {
          console.warn('⚠️ Order History: Connection test failed, using local + fallback');
          const combinedOrders = [...localOrders, ...fallbackOrders];
          setOrders(combinedOrders);
          return;
        }
      }
      
      // Try to fetch from database using Supabase client with timeout
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            menu_items (
              name,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Supabase orders fetch error:', error);
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => fetchOrders(retryCount + 1), 2000);
          return;
        }
        // Fallback to local orders only
        setOrders(localOrders);
        return;
      }

      if (data && data.length > 0) {
        // Transform the database data
        const transformedOrders = data.map((order: any) => ({
          ...order,
          order_items: order.order_items?.map((item: any) => ({
            ...item,
            menu_item: { 
              name: item.menu_items?.name || 'Unknown Item',
              icon: '☕', // Default coffee icon since icon field doesn't exist
              image_url: item.menu_items?.image_url
            }
          })) || []
        }));
        
        // Combine database orders with local orders (local orders first for recent cashier orders)
        const combinedOrders = [...localOrders, ...transformedOrders];
        
        // Remove duplicates based on order_number
        const uniqueOrders = combinedOrders.filter((order, index, self) => 
          index === self.findIndex(o => o.order_number === order.order_number)
        );
        
        // Sort by created_at descending
        uniqueOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        console.log('✅ Order History: Combined orders (DB + Local):', uniqueOrders.length);
        setOrders(uniqueOrders);
      } else {
        // No database data, use local orders only
        setOrders(localOrders);
        console.log('📝 Order History: No database orders, using local orders only');
      }
    } catch (error: any) {
      console.error('❌ Order History: Fetch failed:', error);
      
      if (error.message?.includes('timeout') && retryCount < maxRetries) {
        console.log(`🔄 Timeout, retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => fetchOrders(retryCount + 1), 2000);
        return;
      }
      
      const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
      setOrders(localOrders);
    }
  };

  const updateOrderStatus = async (orderId: number, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      await fetchOrders();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      alert('Error updating order: ' + error.message);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="order-history">
      <div className="order-history-header">
        <h2>Order History</h2>
        <p>View and manage all orders</p>
      </div>

      <div className="orders-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by order number or customer email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filters">
          {[
            { value: 'all', label: 'All Orders' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ].map(filter => (
            <button
              key={filter.value}
              className={`status-btn ${statusFilter === filter.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(filter.value as any)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="orders-list">
        {filteredOrders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-number">
                <strong>#{order.order_number}</strong>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>
              <div className="order-date">
                <Calendar size={16} />
                {formatDate(order.created_at)}
              </div>
            </div>

            <div className="order-details">
              <div className="order-info">
                <div className="info-item">
                  <User size={16} />
                  <span>{order.customer_email || 'Walk-in Customer'}</span>
                </div>
                <div className="info-item">
                  <DollarSign size={16} />
                  <span>₱{(order.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="info-item">
                  <Package size={16} />
                  <span>{order.order_items.reduce((sum, item) => sum + (item.quantity || 0), 0)} items</span>
                </div>
              </div>

              <div className="order-actions">
                <button 
                  className="view-btn"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye size={16} />
                  View Details
                </button>

                {order.status === 'pending' && (
                  <>
                    <button 
                      className="complete-btn"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                    >
                      Complete
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="order-items-preview">
              {order.order_items.slice(0, 3).map((item, index) => (
                <span key={index} className="item-preview">
                  {item.menu_item.icon} {item.menu_item.name} ({item.quantity || 0})
                </span>
              ))}
              {order.order_items.length > 3 && (
                <span className="more-items">+{order.order_items.length - 3} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="empty-state">
          <p>No orders found matching your criteria.</p>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order #{selectedOrder.order_number}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="order-summary">
                <div className="summary-row">
                  <span>Status:</span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Customer:</span>
                  <span>{selectedOrder.customer_email || 'Walk-in Customer'}</span>
                </div>
                <div className="summary-row">
                  <span>Payment:</span>
                  <span>{selectedOrder.payment_method?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="summary-row">
                  <span>Date:</span>
                  <span>{formatDate(selectedOrder.created_at)}</span>
                </div>
              </div>

              <div className="order-items-detail">
                <h4>Items Ordered:</h4>
                {selectedOrder.order_items.map((item, index) => (
                  <div key={index} className="item-detail">
                    <span className="item-name">
                      {item.menu_item.icon} {item.menu_item.name}
                    </span>
                    <span className="item-quantity">×{item.quantity || 0}</span>
                    <span className="item-total">₱{(item.total_price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-total-detail">
                <div className="total-row">
                  <span>Total:</span>
                  <strong>₱{(selectedOrder.total_amount || 0).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;