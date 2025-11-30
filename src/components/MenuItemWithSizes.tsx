import React, { useState } from 'react';
import { Star, Eye, ShoppingCart } from 'lucide-react';
import SizeSelector from './SizeSelector';
import BrewGuideTooltip from './BrewGuideTooltip';
import { MenuItemDB, getPriceForSize } from '../lib/supabase';

interface MenuItemWithSizesProps {
  item: MenuItemDB;
  rating?: number;
  isPopular?: boolean;
  onQuickView?: () => void;
  onAddToCart: (item: MenuItemDB, quantity: number, size?: string) => Promise<void>;
}

const MenuItemWithSizes: React.FC<MenuItemWithSizesProps> = ({
  item,
  rating = 4.5,
  isPopular = false,
  onQuickView,
  onAddToCart
}) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(item.base_price);

  const handleSizeChange = (size: string, price: number) => {
    setSelectedSize(size);
    setSelectedPrice(price);
  };

  const handleAddToCart = () => {
    onAddToCart(item, 1, selectedSize || undefined);
  };

  const getProductType = (name: string): 'light' | 'medium' | 'dark' | 'espresso' => {
    if (name.toLowerCase().includes('espresso')) return 'espresso';
    if (name.toLowerCase().includes('dark')) return 'dark';
    if (name.toLowerCase().includes('light')) return 'light';
    return 'medium';
  };

  return (
    <div className="menu-item">
      {isPopular && (
        <div className="popular-badge">
          <Star size={14} />
          Popular
        </div>
      )}
      
      <div className="menu-item-image">
        {item.image_url && item.image_url.startsWith('http') ? (
          <img src={item.image_url} alt={item.name} className="menu-item-img" />
        ) : item.image_url && item.image_url.startsWith('data:image') ? (
          <img src={item.image_url} alt={item.name} className="menu-item-img" />
        ) : (
          <span className="menu-emoji">☕</span>
        )}
      </div>
      
      <div className="menu-item-info">
        <h3 className="menu-item-name">{item.name}</h3>
        <p className="menu-item-description">{item.description}</p>
        
        <div className="menu-item-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={16} 
                className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'}
              />
            ))}
          </div>
          <span className="rating-text">{rating}</span>
        </div>
        
        {/* Size Selection */}
        <SizeSelector
          item={item}
          selectedSize={selectedSize}
          onSizeChange={handleSizeChange}
        />
        
        <div className="menu-item-actions">
          <BrewGuideTooltip 
            productName={item.name}
            productType={getProductType(item.name)}
          />
        </div>
        
        <div className="menu-item-footer">
          <span className="menu-item-price">${selectedPrice.toFixed(2)}</span>
          <div className="item-buttons">
            {onQuickView && (
              <button 
                className="quick-view-btn"
                onClick={onQuickView}
                title="Quick View"
              >
                <Eye size={16} />
              </button>
            )}
            <button 
              className="add-btn"
              onClick={handleAddToCart}
              title="Add to Cart"
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemWithSizes;