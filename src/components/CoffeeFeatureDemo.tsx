import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import GrindSizeSelector from './GrindSizeSelector';
import BrewGuideTooltip from './BrewGuideTooltip';
import TestimonialCarousel from './TestimonialCarousel';
import SubscriptionCustomizer from './SubscriptionCustomizer';
import VideoBackground from './VideoBackground';
import './CoffeeFeatureDemo.css';

const CoffeeFeatureDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('grind');

  const demos = [
    { id: 'grind', name: 'Grind Size Visualizer', icon: '⚙️' },
    { id: 'brew', name: 'Brew Guide Tooltips', icon: '💡' },
    { id: 'subscription', name: 'Subscription Customizer', icon: '📦' },
    { id: 'testimonials', name: 'Testimonial Carousel', icon: '💬' },
    { id: 'video', name: 'Video Integration', icon: '🎥' }
  ];

  const sampleProducts = [
    { name: 'Signature Blend', type: 'medium' as const },
    { name: 'Dark Roast Supreme', type: 'dark' as const },
    { name: 'Ethiopian Light', type: 'light' as const },
    { name: 'Espresso Intenso', type: 'espresso' as const }
  ];

  return (
    <div className="coffee-feature-demo">
      <div className="demo-header">
        <h1>☕ Coffee Experience Features</h1>
        <p>Interactive components designed to enhance the coffee shopping and learning experience</p>
      </div>

      <div className="demo-navigation">
        {demos.map((demo) => (
          <button
            key={demo.id}
            className={`demo-nav-btn ${activeDemo === demo.id ? 'active' : ''}`}
            onClick={() => setActiveDemo(demo.id)}
          >
            <span className="demo-icon">{demo.icon}</span>
            {demo.name}
          </button>
        ))}
      </div>

      <div className="demo-content">
        {activeDemo === 'grind' && (
          <div className="demo-section">
            <div className="demo-description">
              <h2>Grind Size Visualizer</h2>
              <p>
                Interactive grind size selector that shows users the optimal coarseness for different 
                brewing methods. Features dynamic visual representations and brewing recommendations.
              </p>
              <ul>
                <li>✅ Interactive grind size selection</li>
                <li>✅ Dynamic visual representation of coffee particles</li>
                <li>✅ Brewing method recommendations</li>
                <li>✅ Professional brewing tips</li>
              </ul>
            </div>
            <div className="demo-showcase">
              <GrindSizeSelector />
            </div>
          </div>
        )}

        {activeDemo === 'brew' && (
          <div className="demo-section">
            <div className="demo-description">
              <h2>Brew Guide Pop-ups</h2>
              <p>
                Hoverable tooltips that appear on product cards, providing instant brewing guidance 
                tailored to each coffee type. Helps customers brew the perfect cup.
              </p>
              <ul>
                <li>✅ Coffee-specific brewing guides</li>
                <li>✅ Temperature and ratio recommendations</li>
                <li>✅ Professional brewing tips</li>
                <li>✅ Multiple brewing methods per coffee</li>
              </ul>
            </div>
            <div className="demo-showcase">
              <div className="brew-guide-samples">
                <h3>Try hovering over these "Best for..." buttons:</h3>
                <div className="sample-tooltips">
                  {sampleProducts.map((product, index) => (
                    <div key={index} className="sample-product">
                      <h4>{product.name}</h4>
                      <BrewGuideTooltip 
                        productName={product.name}
                        productType={product.type}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDemo === 'subscription' && (
          <div className="demo-section">
            <div className="demo-description">
              <h2>Subscription Customizer</h2>
              <p>
                Step-by-step interactive tool that helps users create their perfect coffee 
                subscription. Shows real-time pricing updates and savings calculations.
              </p>
              <ul>
                <li>✅ 3-step customization process</li>
                <li>✅ Real-time price calculations</li>
                <li>✅ Dynamic savings display</li>
                <li>✅ Coffee education integration</li>
              </ul>
            </div>
            <div className="demo-showcase">
              <SubscriptionCustomizer />
            </div>
          </div>
        )}

        {activeDemo === 'testimonials' && (
          <div className="demo-section">
            <div className="demo-description">
              <h2>Enhanced Testimonial Carousel</h2>
              <p>
                Modern, sleek carousel showcasing customer reviews with auto-play functionality, 
                smooth transitions, and professional styling.
              </p>
              <ul>
                <li>✅ Auto-advancing testimonials</li>
                <li>✅ Pause on hover interaction</li>
                <li>✅ Professional customer profiles</li>
                <li>✅ Smooth animations and transitions</li>
              </ul>
            </div>
            <div className="demo-showcase">
              <TestimonialCarousel />
            </div>
          </div>
        )}

        {activeDemo === 'video' && (
          <div className="demo-section">
            <div className="demo-description">
              <h2>Video Integration</h2>
              <p>
                Beautiful, silent video backgrounds that enhance the coffee experience with 
                visual storytelling. Perfect for headers and section dividers.
              </p>
              <ul>
                <li>✅ Auto-playing silent videos</li>
                <li>✅ Responsive fallback images</li>
                <li>✅ Customizable overlay opacity</li>
                <li>✅ Mobile-optimized performance</li>
              </ul>
            </div>
            <div className="demo-showcase">
              <VideoBackground 
                src="/api/placeholder/video/coffee-steam.mp4"
                poster="/api/placeholder/600/300"
                className="demo-video"
                overlayOpacity={0.5}
              >
                <div className="video-demo-content">
                  <Coffee size={48} />
                  <h3>The Perfect Pour</h3>
                  <p>Experience the artistry of coffee making</p>
                </div>
              </VideoBackground>
            </div>
          </div>
        )}
      </div>

      <div className="demo-footer">
        <div className="implementation-note">
          <h3>🚀 Ready to Implement</h3>
          <p>
            All components are fully functional and ready to be integrated into your coffee website. 
            Each feature enhances user engagement and provides valuable coffee education.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoffeeFeatureDemo;