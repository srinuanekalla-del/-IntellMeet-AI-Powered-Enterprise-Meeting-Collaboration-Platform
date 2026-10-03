import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * Wraps routes that require authentication. If there's no user in the
 * store, redirects to /login. Used as a layout route in App.tsx:
 *   <Route element={<ProtectedRoute />}>...protected routes...</Route>
 */
export const ProtectedRoute = () => {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
