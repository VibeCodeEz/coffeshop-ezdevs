import React, { useState } from 'react';
import './GrindSizeSelector.css';

interface GrindOption {
  id: string;
  name: string;
  method: string;
  description: string;
  visualSize: 'coarse' | 'medium-coarse' | 'medium' | 'medium-fine' | 'fine' | 'extra-fine';
  brewTime: string;
}

interface GrindSizeSelectorProps {
  onGrindSelect?: (grind: GrindOption) => void;
  selectedGrind?: string;
}

const GrindSizeSelector: React.FC<GrindSizeSelectorProps> = ({ onGrindSelect, selectedGrind }) => {
  const [activeGrind, setActiveGrind] = useState<string>(selectedGrind || 'medium');

  const grindOptions: GrindOption[] = [
    {
      id: 'coarse',
      name: 'Coarse',
      method: 'French Press',
      description: 'Large, chunky grounds for slow extraction',
      visualSize: 'coarse',
      brewTime: '4 minutes'
    },
    {
      id: 'medium-coarse',
      name: 'Medium-Coarse',
      method: 'Pour Over',
      description: 'Slightly smaller than coarse, perfect for drip coffee',
      visualSize: 'medium-coarse',
      brewTime: '2-3 minutes'
    },
    {
      id: 'medium',
      name: 'Medium',
      method: 'Auto Drip',
      description: 'Balanced grind for most brewing methods',
      visualSize: 'medium',
      brewTime: '4-6 minutes'
    },
    {
      id: 'medium-fine',
      name: 'Medium-Fine',
      method: 'V60/Chemex',
      description: 'Slightly finer for precision brewing',
      visualSize: 'medium-fine',
      brewTime: '2-4 minutes'
    },
    {
      id: 'fine',
      name: 'Fine',
      method: 'Espresso',
      description: 'Fine grounds for high-pressure extraction',
      visualSize: 'fine',
      brewTime: '25-30 seconds'
    },
    {
      id: 'extra-fine',
      name: 'Extra Fine',
      method: 'Turkish',
      description: 'Powder-like consistency for specialty brewing',
      visualSize: 'extra-fine',
      brewTime: '2-3 minutes'
    }
  ];

  const handleGrindSelect = (grind: GrindOption) => {
    setActiveGrind(grind.id);
    onGrindSelect?.(grind);
  };

  const getVisualDots = (size: string) => {
    const dotCounts = {
      'coarse': 8,
      'medium-coarse': 12,
      'medium': 16,
      'medium-fine': 24,
      'fine': 36,
      'extra-fine': 48
    };
    return dotCounts[size as keyof typeof dotCounts] || 16;
  };

  const activeGrindOption = grindOptions.find(g => g.id === activeGrind);

  return (
    <div className="grind-size-selector">
      <h3>Choose Your Grind Size</h3>
      <div className="grind-options">
        {grindOptions.map((grind) => (
          <button
            key={grind.id}
            className={`grind-option ${activeGrind === grind.id ? 'active' : ''}`}
            onClick={() => handleGrindSelect(grind)}
          >
            <div className="grind-method">{grind.method}</div>
            <div className="grind-name">{grind.name}</div>
          </button>
        ))}
      </div>

      {activeGrindOption && (
        <div className="grind-visualization">
          <div className="grind-visual">
            <div className="grind-container">
              <div className={`coffee-grounds ${activeGrindOption.visualSize}`}>
                {Array.from({ length: getVisualDots(activeGrindOption.visualSize) }).map((_, i) => (
                  <div key={i} className="coffee-particle"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="grind-info">
            <h4>{activeGrindOption.method} Grind</h4>
            <p>{activeGrindOption.description}</p>
            <div className="brew-time">
              <strong>Brew Time:</strong> {activeGrindOption.brewTime}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrindSizeSelector;