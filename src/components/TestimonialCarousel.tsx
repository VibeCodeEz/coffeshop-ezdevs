import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import './TestimonialCarousel.css';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company?: string;
  content: string;
  rating: number;
  avatar: string;
  location: string;
  date: string;
}

const TestimonialCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Maria Santos",
      role: "Marketing Director",
      company: "TechCorp Philippines",
      content: "EzDevs Coffee has become my daily ritual. The quality is consistently excellent, and the atmosphere is perfect for both work and relaxation. Their subscription service ensures I never run out of my favorite blend!",
      rating: 5,
      avatar: "👩‍💼",
      location: "Makati, Metro Manila",
      date: "2 weeks ago"
    },
    {
      id: 2,
      name: "John Rivera",
      role: "Coffee Enthusiast",
      company: "Freelance Designer",
      content: "As a coffee connoisseur, I can confidently say EzDevs Coffee serves some of the best brews in the city. Their attention to detail is remarkable - from bean selection to the final cup.",
      rating: 5,
      avatar: "👨‍💻",
      location: "Quezon City",
      date: "1 week ago"
    },
    {
      id: 3,
      name: "Sarah Lee",
      role: "Business Owner",
      company: "Bloom Boutique",
      content: "I love bringing clients here for meetings. The professional yet cozy environment and exceptional service never disappoint. Plus, their pastries are amazing!",
      rating: 5,
      avatar: "👩‍🎓",
      location: "BGC, Taguig",
      date: "3 days ago"
    },
    {
      id: 4,
      name: "Miguel Rodriguez",
      role: "Software Engineer",
      company: "StartupHub Inc.",
      content: "Perfect place for remote work! Fast WiFi, comfortable seating, and the best coffee to fuel long coding sessions. The staff is super friendly too.",
      rating: 5,
      avatar: "👨‍🚀",
      location: "Cebu City",
      date: "5 days ago"
    },
    {
      id: 5,
      name: "Anna Cruz",
      role: "University Student",
      company: "UP Diliman",
      content: "As a student, I appreciate the study-friendly environment and affordable prices. The iced caramel macchiato is my go-to during exam weeks!",
      rating: 5,
      avatar: "👩‍🎓",
      location: "Quezon City",
      date: "1 week ago"
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, currentIndex]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <div 
      className="testimonial-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="carousel-header">
        <div className="header-badge">
          <span className="badge-icon">⭐</span>
          <span className="badge-text">Customer Reviews</span>
        </div>
        <h2>What Our Coffee Lovers Say</h2>
        <p>Discover why thousands choose EzDevs Coffee for their daily brew</p>
        <div className="testimonial-stats">
          <div className="stat-item">
            <span className="stat-number">4.9</span>
            <span className="stat-label">Average Rating</span>
          </div>
          <div className="stat-divider">•</div>
          <div className="stat-item">
            <span className="stat-number">2,000+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat-divider">•</div>
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Daily Reviews</span>
          </div>
        </div>
      </div>

      <div className="carousel-container">
        <button 
          className="carousel-btn prev-btn"
          onClick={prevTestimonial}
          aria-label="Previous testimonial"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="testimonial-display">
          <div 
            className="testimonials-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-slide">
                <div className="testimonial-card">
                  <div className="quote-decoration">
                    <Quote size={32} />
                  </div>

                  <div className="testimonial-rating">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={18} 
                        className={i < testimonial.rating ? 'star-filled' : 'star-empty'}
                      />
                    ))}
                  </div>

                  <blockquote className="testimonial-content">
                    "{testimonial.content}"
                  </blockquote>

                  <div className="testimonial-author">
                    <div className="author-avatar">
                      <span className="avatar-emoji">{testimonial.avatar}</span>
                    </div>
                    <div className="author-details">
                      <h4 className="author-name">{testimonial.name}</h4>
                      <p className="author-role">
                        {testimonial.role}
                        {testimonial.company && (
                          <span className="author-company"> • {testimonial.company}</span>
                        )}
                      </p>
                      <div className="author-meta">
                        <span className="location">{testimonial.location}</span>
                        <span className="date">{testimonial.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          className="carousel-btn next-btn"
          onClick={nextTestimonial}
          aria-label="Next testimonial"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="carousel-indicators">
        {testimonials.map((_, index) => (
          <button
            key={index}
            className={`indicator ${currentIndex === index ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to testimonial ${index + 1}`}
          >
          </button>
        ))}
      </div>

      <div className="carousel-progress">
        <div 
          className="progress-bar"
          style={{ 
            width: isAutoPlaying ? '100%' : '0%',
            animationDuration: isAutoPlaying ? '5s' : '0s'
          }}
        ></div>
      </div>
    </div>
  );
};

export default TestimonialCarousel;