import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Coffee, Star } from 'lucide-react';
import ParallaxSection from './ParallaxSection';
import SteamEffect from './SteamEffect';
import { useAuth } from '../contexts/AuthContext';
import './Hero.css';
import './ExploreMenuButton.css';

const Hero: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOrderNow = () => {
    if (user) {
      navigate('/menu');
    } else {
      alert('Please login or sign up to start ordering!');
      navigate('/auth');
    }
  };

  return (
    <ParallaxSection className="hero coffee-beans" speed={0.5}>
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <Star size={16} />
              <span>Premium Quality Since 2007</span>
            </div>
            
            <h1>
              Experience the Perfect
              <span className="highlight"> Coffee Moment</span>
            </h1>
            
            <p>
              Discover our carefully crafted blends, made from the finest beans 
              sourced globally. Every cup tells a story of passion, quality, and tradition.
            </p>
            
            <div className="hero-actions">
              <SteamEffect className="button-steam">
                <button onClick={handleOrderNow} className="btn btn-hero-primary cursor-hover">
                  <Coffee size={20} />
                  Order Now
                  <ArrowRight size={20} />
                </button>
              </SteamEffect>
              {user ? (
                <Link to="/about" className="btn btn-hero-secondary cursor-hover">
                  <Star size={18} />
                  Our Story
                </Link>
              ) : (
                <Link to="/auth" className="btn btn-hero-secondary cursor-hover">
                  <Star size={18} />
                  Join Us
                </Link>
              )}
            </div>
            
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">Coffee Varieties</span>
              </div>
              <div className="stat">
                <span className="stat-number">100+</span>
                <span className="stat-label">Locations</span>
              </div>
              <div className="stat">
                <span className="stat-number">1M+</span>
                <span className="stat-label">Happy Customers</span>
              </div>
            </div>
          </div>
          
          <div className="hero-image">
            <SteamEffect className="hero-steam">
              <div className="coffee-cup cursor-hover">
                <Coffee size={120} />
              </div>
            </SteamEffect>
            <div className="floating-elements">
              <div className="floating-bean bean-1"></div>
              <div className="floating-bean bean-2"></div>
              <div className="floating-bean bean-3"></div>
            </div>
          </div>
        </div>
      </div>
    </ParallaxSection>
  );
};

export default Hero;