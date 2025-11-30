import React from 'react';
import { Star, Quote } from 'lucide-react';
import ParallaxSection from './ParallaxSection';
import './Testimonials.css';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

const Testimonials: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Maria Santos",
      role: "Regular Customer",
      content: "EzDevs Coffee has become my daily ritual. The quality is consistently excellent, and the atmosphere is perfect for both work and relaxation.",
      rating: 5,
      avatar: "👩‍💼"
    },
    {
      id: 2,
      name: "John Rivera",
      role: "Coffee Enthusiast",
      content: "As a coffee lover, I can confidently say EzDevs Coffee serves some of the best brews in the city. Their attention to detail is remarkable.",
      rating: 5,
      avatar: "👨‍💻"
    },
    {
      id: 3,
      name: "Sarah Lee",
      role: "Business Owner",
      content: "I love bringing clients here for meetings. The professional yet cozy environment and exceptional service never disappoint.",
      rating: 5,
      avatar: "👩‍🎓"
    }
  ];

  return (
    <ParallaxSection className="testimonials section coffee-beans" speed={0.2}>
      <div className="container">
        <div className="section-header text-center">
          <h2>What Our Customers Say</h2>
          <p>Real experiences from coffee lovers who choose EzDevs Coffee every day</p>
        </div>

        <div className="testimonials-grid grid grid-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card cursor-hover">
              <div className="quote-icon">
                <Quote size={24} />
              </div>
              
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    className={i < testimonial.rating ? 'star-filled' : 'star-empty'}
                  />
                ))}
              </div>

              <p className="testimonial-content">"{testimonial.content}"</p>

              <div className="testimonial-author">
                <div className="author-avatar">
                  <span>{testimonial.avatar}</span>
                </div>
                <div className="author-info">
                  <h4>{testimonial.name}</h4>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
};

export default Testimonials;