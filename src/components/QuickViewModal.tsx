import React, { useState } from 'react';
import { X, Plus, Minus, Star, ShoppingCart } from 'lucide-react';
import SizeSelector from './SizeSelector';
import './QuickViewModal.css';

interface QuickViewProduct {
  id: number;
  name: string;
  description: string;
  price: string | number;
  rating: number;
  image: string;
  category: string;
  isPopular?: boolean;
  sizes?: { id: string; name: string; price: number; }[];
  ingredients?: string[];
  allergens?: string[];
  brewingNotes?: string;
}

// Convert QuickViewProduct to MenuItemDB format for SizeSelector
const convertToMenuItemDB = (product: QuickViewProduct): any => {
  const basePrice = typeof product.price === 'string' 
    ? parseFloat(product.price.replace('₱', '')) 
    : product.price;
  
  return {
    id: product.id.toString(),
    name: product.name,
    base_price: basePrice,
    sizes: product.sizes?.map(size => ({
      size: size.name,
      price: size.price,
      available: true
    })) || []
  };
};

interface QuickViewModalProps {
  product: QuickViewProduct;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: QuickViewProduct, quantity: number, size?: string) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]?.name || '');

  if (!isOpen) return null;

  const menuItem = convertToMenuItemDB(product);
  const currentPrice = product.sizes?.find(s => s.name === selectedSize)?.price || menuItem.base_price;
  const totalPrice = currentPrice * quantity;

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedSize);
    onClose();
  };


  return (
    <div className="quick-view-overlay" onClick={onClose}>
      <div className="quick-view-modal" onClick={(e) => e.stopPropagation()}>
        <button className="quick-view-close" onClick={onClose} aria-label="Close quick view">
          <X size={20} />
        </button>

        <div className="quick-view-content">
          <div className="product-image-section">
            <div className="product-image-container">
              {product.isPopular && (
                <div className="popular-badge">
                  <Star size={14} />
                  Popular
                </div>
              )}
              <div className="product-main-image">
                {product.image && (product.image.startsWith('http') || product.image.startsWith('data:image')) ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="product-image"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling!.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="product-emoji-fallback" style={{ display: (product.image && (product.image.startsWith('http') || product.image.startsWith('data:image'))) ? 'none' : 'flex' }}>
                  {product.image || '☕'}
                </div>
              </div>
              <div className="product-category-badge">
                {product.category}
              </div>
            </div>
          </div>

          <div className="product-info-section">
            <div className="product-header">
              <h2 className="product-name">{product.name}</h2>
              <div className="product-rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      className={i < Math.floor(product.rating) ? 'star-filled' : 'star-empty'}
                    />
                  ))}
                </div>
                <span className="rating-text">({product.rating})</span>
              </div>
            </div>

            <p className="product-description">{product.description}</p>

            {/* Size Selection */}
            <SizeSelector
              item={menuItem}
              selectedSize={selectedSize}
              onSizeChange={(size, price) => setSelectedSize(size)}
            />

            {/* Product Details */}
            <div className="product-details">
              {product.allergens && (
                <div className="detail-section">
                  <h5>Allergens:</h5>
                  <p>{product.allergens.join(', ')}</p>
                </div>
              )}
              {product.brewingNotes && (
                <div className="detail-section">
                  <h5>Tasting Notes:</h5>
                  <p>{product.brewingNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="quick-view-footer">
          <div className="price-section">
            <div className="unit-price">₱{currentPrice.toFixed(2)} each</div>
            <div className="total-price">Total: ₱{totalPrice.toFixed(2)}</div>
          </div>

          <div className="quantity-section">
            <label htmlFor="quantity">Qty:</label>
            <div className="quantity-controls">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="99"
              />
              <button onClick={() => setQuantity(quantity + 1)}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button 
            className="add-to-cart-btn"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;