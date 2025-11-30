import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import './StickyCart.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface StickyCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

const StickyCart: React.FC<StickyCartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    const handleScroll = () => {
      // Show cart after user scrolls down 200px
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible && totalItems === 0) return null;

  return (
    <>
      {/* Sticky Cart Icon */}
      <div className={`sticky-cart-trigger ${isVisible ? 'visible' : ''}`}>
        <button 
          className="cart-btn"
          onClick={() => setIsOpen(true)}
          aria-label={`Shopping cart with ${totalItems} items`}
        >
          <ShoppingCart size={24} />
          {totalItems > 0 && (
            <span className="cart-count">{totalItems}</span>
          )}
        </button>
      </div>

      {/* Cart Overlay */}
      {isOpen && (
        <div className="cart-overlay" onClick={() => setIsOpen(false)}>
          <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h3>Your Cart ({totalItems} items)</h3>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            <div className="cart-content">
              {items.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingCart size={48} />
                  <h4>Your cart is empty</h4>
                  <p>Add some delicious coffee to get started!</p>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {items.map((item) => (
                      <div key={item.id} className="cart-item">
                        <div className="item-image">
                          <span className="item-emoji">{item.image}</span>
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
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="quantity">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          
                          <button 
                            className="remove-btn"
                            onClick={() => onRemoveItem(item.id)}
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-summary">
                    <div className="subtotal">
                      <span>Subtotal:</span>
                      <strong>₱{totalPrice.toFixed(2)}</strong>
                    </div>
                    <div className="shipping-note">
                      <small>Shipping calculated at checkout</small>
                    </div>
                  </div>
                </>
              )}
            </div>

            {items.length > 0 && (
              <div className="cart-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Continue Shopping
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={onCheckout}
                >
                  Checkout (₱{totalPrice.toFixed(2)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StickyCart;