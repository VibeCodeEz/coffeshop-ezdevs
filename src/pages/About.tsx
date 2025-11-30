import React from 'react';
import { Users, Globe, Heart, Coffee } from 'lucide-react';
import './About.css';

const About: React.FC = () => {
  const values = [
    {
      icon: <Coffee size={48} />,
      title: "Quality First",
      description: "We source only the finest beans and use expert roasting techniques to ensure every cup meets our high standards."
    },
    {
      icon: <Users size={48} />,
      title: "Community",
      description: "Building meaningful connections with our customers and creating a space where everyone feels welcome."
    },
    {
      icon: <Globe size={48} />,
      title: "Sustainability",
      description: "Committed to ethical sourcing and environmental responsibility in everything we do."
    },
    {
      icon: <Heart size={48} />,
      title: "Passion",
      description: "Our love for coffee drives us to continuously improve and innovate in every aspect of our business."
    }
  ];

  const milestones = [
    { year: "2024", title: "Founded", description: "EzDevs Coffee was established with a vision to serve premium coffee" },
    { year: "2010", title: "Expansion", description: "Opened our 10th location across the Philippines" },
    { year: "2015", title: "Innovation", description: "Launched our signature blend and specialty drinks menu" },
    { year: "2020", title: "Digital Growth", description: "Expanded online presence and delivery services" },
    { year: "2024", title: "100+ Stores", description: "Reached over 100 locations nationwide" }
  ];

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1>Our Story</h1>
          <p>Crafting exceptional coffee experiences since 2007</p>
        </div>
      </section>

      <section className="about-story section">
        <div className="container">
          <div className="story-content">
            <div className="story-text">
              <h2>The Beginning</h2>
              <p>
                EzDevs Coffee started as a simple dream to create the perfect coffee experience. 
                Founded in 2007, our journey began with a passion for quality coffee and a 
                commitment to creating spaces where people could connect, work, and relax.
              </p>
              <p>
                What began as a single store has grown into a beloved coffee chain across 
                the Philippines, but our core values remain the same: exceptional quality, 
                warm hospitality, and genuine care for our community.
              </p>
            </div>
            <div className="story-image">
              <div className="image-placeholder">
                <Coffee size={120} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="values-section section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Our Values</h2>
            <p>The principles that guide everything we do</p>
          </div>
          <div className="values-grid grid grid-4">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="timeline-section section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Our Journey</h2>
            <p>Key milestones in our coffee story</p>
          </div>
          <div className="timeline">
            {milestones.map((milestone, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-year">{milestone.year}</div>
                <div className="timeline-content">
                  <h3>{milestone.title}</h3>
                  <p>{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;