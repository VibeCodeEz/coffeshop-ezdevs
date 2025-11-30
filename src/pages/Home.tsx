import React from 'react';
import { ShoppingBag, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import AboutSection from '../components/AboutSection';
import TestimonialCarousel from '../components/TestimonialCarousel';
// import VideoBackground from '../components/VideoBackground';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <Hero />
      <FeaturedProducts />
      
      {/* Order Now CTA Section */}
      <section className="order-now-cta section">
        <div className="container">
          <div className="cta-content">
            <div className="cta-text">
              <h2>Ready to Order?</h2>
              <p>Explore our full menu and place your order now. Fresh coffee, delivered with love.</p>
            </div>
            <div className="cta-actions">
              <Link to="/menu" className="order-now-btn">
                <ShoppingBag size={20} />
                Order Now
              </Link>
              <Link to="/menu" className="browse-menu-btn">
                <Coffee size={20} />
                Browse Menu
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Coffee Process Video Section */}
      <div className="coffee-process-section">
        <div className="container">
          <div className="coffee-process-content">
            <h2>The Art of Perfect Brewing</h2>
            <p>From bean to cup, discover the passion behind every brew</p>
            <div className="brewing-steps">
              <div className="step">
                <span className="step-icon">🌱</span>
                <h4>Premium Beans</h4>
                <p>Sourced from the finest coffee regions worldwide</p>
              </div>
              <div className="step">
                <span className="step-icon">⚙️</span>
                <h4>Expert Roasting</h4>
                <p>Carefully roasted to bring out unique flavors</p>
              </div>
              <div className="step">
                <span className="step-icon">☕</span>
                <h4>Perfect Brewing</h4>
                <p>Brewed with precision and served with love</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AboutSection />
      
      {/* Customer Testimonials Section */}
      <TestimonialCarousel />
      
    </div>
  );
};

export default Home;