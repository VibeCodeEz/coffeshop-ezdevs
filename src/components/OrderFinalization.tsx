import React, { useState } from 'react';
import { CheckCircle, Edit3, ShoppingBag, Clock } from 'lucide-react';
import './OrderFinalization.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface OrderFinalizationProps {
  items: CartItem[];
  totalPrice: number;
  onFinalize: () => Promise<boolean>;
  onEdit: () => void;
  isVisible: boolean;
  onClose: () => void;
}

const OrderFinalization: React.FC<OrderFinalizationProps> = ({
  items,
  totalPrice,
  onFinalize,
  onEdit,
  isVisible,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

  const handleFinalize = async () => {
    setIsLoading(true);
    
    try {
      const success = await onFinalize();
      
      if (success) {
        setIsFinalized(true);
        setTimeout(() => {
          onClose();
          setIsFinalized(false);
        }, 2000);
      } else {
        alert('Failed to finalize order. Please try again.');
      }
    } catch (error) {
      console.error('Error finalizing order:', error);
      alert('Error finalizing order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  if (isFinalized) {
    return (
      <div className="order-finalization-overlay">
        <div className="order-finalization-panel success-panel">
          <div className="success-content">
            <CheckCircle size={64} className="success-icon" />
            <h2>Order Submitted!</h2>
            <p>Your order has been sent to the kitchen.</p>
            <p>Please proceed to the cashier to pay.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-finalization-overlay" onClick={onClose}>
      <div className="order-finalization-panel" onClick={(e) => e.stopPropagation()}>
        <div className="finalization-header">
          <h2>
            <ShoppingBag size={24} />
            Review Your Order
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="finalization-content">
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="order-items">
              {items.map((item, index) => (
                <div key={index} className="finalization-item">
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
                      <span className="price">₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-total">
              <div className="total-row">
                <span>Total Amount:</span>
                <strong>₱{totalPrice.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <div className="finalization-note">
            <div className="note-content">
              <Clock size={20} />
              <div>
                <h4>Next Steps:</h4>
                <p>After confirming your order, please proceed to the cashier to pay. Your order will be prepared once payment is confirmed.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="finalization-actions">
          <button 
            className="edit-btn"
            onClick={onEdit}
            disabled={isLoading}
          >
            <Edit3 size={16} />
            Edit Order
          </button>
          
          <button 
            className="finalize-btn"
            onClick={handleFinalize}
            disabled={isLoading || items.length === 0}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Confirm Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderFinalization;