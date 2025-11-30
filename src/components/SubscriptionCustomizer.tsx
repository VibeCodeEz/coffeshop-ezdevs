import React, { useState } from 'react';
import { Coffee, Calendar, Package, Truck, Check } from 'lucide-react';
import './SubscriptionCustomizer.css';

interface BeanOption {
  id: string;
  name: string;
  description: string;
  price: number;
  roastLevel: 'light' | 'medium' | 'dark';
  flavor: string[];
}

interface FrequencyOption {
  id: string;
  name: string;
  description: string;
  discount: number;
}

interface QuantityOption {
  id: string;
  name: string;
  weight: string;
  price: number;
}

const SubscriptionCustomizer: React.FC = () => {
  const [selectedBean, setSelectedBean] = useState<string>('signature');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('monthly');
  const [selectedQuantity, setSelectedQuantity] = useState<string>('medium');
  const [currentStep, setCurrentStep] = useState<number>(1);

  const beanOptions: BeanOption[] = [
    {
      id: 'signature',
      name: 'Signature Blend',
      description: 'Our classic house blend with notes of chocolate and caramel',
      price: 280,
      roastLevel: 'medium',
      flavor: ['chocolate', 'caramel', 'nutty']
    },
    {
      id: 'single-origin',
      name: 'Single Origin Ethiopian',
      description: 'Bright and fruity with floral notes',
      price: 320,
      roastLevel: 'light',
      flavor: ['fruity', 'floral', 'citrus']
    },
    {
      id: 'dark-roast',
      name: 'Dark Roast Supreme',
      description: 'Bold and robust with smoky undertones',
      price: 290,
      roastLevel: 'dark',
      flavor: ['bold', 'smoky', 'earthy']
    },
    {
      id: 'decaf',
      name: 'Swiss Water Decaf',
      description: 'All the flavor, none of the caffeine',
      price: 300,
      roastLevel: 'medium',
      flavor: ['smooth', 'rich', 'balanced']
    }
  ];

  const frequencyOptions: FrequencyOption[] = [
    {
      id: 'weekly',
      name: 'Weekly',
      description: 'Perfect for heavy coffee drinkers',
      discount: 0.15
    },
    {
      id: 'bi-weekly',
      name: 'Bi-Weekly',
      description: 'Great for regular coffee lovers',
      discount: 0.10
    },
    {
      id: 'monthly',
      name: 'Monthly',
      description: 'Ideal for moderate consumption',
      discount: 0.05
    }
  ];

  const quantityOptions: QuantityOption[] = [
    {
      id: 'small',
      name: 'Small',
      weight: '250g',
      price: 1.0
    },
    {
      id: 'medium',
      name: 'Medium',
      weight: '500g',
      price: 1.8
    },
    {
      id: 'large',
      name: 'Large',
      weight: '1kg',
      price: 3.2
    }
  ];

  const calculateTotal = () => {
    const bean = beanOptions.find(b => b.id === selectedBean);
    const frequency = frequencyOptions.find(f => f.id === selectedFrequency);
    const quantity = quantityOptions.find(q => q.id === selectedQuantity);

    if (!bean || !frequency || !quantity) return 0;

    const basePrice = bean.price * quantity.price;
    const discount = basePrice * frequency.discount;
    return basePrice - discount;
  };

  const calculateSavings = () => {
    const bean = beanOptions.find(b => b.id === selectedBean);
    const frequency = frequencyOptions.find(f => f.id === selectedFrequency);
    const quantity = quantityOptions.find(q => q.id === selectedQuantity);

    if (!bean || !frequency || !quantity) return 0;

    const basePrice = bean.price * quantity.price;
    return basePrice * frequency.discount;
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const getRoastColor = (level: string) => {
    switch (level) {
      case 'light': return '#8D6E63';
      case 'medium': return '#5D4037';
      case 'dark': return '#3E2723';
      default: return '#5D4037';
    }
  };

  return (
    <div className="subscription-customizer">
      <div className="customizer-header">
        <h2>Create Your Perfect Subscription</h2>
        <p>Customize your coffee delivery and never run out of your favorite beans</p>
      </div>

      <div className="steps-indicator">
        {[1, 2, 3].map((step) => (
          <div key={step} className={`step ${currentStep >= step ? 'active' : ''}`}>
            <div className="step-number">{step}</div>
            <span className="step-label">
              {step === 1 ? 'Bean Type' : step === 2 ? 'Frequency' : 'Quantity'}
            </span>
          </div>
        ))}
      </div>

      <div className="customizer-content">
        {/* Step 1: Bean Selection */}
        {currentStep === 1 && (
          <div className="step-content">
            <h3><Coffee size={20} /> Choose Your Bean</h3>
            <div className="options-grid">
              {beanOptions.map((bean) => (
                <div
                  key={bean.id}
                  className={`option-card ${selectedBean === bean.id ? 'selected' : ''}`}
                  onClick={() => setSelectedBean(bean.id)}
                >
                  <div className="option-header">
                    <h4>{bean.name}</h4>
                    <div 
                      className="roast-indicator" 
                      style={{ backgroundColor: getRoastColor(bean.roastLevel) }}
                    ></div>
                  </div>
                  <p>{bean.description}</p>
                  <div className="flavor-tags">
                    {bean.flavor.map((flavor) => (
                      <span key={flavor} className="flavor-tag">{flavor}</span>
                    ))}
                  </div>
                  <div className="price">₱{bean.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Frequency Selection */}
        {currentStep === 2 && (
          <div className="step-content">
            <h3><Calendar size={20} /> Choose Delivery Frequency</h3>
            <div className="options-grid">
              {frequencyOptions.map((freq) => (
                <div
                  key={freq.id}
                  className={`option-card ${selectedFrequency === freq.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFrequency(freq.id)}
                >
                  <div className="option-header">
                    <h4>{freq.name}</h4>
                    <div className="discount-badge">
                      -{Math.round(freq.discount * 100)}%
                    </div>
                  </div>
                  <p>{freq.description}</p>
                  <div className="delivery-info">
                    <Truck size={16} />
                    <span>Free shipping included</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Quantity Selection */}
        {currentStep === 3 && (
          <div className="step-content">
            <h3><Package size={20} /> Choose Quantity</h3>
            <div className="options-grid">
              {quantityOptions.map((qty) => (
                <div
                  key={qty.id}
                  className={`option-card ${selectedQuantity === qty.id ? 'selected' : ''}`}
                  onClick={() => setSelectedQuantity(qty.id)}
                >
                  <div className="option-header">
                    <h4>{qty.name}</h4>
                    <div className="weight-badge">{qty.weight}</div>
                  </div>
                  <p>Perfect for {qty.id === 'small' ? '1-2' : qty.id === 'medium' ? '3-4' : '5+'} cups per day</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary and Navigation */}
      <div className="customizer-footer">
        <div className="summary">
          <div className="summary-item">
            <strong>Selected:</strong>
            <span>
              {beanOptions.find(b => b.id === selectedBean)?.name} • 
              {frequencyOptions.find(f => f.id === selectedFrequency)?.name} • 
              {quantityOptions.find(q => q.id === selectedQuantity)?.weight}
            </span>
          </div>
          <div className="pricing">
            <div className="total-price">
              <span>Total: </span>
              <strong>₱{calculateTotal().toFixed(2)}</strong>
            </div>
            {calculateSavings() > 0 && (
              <div className="savings">
                You save ₱{calculateSavings().toFixed(2)} per delivery!
              </div>
            )}
          </div>
        </div>

        <div className="navigation">
          {currentStep > 1 && (
            <button className="btn btn-secondary" onClick={prevStep}>
              Previous
            </button>
          )}
          {currentStep < 3 ? (
            <button className="btn btn-primary" onClick={nextStep}>
              Next Step
            </button>
          ) : (
            <button className="btn btn-cta">
              <Check size={16} />
              Start Subscription
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCustomizer;