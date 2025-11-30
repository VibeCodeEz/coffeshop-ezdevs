import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import LoadingSpinner from './components/LoadingSpinner';
import StickyCart from './components/StickyCart';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import Cashier from './pages/Cashier';
import SupabaseTest from './test-supabase';
import useSessionCart from './hooks/useSessionCart';

const AppContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading, isAdminUser } = useAuth();
  const cart = useSessionCart();

  useEffect(() => {
    // Reduce loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleCheckout = () => {
    // Users can view cart and checkout without logging in
    // They'll be prompted to provide contact info during checkout
    window.location.href = '/cart';
  };

  if (isLoading || authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <CustomCursor />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu cart={cart} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart cart={cart} />} />
          <Route path="/orders" element={user ? <Orders /> : <Navigate to="/auth" replace />} />
          <Route path="/admin" element={isAdminUser ? <AdminDashboard /> : <Navigate to="/auth" replace />} />
          <Route path="/cashier" element={
            (user && (isAdminUser || user?.email?.includes('cashier'))) ? 
            <Cashier /> : 
            <Navigate to="/auth" replace />
          } />
          <Route path="/test" element={<SupabaseTest />} />
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <StickyCart
        items={cart.items}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;