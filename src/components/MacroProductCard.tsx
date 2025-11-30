import React from 'react';
import { Star, Plus } from 'lucide-react';
import SteamEffect from './SteamEffect';
import BrewGuideTooltip from './BrewGuideTooltip';
import './MacroProductCard.css';

interface MacroProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  rating: number;
  image: string;
  macroImage?: string;
  isPopular?: boolean;
}

interface MacroProductCardProps {
  product: MacroProduct;
  onAddToCart?: () => void;
}

const MacroProductCard: React.FC<MacroProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="macro-product-card cursor-hover">
      {product.isPopular && (
        <div className="popular-badge">
          <Star size={14} />
          Popular
        </div>
      )}
      
      <SteamEffect className="product-steam">
        <div className="macro-image-container">
          <div className="macro-background">
            <div className="coffee-texture"></div>
            <div className="coffee-beans-scatter"></div>
          </div>
          <div className="product-image-main">
            <span className="product-emoji">{product.image}</span>
          </div>
          <div className="macro-details">
            <div className="texture-overlay"></div>
            <div className="grain-pattern"></div>
          </div>
        </div>
      </SteamEffect>
      
      <div className="product-info-enhanced">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        
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
          <span className="rating-text">{product.rating}</span>
        </div>
        
        <div className="product-actions">
          <BrewGuideTooltip 
            productName={product.name}
            productType={product.name.toLowerCase().includes('espresso') ? 'espresso' : 
                        product.name.toLowerCase().includes('dark') ? 'dark' :
                        product.name.toLowerCase().includes('light') ? 'light' : 'medium'}
          />
        </div>
        
        <div className="product-footer-enhanced">
          <span className="product-price">{product.price}</span>
          <SteamEffect className="button-steam">
            <button className="add-btn-enhanced cursor-hover" onClick={onAddToCart}>
              <Plus size={16} />
            </button>
          </SteamEffect>
        </div>
      </div>
    </div>
  );
};

export default MacroProductCard;