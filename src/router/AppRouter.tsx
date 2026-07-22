import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Layout
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { BackButton } from '../components/common/BackButton';

// Views
import HomeView from '../components/views/HomeView';
import ListingView from '../components/views/ListingView';
import ProductDetailsView from '../components/views/ProductDetailsView';
import CartView from '../components/views/CartView';
import WishlistView from '../components/views/WishlistView';
import CheckoutView from '../components/views/CheckoutView';
import AuthViews from '../components/views/AuthViews';
import PortalViews from '../components/views/PortalViews';
import { OrderSuccessView, AboutView, BlogView } from '../components/views/StaticViews';

// Guards
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';


/** Shell layout that wraps every page */
const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const hideFooterPaths = ['/wishlist', '/cart', '/login', '/register', '/forgot-password', '/checkout'];
  const hideHeaderPaths = ['/login', '/register', '/forgot-password'];
  const isPortal = location.pathname.startsWith('/portal');
  const isAdminPortal = isPortal && (user?.role === 'admin' || user?.role === 'super_admin');
  const isOrderSuccess = location.pathname.startsWith('/order/success');
  const hideFooter = hideFooterPaths.includes(location.pathname) || isAdminPortal || isOrderSuccess;
  const hideHeader = hideHeaderPaths.includes(location.pathname) || isAdminPortal;
  const hideBackButton = isAdminPortal || isOrderSuccess || hideHeader;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!hideHeader && (
        <div className="fixed top-0 left-0 w-full z-[1000] bg-white flex flex-col">
          <Header />
        </div>
      )}
      <main className={`flex-1 w-full bg-white relative ${hideHeader ? 'pt-0' : 'pt-[96px] md:pt-[97px]'}`}>
        {!isHome && !hideBackButton && <BackButton />}
        {/* Child routes render here */}
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomeView />} />
          <Route path="/shop" element={<ListingView />} />
          <Route path="/shop/product/:productId" element={<ProductDetailsView />} />
          <Route path="/cart" element={<CartView />} />
          <Route path="/wishlist" element={<WishlistView />} />
          <Route path="/about" element={<AboutView />} />
          <Route path="/blog" element={<BlogView />} />

          {/* Auth routes — redirect if already logged in */}
          <Route element={<ProtectedRoute redirectAuthenticated />}>
            <Route path="/login" element={<AuthViews initialSubView="login" />} />
            <Route path="/register" element={<AuthViews initialSubView="register" />} />
            <Route path="/forgot-password" element={<AuthViews initialSubView="forgot" />} />
          </Route>

          {/* Protected routes — redirect to /login if not logged in */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutView />} />
            <Route path="/order/success/:orderId" element={<OrderSuccessView />} />
            <Route path="/portal/dashboard" element={<PortalViews />} />
            <Route path="/portal/profile" element={<PortalViews />} />
            <Route path="/portal/orders" element={<PortalViews />} />
            <Route path="/portal/wholesale" element={<PortalViews />} />
            <Route path="/portal/admin" element={<PortalViews />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default AppLayout;
