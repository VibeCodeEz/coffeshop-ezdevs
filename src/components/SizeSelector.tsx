import React from 'react';
import { MenuItemDB, MenuItemSize, getAvailableSizes, formatPrice } from '../lib/supabase';
import './SizeSelector.css';

interface SizeSelectorProps {
  item: MenuItemDB;
  selectedSize: string | null;
  onSizeChange: (size: string, price: number) => void;
  disabled?: boolean;
}

const SizeSelector: React.FC<SizeSelectorProps> = ({ 
  item, 
  selectedSize, 
  onSizeChange, 
  disabled = false 
}) => {
  const availableSizes = getAvailableSizes(item);

  // If no sizes are available, show base price only
  if (availableSizes.length === 0) {
    return (
      <div className="size-selector no-sizes">
        <div className="single-price">
          {formatPrice(item.base_price)}
        </div>
      </div>
    );
  }

  return (
    <div className="size-selector">
      <div className="size-selector-label">
        <span>Size:</span>
      </div>
      <div className="size-options">
        {availableSizes.map((sizeOption: MenuItemSize) => {
          const isSelected = selectedSize === sizeOption.size;
          
          return (
            <button
              key={sizeOption.size}
              type="button"
              className={`size-option ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && onSizeChange(sizeOption.size, sizeOption.price)}
              disabled={disabled}
            >
              <div className="size-name">{sizeOption.size}</div>
              <div className="size-price">{formatPrice(sizeOption.price)}</div>
            </button>
          );
        })}
      </div>
      {selectedSize && (
        <div className="selected-size-info">
          <span>Selected: {selectedSize}</span>
        </div>
      )}
    </div>
  );
};

export default SizeSelector;