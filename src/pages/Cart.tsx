import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ShippingCalculator from '../components/ShippingCalculator';
import CustomerOrderConfirmation from '../components/CustomerOrderConfirmation';
import { supabase, generateOrderNumber } from '../lib/supabase';
import './Cart.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface CartProps {
  cart: {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    updateQuantity: (id: number, quantity: number) => void;
    removeItem: (id: number) => void;
    clearCart: () => void;
    finalizeOrder: () => Promise<boolean>;
  };
}

interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  paymentMethod: 'cash' | 'card' | 'gcash';
  notes?: string;
}

const Cart: React.FC<CartProps> = ({ cart }) => {
  const [selectedShipping, setSelectedShipping] = React.useState<any>(null);
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  const grandTotal = cart.totalPrice + (selectedShipping?.price || 0);

  const handleConfirmOrder = async (customerInfo: CustomerInfo): Promise<string | null> => {
    try {
      console.log('🔄 Creating customer order...', customerInfo);

      // Generate order number
      const orderNumber = generateOrderNumber();
      
      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_email: customerInfo.email || null,
          customer_name: customerInfo.name,
          total_amount: grandTotal,
          status: 'pending',
          payment_method: customerInfo.paymentMethod,
          notes: customerInfo.notes || null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      console.log('✅ Order created:', orderData);

      // Add order items
      const orderItems = cart.items.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        menu_item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.size ? `Size: ${item.size}` : null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      console.log('✅ Order items added');

      // Clear cart after successful order
      setTimeout(() => {
        cart.clearCart();
      }, 2000);

      return orderNumber;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart-state">
            <ShoppingCart size={64} />
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any delicious coffee to your cart yet.</p>
            <Link to="/menu" className="btn btn-primary">
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <Link to="/menu" className="back-link">
            <ArrowLeft size={20} />
            Continue Shopping
          </Link>
          <h1>Shopping Cart ({cart.totalItems} items)</h1>
        </div>

        <div className="cart-layout">
          <div className="cart-items-section">
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="cart-item">
                  <div className="item-image">
                    <span className="item-emoji">{item.image}</span>
                  </div>
                  
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    {item.size && <span className="item-size">{item.size}</span>}
                    <div className="item-price">₱{item.price.toFixed(2)} each</div>
                  </div>

                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button 
                        onClick={() => cart.updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <div className="item-total">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </div>
                    
                    <button 
                      className="remove-btn"
                      onClick={() => cart.removeItem(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-summary-section">
            <div className="cart-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-line">
                <span>Subtotal:</span>
                <span>₱{cart.totalPrice.toFixed(2)}</span>
              </div>
              
              {selectedShipping && (
                <div className="summary-line">
                  <span>Shipping ({selectedShipping.name}):</span>
                  <span>
                    {selectedShipping.price === 0 ? 'FREE' : `₱${selectedShipping.price.toFixed(2)}`}
                  </span>
                </div>
              )}
              
              <div className="summary-total">
                <span>Total:</span>
                <strong>₱{grandTotal.toFixed(2)}</strong>
              </div>
              
              <button 
                className="confirm-order-btn"
                onClick={() => setShowConfirmation(true)}
              >
                <CheckCircle size={16} />
                Confirm Order
              </button>
              
              <button 
                className="clear-cart-btn"
                onClick={cart.clearCart}
              >
                Clear Cart
              </button>
            </div>

            <ShippingCalculator 
              cartTotal={cart.totalPrice}
              onShippingSelect={setSelectedShipping}
              className="compact"
            />
          </div>
        </div>
      </div>

      {/* Customer Order Confirmation */}
      {showConfirmation && (
        <CustomerOrderConfirmation
          items={cart.items}
          totalPrice={grandTotal}
          onConfirmOrder={handleConfirmOrder}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
};

export default Cart;