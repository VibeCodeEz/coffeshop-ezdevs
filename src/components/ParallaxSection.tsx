import React, { useEffect, useRef, useState } from 'react';
import './ParallaxSection.css';

interface ParallaxSectionProps {
  children: React.ReactNode;
  backgroundImage?: string;
  speed?: number;
  className?: string;
}

const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  backgroundImage,
  speed = 0.5,
  className = ''
}) => {
  const [offsetY, setOffsetY] = useState(0);
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const rect = parallaxRef.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * -speed;
        
        // Only apply parallax when element is in viewport
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          setOffsetY(rate);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div 
      ref={parallaxRef}
      className={`parallax-section ${className}`}
    >
      <div 
        className="parallax-background"
        style={{
          transform: `translateY(${offsetY}px)`,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined
        }}
      />
      <div className="parallax-content">
        {children}
      </div>
    </div>
  );
};

export default ParallaxSection;