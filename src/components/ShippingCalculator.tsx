import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Clock, Calculator } from 'lucide-react';
import './ShippingCalculator.css';

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description: string;
  icon: string;
}

interface ShippingCalculatorProps {
  cartTotal?: number;
  onShippingSelect?: (option: ShippingOption) => void;
  className?: string;
}

const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  cartTotal = 0,
  onShippingSelect,
  className = ''
}) => {
  const [zipCode, setZipCode] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Philippine ZIP code validation
  const validateZipCode = (zip: string) => {
    // Philippine ZIP codes are 4 digits
    const zipRegex = /^\d{4}$/;
    return zipRegex.test(zip);
  };

  const calculateShipping = (zip: string): ShippingOption[] => {
    const area = getAreaFromZip(zip);
    const baseOptions: ShippingOption[] = [
      {
        id: 'standard',
        name: 'Standard Delivery',
        price: area === 'metro-manila' ? 0 : 50,
        estimatedDays: area === 'metro-manila' ? '1-2 days' : '3-5 days',
        description: 'Regular delivery during business hours',
        icon: '📦'
      },
      {
        id: 'express',
        name: 'Express Delivery',
        price: area === 'metro-manila' ? 100 : 150,
        estimatedDays: area === 'metro-manila' ? 'Same day' : '1-2 days',
        description: 'Priority handling and faster delivery',
        icon: '🚀'
      },
      {
        id: 'overnight',
        name: 'Overnight Express',
        price: area === 'metro-manila' ? 200 : 300,
        estimatedDays: 'Next day',
        description: 'Guaranteed next business day delivery',
        icon: '⚡'
      }
    ];

    // Free shipping for orders over ₱1000
    if (cartTotal >= 1000) {
      baseOptions[0].price = 0;
      baseOptions[0].description = 'FREE shipping on orders over ₱1000!';
    }

    // Remote area surcharge
    if (area === 'remote') {
      baseOptions.forEach(option => {
        option.price += 100;
        option.estimatedDays = option.estimatedDays.includes('day') 
          ? option.estimatedDays.replace(/\d+/, (match) => String(parseInt(match) + 2))
          : '5-7 days';
      });
    }

    return baseOptions;
  };

  const getAreaFromZip = (zip: string): 'metro-manila' | 'luzon' | 'visayas' | 'mindanao' | 'remote' => {
    const zipNum = parseInt(zip);
    
    // Metro Manila ZIP codes
    if ((zipNum >= 1000 && zipNum <= 1799)) return 'metro-manila';
    
    // Luzon ZIP codes
    if ((zipNum >= 1800 && zipNum <= 3999)) return 'luzon';
    
    // Visayas ZIP codes
    if ((zipNum >= 6000 && zipNum <= 7999)) return 'visayas';
    
    // Mindanao ZIP codes
    if ((zipNum >= 8000 && zipNum <= 9999)) return 'mindanao';
    
    // Remote areas
    return 'remote';
  };

  const getAreaName = (area: string): string => {
    switch (area) {
      case 'metro-manila': return 'Metro Manila';
      case 'luzon': return 'Luzon';
      case 'visayas': return 'Visayas';
      case 'mindanao': return 'Mindanao';
      case 'remote': return 'Remote Area';
      default: return 'Unknown Area';
    }
  };

  useEffect(() => {
    if (zipCode && validateZipCode(zipCode)) {
      setIsLoading(true);
      setError('');
      
      // Simulate API call delay
      const timeout = setTimeout(() => {
        const options = calculateShipping(zipCode);
        setShippingOptions(options);
        setSelectedOption(options[0].id);
        setIsLoading(false);
      }, 800);

      return () => clearTimeout(timeout);
    } else {
      setShippingOptions([]);
      setSelectedOption('');
      setError('');
    }
  }, [zipCode, cartTotal]);

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setZipCode(value);
    
    if (value && !validateZipCode(value) && value.length === 4) {
      setError('Please enter a valid Philippine ZIP code');
    } else {
      setError('');
    }
  };

  const handleOptionSelect = (option: ShippingOption) => {
    setSelectedOption(option.id);
    onShippingSelect?.(option);
  };

  const area = zipCode && validateZipCode(zipCode) ? getAreaFromZip(zipCode) : '';

  return (
    <div className={`shipping-calculator ${className}`}>
      <div className="calculator-header">
        <div className="header-icon">
          <Calculator size={20} />
        </div>
        <h3>Calculate Shipping</h3>
      </div>

      <div className="zip-input-section">
        <div className="input-group">
          <MapPin size={18} className="input-icon" />
          <input
            type="text"
            placeholder="Enter ZIP code (e.g. 1234)"
            value={zipCode}
            onChange={handleZipCodeChange}
            className={error ? 'error' : ''}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        {area && !error && (
          <div className="area-info">
            <span className="area-badge">{getAreaName(area)}</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <span>Calculating shipping options...</span>
        </div>
      )}

      {shippingOptions.length > 0 && !isLoading && (
        <div className="shipping-options">
          <h4>Available Shipping Options:</h4>
          <div className="options-list">
            {shippingOptions.map((option) => (
              <label key={option.id} className="shipping-option">
                <input
                  type="radio"
                  name="shipping"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => handleOptionSelect(option)}
                />
                <div className="option-content">
                  <div className="option-header">
                    <span className="option-icon">{option.icon}</span>
                    <div className="option-info">
                      <span className="option-name">{option.name}</span>
                      <span className="option-price">
                        {option.price === 0 ? 'FREE' : `₱${option.price}`}
                      </span>
                    </div>
                    <div className="option-timing">
                      <Clock size={14} />
                      <span>{option.estimatedDays}</span>
                    </div>
                  </div>
                  <p className="option-description">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
          
          {cartTotal < 1000 && (
            <div className="free-shipping-note">
              <Truck size={16} />
              <span>
                Add ₱{(1000 - cartTotal).toFixed(2)} more for FREE standard shipping!
              </span>
            </div>
          )}
        </div>
      )}

      {zipCode && validateZipCode(zipCode) && shippingOptions.length === 0 && !isLoading && !error && (
        <div className="no-shipping">
          <p>No shipping options available for this area. Please contact us for assistance.</p>
        </div>
      )}
    </div>
  );
};

export default ShippingCalculator;