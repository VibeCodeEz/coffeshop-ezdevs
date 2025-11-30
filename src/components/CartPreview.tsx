import React from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import './CartPreview.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface CartPreviewProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClose: () => void;
}

const CartPreview: React.FC<CartPreviewProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClose
}) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="cart-preview-overlay" onClick={onClose}>
      <div className="cart-preview-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-preview-header">
          <h3>
            <ShoppingBag size={20} />
            Your Cart ({totalItems} items)
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-preview-content">
          {items.length === 0 ? (
            <div className="empty-cart-preview">
              <ShoppingBag size={48} />
              <h4>Your cart is empty</h4>
              <p>Add some delicious coffee to get started!</p>
            </div>
          ) : (
            <>
              <div className="cart-preview-items">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size || 'default'}`} className="cart-preview-item">
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
                      <div className="item-price">₱{item.price.toFixed(2)}</div>
                    </div>

                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="qty-btn"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="qty-btn"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      
                      <button 
                        className="remove-btn"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-preview-summary">
                <div className="subtotal">
                  <span>Total:</span>
                  <strong>₱{totalPrice.toFixed(2)}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-preview-footer">
            <button 
              className="btn-continue"
              onClick={onClose}
            >
              Continue Shopping
            </button>
            <button 
              className="btn-checkout"
              onClick={() => window.location.href = '/cart'}
            >
              View Full Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPreview;