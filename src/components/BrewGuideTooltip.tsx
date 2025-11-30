import React, { useState } from 'react';
import { Info } from 'lucide-react';
import './BrewGuideTooltip.css';

interface BrewGuide {
  method: string;
  temperature: string;
  ratio: string;
  brewTime: string;
  grindSize: string;
  tips: string[];
}

interface BrewGuideTooltipProps {
  productName: string;
  productType?: 'light' | 'medium' | 'dark' | 'espresso';
  className?: string;
}

const BrewGuideTooltip: React.FC<BrewGuideTooltipProps> = ({ 
  // productName, 
  productType = 'medium',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getBrewGuides = (type: string): BrewGuide[] => {
    const guides: Record<string, BrewGuide[]> = {
      light: [
        {
          method: 'Pour Over',
          temperature: '200°F (93°C)',
          ratio: '1:16',
          brewTime: '2-3 minutes',
          grindSize: 'Medium-Fine',
          tips: ['Use a gooseneck kettle', 'Bloom for 30 seconds', 'Pour in circles']
        },
        {
          method: 'V60',
          temperature: '205°F (96°C)',
          ratio: '1:15',
          brewTime: '2:30-3:00',
          grindSize: 'Medium-Fine',
          tips: ['Pre-wet filter', 'Consistent pouring speed', 'Total brew time 2:30-3:00']
        }
      ],
      medium: [
        {
          method: 'French Press',
          temperature: '195°F (90°C)',
          ratio: '1:12',
          brewTime: '4 minutes',
          grindSize: 'Coarse',
          tips: ['Stir after 30 seconds', 'Press slowly', 'Serve immediately']
        },
        {
          method: 'Auto Drip',
          temperature: '200°F (93°C)',
          ratio: '1:15',
          brewTime: '5-6 minutes',
          grindSize: 'Medium',
          tips: ['Use filtered water', 'Clean machine regularly', 'Fresh ground beans']
        }
      ],
      dark: [
        {
          method: 'French Press',
          temperature: '190°F (88°C)',
          ratio: '1:14',
          brewTime: '4 minutes',
          grindSize: 'Coarse',
          tips: ['Lower temperature prevents bitterness', 'Shorter steep time', 'Coarse grind essential']
        },
        {
          method: 'Cold Brew',
          temperature: 'Cold Water',
          ratio: '1:8',
          brewTime: '12-24 hours',
          grindSize: 'Extra Coarse',
          tips: ['Steep in fridge', 'Strain twice', 'Dilute if needed']
        }
      ],
      espresso: [
        {
          method: 'Espresso',
          temperature: '200°F (93°C)',
          ratio: '1:2',
          brewTime: '25-30 seconds',
          grindSize: 'Fine',
          tips: ['18-20g dose', 'Even distribution', 'Consistent tamping pressure']
        },
        {
          method: 'Cappuccino',
          temperature: '200°F (93°C)',
          ratio: '1:2 + steamed milk',
          brewTime: '25-30 seconds',
          grindSize: 'Fine',
          tips: ['Steam milk to 150°F', '1:1:1 ratio', 'Pour art technique']
        }
      ]
    };

    return guides[type] || guides.medium;
  };

  const brewGuides = getBrewGuides(productType);

  return (
    <div 
      className={`brew-guide-tooltip ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button className="brew-guide-trigger">
        <Info size={16} />
        <span>Brew Guide</span>
      </button>

      {isVisible && (
        <div className="brew-guide-popup">
          <div className="popup-header">
            <h4>Best Brewing Method</h4>
          </div>

          <div className="brew-methods">
            {brewGuides.slice(0, 1).map((guide, index) => (
              <div key={index} className="brew-method">
                <h5>{guide.method}</h5>
                
                <div className="brew-quick-info">
                  <div className="quick-spec">
                    <strong>{guide.temperature}</strong>
                  </div>
                  <div className="quick-spec">
                    <strong>{guide.ratio}</strong>
                  </div>
                  <div className="quick-spec">
                    <strong>{guide.brewTime}</strong>
                  </div>
                </div>

                <div className="best-for-note">
                  Perfect for {guide.grindSize.toLowerCase()} grind
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrewGuideTooltip;