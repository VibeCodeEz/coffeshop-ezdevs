import React from 'react';
import { Coffee, MapPin, Phone, Mail, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <div className="footer-logo">
              <Coffee size={28} />
              <span>EzDevs Coffee</span>
            </div>
            <p>
              Your premier destination for exceptional coffee experiences. 
              Crafting perfect moments, one cup at a time since 2024.
            </p>
            <div className="social-links">
              <a href="https://facebook.com/EzDevsCoffee" className="social-link" target="_blank" rel="noopener noreferrer">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com/ezdevscoffee" className="social-link" target="_blank" rel="noopener noreferrer">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com/ezdevscoffee" className="social-link" target="_blank" rel="noopener noreferrer">
                <Twitter size={20} />
              </a>
              <a href="https://youtube.com/@EzDevsCoffee" className="social-link" target="_blank" rel="noopener noreferrer">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/menu">Menu</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3>Contact Us</h3>
            <div className="contact-item">
              <MapPin size={18} />
              <span>221 Brewline Avenue, Manila 1001, Philippines</span>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <span>+63 912 345 6789</span>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <span>contact@ezdevscoffee.com</span>
            </div>
          </div>

          {/* Business Hours */}
          <div className="footer-section">
            <h3>Hours</h3>
            <div className="hours-list">
              <div className="hour-item">
                <span>Mon - Thu</span>
                <span>8:00 AM - 10:00 PM</span>
              </div>
              <div className="hour-item">
                <span>Friday</span>
                <span>8:00 AM - 11:00 PM</span>
              </div>
              <div className="hour-item">
                <span>Saturday</span>
                <span>9:00 AM - 11:00 PM</span>
              </div>
              <div className="hour-item">
                <span>Sunday</span>
                <span>9:00 AM - 9:00 PM</span>
              </div>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 EzDevs Coffee. All rights reserved. | 
            <a href="https://www.ezdevscoffee.com" target="_blank" rel="noopener noreferrer" style={{marginLeft: '8px', color: '#8b4513'}}>
              www.ezdevscoffee.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;