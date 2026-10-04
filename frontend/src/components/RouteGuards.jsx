import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Loading from './Loading';

/**
 * Logged-in area (the old /user/** URLs). Visitors are sent to /login and come back afterwards.
 * This is only UX: every API call is independently protected by Spring Security.
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading fullScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

/**
 * Admin area. Hides the admin UI from normal users; the real enforcement is
 * hasRole('ADMIN') on /api/admin/** in the backend.
 */
export function AdminRoute() {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/user/dashboard" replace />;
  return <Outlet />;
}

/** Login/register: already-authenticated users go straight to their profile (old defaultSuccessUrl). */
export function GuestOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading fullScreen />;
  if (user) return <Navigate to="/user/profile" replace />;
  return <Outlet />;
}
