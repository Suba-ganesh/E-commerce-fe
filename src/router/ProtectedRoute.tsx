import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalLoader from '../components/common/GlobalLoader';

interface ProtectedRouteProps {
  /** If true, redirects authenticated users away (e.g. login page) */
  redirectAuthenticated?: boolean;
}

/**
 * Blocks unauthenticated users from reaching protected pages.
 * Also redirects already-authenticated users away from auth pages.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectAuthenticated = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Wait until auth state is resolved from localStorage
  if (isLoading) {
    return <GlobalLoader />;
  }

  // Auth pages: redirect authenticated users to their dashboard
  if (redirectAuthenticated && isAuthenticated) {
    const role = user?.role;
    if (role === 'admin' || role === 'super_admin') return <Navigate to="/portal/admin" replace />;
    if (role === 'wholesale') return <Navigate to="/portal/wholesale" replace />;
    return <Navigate to="/portal/dashboard" replace />;
  }

  // Protected pages: redirect unauthenticated users to login
  if (!redirectAuthenticated && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
