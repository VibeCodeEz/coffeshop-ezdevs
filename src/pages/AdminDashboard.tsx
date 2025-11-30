import React, { useState, useEffect } from 'react';
import { Star, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import MenuManagement from '../components/MenuManagement';
import CashierInterface from '../components/CashierInterface';
import OrderHistory from '../components/OrderHistory';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'cashier' | 'orders'>('overview');
  // Initialize with zero stats - will be populated from database
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalMenuItems: 0,
    totalCustomers: 0
  });
  
  const { isAdminUser } = useAuth();

  useEffect(() => {
    // Try to fetch real stats in background (optional)
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('📊 Dashboard: Attempting to fetch real stats...');
      
      // Use authenticated Supabase client instead of raw fetch
      const [ordersRes, menuRes, usersRes] = await Promise.allSettled([
        supabase
          .from('orders')
          .select('total_amount, status')
          .eq('status', 'completed'),
        supabase
          .from('menu_items')
          .select('id'),
        supabase
          .from('user_profiles')
          .select('id')
          .eq('role', 'customer')
      ]);

      // Process results
      let totalOrders = 0;
      let totalRevenue = 0;
      let totalMenuItems = 0;
      let totalCustomers = 0;

      if (ordersRes.status === 'fulfilled' && !ordersRes.value.error) {
        const orders = ordersRes.value.data || [];
        totalOrders = orders.length;
        totalRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.total_amount), 0);
      }

      if (menuRes.status === 'fulfilled' && !menuRes.value.error) {
        totalMenuItems = menuRes.value.data?.length || 0;
      }

      if (usersRes.status === 'fulfilled' && !usersRes.value.error) {
        totalCustomers = usersRes.value.data?.length || 0;
      }
        
      setStats({
        totalOrders,
        totalRevenue,
        totalMenuItems,
        totalCustomers
      });
      
      console.log('✅ Dashboard: Updated with real stats', {
        totalOrders,
        totalRevenue,
        totalMenuItems,
        totalCustomers
      });
    } catch (error) {
      console.log('⚠️ Dashboard: Stats fetch failed, using zero stats:', error);
      // Keep the zero stats we initialized with
    }
  };

  if (!isAdminUser) {
    return (
      <div className="admin-dashboard">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: DollarSign },
    { id: 'menu', name: 'Menu Management', icon: Star },
    { id: 'cashier', name: 'Cashier/Orders', icon: ShoppingCart },
    { id: 'orders', name: 'Order History', icon: Users }
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your coffee shop operations</p>
      </div>

      <div className="dashboard-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <Icon size={20} />
              {tab.name}
            </button>
          );
        })}
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon orders">
                  <ShoppingCart size={24} />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalOrders}</h3>
                  <p>Total Orders</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon revenue">
                  <DollarSign size={24} />
                </div>
                <div className="stat-info">
                  <h3>₱{stats.totalRevenue.toLocaleString()}</h3>
                  <p>Total Revenue</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon menu">
                  <Star size={24} />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalMenuItems}</h3>
                  <p>Menu Items</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon customers">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalCustomers}</h3>
                  <p>Customers</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn menu-btn"
                  onClick={() => setActiveTab('menu')}
                >
                  <Star size={20} />
                  Manage Menu
                </button>
                <button 
                  className="action-btn cashier-btn"
                  onClick={() => setActiveTab('cashier')}
                >
                  <ShoppingCart size={20} />
                  Create Order
                </button>
                <button 
                  className="action-btn orders-btn"
                  onClick={() => setActiveTab('orders')}
                >
                  <Users size={20} />
                  View Orders
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'cashier' && <CashierInterface />}
        {activeTab === 'orders' && <OrderHistory />}
      </div>
    </div>
  );
};

export default AdminDashboard;