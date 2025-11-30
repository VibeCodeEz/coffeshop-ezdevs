import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="coffee-cup-loader">
        <div className="cup">
          <div className="handle"></div>
        </div>
        <div className="steam">
          <div className="steam-line steam-line-1"></div>
          <div className="steam-line steam-line-2"></div>
          <div className="steam-line steam-line-3"></div>
        </div>
      </div>
      <p className="loading-text">Brewing the perfect experience...</p>
    </div>
  );
};

export default LoadingSpinner;