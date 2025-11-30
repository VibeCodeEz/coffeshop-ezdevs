import React from 'react';
import MacroProductCard from './MacroProductCard';
import ParallaxSection from './ParallaxSection';
import './FeaturedProducts.css';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  rating: number;
  image: string;
  isPopular?: boolean;
}

const FeaturedProducts: React.FC = () => {
  const products: Product[] = [
    // No sample products - will be populated from your admin dashboard
  ];

  return (
    <ParallaxSection className="featured-products section coffee-texture" speed={0.3}>
      <div className="container">
        <div className="section-header text-center">
          <h2>Our Featured Favorites</h2>
          <p>Discover our most beloved coffee creations, crafted to perfection</p>
        </div>

        <div className="products-grid grid grid-4">
          {products.map((product) => (
            <MacroProductCard 
              key={product.id} 
              product={product}
              onAddToCart={() => console.log(`Added ${product.name} to cart`)}
            />
          ))}
        </div>

        <div className="text-center" style={{ marginTop: '40px' }}>
          <a href="/menu" className="btn btn-secondary cursor-hover">View Full Menu</a>
        </div>
      </div>
    </ParallaxSection>
  );
};

export default FeaturedProducts;