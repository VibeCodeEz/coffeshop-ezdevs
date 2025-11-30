import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

const Auth: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // TEMPORARY: Allow admin account creation
    if (email === 'coffeeadmin@admin.com') {
      // Allow this specific admin email to create account
      console.log('Creating admin account...');
    } else if (!email.includes('admin') && !email.includes('cashier')) {
      setError('Access restricted to administrators and staff only.');
      setLoading(false);
      return;
    }

    try {
      let result;
      
      if (isSignup && email === 'coffeeadmin@admin.com') {
        // TEMPORARY: Create admin account using Supabase directly
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || 'Coffee Administrator'
            }
          }
        });
        
        if (!result.error) {
          setSuccess('Admin account created! Please check email for verification, then login.');
          setIsSignup(false);
          setEmail('');
          setPassword('');
          setFullName('');
        }
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else if (!isSignup) {
        console.log('✅ Admin login successful');
        setSuccess('Login successful! Redirecting...');
        setLoading(false);
        // Login will redirect automatically via AuthContext
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    // Add body class to disable custom cursor on auth page
    document.body.classList.add('auth-page-body');
    
    return () => {
      // Remove body class when leaving auth page
      document.body.classList.remove('auth-page-body');
    };
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <Shield size={40} />
            <h1>Admin Access</h1>
          </div>
          <p>{isSignup ? 'Create Admin Account' : 'Administrator & Staff Login'}</p>
        </div>

        {/* TEMPORARY: Admin account creation toggle */}
        {email === 'coffeeadmin@admin.com' && (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button 
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              style={{ 
                background: 'none', 
                border: '1px solid #8B4513', 
                color: '#8B4513',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isSignup ? 'Switch to Login' : 'Create Admin Account'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <div className="form-group">
              <label htmlFor="fullName">Admin Name</label>
              <div className="input-group">
                <Shield size={20} />
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter admin name"
                  required={isSignup}
                />
              </div>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <div className="input-group">
              <Mail size={20} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-group">
              <Lock size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading 
              ? (isSignup ? 'Creating Account...' : 'Authenticating...') 
              : (isSignup ? 'Create Admin Account' : 'Login')
            }
          </button>
        </form>

        <div className="auth-footer">
          <div className="admin-hint">
            <p><small>Access restricted to administrators and staff only</small></p>
            <p><small>Contact system administrator for account credentials</small></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;