import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { getGoogleMapsKey, isGoogleMapsKeyValid } from './lib/maps';

import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';

// Pages - to be implemented
import { APIProvider } from '@vis.gl/react-google-maps';

const Home = React.lazy(() => import('./components/checkout/pages/Home'));
const ProductDetails = React.lazy(() => import('./components/checkout/pages/ProductDetails'));
const CartPage = React.lazy(() => import('./components/checkout/pages/Cart'));
const Checkout = React.lazy(() => import('./components/checkout/pages/Checkout'));
const Profile = React.lazy(() => import('./components/checkout/pages/Profile'));
const VendorDashboard = React.lazy(() => import('./components/checkout/pages/VendorDashboard'));
const AdminDashboard = React.lazy(() => import('./components/checkout/pages/AdminDashboard'));
const RiderDashboard = React.lazy(() => import('./components/checkout/pages/RiderDashboard'));
const Login = React.lazy(() => import('./components/checkout/pages/Login'));
const CategorySelection = React.lazy(() => import('./components/checkout/pages/CategorySelection'));
const CategoryProducts = React.lazy(() => import('./components/checkout/pages/CategoryProducts'));
const SearchResults = React.lazy(() => import('./components/checkout/pages/SearchResults'));
const Orders = React.lazy(() => import('./components/checkout/pages/Orders'));
import Addresses from './components/checkout/pages/Addresses';
const Wishlist = React.lazy(() => import('./components/checkout/pages/Wishlist'));
const AccountSettings = React.lazy(() => import('./components/checkout/pages/AccountSettings'));
const UserDashboard = React.lazy(() => import('./components/checkout/pages/UserDashboard'));

// Layout
const MainLayout = React.lazy(() => import('./components/layout/MainLayout'));

const RiderLogin = React.lazy(() => import('./components/checkout/pages/RiderLogin'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const LoadingScreen = ({ label = 'Initializing...' }: { label?: string }) => (
  <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-between p-12 py-24">
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="mt-8"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-orange-600 via-white/5 to-green-600 p-[1px] rounded-[2.5rem] shadow-2xl shadow-orange-500/10">
        <div className="w-full h-full bg-gray-950 rounded-[2.5rem] flex items-center justify-center">
          <ShoppingCart size={36} className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
        </div>
      </div>
    </motion.div>

    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-center"
    >
      <h1 className="text-2xl font-black text-white tracking-[0.15em] leading-tight">
        NEXAMART<br />
        <span className="text-[12px] text-gray-500 tracking-[0.4em] font-black">NEPAL'S PREMIER MARKETPLACE</span>
      </h1>
      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="w-8 h-[2px] bg-gradient-to-r from-orange-600 to-green-600 rounded-full" />
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">{label}</p>
      </div>
    </motion.div>

    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] flex items-center gap-3">
        Shop Smart <span className="w-1 h-1 bg-orange-600 rounded-full" /> Delivered Fast
      </p>
    </motion.div>
  </div>
);

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return null;
  if (!user) {
    if (role === 'rider') return <Navigate to="/rider/login" replace />;
    return <Navigate to="/login" replace />;
  }

  // Admin and Super Admin can access all panels
  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    return <>{children}</>;
  }

  if (role && profile?.role !== role) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <React.Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/rider/login" element={<RiderLogin />} />
        
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="categories" element={<CategorySelection />} />
          <Route path="category/:id" element={<CategoryProducts />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="cart" element={<CartPage />} />
          
          {/* Protected Customer Routes */}
          <Route path="user/dashboard" element={<ProtectedRoute role="customer"><UserDashboard /></ProtectedRoute>} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="profile" element={<Profile />} />
          <Route path="orders" element={<Orders />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="account-settings" element={<AccountSettings />} />
          
          {/* Vendor Routes */}
          <Route path="vendor/*" element={
            <ProtectedRoute>
              <VendorDashboard />
            </ProtectedRoute>
          } />
          
          {/* Rider Routes */}
          <Route path="rider/*" element={
            <ProtectedRoute role="rider">
              <RiderDashboard />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="admin/*" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </React.Suspense>
  );
}

function App() {
  const [GM_KEY, setGMKey] = React.useState(() => getGoogleMapsKey());
  const isKeyValid = React.useMemo(() => isGoogleMapsKeyValid(), [GM_KEY]);

  useEffect(() => {
    // Suppress benign cross-origin frame errors
    const handleError = (e: ErrorEvent) => {
      const msg = e.message?.toLowerCase() || '';
      if (msg.includes('$$typeof') || 
          msg.includes('cross-origin frame') || 
          msg.includes('securityerror') ||
          msg.includes('blocked a frame') ||
          msg.includes('could not reach cloud firestore') ||
          msg.includes('watchposition') ||
          msg.includes('should not already be working')) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    const handleRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message?.toLowerCase() || '';
      if (msg.includes('$$typeof') || 
          msg.includes('cross-origin frame') ||
          msg.includes('could not reach cloud firestore') ||
          msg.includes('watchposition')) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    // Initial theme setup on mount to prevent color flash
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    // Capacitor specific initialization
    if (Capacitor.isNativePlatform()) {
      // Set status bar
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#ffffff' });

      // Handle Android back button
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  }, []);

  return (
    <Router>
      <APIProvider apiKey={GM_KEY || ''}>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </APIProvider>
    </Router>
  );
}

export default App;
