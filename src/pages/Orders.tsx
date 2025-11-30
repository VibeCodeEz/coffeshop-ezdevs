import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './Orders.css';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface Order {
  id: number;
  order_date: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  items: OrderItem[];
  order_number: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { user } = useAuth();

  // No sample data - will show empty state

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (
              name,
              image_url,
              icon
            )
          )
        `)
        .eq('user_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedOrders: Order[] = ordersData.map(order => ({
        id: order.id,
        order_number: order.order_number,
        order_date: order.created_at,
        status: order.status,
        total_amount: order.total_amount,
        items: order.order_items.map((item: any) => ({
          id: item.id,
          name: item.menu_items.name,
          price: item.unit_price,
          quantity: item.quantity,
          image: item.menu_items.image_url || '☕',
          size: item.size
        }))
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="status-icon pending" />;
      case 'preparing':
        return <Package size={16} className="status-icon preparing" />;
      case 'ready':
        return <CheckCircle size={16} className="status-icon ready" />;
      case 'completed':
        return <CheckCircle size={16} className="status-icon completed" />;
      case 'cancelled':
        return <XCircle size={16} className="status-icon cancelled" />;
      default:
        return <Clock size={16} className="status-icon pending" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Received';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <section className="orders-hero">
        <div className="container">
          <h1>My Orders</h1>
          <p>Track your coffee orders and view order history</p>
        </div>
      </section>

      <section className="orders-content section">
        <div className="container">
          {orders.length === 0 ? (
            <div className="empty-orders">
              <Package size={64} />
              <h3>No orders yet</h3>
              <p>When you place your first order, it will appear here.</p>
              <a href="/menu" className="btn btn-primary">Browse Menu</a>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Order #{order.order_number}</h3>
                      <p className="order-date">{formatDate(order.order_date)}</p>
                    </div>
                    <div className="order-status">
                      {getStatusIcon(order.status)}
                      <span className={`status-text ${order.status}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="order-items">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-image">
                          {item.image && item.image.startsWith('http') ? (
                            <img src={item.image} alt={item.name} />
                          ) : item.image && item.image.startsWith('data:image') ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <span className="item-emoji">{item.image}</span>
                          )}
                        </div>
                        <div className="item-details">
                          <h4>{item.name}</h4>
                          {item.size && <span className="item-size">{item.size}</span>}
                          <div className="item-meta">
                            <span className="quantity">Qty: {item.quantity}</span>
                            <span className="price">₱{item.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <strong>Total: ₱{order.total_amount.toFixed(2)}</strong>
                    </div>
                    <button 
                      className="view-details-btn"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - #{selectedOrder.order_number}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="order-summary">
                <div className="summary-row">
                  <span>Order Date:</span>
                  <span>{formatDate(selectedOrder.order_date)}</span>
                </div>
                <div className="summary-row">
                  <span>Status:</span>
                  <span className={`status-text ${selectedOrder.status}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Total Amount:</span>
                  <strong>₱{selectedOrder.total_amount.toFixed(2)}</strong>
                </div>
              </div>

              <div className="modal-items">
                <h4>Order Items</h4>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="modal-item">
                    <div className="item-image">
                      {item.image && item.image.startsWith('http') ? (
                        <img src={item.image} alt={item.name} />
                      ) : item.image && item.image.startsWith('data:image') ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span className="item-emoji">{item.image}</span>
                      )}
                    </div>
                    <div className="item-info">
                      <h5>{item.name}</h5>
                      {item.size && <span className="item-size">{item.size}</span>}
                    </div>
                    <div className="item-pricing">
                      <span className="quantity">×{item.quantity}</span>
                      <span className="price">₱{item.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;