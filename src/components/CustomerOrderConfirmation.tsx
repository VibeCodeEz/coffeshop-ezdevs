import React, { useState } from 'react';
import { Check, Clock, User, Mail, Phone, MapPin, CreditCard, Banknote, Smartphone } from 'lucide-react';
import './CustomerOrderConfirmation.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface CustomerOrderConfirmationProps {
  items: CartItem[];
  totalPrice: number;
  onConfirmOrder: (customerInfo: CustomerInfo) => Promise<string | null>; // Returns order number
  onCancel: () => void;
}

interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  paymentMethod: 'cash' | 'card' | 'gcash';
  notes?: string;
}

const CustomerOrderConfirmation: React.FC<CustomerOrderConfirmationProps> = ({
  items,
  totalPrice,
  onConfirmOrder,
  onCancel
}) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'cash',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onConfirmOrder(customerInfo);
      if (result) {
        setOrderNumber(result);
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Failed to confirm order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (orderNumber) {
    return (
      <div className="order-confirmation-modal">
        <div className="order-success">
          <div className="success-icon">
            <Check size={48} />
          </div>
          <h2>Order Confirmed!</h2>
          <div className="order-number">
            Order #<strong>{orderNumber}</strong>
          </div>
          <p>Show this number to the cashier for processing</p>
          
          <div className="order-summary">
            <h3>Your Order:</h3>
            {items.map((item, index) => (
              <div key={index} className="order-item">
                <span>{item.name} {item.size && `(${item.size})`}</span>
                <span>×{item.quantity}</span>
                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="order-total">
              <strong>Total: ₱{totalPrice.toFixed(2)}</strong>
            </div>
          </div>

          <div className="next-steps">
            <h4>Next Steps:</h4>
            <div className="step">
              <Clock size={16} />
              <span>Go to the counter</span>
            </div>
            <div className="step">
              <User size={16} />
              <span>Show order #{orderNumber} to cashier</span>
            </div>
            <div className="step">
              <CreditCard size={16} />
              <span>Pay with {customerInfo.paymentMethod}</span>
            </div>
          </div>

          <button 
            className="btn-done" 
            onClick={() => {
              setOrderNumber(null);
              onCancel(); // Close the modal
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-overlay">
      <div className="order-confirmation-modal">
        <div className="modal-header">
          <h2>Confirm Your Order</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-content">
          <div className="order-review">
            <h3>Order Summary</h3>
            <div className="order-items">
              {items.map((item, index) => (
                <div key={index} className="review-item">
                  <div className="item-image">
                    {item.image && item.image.startsWith('http') ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <span className="item-emoji">{item.image}</span>
                    )}
                  </div>
                  <div className="item-details">
                    <div className="item-name">{item.name}</div>
                    {item.size && <div className="item-size">{item.size}</div>}
                  </div>
                  <div className="item-quantity">×{item.quantity}</div>
                  <div className="item-total">₱{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="order-total">
              <strong>Total: ₱{totalPrice.toFixed(2)}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="customer-form">
            <div className="form-section">
              <h4>Your Information</h4>
              
              <div className="form-group required">
                <label htmlFor="name">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={16} />
                  Email (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <Phone size={16} />
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+63 xxx xxx xxxx"
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Payment Method</h4>
              <div className="payment-methods">
                <label className={`payment-option ${customerInfo.paymentMethod === 'cash' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={customerInfo.paymentMethod === 'cash'}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  />
                  <div className="payment-content">
                    <Banknote size={20} />
                    <span>Cash</span>
                  </div>
                </label>

                <label className={`payment-option ${customerInfo.paymentMethod === 'card' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={customerInfo.paymentMethod === 'card'}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  />
                  <div className="payment-content">
                    <CreditCard size={20} />
                    <span>Card</span>
                  </div>
                </label>

                <label className={`payment-option ${customerInfo.paymentMethod === 'gcash' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="gcash"
                    checked={customerInfo.paymentMethod === 'gcash'}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  />
                  <div className="payment-content">
                    <Smartphone size={20} />
                    <span>GCash</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label htmlFor="notes">Special Instructions (Optional)</label>
                <textarea
                  id="notes"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-confirm" disabled={loading || !customerInfo.name}>
                {loading ? 'Processing...' : 'Confirm Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderConfirmation;