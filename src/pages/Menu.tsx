import React, { useState, useEffect } from 'react';
import { Star, Eye, ShoppingBag, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import QuickViewModal from '../components/QuickViewModal';
import CartPreview from '../components/CartPreview';
import './Menu.css';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  base_price?: number; // Add numeric price for cart operations
  category: string;
  rating: number;
  isPopular?: boolean;
  image: string;
  sizes?: { id: string; name: string; price: number; }[];
  ingredients?: string[];
  allergens?: string[];
  brewingNotes?: string;
}

interface MenuProps {
  cart?: {
    items: any[];
    addItem: (product: any, quantity?: number, size?: string) => Promise<void>;
    updateQuantity: (id: number, quantity: number) => void;
    removeItem: (id: number) => void;
  };
}

const Menu: React.FC<MenuProps> = ({ cart }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [quickViewProduct, setQuickViewProduct] = useState<MenuItem | null>(null);
  const [showCartPreview, setShowCartPreview] = useState(false);

  // Empty menu items - will be populated from database or show empty state
  const fallbackMenuItems: MenuItem[] = [];

  // Static menu items as fallback - initialize immediately
  const [menuItems, setMenuItems] = useState<MenuItem[]>(fallbackMenuItems);

  // Optional database fetch (runs in background, doesn't block UI)
  useEffect(() => {
    // Add a delay to let the page render first
    const timer = setTimeout(async () => {
      console.log('🍽️ Attempting background database fetch...');
      
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select(`
            *,
            menu_categories (
              name
            )
          `)
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          console.log('✅ Background fetch successful, updating menu items:', data.length);
          
          const transformedItems: MenuItem[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: `₱${item.base_price}`, // Formatted price for display
            base_price: item.base_price, // Keep numeric value for cart operations
            category: mapDatabaseCategory(item.menu_categories?.name || 'Coffee'),
            rating: 4.5,
            isPopular: item.is_featured,
            image: item.image_url || getDefaultIcon(item.menu_categories?.name || 'Coffee'),
            sizes: generateDefaultSizes(item.base_price),
            ingredients: item.tags || ["Fresh ingredients"],
            allergens: item.allergens || ["None"],
            brewingNotes: item.description || `Expertly crafted ${item.name.toLowerCase()} with premium ingredients.`
          }));
          
          setMenuItems(transformedItems);
        }
      } catch (err: any) {
        console.log('⚠️ Background fetch failed (keeping static menu):', err.message);
      }
    }, 100); // Small delay to ensure page renders first

    return () => clearTimeout(timer);
  }, []);

  // Helper function to map database categories to component categories
  const mapDatabaseCategory = (dbCategory: string): string => {
    const categoryMap: { [key: string]: string } = {
      'Coffee': 'coffee',
      'Tea': 'tea',
      'Pastries': 'pastries',
      'Sandwiches': 'sandwiches',
      'Pasta': 'pasta',
      'Salads': 'salads',
      'Breakfast': 'breakfast',
      'Snacks': 'snacks',
      'Beverages': 'beverages',
      'Desserts': 'desserts'
    };
    return categoryMap[dbCategory] || 'coffee';
  };

  // Helper function to get default icon based on category
  const getDefaultIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      'Hot Coffee': '☕',
      'Iced Coffee': '🧊',
      'Tea': '🍵',
      'Frappe': '🍫',
      'Specialty': '⭐'
    };
    return iconMap[category] || '☕';
  };

  // Helper function to generate default sizes based on base price
  const generateDefaultSizes = (basePrice: number) => [
    { id: 'small', name: 'Small', price: basePrice },
    { id: 'medium', name: 'Medium', price: basePrice + 30 },
    { id: 'large', name: 'Large', price: basePrice + 60 },
    { id: 'extra-large', name: 'Extra Large', price: basePrice + 90 }
  ];

  // Use the loaded menu items (either from database or fallback)
  const displayItems = menuItems;

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'coffee', name: 'Coffee' },
    { id: 'tea', name: 'Tea' },
    { id: 'pastries', name: 'Pastries' },
    { id: 'sandwiches', name: 'Sandwiches' },
    { id: 'pasta', name: 'Pasta' },
    { id: 'salads', name: 'Salads' },
    { id: 'breakfast', name: 'Breakfast' },
    { id: 'snacks', name: 'Snacks' },
    { id: 'beverages', name: 'Beverages' },
    { id: 'desserts', name: 'Desserts' }
  ];

  const filteredItems = activeCategory === 'all' 
    ? displayItems 
    : displayItems.filter(item => item.category === activeCategory);

  // Always show content immediately - no loading screen

  return (
    <div className="menu-page">
      <section className="menu-hero">
        <div className="container">
          <h1>Our Menu</h1>
          <p>Discover our carefully crafted beverages made with premium ingredients</p>
        </div>
      </section>

      <section className="menu-content section">
        <div className="container">
          <div className="menu-header-section">
            <div className="menu-filters">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`filter-btn ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            {cart && cart.items && cart.items.length > 0 && (
              <div className="cart-actions">
                <button 
                  className="view-cart-btn"
                  onClick={() => setShowCartPreview(true)}
                >
                  <ShoppingBag size={18} />
                  View Cart ({cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)})
                </button>
                <a 
                  href="/cart"
                  className="checkout-cart-btn"
                >
                  🛒 Proceed to Checkout
                </a>
              </div>
            )}
          </div>

          <div className="menu-grid grid grid-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="menu-item">
                {item.isPopular && (
                  <div className="popular-badge">
                    <Star size={14} />
                    Popular
                  </div>
                )}
                
                <div className="menu-item-image">
                  {item.image && (item.image.startsWith('http') || item.image.startsWith('data:image')) ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="menu-item-img"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="menu-emoji-fallback" style={{ display: (item.image && (item.image.startsWith('http') || item.image.startsWith('data:image'))) ? 'none' : 'flex' }}>
                    {item.image || '☕'}
                  </div>
                </div>
                
                <div className="menu-item-info">
                  <h3 className="menu-item-name">{item.name}</h3>
                  <p className="menu-item-description">{item.description}</p>
                  
                  
                  <div className="menu-item-footer">
                    <div className="price-section">
                      <span className="menu-item-price">{item.price}</span>
                    </div>
                    <div className="item-buttons">
                      <button 
                        className="quick-view-btn"
                        onClick={() => setQuickViewProduct(item)}
                        title="Quick View"
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                      <button 
                        className="add-to-cart-btn"
                        onClick={() => setQuickViewProduct(item)}
                        title="Customize & Add to Cart"
                      >
                        <ShoppingCart size={16} />
                        <span>Customize & Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          isOpen={true}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={(product, quantity, size) => {
            cart?.addItem(product, quantity, size).catch(error => 
              console.error('Error adding item:', error)
            );
          }}
        />
      )}

      {/* Cart Preview Modal */}
      {showCartPreview && cart && (
        <CartPreview
          items={cart.items || []}
          onUpdateQuantity={cart.updateQuantity}
          onRemoveItem={cart.removeItem}
          onClose={() => setShowCartPreview(false)}
        />
      )}
    </div>
  );
};

export default Menu;