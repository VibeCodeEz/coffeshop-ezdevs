import React from 'react';
import './SteamEffect.css';

interface SteamEffectProps {
  children: React.ReactNode;
  className?: string;
}

const SteamEffect: React.FC<SteamEffectProps> = ({ children, className = '' }) => {
  return (
    <div className={`steam-container ${className}`}>
      {children}
      <div className="steam-effect">
        <div className="steam-particle steam-1"></div>
        <div className="steam-particle steam-2"></div>
        <div className="steam-particle steam-3"></div>
        <div className="steam-particle steam-4"></div>
        <div className="steam-particle steam-5"></div>
      </div>
    </div>
  );
};

export default SteamEffect;