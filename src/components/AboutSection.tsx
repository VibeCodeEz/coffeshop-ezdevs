import React from 'react';
import { Award, Users, Globe, Heart } from 'lucide-react';
import ParallaxSection from './ParallaxSection';
import SteamEffect from './SteamEffect';
import './AboutSection.css';

const AboutSection: React.FC = () => {
  const features = [
    {
      icon: <Award size={48} />,
      title: "Premium Quality",
      description: "Sourced from the finest coffee farms worldwide, ensuring exceptional taste in every cup."
    },
    {
      icon: <Users size={48} />,
      title: "Expert Baristas",
      description: "Our skilled baristas are passionate about creating the perfect coffee experience for you."
    },
    {
      icon: <Globe size={48} />,
      title: "Sustainable Sourcing",
      description: "We work directly with farmers to ensure fair trade and sustainable coffee production."
    },
    {
      icon: <Heart size={48} />,
      title: "Community Focus",
      description: "Building connections and creating a warm, welcoming space for coffee lovers to gather."
    }
  ];

  return (
    <ParallaxSection className="about-section section coffee-farm" speed={0.4}>
      <div className="container">
        <div className="about-content">
          <div className="about-text">
            <h2>Why Choose EzDevs Coffee?</h2>
            <p>
              Since 2024, EzDevs Coffee has been committed to delivering exceptional coffee experiences. 
              We believe that great coffee brings people together, creates moments of joy, and 
              fuels the spirit of community.
            </p>
            <p>
              Our journey began with a simple mission: to serve the best coffee while creating 
              meaningful connections with our customers. Today, we're proud to be part of your 
              daily routine, special celebrations, and everything in between.
            </p>
            <SteamEffect className="button-steam">
              <a href="/about" className="btn btn-cta cursor-hover">Learn Our Story</a>
            </SteamEffect>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <SteamEffect key={index} className="feature-steam">
                <div className="feature-card cursor-hover">
                  <div className="feature-icon">
                    {feature.icon}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </SteamEffect>
            ))}
          </div>
        </div>
      </div>
    </ParallaxSection>
  );
};

export default AboutSection;