import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Coffee, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, profile, isAdminUser, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
  };

  const handleOrderNow = () => {
    // Customers can browse and order without logging in
    navigate('/menu');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <Coffee size={32} />
            <span>EzDevs Coffee</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav desktop-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/menu" className="nav-link">Menu</Link>
            {isAdminUser && (
              <Link to="/admin" className="nav-link">Dashboard</Link>
            )}
            {!isAdminUser && (
              <>
                <Link to="/about" className="nav-link">About</Link>
                <Link to="/contact" className="nav-link">Contact</Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="user-menu-container">
            {user ? (
              <>
                {!isAdminUser && (
                  <Link to="/menu" className="btn btn-primary order-btn">Order Now</Link>
                )}
                
                <div className="user-menu">
                  <button 
                    className="user-menu-trigger"
                    onClick={toggleUserMenu}
                  >
                    <User size={20} />
                    <span className="user-name">
                      {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="user-menu-dropdown">
                      <div className="user-info">
                        <div className="user-email">{user?.email}</div>
                        <div className="user-role">{isAdminUser ? 'Administrator' : 'Customer'}</div>
                      </div>
                      
                      <div className="menu-divider"></div>
                      
                      {isAdminUser ? (
                        <>
                          <Link to="/admin" className="menu-item" onClick={() => setIsUserMenuOpen(false)}>
                            <Settings size={16} />
                            Admin Dashboard
                          </Link>
                          <Link to="/cashier" className="menu-item" onClick={() => setIsUserMenuOpen(false)}>
                            <Coffee size={16} />
                            Cashier
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link to="/orders" className="menu-item" onClick={() => setIsUserMenuOpen(false)}>
                            <Coffee size={16} />
                            My Orders
                          </Link>
                          <Link to="/cart" className="menu-item" onClick={() => setIsUserMenuOpen(false)}>
                            <User size={16} />
                            My Cart
                          </Link>
                        </>
                      )}
                      
                      <button 
                        className="menu-item logout-btn" 
                        onClick={handleSignOut}
                        type="button"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/auth" className="btn btn-secondary login-btn">Staff Login</Link>
                <button onClick={handleOrderNow} className="btn btn-primary order-btn">Order Now</button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="nav mobile-nav">
            <Link to="/" className="nav-link" onClick={toggleMenu}>Home</Link>
            <Link to="/menu" className="nav-link" onClick={toggleMenu}>Menu</Link>
            {user ? (
              <>
                {isAdminUser ? (
                  <>
                    <Link to="/admin" className="nav-link" onClick={toggleMenu}>Dashboard</Link>
                    <Link to="/cashier" className="nav-link" onClick={toggleMenu}>Cashier</Link>
                  </>
                ) : (
                  <>
                    <Link to="/about" className="nav-link" onClick={toggleMenu}>About</Link>
                    <Link to="/contact" className="nav-link" onClick={toggleMenu}>Contact</Link>
                    <Link to="/orders" className="nav-link" onClick={toggleMenu}>My Orders</Link>
                    <Link to="/cart" className="nav-link" onClick={toggleMenu}>My Cart</Link>
                  </>
                )}
                <button 
                  className="mobile-logout-btn" 
                  onClick={() => { 
                    toggleMenu(); 
                    handleSignOut(); 
                  }}
                  type="button"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/about" className="nav-link" onClick={toggleMenu}>About</Link>
                <Link to="/contact" className="nav-link" onClick={toggleMenu}>Contact</Link>
                <Link to="/auth" className="btn btn-secondary mobile-login-btn" onClick={toggleMenu}>
                  Staff Login
                </Link>
              </>
            )}
            {!user && (
              <button 
                className="btn btn-primary mobile-order-btn" 
                onClick={() => { 
                  handleOrderNow(); 
                  toggleMenu(); 
                }}
              >
                Order Now
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;